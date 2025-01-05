use anchor_lang::prelude::*;
use crate::constants::*;

#[account]
#[derive(InitSpace)]
pub struct Post {
    pub author: Pubkey,
    pub topic_address: Pubkey,
    #[max_len(MAX_SHDW_URL_LENGTH)]
    pub post_file_url: String,
} 

impl Post {
    pub const INIT_SPACE: usize = 8 + 
      32 +                     // author (Pubkey)
      32 +                     // topic_address (Pubkey)
      4 + MAX_SHDW_URL_LENGTH; // post_file_url (String with max 100 chars)
  }