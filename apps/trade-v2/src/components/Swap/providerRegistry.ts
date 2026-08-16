import { ComponentType } from 'react';

import {
  ApeSwapIcon,
  BabyDogeSwapIcon,
  BabySwapIcon,
  BakerySwapIcon,
  BiswapIcon,
  DodoIcon,
  ListaIcon,
  NomiswapIcon,
  PancakeSwapIcon,
  ProviderIconProps,
  SquadSwapIcon,
  SushiSwapIcon,
  ThenaIcon,
  UniswapIcon,
  WombatIcon,
} from './icons/providers/ProviderIcons';

export const SWAP_PROVIDER_CODES = [
  'APESWAP',
  'PANCAKEV3',
  'PANCAKEV2',
  'BAKERYSWAP',
  'SQUADSWAP_V2',
  'LISTA_STABLE',
  'WOMBAT',
  'UNISWAPV4',
  'THENA_FUSION',
  'PANCAKEV1',
  'BABYSWAP',
  'DODO',
  'BABYDOGESWAP',
  'SQUADSWAP_V3',
  'PANCAKE_INFINITY_LB',
  'UNISWAPV3',
  'NOMISWAP_STABLE',
  'UNISWAPV2',
  'PANCAKE_INFINITY_CL',
  'SUSHISWAP_V2',
  'THENAV3',
  'SUSHISWAP_V3',
  'PANCAKE_STABLE',
  'BISWAP',
] as const;

export type SwapProviderCode = (typeof SWAP_PROVIDER_CODES)[number];

export type SwapProvider = {
  code: string;
  displayName: string;
  familyName: string;
  Icon?: ComponentType<ProviderIconProps>;
};

const PROVIDERS: Record<SwapProviderCode, SwapProvider> = {
  APESWAP: provider('APESWAP', 'ApeSwap', 'ApeSwap', ApeSwapIcon),
  PANCAKEV3: provider(
    'PANCAKEV3',
    'PancakeSwap V3',
    'PancakeSwap',
    PancakeSwapIcon,
  ),
  PANCAKEV2: provider(
    'PANCAKEV2',
    'PancakeSwap V2',
    'PancakeSwap',
    PancakeSwapIcon,
  ),
  BAKERYSWAP: provider(
    'BAKERYSWAP',
    'BakerySwap',
    'BakerySwap',
    BakerySwapIcon,
  ),
  SQUADSWAP_V2: provider(
    'SQUADSWAP_V2',
    'SquadSwap V2',
    'SquadSwap',
    SquadSwapIcon,
  ),
  LISTA_STABLE: provider(
    'LISTA_STABLE',
    'Lista Stable',
    'Lista',
    ListaIcon,
  ),
  WOMBAT: provider('WOMBAT', 'Wombat', 'Wombat', WombatIcon),
  UNISWAPV4: provider('UNISWAPV4', 'Uniswap V4', 'Uniswap', UniswapIcon),
  THENA_FUSION: provider(
    'THENA_FUSION',
    'Thena Fusion',
    'Thena',
    ThenaIcon,
  ),
  PANCAKEV1: provider(
    'PANCAKEV1',
    'PancakeSwap V1',
    'PancakeSwap',
    PancakeSwapIcon,
  ),
  BABYSWAP: provider('BABYSWAP', 'BabySwap', 'BabySwap', BabySwapIcon),
  DODO: provider('DODO', 'DODO', 'DODO', DodoIcon),
  BABYDOGESWAP: provider(
    'BABYDOGESWAP',
    'BabyDogeSwap',
    'BabyDogeSwap',
    BabyDogeSwapIcon,
  ),
  SQUADSWAP_V3: provider(
    'SQUADSWAP_V3',
    'SquadSwap V3',
    'SquadSwap',
    SquadSwapIcon,
  ),
  PANCAKE_INFINITY_LB: provider(
    'PANCAKE_INFINITY_LB',
    'Pancake Infinity LB',
    'PancakeSwap',
    PancakeSwapIcon,
  ),
  UNISWAPV3: provider('UNISWAPV3', 'Uniswap V3', 'Uniswap', UniswapIcon),
  NOMISWAP_STABLE: provider(
    'NOMISWAP_STABLE',
    'Nomiswap Stable',
    'Nomiswap',
    NomiswapIcon,
  ),
  UNISWAPV2: provider('UNISWAPV2', 'Uniswap V2', 'Uniswap', UniswapIcon),
  PANCAKE_INFINITY_CL: provider(
    'PANCAKE_INFINITY_CL',
    'Pancake Infinity CL',
    'PancakeSwap',
    PancakeSwapIcon,
  ),
  SUSHISWAP_V2: provider(
    'SUSHISWAP_V2',
    'SushiSwap V2',
    'SushiSwap',
    SushiSwapIcon,
  ),
  THENAV3: provider('THENAV3', 'Thena V3', 'Thena', ThenaIcon),
  SUSHISWAP_V3: provider(
    'SUSHISWAP_V3',
    'SushiSwap V3',
    'SushiSwap',
    SushiSwapIcon,
  ),
  PANCAKE_STABLE: provider(
    'PANCAKE_STABLE',
    'Pancake Stable',
    'PancakeSwap',
    PancakeSwapIcon,
  ),
  BISWAP: provider('BISWAP', 'Biswap', 'Biswap', BiswapIcon),
};

export function getSwapProvider(providerCode: string): SwapProvider {
  return (
    PROVIDERS[providerCode.toUpperCase() as SwapProviderCode] ?? {
      code: providerCode,
      displayName: providerCode,
      familyName: providerCode,
    }
  );
}

function provider(
  code: SwapProviderCode,
  displayName: string,
  familyName: string,
  Icon: ComponentType<ProviderIconProps>,
): SwapProvider {
  return { code, displayName, familyName, Icon };
}
