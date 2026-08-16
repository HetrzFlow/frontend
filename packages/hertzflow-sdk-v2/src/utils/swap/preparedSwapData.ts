import { MARKETS } from "configs/markets";
import { SwapPaths } from "types/trade";

import { MarketsGraph, buildMarketsAdjacencyGraph } from "./buildMarketsAdjacencyGraph";
import { findSwapPathsBetweenTokens } from "./findSwapPathsBetweenTokens";

const MARKETS_ADJACENCY_GRAPH: {
  [chainId: number]: MarketsGraph;
} = {};

for (const chainId in MARKETS) {
  const markets = MARKETS[chainId];
  const chainGraph = buildMarketsAdjacencyGraph(markets);

  MARKETS_ADJACENCY_GRAPH[chainId] = chainGraph;
}

const TOKEN_SWAP_PATHS: {
  [chainId: number]: SwapPaths;
} = {};

for (const chainId in MARKETS) {
  const chainGraph = MARKETS_ADJACENCY_GRAPH[chainId];
  const chainSwapPaths = findSwapPathsBetweenTokens(chainGraph);

  TOKEN_SWAP_PATHS[chainId] = chainSwapPaths;
}

export { MARKETS_ADJACENCY_GRAPH, TOKEN_SWAP_PATHS };
