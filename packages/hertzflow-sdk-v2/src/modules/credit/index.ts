import { abis } from "abis/index";
import { getContract } from "configs/contracts";
import { Module } from "modules/base";
import type { Address } from "viem";

export const CREDIT_TOKEN_DECIMALS = 18;

export type CreditFeeClaimLimits = {
  totalClaimableCredit: bigint;
  maxClaimableCredit: bigint;
};

export type CreditFeeClaimPreview = {
  claimTokens: readonly Address[];
  tokenAmounts: readonly bigint[];
  creditAmounts: readonly bigint[];
};

export class Credit extends Module {
  private requireAccount(account?: Address): Address {
    const resolvedAccount = account ?? this.account;
    if (!resolvedAccount) {
      throw new Error("Account is required for Credit operations");
    }
    return resolvedAccount;
  }

  async getFeeClaimLimits(account?: Address): Promise<CreditFeeClaimLimits> {
    const resolvedAccount = this.requireAccount(account);
    const vault = getContract(this.chainId, "CreditFeeClaimVault");
    const [totalClaimableCredit, maxClaimableCredit] = await Promise.all([
      this.publicClient.readContract({
        address: vault,
        abi: abis.CreditFeeClaimVault,
        functionName: "totalClaimableCredit",
        args: [resolvedAccount],
      }),
      this.publicClient.readContract({
        address: vault,
        abi: abis.CreditFeeClaimVault,
        functionName: "maxClaimableCredit",
        args: [resolvedAccount],
      }),
    ]);

    return { totalClaimableCredit, maxClaimableCredit };
  }

  async getFeeClaimPreview(creditAmount: bigint, account?: Address): Promise<CreditFeeClaimPreview> {
    const resolvedAccount = this.requireAccount(account);
    const [claimTokens, tokenAmounts, creditAmounts] = await this.publicClient.readContract({
      address: getContract(this.chainId, "CreditFeeClaimVault"),
      abi: abis.CreditFeeClaimVault,
      functionName: "previewClaim",
      args: [resolvedAccount, creditAmount],
    });

    return { claimTokens, tokenAmounts, creditAmounts };
  }

  async getFeeClaimAllowance(account?: Address): Promise<bigint> {
    const resolvedAccount = this.requireAccount(account);
    return this.publicClient.readContract({
      address: getContract(this.chainId, "CreditToken"),
      abi: abis.ERC20,
      functionName: "allowance",
      args: [resolvedAccount, getContract(this.chainId, "CreditFeeClaimVault")],
    });
  }

  approveFeeClaim(creditAmount: bigint) {
    this.requireAccount();
    return this.sdk.callContract(getContract(this.chainId, "CreditToken"), abis.ERC20, "approve", [
      getContract(this.chainId, "CreditFeeClaimVault"),
      creditAmount,
    ]);
  }

  claimFeeRebate(creditAmount: bigint) {
    this.requireAccount();
    return this.sdk.callContract(
      getContract(this.chainId, "CreditFeeClaimVault"),
      abis.CreditFeeClaimVault,
      "claim",
      [creditAmount]
    );
  }

  claimAirdrop() {
    this.requireAccount();
    return this.sdk.callContract(getContract(this.chainId, "CreditDistributor"), abis.CreditDistributor, "claim", []);
  }

  claimTokenAirdrop() {
    this.requireAccount();
    return this.sdk.callContract(getContract(this.chainId, "XP"), abis.XP, "claim", []);
  }
}
