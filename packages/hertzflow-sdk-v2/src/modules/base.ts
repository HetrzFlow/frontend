import type { HertzFlowSDK } from "..";

export class Module {
  constructor(public sdk: HertzFlowSDK) {
    this.sdk = sdk;
  }

  get oracle() {
    return this.sdk.oracle;
  }

  get chainId() {
    return this.sdk.chainId;
  }

  get account() {
    return this.sdk.account;
  }

  get walletClient() {
    return this.sdk.walletClient;
  }

  get publicClient() {
    return this.sdk.publicClient;
  }

  get logger() {
    return this.sdk.logger;
  }
}
