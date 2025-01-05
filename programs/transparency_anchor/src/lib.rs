pub mod state;
pub mod instructions;
pub mod errors;
pub mod constants;

use {
    anchor_lang::prelude::*,
    instructions::create_post::*,
};

declare_id!("DL1fGdczcn6St1kqgnaV5v5fwoicpTW3FLHhsAJbQPPM");

#[program]
pub mod transparency_anchor {
    use super::*;

    pub fn create_post(ctx: Context<CreatePost>, post_file_url: String) -> Result<()> {
        let post = &mut ctx.accounts.post;
        post.author = ctx.accounts.payer.key();
        post.topic_address = ctx.accounts.topic_address.key();
        post.post_file_url = post_file_url;
        Ok(())
    }
}
