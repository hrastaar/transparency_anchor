use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
pub struct CreatePost<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
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
