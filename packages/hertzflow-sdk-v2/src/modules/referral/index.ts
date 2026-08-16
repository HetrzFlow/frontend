import { abis } from "abis/index";
import { getContract } from "configs/contracts";
import { affiliateRewardKey } from "configs/dataStore";
import { Abi, Address, zeroAddress, zeroHash } from "viem";

import { Market } from "types/markets";
import { UserReferralInfo } from "types/referral";
import { ContractCallsConfig } from "utils/multicall";
import { basisPointsToFloat } from "utils/numbers";
import { decodeReferralCode, encodeReferralCode } from "utils/referral";

import { Module } from "../base";

export interface AffiliateRewardItem {
  marketAddress: string;
  longTokenAddress: Address;
  shortTokenAddress: Address;
  affiliateRewardLong: bigint;
  affiliateRewardShort: bigint;
}

export class Referral extends Module {
  private getEncodedReferralCode(code: string) {
    const encodedCode = encodeReferralCode(code);

    if (encodedCode === zeroHash) {
      throw new Error("Invalid referral code");
    }

    return encodedCode;
  }

  async getCodeOwner(code: string | undefined): Promise<string | undefined> {
    if (!code) {
      return undefined;
    }

    const encodedCode = this.getEncodedReferralCode(code);
    const referralStorageAddress = getContract(this.chainId, "ReferralStorage");

    return this.sdk
      .executeMulticall({
        referralStorage: {
          contractAddress: referralStorageAddress,
          abiId: "ReferralStorage",
          calls: {
            codeOwner: {
              methodName: "codeOwners",
              params: [encodedCode],
            },
          },
        },
      })
      .then((res) => {
        return res.data.referralStorage.codeOwner.returnValues[0];
      });
  }

  async getTraderReferralCode(account?: string) {
    if (!account || account === zeroAddress) {
      return undefined;
    }

    const referralStorageAddress = getContract(this.chainId, "ReferralStorage");

    return this.sdk
      .executeMulticall({
        referralStorage: {
          contractAddress: referralStorageAddress,
          abiId: "ReferralStorage",
          calls: {
            traderReferralCode: {
              methodName: "traderReferralCodes",
              params: [account],
            },
          },
        },
      })
      .then((res) => {
        const traderReferralCode = res.data.referralStorage.traderReferralCode.returnValues?.[0];
        return traderReferralCode && traderReferralCode !== zeroHash ? traderReferralCode : undefined;
      });
  }

  async getTraderReferralSnapshot(account?: string) {
    if (!account || account === zeroAddress) {
      return undefined;
    }

    const referralStorageAddress = getContract(this.chainId, "ReferralStorage");
    const res = await this.sdk.executeMulticall({
      referralStorage: {
        contractAddress: referralStorageAddress,
        abiId: "ReferralStorage",
        calls: {
          traderReferralInfo: {
            methodName: "getTraderReferralInfo",
            params: [account],
          },
          referrerTiers: {
            methodName: "referrerTiers",
            params: [account],
          },
        },
      },
    });

    const [userReferralCode, affiliate] = res.data.referralStorage.traderReferralInfo.returnValues ?? [];
    const tierId = res.data.referralStorage.referrerTiers.returnValues?.[0];
    const attachedOnChain = !!userReferralCode && userReferralCode !== zeroHash;

    return {
      attachedOnChain,
      userReferralCode: attachedOnChain ? userReferralCode : undefined,
      userReferralCodeString: attachedOnChain && userReferralCode ? decodeReferralCode(userReferralCode) : undefined,
      affiliate: affiliate && affiliate !== zeroAddress ? affiliate : undefined,
      tierId: tierId === undefined ? undefined : Number(tierId),
    };
  }

  async getTierDetail(tierId?: number) {
    if (tierId === undefined) {
      return {
        l0: 0n,
        l1: 0n,
        l2: 0n,
      };
    }

    const referralStorageAddress = getContract(this.chainId, "ReferralStorage");
    const res = await this.sdk.executeMulticall({
      referralStorage: {
        contractAddress: referralStorageAddress,
        abiId: "ReferralStorage",
        calls: {
          tierDetail: {
            methodName: "getTierDetail",
            params: [tierId],
          },
        },
      },
    });

    const [l0 = 0n, l1 = 0n, l2 = 0n] = res.data.referralStorage.tierDetail.returnValues ?? [];

    return { l0, l1, l2 };
  }

