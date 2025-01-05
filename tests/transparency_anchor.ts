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

  it('Add a Post to valid profile', async () => {
    const [postPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("post"), topicPubkeyAddress.toBuffer(), provider.wallet.publicKey.toBuffer()],
      program.programId
    );
    const postUrlString: string = "https://shadow-storage.genesysgo.net/hello_world"

    const postAccounts = {
      payer: provider.wallet.publicKey,
      topicAddress: topicPubkeyAddress,
      post: postPda,
      systemProgram: SystemProgram.programId,
    } as const;

    try {
      await program.methods
        .createPost(postUrlString)
        .accounts(postAccounts)
        .rpc();
    } catch (error) {
      console.log("Error creating post:", error);
      throw error;
    }

    const postAccount = await program.account.post.fetch(postPda);
    expect(postAccount.author.toString()).to.equal(provider.wallet.publicKey.toString());
    expect(postAccount.postFileUrl).to.equal(postUrlString);
    expect(postAccount.topicAddress.toString()).to.equal(topicPubkeyAddress.toString());
  });
});
