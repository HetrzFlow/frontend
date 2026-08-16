import { getFullnodeUrl } from '@mysten/sui/client';
import HertzFlowSDK, { HertzFlowSdkOptions } from '../main';
import { checkInvalidSuiAddress } from '../utils';
import { SuiAddress } from '../types';
import { ENV_CONFIG, HERTZFLOW_API_ENDPOINTS } from '../constants';
import { SuiClient } from '@mysten/sui/client';

export const hertzflowMainnet: HertzFlowSdkOptions = {
  fullRpcUrl: getFullnodeUrl('mainnet'),
  simulationAccount: {
    address:
      '0x0000000000000000000000000000000000000000000000000000000000000000',
  },
  packageId: ENV_CONFIG.MAINNET.PACKAGE_ID,
  apiUrl: HERTZFLOW_API_ENDPOINTS.MAINNET,
  vault: {
    package_id: ENV_CONFIG.MAINNET.VAULT_ID,
    published_at: ENV_CONFIG.MAINNET.VAULT_ID,
  },
  protocolStore: {
    package_id: ENV_CONFIG.MAINNET.PROTOCOL_STORE_ID,
    published_at: ENV_CONFIG.MAINNET.PROTOCOL_STORE_ID,
  },
  version: {
    package_id: ENV_CONFIG.MAINNET.VERSION_ID,
    published_at: ENV_CONFIG.MAINNET.VERSION_ID,
  },
  oracleStore: {
    package_id: ENV_CONFIG.MAINNET.ORACLE_STORE_ID,
    published_at: ENV_CONFIG.MAINNET.ORACLE_STORE_ID,
  },
  oraclePackage: {
    package_id: ENV_CONFIG.MAINNET.ORACLE_PACKAGE_ID,
    published_at: ENV_CONFIG.MAINNET.ORACLE_PACKAGE_ID,
  },
  oracleVersion: {
    package_id: ENV_CONFIG.MAINNET.ORACLE_VERSION_ID,
    published_at: ENV_CONFIG.MAINNET.ORACLE_VERSION_ID,
  },
  oracle: {
    package_id: ENV_CONFIG.MAINNET.ORACLE_ID,
    published_at: ENV_CONFIG.MAINNET.ORACLE_ID,
  },
  hzlp: {
    package_id: ENV_CONFIG.MAINNET.HZLP_ID,
    published_at: ENV_CONFIG.MAINNET.HZLP_ID,
  },
  faucet: {
    package_id: ENV_CONFIG.MAINNET.FAUCET_PACKAGE_ID,
    published_at: ENV_CONFIG.MAINNET.FAUCET_PACKAGE_ID,
  },
  HZLP_TYPE: ENV_CONFIG.MAINNET.HZLP_TYPE,
  TOKENS_FAUCETS_ID: ENV_CONFIG.MAINNET.TOKENS_FAUCETS_ID,
  FAUCET_ADMIN_CAP_ID: ENV_CONFIG.MAINNET.FAUCET_ADMIN_CAP_ID,
};

export function initMainnetSDK(
  fullNodeUrl?: string,
  wallet?: string,
  suiClient?: SuiClient,
): HertzFlowSDK {
  if (fullNodeUrl) {
    hertzflowMainnet.fullRpcUrl = fullNodeUrl;
  }
  const sdk = new HertzFlowSDK({
    ...hertzflowMainnet,
    suiClient,
  });
  if (wallet && checkInvalidSuiAddress(wallet)) {
    sdk.senderAddress = wallet as SuiAddress;
  }
  return sdk;
}
