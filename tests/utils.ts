import { PublicKey } from '@solana/web3.js'
import { Metadata } from '@metaplex-foundation/mpl-token-metadata';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { MINT_ADDRESS_STRING } from './constants';

export async function getNFTAccounts(ownerPublicKey: PublicKey): Promise<NFTAccounts> {
    // Get the associated metadata account for the mint
    const mintPublicKey = new PublicKey(MINT_ADDRESS_STRING);
    const metadataPda = await Metadata.getPDA(mintPublicKey);
  
    const ata = await getAssociatedTokenAddress(
      mintPublicKey,
      ownerPublicKey
    );
  
    return {
      metadataPda,
      associatedTokenAccount: ata,
    };
  }
  
export interface NFTAccounts {
    metadataPda: PublicKey;
    associatedTokenAccount: PublicKey;
  }