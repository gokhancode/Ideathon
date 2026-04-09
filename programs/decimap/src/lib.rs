use anchor_lang::prelude::*;

declare_id!("DeCiMAPxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");

#[program]
pub mod decimap {
    use super::*;

    /// Initialize a noise zone (e.g. "ETH Zurich Campus", "Zurich Altstadt")
    pub fn create_zone(ctx: Context<CreateZone>, name: String, lat: f64, lng: f64, radius_m: u32) -> Result<()> {
        require!(name.len() <= 64, ErrorCode::NameTooLong);
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

    /// Submit a noise reading from a device/phone
    pub fn submit_report(
        ctx: Context<SubmitReport>,
        decibels: u16,
        lat: f64,
        lng: f64,
        timestamp: i64,
    ) -> Result<()> {
        require!(decibels <= 194, ErrorCode::InvalidDecibels); // 194 dB is theoretical max
        require!(decibels > 0, ErrorCode::InvalidDecibels);

        let report = &mut ctx.accounts.report;
        report.reporter = ctx.accounts.reporter.key();
        report.zone = ctx.accounts.zone.key();
        report.decibels = decibels;
        report.lat = lat;
        report.lng = lng;
        report.timestamp = timestamp;
        report.verified = false;
        report.bump = ctx.bumps.report;

        // Update zone stats (running average)
        let zone = &mut ctx.accounts.zone;
        let total = (zone.avg_decibels as u64) * (zone.report_count as u64) + (decibels as u64);
        zone.report_count += 1;
        zone.avg_decibels = (total / zone.report_count as u64) as u16;

        // Update reporter profile
        let profile = &mut ctx.accounts.reporter_profile;
        profile.total_reports += 1;

        emit!(NoiseReportEvent {
            reporter: report.reporter,
            zone: report.zone,
            decibels,
            lat,
            lng,
            timestamp,
        });

        Ok(())
    }

    /// Initialize a reporter profile (tracks contributions for rewards)
    pub fn init_profile(ctx: Context<InitProfile>) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        profile.authority = ctx.accounts.authority.key();
        profile.total_reports = 0;
        profile.rewards_claimed = 0;
        profile.bump = ctx.bumps.profile;
        Ok(())
    }

    /// Claim rewards based on report count (simplified reward mechanism)
    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        let unclaimed = profile.total_reports.saturating_sub(profile.rewards_claimed);
        require!(unclaimed > 0, ErrorCode::NoRewardsToClaim);

        // Transfer SOL reward: 0.001 SOL per report
        let reward_lamports = (unclaimed as u64) * 1_000_000; // 0.001 SOL each
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
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct ReporterProfile {
    pub authority: Pubkey,
    pub total_reports: u64,
    pub rewards_claimed: u64,
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
}
