import { describe, expect, it, vi } from "vitest";

import { SOURCE_BSC_TESTNET } from "configs/chains";

import { Markets } from "./index";

describe("Markets", () => {
  describe("getMarkets", () => {
    it("deduplicates concurrent market refreshes", async () => {
      const executeMulticall = vi.fn().mockResolvedValue({
        data: {
          markets: {
            markets: {
              returnValues: [
                {
                  marketToken: "0x1111111111111111111111111111111111111111",
                  indexToken: "0x2222222222222222222222222222222222222222",
                  longToken: "0x3333333333333333333333333333333333333333",
                  shortToken: "0x4444444444444444444444444444444444444444",
                },
              ],
            },
          },
        },
      });
      const markets = new Markets({
        chainId: SOURCE_BSC_TESTNET,
        executeMulticall,
        logger: { warn: vi.fn() },
      } as never);

      const [first, second] = await Promise.all([markets.getMarkets(), markets.getMarkets()]);

      expect(second).toBe(first);
      expect(executeMulticall).toHaveBeenCalledOnce();
    });

    it("keeps pagination caches and in-flight requests separate", async () => {
      const executeMulticall = vi.fn().mockResolvedValue({
        data: {
          markets: {
            markets: {
              returnValues: [],
            },
          },
        },
      });
      const markets = new Markets({
        chainId: SOURCE_BSC_TESTNET,
        executeMulticall,
        logger: { warn: vi.fn() },
      } as never);

      await Promise.all([markets.getMarkets(0n, 1n), markets.getMarkets(1n, 1n)]);
      await markets.getMarkets(0n, 1n);

      expect(executeMulticall).toHaveBeenCalledTimes(2);
    });

    it("keeps markets available and marks only unresolved wrapper candidates when Factory RPC fails", async () => {
      const unresolvedToken = "0x1111111111111111111111111111111111111111";
      const ordinaryLongToken = "0x2222222222222222222222222222222222222222";
      const ordinaryShortToken = "0x3333333333333333333333333333333333333333";
      const warn = vi.fn();
      const sdk = {
        chainId: SOURCE_BSC_TESTNET,
        executeMulticall: vi.fn().mockResolvedValue({
          data: {
            markets: {
              markets: {
                returnValues: [
                  {
                    marketToken: "0x4444444444444444444444444444444444444444",
                    indexToken: "0x5555555555555555555555555555555555555555",
                    longToken: unresolvedToken,
                    shortToken: unresolvedToken,
                  },
                  {
                    marketToken: "0x6666666666666666666666666666666666666666",
                    indexToken: "0x7777777777777777777777777777777777777777",
                    longToken: ordinaryLongToken,
                    shortToken: ordinaryShortToken,
                  },
                ],
              },
            },
          },
        }),
        publicClient: {
          multicall: vi.fn().mockRejectedValue(new Error("Factory RPC failed")),
        },
        logger: { warn },
      };
      const markets = new Markets(sdk as never);

      await expect(markets.getMarkets()).resolves.toMatchObject([
        { internalUsdResolutionError: true },
        { internalUsdResolutionError: false },
      ]);
      expect(warn).toHaveBeenCalledWith("Failed to resolve internal USD wrapper candidates", expect.any(Error));
    });
  });
});
