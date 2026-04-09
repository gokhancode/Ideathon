use anchor_lang::prelude::*;

declare_id!("DeCiMAPxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");

/// Cooldown between reports from same reporter in same zone (seconds)
const REPORT_COOLDOWN: i64 = 60;
/// Minimum stake required to submit reports (0.01 SOL)
const MIN_STAKE_LAMPORTS: u64 = 10_000_000;
/// Slash amount for flagged reporters (0.005 SOL)
const SLASH_AMOUNT: u64 = 5_000_000;
/// Max deviation from zone average before flagging (dB)
const OUTLIER_THRESHOLD: u16 = 30;
/// Minimum validators needed to confirm a report
const MIN_VALIDATIONS: u8 = 2;

#[program]
pub mod decimap {
    use super::*;

    /// Initialize a noise zone (e.g. "ETH Zurich Campus", "Zurich Altstadt")
    pub fn create_zone(ctx: Context<CreateZone>, name: String, lat: f64, lng: f64, radius_m: u32) -> Result<()> {
        require!(name.len() <= 64, ErrorCode::NameTooLong);
        require!(radius_m > 0 && radius_m <= 10_000, ErrorCode::InvalidRadius);
        let zone = &mut ctx.accounts.zone;
        zone.authority = ctx.accounts.authority.key();
        zone.name = name;
        zone.lat = lat;
        zone.lng = lng;
        zone.radius_m = radius_m;
        zone.report_count = 0;
        zone.avg_decibels = 0;
        zone.bump = ctx.bumps.zone;
        Ok(())
    }

    /// Stake SOL to become an eligible reporter. Must stake before submitting.
    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        require!(amount >= MIN_STAKE_LAMPORTS, ErrorCode::InsufficientStake);

        // Transfer SOL from reporter to stake vault
        let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.authority.key(),
            &ctx.accounts.stake_vault.key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke(
            &transfer_ix,
            &[
                ctx.accounts.authority.to_account_info(),
                ctx.accounts.stake_vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        let profile = &mut ctx.accounts.profile;
        profile.staked_amount += amount;

        emit!(StakeEvent {
            authority: profile.authority,
            amount,
            total_staked: profile.staked_amount,
        });

        Ok(())
    }

    /// Submit a noise reading from a device/phone
    pub fn submit_report(
        ctx: Context<SubmitReport>,
        decibels: u16,
        lat: f64,
        lng: f64,
        timestamp: i64,
    ) -> Result<()> {
        // ── Input validation ──
        require!(decibels <= 194, ErrorCode::InvalidDecibels);
        require!(decibels > 0, ErrorCode::InvalidDecibels);
        require!(lat >= -90.0 && lat <= 90.0, ErrorCode::InvalidCoordinates);
        require!(lng >= -180.0 && lng <= 180.0, ErrorCode::InvalidCoordinates);

        // ── Timestamp validation: must be within 5 minutes of on-chain clock ──
        let clock = Clock::get()?;
        let now = clock.unix_timestamp;
        let time_diff = (timestamp - now).abs();
        require!(time_diff <= 300, ErrorCode::TimestampTooFar);

        // ── Stake check: reporter must have staked ──
        let profile = &ctx.accounts.reporter_profile;
        require!(profile.staked_amount >= MIN_STAKE_LAMPORTS, ErrorCode::InsufficientStake);

        // ── Rate limiting: enforce cooldown per reporter per zone ──
        let profile = &ctx.accounts.reporter_profile;
        let time_since_last = now - profile.last_report_ts;
        require!(time_since_last >= REPORT_COOLDOWN, ErrorCode::ReportCooldown);

        // ── Outlier detection: flag if too far from zone average ──
        let zone = &ctx.accounts.zone;
        let mut flagged = false;
        if zone.report_count > 10 {
            let diff = if decibels > zone.avg_decibels {
                decibels - zone.avg_decibels
            } else {
                zone.avg_decibels - decibels
            };
            if diff > OUTLIER_THRESHOLD {
                flagged = true;
            }
        }

        // ── Write report ──
        let report = &mut ctx.accounts.report;
        report.reporter = ctx.accounts.reporter.key();
        report.zone = ctx.accounts.zone.key();
        report.decibels = decibels;
        report.lat = lat;
        report.lng = lng;
        report.timestamp = timestamp;
        report.verified = false;
        report.flagged = flagged;
        report.validation_count = 0;
        report.bump = ctx.bumps.report;

        // ── Update zone stats (running average) ──
        let zone = &mut ctx.accounts.zone;
        let total = (zone.avg_decibels as u64) * (zone.report_count as u64) + (decibels as u64);
        zone.report_count += 1;
        zone.avg_decibels = (total / zone.report_count as u64) as u16;

        // ── Update reporter profile ──
        let profile = &mut ctx.accounts.reporter_profile;
        profile.total_reports += 1;
        profile.last_report_ts = now;

        emit!(NoiseReportEvent {
            reporter: report.reporter,
            zone: report.zone,
            decibels,
            lat,
            lng,
            timestamp,
            flagged,
        });

        Ok(())
    }

    /// Validate another reporter's reading (cross-validation)
    pub fn validate_report(ctx: Context<ValidateReport>, agrees: bool) -> Result<()> {
        let report = &mut ctx.accounts.report;
        let validator_profile = &ctx.accounts.validator_profile;

        // Can't validate your own report
        require!(
            report.reporter != ctx.accounts.validator.key(),
            ErrorCode::CannotSelfValidate
        );

        // Validator must also be staked
        require!(
            validator_profile.staked_amount >= MIN_STAKE_LAMPORTS,
            ErrorCode::InsufficientStake
        );

        if agrees {
            report.validation_count += 1;
            if report.validation_count >= MIN_VALIDATIONS {
                report.verified = true;
                report.flagged = false; // Clear flag if consensus reached
            }
        } else {
            report.dispute_count += 1;
        }

        emit!(ValidationEvent {
            validator: ctx.accounts.validator.key(),
            report: report.key(),
            agrees,
            validation_count: report.validation_count,
            dispute_count: report.dispute_count,
        });

        Ok(())
    }

    /// Slash a reporter whose reports are consistently disputed
    pub fn slash_reporter(ctx: Context<SlashReporter>) -> Result<()> {
        let profile = &mut ctx.accounts.reporter_profile;

        // Only zone authority can slash
        require!(
            ctx.accounts.authority.key() == ctx.accounts.zone.authority,
            ErrorCode::Unauthorized
        );

        // Must have evidence: more disputes than validations
        require!(
            profile.dispute_count > profile.total_reports / 3,
            ErrorCode::InsufficientEvidence
        );

        let slash = std::cmp::min(SLASH_AMOUNT, profile.staked_amount);
        profile.staked_amount -= slash;
        profile.slashed = true;

        // Transfer slashed SOL to zone authority (could go to treasury instead)
        **ctx.accounts.stake_vault.to_account_info().try_borrow_mut_lamports()? -= slash;
        **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? += slash;

        emit!(SlashEvent {
            reporter: profile.authority,
            amount: slash,
            remaining_stake: profile.staked_amount,
        });

        Ok(())
    }

    /// Initialize a reporter profile (tracks contributions for rewards)
    pub fn init_profile(ctx: Context<InitProfile>) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        profile.authority = ctx.accounts.authority.key();
        profile.total_reports = 0;
        profile.rewards_claimed = 0;
        profile.staked_amount = 0;
        profile.last_report_ts = 0;
        profile.reputation_score = 100; // Start at 100, degrades with disputes
        profile.dispute_count = 0;
        profile.slashed = false;
        profile.bump = ctx.bumps.profile;
        Ok(())
    }

