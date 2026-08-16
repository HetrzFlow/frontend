'use client';

import { memo, ReactNode, useEffect, useMemo } from 'react';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { useShallow } from 'zustand/react/shallow';
import { queryClient, QueryClientProvider } from '@repo/lib/queryClient';
import { useWalletStore } from '../stores/walletStore';
import AutoConnect from './AutoConnect';
import { HzSdkProvider } from './HzSdkProvider';

const ChainClientProvider = ({ children }: { children: ReactNode }) => {
  const [network, rpcKey, customRpc, setRpcKey] = useWalletStore(
    useShallow((state) => [
      state.network,
      state.rpcKey,
      state.customRpc,
      state.setRpcKey,
    ]),
  );

  const networks = useMemo(() => {
    const testnet = {
      default: getFullnodeUrl('testnet'),
      Blast: 'https://sui-testnet.public.blastapi.io',
      // BlockVision: 'https://sui-testnet-endpoint.blockvision.org',
      Suiet: 'https://rpc.testnet.sui.io',
      Suiscan: 'https://rpc-testnet.suiscan.xyz:443',
      Custom: customRpc.testnet,
    };

    const mainnet = {
      default: getFullnodeUrl('mainnet'),
      Blast: 'https://sui-mainnet.public.blastapi.io',
      // BlockVision: 'https://sui-mainnet-endpoint.blockvision.org',
      Suiet: 'https://rpc.mainnet.sui.io',
      Suiscan: 'https://rpc-mainnet.suiscan.xyz:443',
      Custom: customRpc.mainnet,
    };

    return {
      testnet: {
        url: testnet[rpcKey] || testnet.default,
        variables: testnet,
      },
      mainnet: {
        url: mainnet[rpcKey] || testnet.default,
        variables: mainnet,
      },
    };
  }, [customRpc, rpcKey]);
  const [slushWallet] = useMemo(() => {
    return [{ name: 'HertzFlow' }];
  }, []);

  useEffect(() => {
    if (!networks[network].variables[rpcKey]) {
      setRpcKey('default');
    }
  }, [rpcKey, setRpcKey, network, networks]);

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} network={network}>
        <WalletProvider slushWallet={slushWallet} autoConnect>
          <AutoConnect />
          <HzSdkProvider>{children}</HzSdkProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
};

export default memo(ChainClientProvider);
