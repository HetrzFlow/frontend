import { ClientConfig, MulticallBatchOptions } from "viem";

import { AnyChainId, SOURCE_BSC_MAINNET, SOURCE_BSC_TESTNET } from "./chains";

export const BATCH_CONFIGS: Record<
  AnyChainId,
  {
    http: MulticallBatchOptions;
    client: ClientConfig["batch"];
  }
> = {
  [SOURCE_BSC_MAINNET]: {
    http: {
      batchSize: 20,
      wait: 100,
    },
    client: {
      multicall: {
        batchSize: 1024 * 1024,
        wait: 100,
      },
    },
  },
  [SOURCE_BSC_TESTNET]: {
    http: {
      batchSize: 20,
      wait: 100,
    },
    client: {
      multicall: {
        batchSize: 512 * 1024,
        wait: 100,
      },
    },
  },
};
