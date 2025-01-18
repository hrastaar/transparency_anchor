import * as anchor from '@coral-xyz/anchor'
import {Program} from '@coral-xyz/anchor'
import { PublicKey, Keypair, SystemProgram, ComputeBudgetProgram } from '@solana/web3.js'
import {TransparencyAnchor} from '../target/types/transparency_anchor'
import { expect } from "chai";
import * as bs58 from 'bs58';
import { Metadata } from '@metaplex-foundation/mpl-token-metadata';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import * as dotenv from 'dotenv';

dotenv.config();

const provider = anchor.AnchorProvider.env()
anchor.setProvider(provider)

const program = anchor.workspace.TransparencyAnchor as Program<TransparencyAnchor>;

describe('transparency', () => {
  const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
    units: 400_000
  });

  const MINT_ADDRESS_STRING: string = "HWbWwBfzZ7KqWcFLfuakvPGD1zwPzjotXb99ggdyFJgB";

  const secretKey58 = process.env.PRIVATE_KEY_BASE_58 || '';
  const secretKey = bs58.default.decode(secretKey58);
  const NFT_HOLDING_KEYPAIR = Keypair.fromSecretKey(secretKey);

  const topicPubkeyAddress1 = Keypair.generate().publicKey;
  it('Creates post from account holding the required NFT', async () => {
    // Get the associated metadata account for the mint
    const mintPublicKey = new PublicKey(MINT_ADDRESS_STRING);
    const metadataPda = await Metadata.getPDA(mintPublicKey);

    // Get the associated token account for the NFT, and the NFT_HOLDING_KEYPAIR wallet
    const ata = await getAssociatedTokenAddress(
      mintPublicKey,
      NFT_HOLDING_KEYPAIR.publicKey
    );

    const [postPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('post'), topicPubkeyAddress1.toBuffer(), NFT_HOLDING_KEYPAIR.publicKey.toBuffer()],
      program.programId
    );

    const postAccounts = {
      payer: NFT_HOLDING_KEYPAIR.publicKey,
      topicAddress: topicPubkeyAddress1,
      tokenAccount: ata,
      metadata: metadataPda,
      post: postPda,
      systemProgram: SystemProgram.programId,
    } as const;
  
    const SHDW_POST_URL_STRING = "https://shadow-storage.genesysgo.net/hello_world";
    const IS_SCAM = false;
    const POST_RATING = 5;
  
    try {
      await program.methods
        .createPost(SHDW_POST_URL_STRING, IS_SCAM, POST_RATING)
        .preInstructions([modifyComputeUnits])
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
    expect(postAccount.topicAddress.toString()).to.equal(topicPubkeyAddress1.toString());
    expect(postAccount.isScam).to.equal(IS_SCAM);
    expect(postAccount.postRating).to.equal(POST_RATING);
  });

  it('Fails to create a post - missing NFT', async () => {
    // Get the associated metadata account for the mint
    const mintPublicKey = new PublicKey(MINT_ADDRESS_STRING);
    const metadataPda = await Metadata.getPDA(mintPublicKey);

    const ata = await getAssociatedTokenAddress(
      mintPublicKey,
      NFT_HOLDING_KEYPAIR.publicKey
    );
    
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
      tokenAccount: ata,
      metadata: metadataPda,
      post: postPda,
      systemProgram: SystemProgram.programId,
    } as const;
  
    const SHDW_POST_URL_STRING = "https://shadow-storage.genesysgo.net/hello_world";
    const IS_SCAM = false;
    const POST_RATING = 5;
  
    try {
      await program.methods
        .createPost(SHDW_POST_URL_STRING, IS_SCAM, POST_RATING)
        .preInstructions([modifyComputeUnits])
        .accounts(postAccounts)
        .signers([randomUserKeypair])
        .rpc();
        expect.fail("Transaction should have failed due to missing nft");
    } catch (error) {
      // Expect a constraint error because the signer does not own the token account provided.
      expect(error.error.errorCode.code).to.equal('InvalidTokenOwner');
    }
  });

  it('Updates post from author account', async () => {
    const [postPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('post'), topicPubkeyAddress1.toBuffer(), NFT_HOLDING_KEYPAIR.publicKey.toBuffer()],
      program.programId
    );

    // Previous post account checks.
    const postAccount = await program.account.post.fetch(postPda);

    const SHDW_POST_URL_STRING = "https://shadow-storage.genesysgo.net/hello_world";
    const IS_SCAM = false;
    const POST_RATING = 5;

    expect(postAccount.author.toString()).to.equal(provider.wallet.publicKey.toString());
    expect(postAccount.postFileUrl).to.equal(SHDW_POST_URL_STRING);
    expect(postAccount.topicAddress.toString()).to.equal(topicPubkeyAddress1.toString());
    expect(postAccount.isScam).to.equal(IS_SCAM);
    expect(postAccount.postRating).to.equal(POST_RATING);

    const postAccounts = {
      payer: NFT_HOLDING_KEYPAIR.publicKey,
      topicAddress: topicPubkeyAddress1,
      post: postPda,
      systemProgram: SystemProgram.programId,
    } as const;
  
    const UPDATED_SHDW_POST_URL_STRING = "https://shadow-storage.genesysgo.net/updated_shdw_post.json";
    const UPDATED_IS_SCAM = true;
    const UPDATED_POST_RATING = 1;
  
    try {
      await program.methods
        .updatePost(UPDATED_SHDW_POST_URL_STRING, UPDATED_IS_SCAM, UPDATED_POST_RATING)
        .preInstructions([modifyComputeUnits])
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
    expect(updatedPostAccount.topicAddress.toString()).to.equal(topicPubkeyAddress1.toString());
    expect(updatedPostAccount.isScam).to.equal(UPDATED_IS_SCAM);
    expect(updatedPostAccount.postRating).to.equal(UPDATED_POST_RATING);
  });
});
