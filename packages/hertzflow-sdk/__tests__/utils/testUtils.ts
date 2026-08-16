import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';

export class TestUtils {
  constructor(
    private readonly client: SuiClient,
    private readonly keypair: Ed25519Keypair,
  ) {}

  async getCoinMetadata(coinType: string) {
    const coinMetadata = await this.client.getCoinMetadata({
      coinType,
    });
    if (!coinMetadata) throw new Error('Failed to get coin metadata');
    return coinMetadata;
  }

  async executeAndWaitForTx(tx: Transaction) {
    const result = await this.client.signAndExecuteTransaction({
      signer: this.keypair,
      transaction: tx,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });

    const txResponse = await this.client.waitForTransaction({
      digest: result.digest,
      options: {
        showEvents: true,
        showEffects: true,
      },
    });

    console.log('Transaction events:', txResponse.events);
    console.log('Transaction effects:', txResponse.effects);

    return txResponse;
  }

  async executeWithGasBudget(tx: Transaction, gasBudget: number = 10000000) {
    tx.setGasBudget(gasBudget);
    return this.executeAndWaitForTx(tx);
  }
}
