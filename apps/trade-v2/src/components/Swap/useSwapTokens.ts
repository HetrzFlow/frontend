'use client';

import { useMemo, useSyncExternalStore } from 'react';

import { useQuery } from '@repo/lib/queryClient';
import { useRecommendedSwapTokensQuery } from '@/queries/bsc/swap';

const API_BASE_URL = 'https://api.peach.ag/v1/bsc/pro';
const FAVORITES_STORAGE_KEY = 'trade-v2.swapFavorites.v1';
const EMPTY_FAVORITES: SwapToken[] = [];
const favoriteListeners = new Set<() => void>();
let cachedFavoritesValue: string | null | undefined;
let cachedFavorites = EMPTY_FAVORITES;

export type SwapToken = {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  price: string;
  balance?: string;
  usdValue?: string;
};

type PeachToken = {
  chainId?: number;
  address?: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  logoURI?: string;
  p?: string;
  rl?: string;
};

type PeachTokenResponse = {
  code?: number;
  msg?: string;
  data?: {
    coin_list?: PeachToken[];
  };
};

export const USDT_TOKEN: SwapToken = {
  chainId: 56,
  address: '0x55d398326f99059ff775485246999027b3197955',
  name: 'Tether USD',
  symbol: 'USDT',
  decimals: 18,
  logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
  price: '1',
};

export const BNB_TOKEN: SwapToken = {
  chainId: 56,
  address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  name: 'BNB',
  symbol: 'BNB',
  decimals: 18,
  logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7192.png',
  price: '',
};

export const BTCB_TOKEN: SwapToken = {
  chainId: 56,
  address: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c',
  name: 'BTCB Token',
  symbol: 'BTC',
  decimals: 18,
  logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4023.png',
  price: '',
};

export const USD1_TOKEN: SwapToken = {
  chainId: 56,
  address: '0x8d0d000ee44948fc98c9b98a4fa4921476f08b0d',
  name: 'World Liberty Financial USD',
  symbol: 'USD1',
  decimals: 18,
  logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/36148.png',
  price: '',
};

export const U_TOKEN: SwapToken = {
  chainId: 56,
  address: '0xce24439f2d9c6a2289f741120fe202248b666666',
  name: 'United Stables',
  symbol: 'U',
  decimals: 18,
  logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/39120.png',
  price: '',
};

export const QUICK_SWAP_TOKENS: SwapToken[] = [
  USDT_TOKEN,
  BNB_TOKEN,
  BTCB_TOKEN,
  {
    chainId: 56,
    address: '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
    name: 'Ethereum Token',
    symbol: 'ETH',
    decimals: 18,
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
    price: '',
  },
];

export const GENESIS_QUICK_SWAP_TOKENS: SwapToken[] = [
  USD1_TOKEN,
  U_TOKEN,
  ...QUICK_SWAP_TOKENS,
];

export const GENESIS_SWAP_TOKENS_BY_SYMBOL = {
  USD1: USD1_TOKEN,
  USDT: USDT_TOKEN,
  U: U_TOKEN,
} as const;

const normalizeToken = (
  token: PeachToken,
  allowHighRisk = false,
): SwapToken | undefined => {
  if (
    token.chainId !== 56 ||
    !token.address ||
    !token.name ||
    !token.symbol ||
    !Number.isInteger(token.decimals) ||
    (!allowHighRisk && token.rl === 'highRisk')
  ) {
    return undefined;
  }

  return {
    chainId: token.chainId,
    address: token.address.toLowerCase(),
    name: token.name,
    symbol: token.symbol,
    decimals: token.decimals!,
    logoURI: token.logoURI || '',
    price: token.p || '',
  };
};

const parseResponse = async (response: Response, allowHighRisk = false) => {
  if (!response.ok) {
    throw new Error(`Peach token request failed (${response.status})`);
  }

  const result = (await response.json()) as PeachTokenResponse;
  if (result.code !== 0 || !Array.isArray(result.data?.coin_list)) {
    throw new Error(result.msg || 'Invalid Peach token response');
  }

  return result.data.coin_list
    .map((token) => normalizeToken(token, allowHighRisk))
    .filter((token): token is SwapToken => !!token);
};

const fetchSearchTokens = async (search: string, signal?: AbortSignal) => {
  const params = new URLSearchParams({
    q: search,
    page: '1',
    page_size: '50',
  });

  const isAddressSearch = /^0x[a-fA-F0-9]{40}$/.test(search);
  return parseResponse(
    await fetch(`${API_BASE_URL}/coins/search?${params.toString()}`, {
      signal,
    }),
    isAddressSearch,
  );
};

