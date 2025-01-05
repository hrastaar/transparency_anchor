use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Profile already exists")]
    ProfileAlreadyExists,
    #[msg("Profile does not exist")]
    ProfileDoesNotExist,
    #[msg("Post already exists")]
    PostAlreadyExists,
} 