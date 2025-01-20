use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Post already exists")]
    PostAlreadyExists,

    #[msg("Invalid post rating")]
    InvalidPostRating,

    #[msg("Invalid collection")]
    InvalidCollection,

    #[msg("Missing Collection")]
    MissingCollection,

    #[msg("Bad Pubkey")]
    BadPubkey,

    #[msg("Bad mint")]
    IncorrectMint,

    #[msg("Invalid token amount")]
    InvalidTokenAmount,

    #[msg("Invalid token owner")]
    InvalidTokenOwner,

    #[msg("Invalid post author")]
    InvalidPostAuthor,

    #[msg("Metadata account must be owned by metaplex")]
    NonMetaplexMetadataAccount
}