export const fetchSwapTokenByAddress = async (
  address: string,
  signal?: AbortSignal,
) => {
  const tokens = await fetchSearchTokens(address, signal);
  const token = tokens.find(
    (item) => item.address.toLowerCase() === address.toLowerCase(),
  );
  if (!token) throw new Error(`Peach token not found: ${address}`);
  return token;
};

export const getSwapTokenQueryOptions = (address: string) => ({
  queryKey: ['peach', 'swap-token', address.toLowerCase()],
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    fetchSwapTokenByAddress(address, signal),
  staleTime: 60_000,
  refetchOnWindowFocus: false,
});

const fetchQuickSwapTokens = async (
  quickTokenPreset: SwapToken[],
  signal?: AbortSignal,
) => {
  const tokens = await Promise.all(
    quickTokenPreset.map(async (quickToken) => {
      if (quickToken.price) return quickToken;

      const token = await fetchSwapTokenByAddress(quickToken.address, signal);
      return {
        ...token,
        name: quickToken.name,
        symbol: quickToken.symbol,
      };
    }),
  );

  return tokens;
};

const parseFavorites = (value: string | null) => {
  try {
    return (JSON.parse(value || '[]') as PeachToken[])
      .map((token) => normalizeToken(token, true))
      .filter((token): token is SwapToken => !!token);
  } catch {
    return EMPTY_FAVORITES;
  }
};

const getFavoritesSnapshot = () => {
  try {
    const value = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (value !== cachedFavoritesValue) {
      cachedFavoritesValue = value;
      cachedFavorites = parseFavorites(value);
    }
  } catch {
    return EMPTY_FAVORITES;
  }
  return cachedFavorites;
};

const subscribeFavorites = (listener: () => void) => {
  favoriteListeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== FAVORITES_STORAGE_KEY && event.key !== null) return;
    cachedFavoritesValue = undefined;
    listener();
  };
  window.addEventListener('storage', handleStorage);
  return () => {
    favoriteListeners.delete(listener);
    window.removeEventListener('storage', handleStorage);
  };
};

const writeFavorites = (favorites: SwapToken[]) => {
  const value = JSON.stringify(favorites);
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, value);
  cachedFavoritesValue = value;
  cachedFavorites = favorites;
  favoriteListeners.forEach((listener) => listener());
};

const uniqueTokens = (tokens: SwapToken[]) => {
  const unique = new Map<string, SwapToken>();
  tokens.forEach((token) => unique.set(token.address, token));
  return Array.from(unique.values());
};

export const useSwapTokens = (
  search: string,
  quickTokenPreset = QUICK_SWAP_TOKENS,
) => {
  const favorites = useSyncExternalStore(
    subscribeFavorites,
    getFavoritesSnapshot,
    () => EMPTY_FAVORITES,
  );

  const recommendedQuery = useRecommendedSwapTokensQuery();

  const quickTokensQuery = useQuery({
    queryKey: [
      'peach',
      'swap-tokens',
      'quick',
      ...quickTokenPreset.map((token) => token.address.toLowerCase()),
    ],
    queryFn: ({ signal }) => fetchQuickSwapTokens(quickTokenPreset, signal),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const searchQuery = useQuery({
    queryKey: ['peach', 'swap-tokens', 'search', search],
    queryFn: ({ signal }) => fetchSearchTokens(search, signal),
    enabled: search.length > 0,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const quickTokens = quickTokensQuery.data || quickTokenPreset;
  const recommended = useMemo(() => {
    const quickTokenAddresses = new Set(
      quickTokenPreset.map((token) => token.address.toLowerCase()),
    );

    return uniqueTokens(
      (recommendedQuery.data ?? []).flatMap((token) =>
        Number.isInteger(token.decimals) &&
        !quickTokenAddresses.has(token.address.toLowerCase())
          ? [
              {
                chainId: 56,
                address: token.address,
                name: token.name,
                symbol: token.symbol,
                decimals: token.decimals!,
                logoURI: token.logoUri || '',
                price: '',
              },
            ]
          : [],
      ),
    );
  }, [quickTokenPreset, recommendedQuery.data]);
  const searchResults = searchQuery.data || [];
  const toggleFavorite = (token: SwapToken) => {
    const exists = favorites.some((item) => item.address === token.address);
    writeFavorites(
      exists
        ? favorites.filter((item) => item.address !== token.address)
        : [...favorites, token],
    );
  };

  const favoriteAddresses = new Set(favorites.map((token) => token.address));

  return {
    quickTokens,
    favorites,
    favoriteAddresses,
    recommended,
    searchResults,
    isSearching: searchQuery.isFetching,
    isRecommendedLoading: recommendedQuery.isLoading,
    toggleFavorite,
  };
};
