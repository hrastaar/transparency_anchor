use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

use crate::state::*;
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct CreatePost<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        constraint = token_account.amount >= 1 @ ErrorCode::InvalidTokenAmount,
        constraint = token_account.owner == payer.key() @ ErrorCode::InvalidTokenOwner
    )]
    pub token_account: Account<'info, TokenAccount>,

    /// CHECK: Metadata account is manually verified
    pub metadata: AccountInfo<'info>,

    /// CHECK: This is not written to, just used as a reference for PDA creation
    pub topic_address: AccountInfo<'info>,

    #[account(
        init,
        seeds = [b"post", topic_address.key().as_ref(), payer.key().as_ref()],
        bump,
        payer = payer,
        space = 8 + Post::INIT_SPACE,
    )]
    pub post: Account<'info, Post>,
    pub system_program: Program<'info, System>,
}
