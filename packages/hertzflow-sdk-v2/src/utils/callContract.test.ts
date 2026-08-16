import { describe, expect, it, vi } from "vitest";

import { SOURCE_BSC_TESTNET } from "configs/chains";

import { sendTransaction } from "./callContract";

const ACCOUNT = "0x1111111111111111111111111111111111111111";
const TARGET = "0x2222222222222222222222222222222222222222";

describe("sendTransaction", () => {
  it("sends raw calldata through the SDK wallet with the shared transaction options", async () => {
    const walletClient = {
      sendTransaction: vi.fn().mockResolvedValue(`0x${"3".repeat(64)}`),
    };
    const sdk = {
      account: ACCOUNT,
      chainId: SOURCE_BSC_TESTNET,
      walletClient,
    } as never;

    await sendTransaction(sdk, { to: TARGET, data: "0x1234", value: 5n }, { gasLimit: 100_000n, gasPrice: 3n });

    expect(walletClient.sendTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        account: ACCOUNT,
        to: TARGET,
        data: "0x1234",
        value: 5n,
        gas: 100_000n,
        gasPrice: 3n,
      })
    );
  });
});
