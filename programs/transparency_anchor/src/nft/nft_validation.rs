pub mod nft_validation {

    use anchor_lang::prelude::msg;
    use anchor_spl::token::TokenAccount;
    use mpl_token_metadata::accounts::Metadata;
    use crate::constants::COLLECTION_MINT_ADDRESS;
    use {
        anchor_lang::prelude::*,
        crate::errors::ErrorCode
    };

    pub fn is_signer_nft_member<'info>(metadata_account: &AccountInfo<'info>, token_account: &Account<'info, TokenAccount>) -> Result<()> {
        let metadata: Metadata = Metadata::try_from(&metadata_account.to_account_info())?;

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
        return Ok(());
    }
}
