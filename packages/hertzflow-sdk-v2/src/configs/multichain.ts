import { SOURCE_BSC_MAINNET, SOURCE_BSC_TESTNET } from "./chainIds";
import { SourceChainId } from "./chains";

function ensureExhaustive<T extends number>(value: Record<T, true>): T[] {
  return Object.keys(value).map(Number) as T[];
}

export const SOURCE_CHAINS: SourceChainId[] = ensureExhaustive<SourceChainId>({
  [SOURCE_BSC_MAINNET]: true,
  [SOURCE_BSC_TESTNET]: true,
});

export function isSourceChain(chainId: number | undefined): chainId is SourceChainId {
  return SOURCE_CHAINS.includes(chainId as SourceChainId);
}
