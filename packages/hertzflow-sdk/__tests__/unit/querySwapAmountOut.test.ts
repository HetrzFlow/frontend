import { describe, it, expect, beforeAll } from '@jest/globals';
import { HertzFlowSDK } from '../../src/sdk';
import {
  ProtocolStoreObjectInfo,
  QueryModule,
} from '../../src/modules/queryModule';
import { initTestnetSDK } from '../../src/config/testnet';
import {
  SwapWithAmountInQueryParams,
  SwapAmountOutResult,
} from '../../src/modules/queryModule';

describe('QueryModule.querySwapAmountOut Unit Tests', () => {
  let sdk: HertzFlowSDK;
  let queryModule: QueryModule;
  let protocolStore: ProtocolStoreObjectInfo;

  const testParams = {
    collateralCoinPrice: '117082.91805971',
    collateralCoinDecimals: 8,
    receiverCoinDecimals: 8,
    receiverCoinPrice: '4593.25721288',
    slippage: 0.02,
    typeArguments: [
      '0x8c73df029cb08f82e064b215b78a3b8996174d9c536074c0bef8504f9f1abf9f::btc::BTC',
      '0xcffbb3233da5992a8b336d0ff9de73a56c0332844133992348600d5030cf86d9::eth::ETH',
    ] as [string, string],
    amountIn: '0.000102',
  };

  beforeAll(async () => {
    console.log('🔧  SDK ...');

    sdk = initTestnetSDK();
    queryModule = sdk.QueryModule;

    try {
      protocolStore = await sdk.QueryModule.parseProtocolStoreObject();
    } catch (error) {
      console.error('❌  protocolStore :', error);
      throw error;
    }
  }, 60000);

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return 'null';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  describe('querySwapAmountOut ', () => {
    it(' BTC -> ETH  swap ', async () => {
      const queryParams: SwapWithAmountInQueryParams = {
        protocolStore,
        typeArguments: testParams.typeArguments,
        amountIn: testParams.amountIn,
        inCoinDecimals: testParams.collateralCoinDecimals,
        slippage: testParams.slippage,
        outCoinPrice: testParams.receiverCoinPrice,
        outCoinDecimals: testParams.receiverCoinDecimals,
      };

      try {
        const result: SwapAmountOutResult =
          await queryModule.querySwapAmountOut(queryParams);
        console.log(formatValue(result));
        expect(result).toBeDefined();
      } catch (error) {
        console.error('❌ :', error);
        console.error(':', (error as Error).message);
        throw error;
      }
    }, 60000);
  });
});
