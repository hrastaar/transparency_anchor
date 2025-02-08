use crate::constants::*;
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Post {
    pub author: Pubkey,
    pub topic_address: Pubkey,
    #[max_len(MAX_SHDW_URL_LENGTH)]
    pub post_file_url: String,
    pub is_scam: bool,   // pass in true if scam wallet, false otherwise
    pub post_rating: u8, // post rating, with value range [1,5] (inclusive)
}

impl Post {
    pub const INIT_SPACE: usize = 8 +
      32 +                        // author (Pubkey)
      32 +                        // topic_address (Pubkey)
      (4 + MAX_SHDW_URL_LENGTH) + // post_file_url (SHDW Drive files are 153 bytes)
      1 +                         // is_scam boolean, 1 byte.
      1; // post_rating u8, 1 byte.
}
