pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

use {
    anchor_lang::prelude::*, errors::ErrorCode, instructions::create_post::*,
    instructions::update_post::*,
};

declare_id!("DL1fGdczcn6St1kqgnaV5v5fwoicpTW3FLHhsAJbQPPM");

#[program]
pub mod transparency_anchor {

    use mpl_token_metadata::accounts::Metadata;

    use super::*;

    const COLLECTION_MINT_ADDRESS: &str = "DWmiAaepNXAV7iZYNwAp7huwNbyYukctTmPHxE4ungR1";

    pub fn create_post(
        ctx: Context<CreatePost>,
        post_file_url: String,
        is_scam: bool,
        post_rating: u8,
    ) -> Result<()> {
        let metadata_account = &mut ctx.accounts.metadata;

        let metadata: Metadata = Metadata::try_from(&metadata_account.to_account_info())?;

        if metadata.mint != ctx.accounts.token_account.mint {
            msg!("Metadata account mint does not match token account mint");
            return Err(error!(ErrorCode::IncorrectMint));
        }

        if let Some(collection) = metadata.collection {
            let collection_mint_pubkey: Pubkey = match Pubkey::try_from(COLLECTION_MINT_ADDRESS) {
                Ok(pubkey) => pubkey,
                Err(err) => {
                    eprintln!("Unable to convert collection mint to pubkey: {}", err);
                    return Err(error!(ErrorCode::BadPubkey));
                }
            };

            if collection.key != collection_mint_pubkey {
                return Err(error!(ErrorCode::InvalidCollection));
            }
        } else {
            return Err(error!(ErrorCode::MissingCollection));
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
        let post = &mut ctx.accounts.post;

        post.post_file_url = post_file_url;
        post.is_scam = is_scam;
        post.post_rating = post_rating;

        msg!("Successfully updated post with post file url");

        Ok(())
    }
}
