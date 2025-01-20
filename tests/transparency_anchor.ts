import * as anchor from '@coral-xyz/anchor'
import {Program} from '@coral-xyz/anchor'
import { PublicKey, Keypair, SystemProgram } from '@solana/web3.js'
import {TransparencyAnchor} from '../target/types/transparency_anchor'
import { expect } from "chai";
import * as bs58 from 'bs58';
import * as dotenv from 'dotenv';
import { getNFTAccounts } from './utils';

dotenv.config();

const provider = anchor.AnchorProvider.env()
anchor.setProvider(provider)

const program = anchor.workspace.TransparencyAnchor as Program<TransparencyAnchor>;

describe('transparency', () => {

  const secretKey58 = process.env.PRIVATE_KEY_BASE_58 || '';
  const secretKey = bs58.decode(secretKey58);
  const NFT_HOLDING_KEYPAIR = Keypair.fromSecretKey(secretKey);

  const POST_TOPIC_PUBLIC_KEY = Keypair.generate().publicKey;
  it('Creates post from account holding the required NFT', async () => {
    // Get the nft accounts.
    const nftAccounts = await getNFTAccounts(NFT_HOLDING_KEYPAIR.publicKey);

    const [postPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('post'), POST_TOPIC_PUBLIC_KEY.toBuffer(), NFT_HOLDING_KEYPAIR.publicKey.toBuffer()],
      program.programId
    );

    const postAccounts = {
      payer: NFT_HOLDING_KEYPAIR.publicKey,
      topicAddress: POST_TOPIC_PUBLIC_KEY,
      tokenAccount: nftAccounts.associatedTokenAccount,
      metadata: nftAccounts.metadataPda,
      post: postPda,
      systemProgram: SystemProgram.programId,
    } as const;
  
    const SHDW_POST_URL_STRING = "https://shadow-storage.genesysgo.net/hello_world";
    const IS_SCAM = false;
    const POST_RATING = 5;
  
    try {
      await program.methods
        .createPost(SHDW_POST_URL_STRING, IS_SCAM, POST_RATING)
        .accounts(postAccounts)
        .signers([NFT_HOLDING_KEYPAIR])
        .rpc();
    } catch (error) {
      console.error(error)
      throw error;
    }

    const postAccount = await program.account.post.fetch(postPda);

    expect(postAccount.author.toString()).to.equal(provider.wallet.publicKey.toString());
    expect(postAccount.postFileUrl).to.equal(SHDW_POST_URL_STRING);
    expect(postAccount.topicAddress.toString()).to.equal(POST_TOPIC_PUBLIC_KEY.toString());
    expect(postAccount.isScam).to.equal(IS_SCAM);
    expect(postAccount.postRating).to.equal(POST_RATING);
  });

  it('Fails to create a post - missing NFT', async () => {
    // Get the nft accounts.
    const nftAccounts = await getNFTAccounts(NFT_HOLDING_KEYPAIR.publicKey);
    
    const randomUserKeypair = Keypair.generate();

    // Transfer SOL from provider wallet to new user
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: NFT_HOLDING_KEYPAIR.publicKey,
      toPubkey: randomUserKeypair.publicKey,
      lamports: 0.05 * anchor.web3.LAMPORTS_PER_SOL,
    });

    const transferTx = new anchor.web3.Transaction().add(transferInstruction);
    await provider.sendAndConfirm(transferTx);
    
    const topicPubkeyAddress = Keypair.generate().publicKey;
    const [postPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('post'), topicPubkeyAddress.toBuffer(), randomUserKeypair.publicKey.toBuffer()],
      program.programId
    );

    const postAccounts = {
      payer: randomUserKeypair.publicKey,
      topicAddress: topicPubkeyAddress,
      tokenAccount: nftAccounts.associatedTokenAccount,
      metadata: nftAccounts.metadataPda,
      post: postPda,
      systemProgram: SystemProgram.programId,
    } as const;
  
    const SHDW_POST_URL_STRING = "https://shadow-storage.genesysgo.net/hello_world";
    const IS_SCAM = false;
    const POST_RATING = 5;
  
    try {
      await program.methods
        .createPost(SHDW_POST_URL_STRING, IS_SCAM, POST_RATING)
        .accounts(postAccounts)
        .signers([randomUserKeypair]) // IMPORTANT: This is the signer that does not own the token account.
        .rpc();
        expect.fail("Transaction should have failed due to missing nft");
    } catch (error) {
      // Expect a constraint error because the signer does not own the token account provided.
      expect(error.error.errorCode.code).to.equal('InvalidTokenOwner');
    }
  });

  it('Updates post from author account', async () => {
    // Get the nft accounts.
    const nftAccounts = await getNFTAccounts(NFT_HOLDING_KEYPAIR.publicKey);

    const [postPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('post'), POST_TOPIC_PUBLIC_KEY.toBuffer(), NFT_HOLDING_KEYPAIR.publicKey.toBuffer()],
      program.programId
    );

    // Previous post account checks.
    const postAccount = await program.account.post.fetch(postPda);

    const SHDW_POST_URL_STRING = "https://shadow-storage.genesysgo.net/hello_world";
    const IS_SCAM = false;
    const POST_RATING = 5;

    expect(postAccount.author.toString()).to.equal(provider.wallet.publicKey.toString());
    expect(postAccount.postFileUrl).to.equal(SHDW_POST_URL_STRING);
    expect(postAccount.topicAddress.toString()).to.equal(POST_TOPIC_PUBLIC_KEY.toString());
    expect(postAccount.isScam).to.equal(IS_SCAM);
    expect(postAccount.postRating).to.equal(POST_RATING);

    const postAccounts = {
      payer: NFT_HOLDING_KEYPAIR.publicKey,
      topicAddress: POST_TOPIC_PUBLIC_KEY,
      tokenAccount: nftAccounts.associatedTokenAccount,
      metadata: nftAccounts.metadataPda,
      post: postPda,
      systemProgram: SystemProgram.programId,
    } as const;
  
    const UPDATED_SHDW_POST_URL_STRING = "https://shadow-storage.genesysgo.net/updated_shdw_post.json";
    const UPDATED_IS_SCAM = true;
    const UPDATED_POST_RATING = 1;
  
    try {
      await program.methods
        .updatePost(UPDATED_SHDW_POST_URL_STRING, UPDATED_IS_SCAM, UPDATED_POST_RATING)
        .accounts(postAccounts)
        .signers([NFT_HOLDING_KEYPAIR])
        .rpc();
    } catch (error) {
      console.error(error)
      throw error;
    }

    const updatedPostAccount = await program.account.post.fetch(postPda);

    expect(updatedPostAccount.author.toString()).to.equal(provider.wallet.publicKey.toString());
    expect(updatedPostAccount.postFileUrl).to.equal(UPDATED_SHDW_POST_URL_STRING);
    expect(updatedPostAccount.topicAddress.toString()).to.equal(POST_TOPIC_PUBLIC_KEY.toString());
    expect(updatedPostAccount.isScam).to.equal(UPDATED_IS_SCAM);
    expect(updatedPostAccount.postRating).to.equal(UPDATED_POST_RATING);
  });
});

