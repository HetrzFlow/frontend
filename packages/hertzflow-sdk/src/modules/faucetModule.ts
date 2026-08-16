import { Transaction } from '@mysten/sui/transactions';
import { HertzFlowSDK } from '../sdk';
import {
  COMMON_CONSTS,
  CONTRACT_FUNCTION,
  CONTRACT_MODULE,
} from '../constants';
import { bcs } from '@mysten/bcs';

export interface BatchClaimEvent {
  user: string;
  tokens: string[];
  amounts: string[];
  timestamp: string;
}

export interface ClaimAllTokensParams {
  tokenType1: string;

  tokenType2: string;

  tokenType3: string;

  tx?: Transaction;
}

export class FaucetModule {
  protected _sdk: HertzFlowSDK;

  constructor(sdk: HertzFlowSDK) {
    this._sdk = sdk;
  }

  get sdk() {
    return this._sdk;
  }

  public createClaimAllTokensPayload(params: ClaimAllTokensParams) {
    const { tokenType1, tokenType2, tokenType3, tx } = params;
    const newTx = tx || new Transaction();

    newTx.moveCall({
      package: this.sdk.sdkOptions.faucet.package_id,
      module: CONTRACT_MODULE.FAUCET,
      function: CONTRACT_FUNCTION['faucet'].CLAIM_ALL_TOKENS,
      arguments: [
        newTx.object(this.sdk.sdkOptions.TOKENS_FAUCETS_ID),
        newTx.object(COMMON_CONSTS.CLOCK_ID),
      ],
      typeArguments: [tokenType1, tokenType2, tokenType3],
    });

    return newTx;
  }

  public async queryUserLastClaim(userAddress: string): Promise<number> {
    const tx = new Transaction();

    tx.moveCall({
      package: this.sdk.sdkOptions.faucet.package_id,
      module: CONTRACT_MODULE.FAUCET,
      function: CONTRACT_FUNCTION['faucet'].GET_USER_LAST_CLAIM,
      arguments: [
        tx.object(this.sdk.sdkOptions.TOKENS_FAUCETS_ID),
        tx.pure.address(userAddress),
      ],
    });

    const devInspectResult =
      await this.sdk.RpcModule.devInspectTransactionBlock({
        transactionBlock: tx,
        sender:
          this.sdk.senderAddress ||
          this.sdk.sdkOptions.simulationAccount.address,
      });

    const returnValues =
      devInspectResult.results?.[devInspectResult.results.length - 1]
        ?.returnValues;

    if (!returnValues || returnValues.length < 1) {
      throw new Error(
        `Invalid return values from get_user_last_claim. Expected 1, got ${returnValues?.length || 0}. Error: ${devInspectResult.error || 'none'}`,
      );
    }

    const lastClaimTimeRaw = bcs
      .u64()
      .parse(new Uint8Array(returnValues[0]![0]));
    const lastClaimTimeNumber = Number(lastClaimTimeRaw);
    return Math.floor(lastClaimTimeNumber / 1000);
  }
}