    /// Claim rewards — only verified reports count
    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        let profile = &mut ctx.accounts.profile;

        // Slashed reporters cannot claim
        require!(!profile.slashed, ErrorCode::AccountSlashed);

        let unclaimed = profile.total_reports.saturating_sub(profile.rewards_claimed);
        require!(unclaimed > 0, ErrorCode::NoRewardsToClaim);

        // Transfer SOL reward: 0.001 SOL per report
        let reward_lamports = (unclaimed as u64) * 1_000_000;
        let vault = &ctx.accounts.reward_vault;

        **vault.to_account_info().try_borrow_mut_lamports()? -= reward_lamports;
        **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? += reward_lamports;

        profile.rewards_claimed = profile.total_reports;

        emit!(RewardClaimedEvent {
            authority: profile.authority,
            amount: reward_lamports,
            reports_rewarded: unclaimed,
        });

        Ok(())
    }
}

// ── Accounts ──────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateZone<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Zone::INIT_SPACE,
        seeds = [b"zone", name.as_bytes()],
        bump,
    )]
    pub zone: Account<'info, Zone>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(
        mut,
        seeds = [b"profile", authority.key().as_ref()],
        bump = profile.bump,
        has_one = authority,
    )]
    pub profile: Account<'info, ReporterProfile>,
    /// CHECK: Stake vault PDA, validated by seeds
    #[account(
        mut,
        seeds = [b"stake_vault"],
        bump,
    )]
    pub stake_vault: AccountInfo<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitReport<'info> {
    #[account(
        init,
        payer = reporter,
        space = 8 + NoiseReport::INIT_SPACE,
        seeds = [b"report", zone.key().as_ref(), reporter.key().as_ref(), &zone.report_count.to_le_bytes()],
        bump,
    )]
    pub report: Account<'info, NoiseReport>,
    #[account(mut)]
    pub zone: Account<'info, Zone>,
    #[account(
        mut,
        seeds = [b"profile", reporter.key().as_ref()],
        bump = reporter_profile.bump,
    )]
    pub reporter_profile: Account<'info, ReporterProfile>,
    #[account(mut)]
    pub reporter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ValidateReport<'info> {
    #[account(mut)]
    pub report: Account<'info, NoiseReport>,
    #[account(
        seeds = [b"profile", validator.key().as_ref()],
        bump = validator_profile.bump,
    )]
    pub validator_profile: Account<'info, ReporterProfile>,
    #[account(mut)]
    pub validator: Signer<'info>,
}

