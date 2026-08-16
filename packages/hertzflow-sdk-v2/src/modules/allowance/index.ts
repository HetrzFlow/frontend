import { getContract } from "configs/contracts";
import { Module } from "../base";
import { abis } from "abis/index";
import { Address, Log, zeroAddress, isAddress, maxUint256, type WatchContractEventReturnType } from "viem";
import { ContractCallsConfig } from "utils/multicall";

export class Allowance extends Module {
  disposers: Map<WatchContractEventReturnType, ["Approve", Address[], (logs: Log[]) => void]> = new Map();

  destroy() {
    for (const disposer of this.disposers.keys()) {
      try {
        disposer();
      } catch (e) {
        this.logger.error("Event dispose error:", e);
      }
    }
    this.disposers.clear();
  }

  async getTokenAllowance(tokenAddress: Address, spenderAddress: Address) {
    if (!this.account) {
      return;
    }

    const result = await this.sdk.executeMulticall({
      [tokenAddress]: {
        contractAddress: tokenAddress,
        abiId: "ERC20",
        calls: {
          allowance: {
            methodName: "allowance",
            params: [this.account, spenderAddress],
          },
        },
      } satisfies ContractCallsConfig<any>,
    });

    return result.data[tokenAddress].allowance.returnValues[0];
  }

  async getTokenAllowanceForSyntheticsRouter(tokenAddress: Address): Promise<bigint | undefined> {
    // Validate that tokenAddress is actually a token address, not a contract address
    if (!this.account) {
      return 0n;
    }

    try {
      return await this.getTokenAllowance(tokenAddress, getContract(this.chainId, "SyntheticsRouter"));
    } catch (error) {
      this.logger.error(`Error checking allowance for token ${tokenAddress}:`, error);
      throw error;
    }
  }

  async approveToken(tokenAddress: Address, spenderAddress: Address, amount: bigint = maxUint256) {
    if (!this.account) {
      throw new Error("No account connected");
    }

    try {
      return await this.sdk.callContract(tokenAddress, abis.ERC20, "approve", [spenderAddress, amount]);
    } catch (error) {
      this.logger.error(`Error approving token ${tokenAddress} for spender ${spenderAddress}:`, error);
      throw error;
    }
  }

  async approveTokenForSyntheticsRouter(tokenAddress: Address, amount: bigint = maxUint256) {
    const spenderAddress = getContract(this.chainId, "SyntheticsRouter");
    return await this.approveToken(tokenAddress, spenderAddress, amount);
  }

  async getTokenAllowanceForLiquidityRouter(tokenAddress: Address): Promise<bigint | undefined> {
    return this.getTokenAllowanceForSyntheticsRouter(tokenAddress);
  }

  async approveTokenForLiquidityRouter(tokenAddress: Address, amount: bigint = maxUint256) {
    return this.approveTokenForSyntheticsRouter(tokenAddress, amount);
  }

  switchAccount() {
    for (const [disposer, params] of new Map(this.disposers)) {
      try {
        disposer();
        this.disposers.delete(disposer);
        if (params[0] === "Approve") {
          this.subscribeApprovalEvents(params[1], params[2]);
        }
      } catch (e) {
        this.logger.error("Event dispose error:", e);
      }
    }
  }

  /**
   * Subscribe to Approval events for ERC20 tokens
   *
   * @param tokenAddresses Array of token addresses to monitor (if not provided, will monitor all tokens)
   * @param callback Function called when approval events are detected
   * @returns Cleanup function to unsubscribe
   */
  subscribeApprovalEvents(tokenAddresses: Address[], callback: (logs: Log[]) => void) {
    const accountAddress = this.sdk.account;
    let disposer = () => {};

    if (accountAddress) {
      // Get list of spenders to monitor
      const spenders = [zeroAddress, getContract(this.chainId, "SyntheticsRouter")] as Address[];

      // If tokenAddresses not provided, get all token addresses (excluding native token)
      const finalTokenAddresses = tokenAddresses.filter(
        (address) => isAddress(address) && address !== zeroAddress
      ) as Address[];

      // Create multiple watchers, one for each token since ERC20 Approval events are standard
      const watchers: WatchContractEventReturnType[] = [];

      for (const tokenAddress of finalTokenAddresses) {
        const watcher = this.sdk.wsPublicClient.watchContractEvent({
          address: tokenAddress,
          abi: abis.ERC20,
          eventName: "Approval",
          args: {
            owner: accountAddress,
            spender: spenders,
          },
          onLogs: (logs) => {
            const processedLogs = logs.map((log) => ({
              ...log,
              decodedData: {
                tokenAddress: tokenAddress,
                spender: log.args.spender,
                value: log.args.value,
              },
            }));

            callback(processedLogs as any);
          },
        });

        watchers.push(watcher);
      }

      // Create a disposer function that cleans up all watchers
      disposer = () => {
        watchers.forEach((watcher) => {
          try {
            watcher();
          } catch (e) {
            this.logger.error("Error disposing approval watcher:", e);
          }
        });
      };
    }

    this.disposers.set(disposer, ["Approve", tokenAddresses, callback]);

    return () => {
      disposer();
      this.disposers.delete(disposer);
    };
  }
}
