import * as anchor from '@coral-xyz/anchor'
import {Program} from '@coral-xyz/anchor'
import { PublicKey, Keypair, SystemProgram } from '@solana/web3.js'
import {TransparencyAnchor} from '../target/types/transparency_anchor'
import { expect } from "chai";

describe('transparency', () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.TransparencyAnchor as Program<TransparencyAnchor>
  const topicPubkeyAddress = Keypair.generate().publicKey;

  it('Fails to create a post with invalid post rating values', async () => {
    const [postPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('post'), topicPubkeyAddress.toBuffer(), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    const postAccounts = {
      payer: provider.wallet.publicKey,
      topicAddress: topicPubkeyAddress,
      post: postPda,
      systemProgram: SystemProgram.programId,
    } as const;

    const SHDW_POST_URL_STRING = "https://shadow-storage.genesysgo.net/hello_world";
    const IS_SCAM = false;
    const INVALID_POST_RATING = 0; // Invalid rating (not within [1, 5])
    const ALTERNATIVE_INVALID_POST_RATING = 6;

    try {
      await program.methods
        .createPost(SHDW_POST_URL_STRING, IS_SCAM, INVALID_POST_RATING)
        .accounts(postAccounts)
        .rpc();

      // If the transaction doesn't throw an error, the test should fail
      expect.fail("Transaction should have failed due to too small post rating");
    } catch (error) {
      const invalidPostRatingAnchorError = error as anchor.AnchorError;
      // Check if the error code is as expected (InvalidPostRating)
      expect(invalidPostRatingAnchorError.error.errorCode.code).to.equal("InvalidPostRating");
      expect(invalidPostRatingAnchorError.error.errorMessage).to.equal("Invalid post rating");
    }

    try {
      await program.methods
        .createPost(SHDW_POST_URL_STRING, IS_SCAM, ALTERNATIVE_INVALID_POST_RATING)
        .accounts(postAccounts)
        .rpc();

      // If the transaction doesn't throw an error, the test should fail
      expect.fail("Transaction should have failed due to too large post rating");
    } catch (error) {
      const invalidPostRatingAnchorError = error as anchor.AnchorError;
      // Check if the error code is as expected (InvalidPostRating)
      expect(invalidPostRatingAnchorError.error.errorCode.code).to.equal("InvalidPostRating");
      expect(invalidPostRatingAnchorError.error.errorMessage).to.equal("Invalid post rating");
    }
  });

  it('Add a Post to valid profile', async () => {
    const [postPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("post"), topicPubkeyAddress.toBuffer(), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    const postAccounts = {
      payer: provider.wallet.publicKey,
      topicAddress: topicPubkeyAddress,
      post: postPda,
      systemProgram: SystemProgram.programId,
    } as const;

    const SHDW_POST_URL_STRING: string = "https://shadow-storage.genesysgo.net/hello_world"
    const IS_SCAM: boolean = false;
    const POST_RATING: number = 5;

    try {
      await program.methods
        .createPost(SHDW_POST_URL_STRING, IS_SCAM, POST_RATING)
        .accounts(postAccounts)
        .rpc();
    } catch (error) {
      console.log("Error creating post:", error);
      throw error;
    }

    const postAccount = await program.account.post.fetch(postPda);

    expect(postAccount.author.toString()).to.equal(provider.wallet.publicKey.toString());
    expect(postAccount.postFileUrl).to.equal(SHDW_POST_URL_STRING);
    expect(postAccount.topicAddress.toString()).to.equal(topicPubkeyAddress.toString());
    expect(postAccount.isScam).to.equal(IS_SCAM);
    expect(postAccount.postRating).to.equal(POST_RATING);
  });
});
