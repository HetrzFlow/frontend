import {
  Abi,
  Address,
  createPublicClient,
  createWalletClient,
  Hex,
  http,
  PublicClient,
  WalletClient,
  webSocket,
} from "viem";

import { BATCH_CONFIGS } from "configs/batch";
import { getViemChain } from "configs/chains";
import { Markets } from "modules/markets";
import { Liquidity } from "modules/liquidity";
import { Oracle } from "modules/oracle";
import { Orders } from "modules/orders/orders";
import { Positions } from "modules/positions/positions";
import { Tokens } from "modules/tokens/tokens";
import { Utils } from "modules/utils/utils";
import { Events } from "modules/events";
import { Claim } from "modules/claim";
import type { HertzFlowSdkConfig } from "types/sdk";
import { callContract, CallContractOpts, sendTransaction as sendRawTransaction } from "utils/callContract";
import type { SendTransactionOpts } from "utils/callContract";
import { createLogger, type Logger } from "utils/logger";
import { MAX_TIMEOUT, Multicall, MulticallRequestConfig } from "utils/multicall";
import { Allowance } from "modules/allowance";
import { Referral } from "modules/referral";
import { Credit } from "modules/credit";
import { ExternalSwap } from "modules/externalSwap";

export { CREDIT_TOKEN_DECIMALS } from "modules/credit";
export type { CreditFeeClaimLimits, CreditFeeClaimPreview } from "modules/credit";
export { PEACH_NATIVE_TOKEN_ADDRESS } from "modules/externalSwap";
export type { LiquidityOrder, LiquidityOrderKind, LiquidityOrderScope } from "modules/liquidity";
export {
  Allowance,
  Claim,
  Credit,
  Events,
  ExternalSwap,
  Liquidity,
  Markets,
  Oracle,
  Orders,
  Positions,
  Referral,
  Tokens,
  Utils,
};

export class HertzFlowSDK {
  public readonly logger: Logger;

  public readonly markets = new Markets(this);
  public readonly liquidity = new Liquidity(this);
  public readonly tokens = new Tokens(this);
  public readonly positions = new Positions(this);
  public readonly orders = new Orders(this);
  public readonly utils = new Utils(this);
  public readonly oracle = new Oracle(this);
  public readonly events = new Events(this);
  public readonly claim = new Claim(this);
  public readonly allowance = new Allowance(this);
  public readonly referral = new Referral(this);
  public readonly credit = new Credit(this);
  public readonly externalSwap = new ExternalSwap(this);

  public publicClient: PublicClient;
  public walletClient: WalletClient;
  public wsPublicClient: PublicClient;

  constructor(public config: HertzFlowSdkConfig) {
    this.logger = createLogger(() => this.config.settings?.debugMode !== false);
    this.publicClient =
      config.publicClient ??
      createPublicClient({
        transport: http(this.config.rpcUrl, {
          // retries works strangely in viem, so we disable them
          retryCount: 0,
          retryDelay: 10000000,
          batch: BATCH_CONFIGS[this.config.chainId]?.http,
          timeout: MAX_TIMEOUT,
        }),
        pollingInterval: undefined,
        batch: BATCH_CONFIGS[this.config.chainId]?.client,
        chain: getViemChain(this.config.chainId),
      });
    this.walletClient =
      config.walletClient ??
      createWalletClient({
        account: config.account as Address,
        chain: getViemChain(config.chainId),
        transport: http(config.rpcUrl, {
          retryCount: 0,
          retryDelay: 10000000,
          batch: BATCH_CONFIGS[config.chainId]?.http,
          timeout: MAX_TIMEOUT,
        }),
      });
    this.wsPublicClient = config.wsRpcUrl
      ? createPublicClient({
          transport: webSocket(config.wsRpcUrl),
          batch: BATCH_CONFIGS[config.chainId]?.client,
          chain: getViemChain(config.chainId),
        })
      : this.publicClient;
  }

  setAccount(account: Address) {
    if (this.config.account !== account) {
      this.config.account = account;
      this.events.switchAccount();
      this.allowance.switchAccount();
    }
  }

  setWalletClient(walletClient: WalletClient) {
    this.walletClient = walletClient;
  }

  setPublicClient(publicClient: PublicClient) {
    this.publicClient = publicClient;
  }

  async executeMulticall<T = any>(request: MulticallRequestConfig<any>) {
    const multicall = await Multicall.getInstance(this);
    return multicall?.call(request, MAX_TIMEOUT) as Promise<T>;
  }

  async callContract(address: Address, abi: Abi, method: string, params: any[], opts?: CallContractOpts) {
    return callContract(this, address, abi, method, params, opts);
  }

  /** Send pre-encoded calldata through the SDK's configured wallet client. */
  async sendTransaction(transaction: { to: Address; data: Hex; value?: bigint }, opts?: SendTransactionOpts) {
    return sendRawTransaction(this, transaction, opts);
  }

  get chainId() {
    return this.config.chainId;
  }

  get chain() {
    return getViemChain(this.chainId);
  }

  get account() {
    return this.config.account;
  }

  destroy() {
    this.events.destroy();
    this.allowance.destroy();
  }
}
