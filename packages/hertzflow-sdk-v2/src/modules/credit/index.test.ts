import { beforeEach, describe, expect, it, vi } from "vitest";

import { SOURCE_BSC_TESTNET } from "../../configs/chains";
import { getContract } from "../../configs/contracts";

import { Credit } from "./index";

describe("Credit", () => {
  const account = "0x1111111111111111111111111111111111111111";
  const txHash = `0x${"1".repeat(64)}`;
  let readContract: ReturnType<typeof vi.fn>;
  let callContract: ReturnType<typeof vi.fn>;
  let credit: Credit;

  beforeEach(() => {
    readContract = vi.fn();
    callContract = vi.fn();
    credit = new Credit({
      chainId: SOURCE_BSC_TESTNET,
      account,
      publicClient: { readContract },
      callContract,
    } as never);
  });

  it("reads fee claim limits in parallel", async () => {
    readContract.mockResolvedValueOnce(12n).mockResolvedValueOnce(8n);

    await expect(credit.getFeeClaimLimits()).resolves.toEqual({
      totalClaimableCredit: 12n,
      maxClaimableCredit: 8n,
    });
    expect(readContract).toHaveBeenCalledTimes(2);
  });

  it("normalizes the fee claim preview", async () => {
    const token = "0x2222222222222222222222222222222222222222";
    readContract.mockResolvedValueOnce([[token], [10n], [10n]]);

    await expect(credit.getFeeClaimPreview(10n)).resolves.toEqual({
      claimTokens: [token],
      tokenAmounts: [10n],
      creditAmounts: [10n],
    });
  });

  it("claims a fee rebate through the configured vault", async () => {
    callContract.mockResolvedValueOnce(txHash);

    await expect(credit.claimFeeRebate(10n)).resolves.toBe(txHash);
    expect(callContract).toHaveBeenCalledWith(
      getContract(SOURCE_BSC_TESTNET, "CreditFeeClaimVault"),
      expect.any(Array),
      "claim",
      [10n]
    );
  });

  it("claims distributed Credit through the SDK", async () => {
    callContract.mockResolvedValueOnce(txHash);

    await expect(credit.claimAirdrop()).resolves.toBe(txHash);
    expect(callContract).toHaveBeenCalledWith(
      getContract(SOURCE_BSC_TESTNET, "CreditDistributor"),
      expect.any(Array),
      "claim",
      []
    );
  });
});
