import { beforeEach, describe, expect, it, vi } from "vitest";
import { zeroAddress, zeroHash } from "viem";

import { SOURCE_BSC_TESTNET } from "../../configs/chains";
import { basisPointsToFloat } from "../../utils/numbers";
import { encodeReferralCode } from "../../utils/referral";

import { Referral } from "./index";

describe("Referral", () => {
  const account = "0x1111111111111111111111111111111111111111";

  let executeMulticall: ReturnType<typeof vi.fn>;
  let callContract: ReturnType<typeof vi.fn>;
  let referral: Referral;

  beforeEach(() => {
    executeMulticall = vi.fn();
    callContract = vi.fn();
    referral = new Referral({
      chainId: SOURCE_BSC_TESTNET,
      account,
      executeMulticall,
      callContract,
    } as never);
  });

  it("claims affiliate rewards through the native exchange router", async () => {
    const market = "0x2222222222222222222222222222222222222222";
    const token = "0x3333333333333333333333333333333333333333";
    callContract.mockResolvedValueOnce(zeroHash);

    await referral.claimAffiliateRewards([market], [token], account);

    expect(callContract).toHaveBeenCalledWith(expect.any(String), expect.any(Array), "claimAffiliateRewards", [
      [market],
      [token],
      account,
    ]);
  });

  it("does not duplicate affiliate rewards when long and short use the same token", async () => {
    const marketAddress = "0x2222222222222222222222222222222222222222";
    const tokenAddress = "0x3333333333333333333333333333333333333333";
    executeMulticall.mockResolvedValueOnce({
      data: {
        dataStore: {
          [`${marketAddress}-${tokenAddress}`]: {
            returnValues: [12n],
          },
        },
      },
    });

    const result = await referral.getAffiliateRewards([
      {
        marketTokenAddress: marketAddress,
        longTokenAddress: tokenAddress,
        shortTokenAddress: tokenAddress,
      } as never,
    ]);

    const request = executeMulticall.mock.calls[0]?.[0];
    expect(Object.keys(request.dataStore.calls)).toHaveLength(1);
    expect(result).toEqual([
      {
        marketAddress,
        longTokenAddress: tokenAddress,
        shortTokenAddress: tokenAddress,
        affiliateRewardLong: 12n,
        affiliateRewardShort: 0n,
      },
    ]);
  });

  it("returns undefined when the trader has no bound referral code", async () => {
    executeMulticall.mockResolvedValueOnce({
      data: {
        referralStorage: {
          traderReferralInfo: {
            returnValues: [zeroHash, zeroAddress],
          },
          referrerTiers: {
            returnValues: [0n],
          },
        },
      },
    } as never);

    const result = await referral.getUserReferralInfo();

    expect(result).toBeUndefined();
  });

  it("derives discountFactor from the trader tier l0 when a referral code is bound", async () => {
    const referralCode = encodeReferralCode("TRADER");
    const affiliate = "0x2222222222222222222222222222222222222222";

    executeMulticall
      .mockResolvedValueOnce({
        data: {
          referralStorage: {
            traderReferralInfo: {
              returnValues: [referralCode, affiliate],
            },
            referrerTiers: {
              returnValues: [2n],
            },
          },
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          referralStorage: {
            tierDetail: {
              returnValues: [500n, 2000n, 1000n],
            },
          },
        },
      } as never);

    const result = await referral.getUserReferralInfo();

    expect(result).toMatchObject({
      affiliate,
      tierId: 2,
      userReferralCode: referralCode,
      userReferralCodeString: "TRADER",
      attachedOnChain: true,
      discountFactor: basisPointsToFloat(500n),
      discountShare: 500n,
      totalRebate: 3500n,
      totalRebateFactor: basisPointsToFloat(3500n),
    });
  });

  it("uses the trader tier instead of the affiliate tier for the discount", async () => {
    const referralCode = encodeReferralCode("OWNER");
    const affiliate = "0x3333333333333333333333333333333333333333";

    executeMulticall
      .mockResolvedValueOnce({
        data: {
          referralStorage: {
            traderReferralInfo: {
              returnValues: [referralCode, affiliate],
            },
            referrerTiers: {
              returnValues: [1n],
            },
          },
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          referralStorage: {
            tierDetail: {
              returnValues: [500n, 1000n, 1000n],
            },
          },
        },
      } as never);

    const result = await referral.getUserReferralInfo();

    expect(result?.discountFactor).toBe(basisPointsToFloat(500n));
    expect(executeMulticall).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        referralStorage: expect.objectContaining({
          calls: expect.objectContaining({
            referrerTiers: expect.objectContaining({
              params: [account],
            }),
          }),
        }),
      })
    );
  });
});
