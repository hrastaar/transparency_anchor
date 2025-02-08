use anchor_lang::prelude::*;

use crate::state::*;

#[derive(Accounts)]
pub struct DeletePost<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: This is not written to, just used as a reference for PDA creation
    pub topic_address: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [b"post", topic_address.key().as_ref(), payer.key().as_ref()],
        bump,
        close = payer,
    )]
    pub post: Account<'info, Post>,

    pub system_program: Program<'info, System>,
}
