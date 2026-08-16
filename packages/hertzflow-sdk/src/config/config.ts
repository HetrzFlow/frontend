import HertzFlowSDK from '../main';
import { initMainnetSDK } from './mainnet';
import { initTestnetSDK } from './testnet';
import { SuiClient } from '@mysten/sui/client';

interface InitHertzFlowSDKOptions {
  network: 'mainnet' | 'testnet';
  fullNodeUrl?: string;
  wallet?: string;
  suiClient?: SuiClient;
}

export function initHertzFlowSDK(
  options: InitHertzFlowSDKOptions,
): HertzFlowSDK {
  const { network, fullNodeUrl, wallet, suiClient } = options;
  return network === 'mainnet'
    ? initMainnetSDK(fullNodeUrl, wallet, suiClient)
    : initTestnetSDK(fullNodeUrl, wallet, suiClient);
}
