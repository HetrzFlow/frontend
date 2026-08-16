import { getInternalUsdCollateralPriceTokenAddress } from '@hertzflow/sdk-v2/configs/internalUsd';
import {
  PRECISION_DECIMALS,
  USD_DECIMALS,
} from '@hertzflow/sdk-v2/utils/numbers';
import { calc } from '@repo/lib/calc';
import { CREDIT_TOKEN_SYMBOL } from '@/lib/credit/creditTrade';

export { CREDIT_TOKEN_DECIMALS } from '@hertzflow/sdk-v2';
export * from './common';

export const CONTRACT_USD_MULTIPLIER = calc(10).pow(USD_DECIMALS);
export const CONTRACT_PRECISION_MULTIPLIER = calc(10).pow(PRECISION_DECIMALS);

export const ZERO_STR = '0';
export const HZLP_TOKEN_DECIMALS = 18;
export const HZV_TOKEN_DECIMALS = 18;
export const HZFL_TOKEN_SYMBOL = 'HZFL';
export const HZFL_TOKEN_DECIMALS = 18;
export const HZFL_TOKEN_DISPLAY_DECIMALS = 2;
export const USDT_USD_PRICE_SYMBOL = 'USDT/USD';
export const CREDIT_TOKEN_USD_PRICE_SYMBOL = '__CREDIT_TOKEN_USD__';

type PriceCoin = {
  address?: string;
  symbol?: string;
};

type PriceCoins = Record<string, PriceCoin | undefined>;

let usdPriceSymbolAliases: Record<string, string> = {};

function getCoinByAddress(coins: PriceCoins, address?: string) {
  if (!address) return undefined;

  const normalizedAddress = address.toLowerCase();
  return (
    coins[address] ??
    coins[normalizedAddress] ??
    Object.values(coins).find(
      (coin) => coin?.address?.toLowerCase() === normalizedAddress,
    )
  );
}

export function getUsdPriceSymbolAliases({
  chainId,
  coins,
}: {
  chainId?: number;
  coins: PriceCoins;
}) {
  const aliases: Record<string, string> = {};
  if (!chainId) {
    usdPriceSymbolAliases = aliases;
    return aliases;
  }

  Object.values(coins).forEach((coin) => {
    if (!coin?.address || !coin.symbol) return;

    const underlyingTokenAddress =
      getInternalUsdCollateralPriceTokenAddress({
        chainId,
        collateralTokenAddress: coin.address,
      });
    if (
      !underlyingTokenAddress ||
      underlyingTokenAddress.toLowerCase() === coin.address.toLowerCase()
    ) {
      return;
    }

    const underlyingCoin = getCoinByAddress(coins, underlyingTokenAddress);
    if (!underlyingCoin?.symbol) return;

    aliases[`${coin.symbol}/USD`.toUpperCase()] = `${underlyingCoin.symbol}/USD`;
  });

  usdPriceSymbolAliases = aliases;
  return aliases;
}

export function getUsdPriceSymbol(tokenSymbol?: string) {
  if (!tokenSymbol) return '';
  return tokenSymbol === CREDIT_TOKEN_SYMBOL
    ? CREDIT_TOKEN_USD_PRICE_SYMBOL
    : `${tokenSymbol}/USD`;
}

export function normalizeUsdPriceSymbol(
  priceSymbol?: string,
  aliases: Record<string, string> = usdPriceSymbolAliases,
) {
  if (!priceSymbol) return '';
  if (priceSymbol === CREDIT_TOKEN_USD_PRICE_SYMBOL) {
    return USDT_USD_PRICE_SYMBOL;
  }

  return aliases[priceSymbol.toUpperCase()] ?? priceSymbol;
}

export function getCreditAwareUsdPriceSymbol({
  isCreditMarket,
  tokenSymbol,
}: {
  isCreditMarket?: boolean;
  tokenSymbol?: string;
}) {
  return getUsdPriceSymbol(isCreditMarket ? CREDIT_TOKEN_SYMBOL : tokenSymbol);
}

export {
  CREDIT_MARKET_CATEGORY,
  CREDIT_TOKEN_DISPLAY_DECIMALS,
  CREDIT_TOKEN_INPUT_DECIMALS,
  CREDIT_TOKEN_SYMBOL,
  CREDIT_TOKEN_UI_CONFIG,
} from '@/lib/credit/creditTrade';
