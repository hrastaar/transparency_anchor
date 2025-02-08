pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;
pub mod nft;

use {
    anchor_lang::prelude::*, 
    errors::ErrorCode, 
    instructions::create_post::*,
    instructions::update_post::*,
    instructions::delete_post::*,
    nft::nft_validation::nft_validation::is_signer_nft_member
};

declare_id!("A1JwCbCR9s3RCruL23hUFNnRknV1dgFoEJzUVYL6jwN6");

#[program]
pub mod transparency_anchor {

    use super::*;

    pub fn create_post(
        ctx: Context<CreatePost>,
        post_file_url: String,
        is_scam: bool,
        post_rating: u8,
    ) -> Result<()> {
        let metadata_account= &ctx.accounts.metadata;
        let nft_token_account = &ctx.accounts.token_account;
        
        let nft_validation_result = is_signer_nft_member(metadata_account, nft_token_account);

        if let Err(error) = nft_validation_result {
            return Err(error);
        }

        if !(1..=5).contains(&post_rating) {
            msg!("Invalid post rating");
            return err!(ErrorCode::InvalidPostRating);
        }

        let post = &mut ctx.accounts.post;

        post.author = ctx.accounts.payer.key();
        post.topic_address = ctx.accounts.topic_address.key();
        post.post_file_url = post_file_url;
        post.is_scam = is_scam;
        post.post_rating = post_rating;

        Ok(())
    }

    pub fn update_post(
        ctx: Context<UpdatePost>,
        post_file_url: String,
        is_scam: bool,
        post_rating: u8,
    ) -> Result<()> {
        let metadata_account: &mut AccountInfo<'_> = &mut ctx.accounts.metadata;
        let nft_token_account: &mut Account<'_, anchor_spl::token::TokenAccount> = &mut ctx.accounts.token_account;
        
        let nft_validation_result = is_signer_nft_member(metadata_account, nft_token_account);

        if let Err(error) = nft_validation_result {
            return Err(error);
        }
        
        let post = &mut ctx.accounts.post;

        post.post_file_url = post_file_url;
        post.is_scam = is_scam;
        post.post_rating = post_rating;

        msg!("Successfully updated post with post file url");

        Ok(())
    }

    pub fn delete_post(_ctx: Context<DeletePost>) -> Result<()> {
        msg!("Successfully deleted post");
        Ok(())
    }
}