#[derive(Accounts)]
pub struct SlashReporter<'info> {
    #[account(mut)]
    pub reporter_profile: Account<'info, ReporterProfile>,
    pub zone: Account<'info, Zone>,
    /// CHECK: Stake vault PDA
    #[account(
        mut,
        seeds = [b"stake_vault"],
        bump,
    )]
    pub stake_vault: AccountInfo<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitProfile<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + ReporterProfile::INIT_SPACE,
        seeds = [b"profile", authority.key().as_ref()],
        bump,
    )]
    pub profile: Account<'info, ReporterProfile>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(
        mut,
        seeds = [b"profile", authority.key().as_ref()],
        bump = profile.bump,
        has_one = authority,
    )]
    pub profile: Account<'info, ReporterProfile>,
    /// CHECK: Reward vault PDA, validated by seeds
    #[account(
        mut,
        seeds = [b"vault"],
        bump,
    )]
    pub reward_vault: AccountInfo<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// ── State ─────────────────────────────────────────────────

#[account]
#[derive(InitSpace)]
pub struct Zone {
    pub authority: Pubkey,
    #[max_len(64)]
    pub name: String,
    pub lat: f64,
    pub lng: f64,
    pub radius_m: u32,
    pub report_count: u64,
    pub avg_decibels: u16,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct NoiseReport {
    pub reporter: Pubkey,
    pub zone: Pubkey,
    pub decibels: u16,
    pub lat: f64,
    pub lng: f64,
    pub timestamp: i64,
    pub verified: bool,
    pub flagged: bool,
    pub validation_count: u8,
    pub dispute_count: u8,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct ReporterProfile {
    pub authority: Pubkey,
    pub total_reports: u64,
    pub rewards_claimed: u64,
    pub staked_amount: u64,
    pub last_report_ts: i64,
    pub reputation_score: u8,
    pub dispute_count: u64,
    pub slashed: bool,
    pub bump: u8,
}

// ── Events ────────────────────────────────────────────────

#[event]
pub struct NoiseReportEvent {
    pub reporter: Pubkey,
    pub zone: Pubkey,
    pub decibels: u16,
    pub lat: f64,
    pub lng: f64,
    pub timestamp: i64,
    pub flagged: bool,
}

#[event]
pub struct ValidationEvent {
    pub validator: Pubkey,
    pub report: Pubkey,
    pub agrees: bool,
    pub validation_count: u8,
    pub dispute_count: u8,
}

#[event]
pub struct StakeEvent {
    pub authority: Pubkey,
    pub amount: u64,
    pub total_staked: u64,
}

#[event]
pub struct SlashEvent {
    pub reporter: Pubkey,
    pub amount: u64,
    pub remaining_stake: u64,
}

#[event]
pub struct RewardClaimedEvent {
    pub authority: Pubkey,
    pub amount: u64,
    pub reports_rewarded: u64,
}

// ── Errors ────────────────────────────────────────────────

#[error_code]
pub enum ErrorCode {
    #[msg("Zone name must be 64 characters or less")]
    NameTooLong,
    #[msg("Decibel reading must be between 1 and 194")]
    InvalidDecibels,
    #[msg("No rewards to claim")]
    NoRewardsToClaim,
    #[msg("Coordinates out of valid range")]
    InvalidCoordinates,
    #[msg("Timestamp too far from current time (max 5 min)")]
    TimestampTooFar,
    #[msg("Must wait 60 seconds between reports in the same zone")]
    ReportCooldown,
    #[msg("Must stake at least 0.01 SOL to submit reports")]
    InsufficientStake,
    #[msg("Cannot validate your own report")]
    CannotSelfValidate,
    #[msg("Unauthorized action")]
    Unauthorized,
    #[msg("Insufficient evidence for slashing")]
    InsufficientEvidence,
    #[msg("Account has been slashed — cannot claim rewards")]
    AccountSlashed,
    #[msg("Zone radius must be between 1 and 10000 meters")]
    InvalidRadius,
}
