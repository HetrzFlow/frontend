import { describe, it, expect, beforeAll } from '@jest/globals';
import { HertzFlowSDK } from '../../src/sdk';
import {
  ProtocolStoreObjectInfo,
  QueryModule,
} from '../../src/modules/queryModule';
import { initTestnetSDK } from '../../src/config/testnet';
import {
  SwapWithAmountOutQueryParams,
  SwapAmountInResult,
} from '../../src/modules/queryModule';

describe('QueryModule.querySwapAmountIn Unit Tests', () => {
  let sdk: HertzFlowSDK;
  let queryModule: QueryModule;
  let protocolStore: ProtocolStoreObjectInfo;

  const testParams = {
    typeArguments: [
      '0xcffbb3233da5992a8b336d0ff9de73a56c0332844133992348600d5030cf86d9::eth::ETH',
      '0x55e327fc2111a236f26dff6d5f1869645551ef679542220495ad662e0b48e537::usdc::USDC',
    ] as [string, string],
    amountOut: '52492.65708',
    inCoinDecimals: 8,
    outCoinDecimals: 6,
    slippage: 0.005,
    outCoinPrice: '0.9993752820946',
  };

  beforeAll(async () => {
    console.log('🔧  SDK ...');

    sdk = initTestnetSDK();
    queryModule = sdk.QueryModule;

    console.log('📊 SDK :');
    console.log(`  - Package ID: ${sdk.sdkOptions.packageId}`);
    console.log(`  - RPC URL: ${sdk.sdkOptions.fullRpcUrl}`);
    console.log(`  - API URL: ${sdk.sdkOptions.apiUrl}`);

    console.log('🔄  protocolStore...');
    try {
      protocolStore = await sdk.QueryModule.parseProtocolStoreObject();
      console.log('✅ protocolStore ');
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

  describe('querySwapAmountIn ', () => {
    it(' ETH -> USDC  swap ', async () => {
      console.log('🚀  ETH -> USDC swap ...');
      console.log('📋 :');
      console.log(`  - : ETH`);
      console.log(`  - : USDC`);
      console.log(`  - : ${testParams.amountOut} USDC`);
      console.log(`  - : ${testParams.slippage * 100}%`);
      console.log(`  - : ${testParams.outCoinPrice}`);

      const queryParams: SwapWithAmountOutQueryParams = {
        typeArguments: testParams.typeArguments,
        amountOut: testParams.amountOut,
        inCoinDecimals: testParams.inCoinDecimals,
        outCoinDecimals: testParams.outCoinDecimals,
        outCoinPrice: testParams.outCoinPrice,
        slippage: testParams.slippage,
        protocolStore,
      };

      try {
        const startTime = Date.now();
        const result: SwapAmountInResult =
          await queryModule.querySwapAmountIn(queryParams);
        const endTime = Date.now();
        const executionTime = endTime - startTime;

        console.log(`✅ ，: ${executionTime}ms`);
        console.log('📊 :');
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
