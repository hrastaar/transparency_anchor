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
} 
