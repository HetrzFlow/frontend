import type { ApiFindRouteData } from "@masterpeach/aggregator-sdk";
import { getAddress, isHex, type Hex } from "viem";

import type { ExternalSwapRouteStream, ExternalSwapRouteStreamHop } from "types/externalSwap";

type WeightedStream = {
  numerator: bigint;
  denominator: bigint;
  order: number;
  hops: ExternalSwapRouteStreamHop[];
};

const getPoolId = (pool: string): Hex => {
  if (!isHex(pool)) throw new Error(`Invalid Peach pool id: ${pool}`);
  return pool;
};

export const buildRouteStreams = (
  data: ApiFindRouteData,
  tokenIn: string,
  tokenOut: string
): ExternalSwapRouteStream[] => {
  const source = tokenIn.toLowerCase();
  const target = tokenOut.toLowerCase();
  const paths = data.paths;
  if (paths.some((path) => BigInt(path.amount_in) <= 0n || BigInt(path.amount_out) <= 0n)) {
    throw new Error("Peach route contains a zero-amount path");
  }
  const outgoing = new Map<string, Array<{ index: number; path: (typeof paths)[number] }>>();

  paths.forEach((path, index) => {
    const key = path.token_in.toLowerCase();
    const edges = outgoing.get(key) ?? [];
    edges.push({ index, path });
    outgoing.set(key, edges);
  });

  const usedEdges = new Set<number>();
  const streams: WeightedStream[] = [];

  const visit = (
    token: string,
    numerator: bigint,
    denominator: bigint,
    hops: ExternalSwapRouteStreamHop[],
    visited: Set<string>,
    edgeIndexes: number[]
  ) => {
    if (token === target) {
      edgeIndexes.forEach((index) => usedEdges.add(index));
      streams.push({ numerator, denominator, hops, order: streams.length });
      return;
    }
    if (visited.has(token)) throw new Error("Peach route contains a cycle");

    const edges = outgoing.get(token) ?? [];
    if (edges.length === 0) throw new Error("Peach route contains a broken path");
    const totalAmountIn = edges.reduce((total, edge) => total + BigInt(edge.path.amount_in), 0n);
    if (totalAmountIn <= 0n) throw new Error("Peach route contains an empty split");

    const nextVisited = new Set(visited).add(token);
    for (const { index, path } of edges) {
      const amountIn = BigInt(path.amount_in);
      visit(
        path.token_out.toLowerCase(),
        numerator * amountIn,
        denominator * totalAmountIn,
        [
          ...hops,
          {
            providerCode: String(path.provider),
            pool: getPoolId(path.pool),
            tokenIn: getAddress(path.token_in),
            tokenOut: getAddress(path.token_out),
            amountIn,
            amountOut: BigInt(path.amount_out),
            feeRate: path.fee_rate,
          },
        ],
        nextVisited,
        [...edgeIndexes, index]
      );
    }
  };

  visit(source, 1n, 1n, [], new Set(), []);
  if (streams.length === 0 || usedEdges.size !== paths.length) {
    throw new Error("Peach route contains an orphaned path");
  }

  const allocated = streams.map((stream) => {
    const scaled = stream.numerator * 10_000n;
    return {
      ...stream,
      percentageBps: Number(scaled / stream.denominator),
      remainder: scaled % stream.denominator,
    };
  });
  const remaining = 10_000 - allocated.reduce((sum, stream) => sum + stream.percentageBps, 0);
  const remainderOrder = [...allocated].sort((a, b) => {
    const comparison = a.remainder * b.denominator - b.remainder * a.denominator;
    return comparison === 0n ? a.order - b.order : comparison > 0n ? -1 : 1;
  });
  for (let index = 0; index < remaining; index += 1) {
    remainderOrder[index]!.percentageBps += 1;
  }

  return allocated
    .sort((a, b) => b.percentageBps - a.percentageBps || a.order - b.order)
    .map(({ percentageBps, hops }) => ({ percentageBps, hops }));
};
