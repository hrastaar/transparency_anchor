use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Post already exists")]
    PostAlreadyExists,
    
    #[msg("Invalid post rating")]
    InvalidPostRating,
} 