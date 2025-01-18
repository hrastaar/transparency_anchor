use anchor_lang::prelude::*;

use crate::state::*;
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct UpdatePost<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: This is not written to, just used as a reference for PDA creation
    pub topic_address: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [b"post", topic_address.key().as_ref(), payer.key().as_ref()],
        bump,
        constraint = post.author == payer.key() @ ErrorCode::InvalidPostAuthor
    )]
    pub post: Account<'info, Post>,

    pub system_program: Program<'info, System>,
}