  async getReferrerChain(account?: string) {
    if (!account || account === zeroAddress) {
      return undefined;
    }

    const referralStorageAddress = getContract(this.chainId, "ReferralStorage");
    const res = await this.sdk.executeMulticall({
      referralStorage: {
        contractAddress: referralStorageAddress,
        abiId: "ReferralStorage",
        calls: {
          referrerChain: {
            methodName: "getReferrerChain",
            params: [account],
          },
        },
      },
    });

    const [l1Parent, l2Parent] = res.data.referralStorage.referrerChain.returnValues ?? [];

    return {
      l1Parent: l1Parent && l1Parent !== zeroAddress ? l1Parent : undefined,
      l2Parent: l2Parent && l2Parent !== zeroAddress ? l2Parent : undefined,
    };
  }

  async registerCode(code: string) {
    const referralStorageAddress = getContract(this.chainId, "ReferralStorage");

    return this.sdk.callContract(referralStorageAddress, abis.ReferralStorage as Abi, "registerCode", [
      this.getEncodedReferralCode(code),
    ]);
  }

  async bindReferrer(code: string) {
    const referralStorageAddress = getContract(this.chainId, "ReferralStorage");

    return this.sdk.callContract(referralStorageAddress, abis.ReferralStorage as Abi, "bindReferrer", [
      this.getEncodedReferralCode(code),
    ]);
  }

  async transferCode(code: string, newOwner: Address) {
    const referralStorageAddress = getContract(this.chainId, "ReferralStorage");

    return this.sdk.callContract(referralStorageAddress, abis.ReferralStorage as Abi, "transferCode", [
      this.getEncodedReferralCode(code),
      newOwner,
    ]);
  }

  async claimAffiliateRewards(markets: Address[], tokens: Address[], receiver: Address) {
    return this.sdk.callContract(
      getContract(this.chainId, "ExchangeRouter"),
      abis.ExchangeRouter as Abi,
      "claimAffiliateRewards",
      [markets, tokens, receiver]
    );
  }

  /**
   * Read claimable affiliate rewards (long & short collateral) for the connected
   * account across the given markets via a single DataStore multicall.
   * Iterates each market across its long and short collateral tokens.
   */
  async getAffiliateRewards(markets: Market[]): Promise<AffiliateRewardItem[]> {
    const account = this.account;
    if (!account || !markets.length) {
      return [];
    }

    const dataStoreAddress = getContract(this.chainId, "DataStore");

    const request: Record<string, ContractCallsConfig<any>> = {
      dataStore: {
        contractAddress: dataStoreAddress,
        abiId: "DataStore",
        calls: markets.reduce(
          (acc, market) => {
            const { marketTokenAddress, longTokenAddress, shortTokenAddress } = market;
            acc[`${marketTokenAddress}-${longTokenAddress}`] = {
              methodName: "getUint",
              params: [affiliateRewardKey(marketTokenAddress, longTokenAddress, account)],
            };
            if (shortTokenAddress.toLowerCase() !== longTokenAddress.toLowerCase()) {
              acc[`${marketTokenAddress}-${shortTokenAddress}`] = {
                methodName: "getUint",
                params: [affiliateRewardKey(marketTokenAddress, shortTokenAddress, account)],
              };
            }
            return acc;
          },
          {} as Record<string, { methodName: string; params: any[] }>
        ),
      },
    };

    const res = await this.sdk.executeMulticall(request);
    const calls = res.data.dataStore as Record<string, { returnValues: bigint[] }>;

    return markets.map((market) => {
      const { marketTokenAddress, longTokenAddress, shortTokenAddress } = market;
      const longAmount = calls[`${marketTokenAddress}-${longTokenAddress}`]?.returnValues?.[0] ?? 0n;
      const shortAmount =
        shortTokenAddress.toLowerCase() === longTokenAddress.toLowerCase()
          ? 0n
          : (calls[`${marketTokenAddress}-${shortTokenAddress}`]?.returnValues?.[0] ?? 0n);
      return {
        marketAddress: marketTokenAddress,
        longTokenAddress: longTokenAddress as Address,
        shortTokenAddress: shortTokenAddress as Address,
        affiliateRewardLong: BigInt(longAmount),
        affiliateRewardShort: BigInt(shortAmount),
      };
    });
  }

  async getUserReferralInfo(): Promise<UserReferralInfo | undefined> {
    const snapshot = await this.getTraderReferralSnapshot(this.account);

    if (!snapshot) {
      return undefined;
    }

    const { userReferralCode, userReferralCodeString, attachedOnChain, affiliate, tierId } = snapshot;

    if (!attachedOnChain || !userReferralCode || !userReferralCodeString) {
      return undefined;
    }

    const { l0, l1, l2 } = await this.getTierDetail(tierId);
    const totalRebate = l0 + l1 + l2;

    return {
      userReferralCode,
      userReferralCodeString,
      attachedOnChain,
      affiliate: affiliate ?? zeroAddress,
      tierId: tierId ?? 0,
      totalRebate,
      totalRebateFactor: basisPointsToFloat(totalRebate),
      discountShare: l0,
      discountFactor: basisPointsToFloat(l0),
    };
  }
}
