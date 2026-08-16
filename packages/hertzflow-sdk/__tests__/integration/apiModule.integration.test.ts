import { describe, it, expect, beforeAll } from '@jest/globals';
import { HertzFlowSDK } from '../../src/sdk';
import { ApiModule } from '../../src/modules/apiModule';
import { initTestnetSDK } from '../../src/config/testnet';

describe('ApiModule Integration Tests', () => {
  let sdk: HertzFlowSDK;
  let apiModule: ApiModule;

  beforeAll(() => {
    sdk = initTestnetSDK();
    apiModule = sdk.ApiModule;

    console.log('🔧 SDK :');
    console.log(`  - Package ID: ${sdk.sdkOptions.packageId}`);
    console.log(`  - RPC URL: ${sdk.sdkOptions.fullRpcUrl}`);
    console.log(`  - API URL: ${sdk.sdkOptions.apiUrl}`);
  });

  describe('fetchSignedPrice', () => {
    it(' (getAll=true)', async () => {
      try {
        const result = await apiModule.fetchSignedPrice(undefined, true);
        expect(result).toBeDefined();
        expect(result).not.toBeNull();
      } catch (error) {
        console.error('❌ :', error);
        throw error;
      }
    }, 30000);
  });
});
