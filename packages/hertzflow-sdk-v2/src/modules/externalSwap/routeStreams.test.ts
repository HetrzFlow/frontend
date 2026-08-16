import type { ApiFindRouteData, ApiRoutePath } from "@masterpeach/aggregator-sdk";
import { describe, expect, it } from "vitest";

import { buildRouteStreams } from "./routeStreams";

const A = "0x1111111111111111111111111111111111111111";
const B = "0x2222222222222222222222222222222222222222";
const C = "0x3333333333333333333333333333333333333333";
const D = "0x4444444444444444444444444444444444444444";
const E = "0x5555555555555555555555555555555555555555";
const POOL = "0x6666666666666666666666666666666666666666";
const POOL_ID = `0x${"7".repeat(64)}`;

const path = (
  tokenIn: string,
  tokenOut: string,
  amountIn: number,
  provider: string,
  pool = POOL
): ApiRoutePath => ({
  pool,
  provider,
  adapter: POOL,
  token_in: tokenIn,
  token_out: tokenOut,
  direction: true,
  fee_rate: "0.0025",
  amount_in: String(amountIn),
  amount_out: String(amountIn),
});

const data = (paths: ApiRoutePath[]): ApiFindRouteData => ({
  request_id: "route-test",
  amount_in: "1000",
  amount_out: "1000",
  deviation_ratio: "0",
  paths,
  contracts: { router: POOL, adapters: {} },
  gas: 1,
});

describe("buildRouteStreams", () => {
  it("keeps an ordered multi-hop route as one stream", () => {
    const streams = buildRouteStreams(data([path(A, B, 1000, "pancakev2"), path(B, E, 1000, "UNISWAPV3")]), A, E);

    expect(streams).toHaveLength(1);
    expect(streams[0]?.percentageBps).toBe(10_000);
    expect(streams[0]?.hops.map((hop) => hop.providerCode)).toEqual(["pancakev2", "UNISWAPV3"]);
    expect(streams[0]?.hops[0]?.feeRate).toBe("0.0025");
  });

  it("preserves 32-byte pool ids used by V4 and Infinity providers", () => {
    const streams = buildRouteStreams(
      data([path(A, E, 1000, "PANCAKE_INFINITY_CL", POOL_ID)]),
      A,
      E
    );

    expect(streams[0]?.hops[0]?.pool).toBe(POOL_ID);
  });

  it("expands an intermediate split into complete source-to-target streams", () => {
    const streams = buildRouteStreams(
      data([
        path(A, B, 1000, "PANCAKEV2"),
        path(B, C, 700, "DODO"),
        path(B, D, 300, "THENAV3"),
        path(C, E, 700, "UNISWAPV3"),
        path(D, E, 300, "BISWAP"),
      ]),
      A,
      E
    );

    expect(streams.map((stream) => stream.percentageBps)).toEqual([7000, 3000]);
    expect(streams.map((stream) => stream.hops.map((hop) => hop.providerCode))).toEqual([
      ["PANCAKEV2", "DODO", "UNISWAPV3"],
      ["PANCAKEV2", "THENAV3", "BISWAP"],
    ]);
  });

  it("duplicates a shared downstream hop after branches merge", () => {
    const streams = buildRouteStreams(
      data([
        path(A, B, 600, "PANCAKEV2"),
        path(A, C, 400, "UNISWAPV3"),
        path(B, D, 600, "DODO"),
        path(C, D, 400, "THENAV3"),
        path(D, E, 1000, "BISWAP"),
      ]),
      A,
      E
    );

    expect(streams.map((stream) => stream.percentageBps)).toEqual([6000, 4000]);
    expect(streams.every((stream) => stream.hops.at(-1)?.providerCode === "BISWAP")).toBe(true);
  });

  it("uses stable largest-remainder allocation totaling exactly 10000 bps", () => {
    const streams = buildRouteStreams(
      data([
        path(A, B, 1, "FIRST"),
        path(A, C, 1, "SECOND"),
        path(A, D, 1, "THIRD"),
        path(B, E, 1, "END_ONE"),
        path(C, E, 1, "END_TWO"),
        path(D, E, 1, "END_THREE"),
      ]),
      A,
      E
    );

    expect(streams.map((stream) => stream.percentageBps)).toEqual([3334, 3333, 3333]);
    expect(streams.reduce((sum, stream) => sum + stream.percentageBps, 0)).toBe(10_000);
    expect(streams.map((stream) => stream.hops[0]?.providerCode)).toEqual(["FIRST", "SECOND", "THIRD"]);
  });

  it("rejects broken, cyclic, and orphaned graphs", () => {
    expect(() => buildRouteStreams(data([path(A, B, 1, "BROKEN")]), A, E)).toThrow("broken path");
    expect(() => buildRouteStreams(data([path(A, B, 1, "ONE"), path(B, A, 1, "TWO")]), A, E)).toThrow("cycle");
    expect(() => buildRouteStreams(data([path(A, E, 1, "VALID"), path(C, D, 1, "ORPHAN")]), A, E)).toThrow(
      "orphaned path"
    );
    expect(() => buildRouteStreams(data([path(A, E, 0, "ZERO")]), A, E)).toThrow("zero-amount path");
  });
});
