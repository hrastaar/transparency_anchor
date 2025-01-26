pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

use {
    anchor_lang::prelude::*, errors::ErrorCode, instructions::create_post::*,
    instructions::update_post::*,
};

declare_id!("2ziQobdPPPsgdc7e7Py1mZNs3UrhwiReUJH59ehW67Fd");

#[program]
pub mod transparency_anchor {

    use constants::COLLECTION_MINT_ADDRESS;
    use mpl_token_metadata::accounts::Metadata;

    use super::*;

    pub fn create_post(
        ctx: Context<CreatePost>,
        post_file_url: String,
        is_scam: bool,
        post_rating: u8,
    ) -> Result<()> {
        let metadata_account: &mut AccountInfo<'_> = &mut ctx.accounts.metadata;
        let metadata: Metadata = Metadata::try_from(&metadata_account.to_account_info())?;

        let token_account: &mut Account<'_, anchor_spl::token::TokenAccount> = &mut ctx.accounts.token_account;

        if metadata.mint != token_account.mint {
            msg!("Metadata account mint does not match token account mint");
            return Err(error!(ErrorCode::IncorrectMint));
        }

        let collection_mint_pubkey: Pubkey = match Pubkey::try_from(COLLECTION_MINT_ADDRESS) {
            Ok(pubkey) => pubkey,
            Err(err) => {
                eprintln!("Unable to convert collection mint to pubkey: {}", err);
                return Err(error!(ErrorCode::BadPubkey));
            }
        };

        if token_account.mint != collection_mint_pubkey {
            return Err(error!(ErrorCode::InvalidCollection));
        }

        msg!("Signer is a valid NFT member");

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
        let metadata: Metadata = Metadata::try_from(&metadata_account.to_account_info())?;

        let token_account: &mut Account<'_, anchor_spl::token::TokenAccount> = &mut ctx.accounts.token_account;

        if metadata.mint != token_account.mint {
            msg!("Metadata account mint does not match token account mint");
            return Err(error!(ErrorCode::IncorrectMint));
        }

        let collection_mint_pubkey: Pubkey = match Pubkey::try_from(COLLECTION_MINT_ADDRESS) {
            Ok(pubkey) => pubkey,
            Err(err) => {
                eprintln!("Unable to convert collection mint to pubkey: {}", err);
                return Err(error!(ErrorCode::BadPubkey));
            }
        };

        if token_account.mint != collection_mint_pubkey {
            return Err(error!(ErrorCode::InvalidCollection));
        }

        msg!("Signer is a valid NFT member");
        
        let post = &mut ctx.accounts.post;

        post.post_file_url = post_file_url;
        post.is_scam = is_scam;
        post.post_rating = post_rating;

        msg!("Successfully updated post with post file url");

        Ok(())
    }
}
