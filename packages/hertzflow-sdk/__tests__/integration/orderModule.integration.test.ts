import { describe, it, expect, beforeAll } from '@jest/globals';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromHex } from '@mysten/sui/utils';
import { HertzFlowSDK } from '../../src/sdk';
import { initTestnetSDK } from '../../src/config/testnet';
import { HertzflowError, UtilsErrorCode } from '../../src/errors/errors';
import { COMMON_CONSTS } from '../../src/constants';
import { CancelIncreaseOrderParams } from '../../src/types';
import { TestUtils } from '../utils/testUtils';

describe('OrderModule Integration Tests', () => {
  let sdk: HertzFlowSDK;
  let keypair: Ed25519Keypair;
  let senderAddress: string;
  let testUtils: TestUtils;
  const TEST_TIMEOUT = 60000;

  beforeAll(async () => {
    console.log('🔧  OrderModule ...');
    console.log('Environment variables:', {
      PRIVATE_KEY: process.env.PRIVATE_KEY ? 'exists' : 'missing',
    });

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey)
      throw new HertzflowError(
        'PRIVATE_KEY is not set',
        UtilsErrorCode.InvalidPrivateKeyForTest,
      );

    try {
      if (privateKey.startsWith(COMMON_CONSTS.SUI_PRIVATE_KEY_PREFIX)) {
        keypair = Ed25519Keypair.fromSecretKey(privateKey);
      } else {
        keypair = Ed25519Keypair.fromSecretKey(fromHex(privateKey));
      }
      senderAddress = keypair.getPublicKey().toSuiAddress();
    } catch (error) {
      console.error('Error creating keypair:', error);
      throw new HertzflowError(
        'Invalid private key',
        UtilsErrorCode.InvalidPrivateKeyForTest,
      );
    }

    sdk = initTestnetSDK();
    sdk.senderAddress = senderAddress;

    testUtils = new TestUtils(sdk.fullClient, keypair);
  }, TEST_TIMEOUT);

  it(
    'should cancel increase order on testnet',
    async () => {
      try {
        const orderId =
          '0x9d5fbc7447457b337c4d6808cb62ee4dde5107ee6093ed986819470f0424fab9';

        const btcCoinType =
          '0x8c73df029cb08f82e064b215b78a3b8996174d9c536074c0bef8504f9f1abf9f::btc::BTC';

        const cancelParams: CancelIncreaseOrderParams = {
          orderId: orderId,
          collateralCoin: btcCoinType,
        };

        const cancelTx =
          await sdk.VaultModule.createCancelIncreaseOrderPayload(cancelParams);

        cancelTx.setGasBudget(100000000);

        const txResponse = await testUtils.executeAndWaitForTx(cancelTx);

        expect(txResponse).toBeDefined();
        expect(txResponse.digest).toBeDefined();
        expect(txResponse.effects?.status?.status).toBe('success');
      } catch (error) {
        console.error('❌ :', error);
        throw error;
      }
    },
    TEST_TIMEOUT,
  );
});
