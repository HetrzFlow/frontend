import { getFullnodeUrl } from '@mysten/sui/client';
import HertzFlowSDK, { HertzFlowSdkOptions } from '../main';
import { checkInvalidSuiAddress } from '../utils';
import { SuiAddress } from '../types';
import { ENV_CONFIG, HERTZFLOW_API_ENDPOINTS } from '../constants';
import { SuiClient } from '@mysten/sui/client';

export const hertzflowTestnet: HertzFlowSdkOptions = {
  fullRpcUrl: getFullnodeUrl('testnet'),
  simulationAccount: {
    address:
      '0x0000000000000000000000000000000000000000000000000000000000000000',
  },
  apiUrl: HERTZFLOW_API_ENDPOINTS.TESTNET,
  packageId: ENV_CONFIG.TESTNET.PACKAGE_ID,
  vault: {
    package_id: ENV_CONFIG.TESTNET.VAULT_ID,
    published_at: ENV_CONFIG.TESTNET.VAULT_ID,
  },
  protocolStore: {
    package_id: ENV_CONFIG.TESTNET.PROTOCOL_STORE_ID,
    published_at: ENV_CONFIG.TESTNET.PROTOCOL_STORE_ID,
  },
  version: {
    package_id: ENV_CONFIG.TESTNET.VERSION_ID,
    published_at: ENV_CONFIG.TESTNET.VERSION_ID,
  },
  oracleStore: {
    package_id: ENV_CONFIG.TESTNET.ORACLE_STORE_ID,
    published_at: ENV_CONFIG.TESTNET.ORACLE_STORE_ID,
  },
  oraclePackage: {
    package_id: ENV_CONFIG.TESTNET.ORACLE_PACKAGE_ID,
    published_at: ENV_CONFIG.TESTNET.ORACLE_PACKAGE_ID,
  },
  oracleVersion: {
    package_id: ENV_CONFIG.TESTNET.ORACLE_VERSION_ID,
    published_at: ENV_CONFIG.TESTNET.ORACLE_VERSION_ID,
  },
  oracle: {
    package_id: ENV_CONFIG.TESTNET.ORACLE_ID,
    published_at: ENV_CONFIG.TESTNET.ORACLE_ID,
  },
  hzlp: {
    package_id: ENV_CONFIG.TESTNET.HZLP_ID,
    published_at: ENV_CONFIG.TESTNET.HZLP_ID,
  },
  faucet: {
    package_id: ENV_CONFIG.TESTNET.FAUCET_PACKAGE_ID,
    published_at: ENV_CONFIG.TESTNET.FAUCET_PACKAGE_ID,
  },
  HZLP_TYPE: ENV_CONFIG.TESTNET.HZLP_TYPE,
  TOKENS_FAUCETS_ID: ENV_CONFIG.TESTNET.TOKENS_FAUCETS_ID,
  FAUCET_ADMIN_CAP_ID: ENV_CONFIG.TESTNET.FAUCET_ADMIN_CAP_ID,
};

export function initTestnetSDK(
  fullNodeUrl?: string,
  wallet?: string,
  suiClient?: SuiClient,
): HertzFlowSDK {
  if (fullNodeUrl) {
    hertzflowTestnet.fullRpcUrl = fullNodeUrl;
  }
  const sdk = new HertzFlowSDK({
    ...hertzflowTestnet,
    suiClient,
  });
  if (wallet && checkInvalidSuiAddress(wallet)) {
    sdk.senderAddress = wallet as SuiAddress;
  }
  return sdk;
}
