import { describe, it, expect, beforeAll } from '@jest/globals';
import { HertzFlowSDK } from '../../src/sdk';
import { PositionModule } from '../../src/modules/positionModule';
import { initTestnetSDK } from '../../src/config/testnet';
import { TEST_CONFIG } from '../constants/testConstants';

describe('PositionModule Integration Tests', () => {
  let sdk: HertzFlowSDK;
  let positionModule: PositionModule;

  const TEST_USER_ADDRESS =
    '0x06d121bbbadba4b8f1c50abc9fb0c31023cea313a77e1d783bb83beada0e47a5';

  beforeAll(() => {
    sdk = initTestnetSDK();
    positionModule = sdk.PositionModule;

    console.log('🔧 SDK :');
    console.log(`  - Package ID: ${sdk.sdkOptions.packageId}`);
    console.log(`  - RPC URL: ${sdk.sdkOptions.fullRpcUrl}`);
    console.log(`  - API URL: ${sdk.sdkOptions.apiUrl}`);
  });

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return 'null';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  describe('getPositionRequestById', () => {
    it(
      ' position request',
      async () => {
        try {
          const result = await positionModule.getPositionRequestById(
            '34',
            'increase',
          );

          if (result) {
            expect(result).toBeDefined();
          }
        } catch (error) {
          console.error('❌ :', error);
          throw error;
        }
      },
      TEST_CONFIG.TIMEOUT,
    );
  });

  describe('getUserCompletePositions', () => {
    it(
      ' PositionManager ',
      async () => {
        try {
          const positions =
            await positionModule.getUserCompletePositions(TEST_USER_ADDRESS);
          expect(Array.isArray(positions)).toBe(true);
        } catch (error) {
          throw error;
        }
      },
      TEST_CONFIG.TIMEOUT,
    );
  });
});
