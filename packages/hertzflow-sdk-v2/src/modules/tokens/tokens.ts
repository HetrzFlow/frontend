import { type Address, getAddress } from "viem";
import { getContract } from "configs/contracts";
import { getInternalUsdConfigs } from "configs/internalUsd";
import { NATIVE_TOKEN_ADDRESS, getTokensMap, getV2Tokens } from "configs/tokens";
import { TokenBalancesData, TokenPricesData, TokensData, Token as TToken } from "types/tokens";
import type { ContractCallsConfig } from "utils/multicall";
import { toBigNumberWithDecimals, USD_DECIMALS } from "utils/numbers";

import { Module } from "../base";

type TokensDataResult = {
  tokensData?: TokensData;
  pricesUpdatedAt?: number;
};

type TokenPricesDataResult = {
  pricesData?: TokenPricesData;
  updatedAt?: number;
};

const TOKENS_DATA_CACHE_TIME_MS = 6 * 60 * 60 * 1000;
const TOKENS_DATA_FAILURE_RETRY_TIME_MS = 60 * 1000;

type TokenTotalSuppliesData = {
  [tokenAddress: string]: bigint;
};

export function setInternalUsdPriceAliases(chainId: number, pricesData: TokenPricesData) {
  for (const config of getInternalUsdConfigs(chainId)) {
    const underlyingPrice = pricesData[config.underlyingTokenAddress];
    if (underlyingPrice) {
      pricesData[config.wrappedTokenAddress] = underlyingPrice;
    }
  }
}

function mergeTokenData(...layers: Array<Record<string, Partial<TToken>> | undefined>): TokensData {
  const mergedTokens: Record<string, Partial<TToken>> = {};

  for (const layer of layers) {
    for (const [key, token] of Object.entries(layer ?? {})) {
      const address = getAddress(token.address ?? key);
      mergedTokens[address] = {
        ...mergedTokens[address],
        ...token,
        address,
      };
    }
  }

  return Object.entries(mergedTokens).reduce<TokensData>((tokensData, [address, token]) => {
    if (!token.name || !token.symbol || !Number.isInteger(token.decimals)) {
      throw new Error(`Incomplete token configuration for ${address}`);
    }
    tokensData[address] = token as TToken;
    return tokensData;
  }, {});
}

function getUnknownProviderTokens(
  providedTokens: TokensData | undefined,
  configuredTokens: TokensData
): TokensData {
  return Object.entries(providedTokens ?? {}).reduce<TokensData>((tokensData, [key, token]) => {
    const address = getAddress(token.address ?? key);
    if (!configuredTokens[address]) {
      tokensData[address] = {
        ...token,
        address,
      };
    }
    return tokensData;
  }, {});
}

export class Tokens extends Module {
  private get tokensLoader() {
    return typeof this.sdk.config.tokens === "function"
      ? this.sdk.config.tokens
      : undefined;
  }

  private get tokenOverrides() {
    return typeof this.sdk.config.tokens === "function"
      ? undefined
      : this.sdk.config.tokens;
  }

  _tokensConfigs: { [key: string]: TToken } | undefined = undefined;
  get tokensConfig() {
    if (this._tokensConfigs) {
      return this._tokensConfigs;
    }

    this._tokensConfigs = mergeTokenData(
      getTokensMap(this.chainId),
      this.tokenOverrides,
    );

    return this._tokensConfigs;
  }

  async getTokenRecentPrices(): Promise<TokenPricesDataResult> {
    const [{ tokensData = {} }, priceItems] = await Promise.all([
      this.getTokensData(),
      this.oracle.getLatestPrices(),
    ]);
    const tokensByPriceSymbol = Object.values(tokensData).reduce<Record<string, TToken>>(
      (tokensMap, token) => {
        for (const priceSymbol of [token.symbol, `${token.symbol}/USD`, `USD/${token.symbol}`]) {
          const indexedToken = tokensMap[priceSymbol];
          if (!indexedToken || (indexedToken.isSynthetic && !token.isSynthetic)) {
            tokensMap[priceSymbol] = token;
          }
        }
        return tokensMap;
      },
      {}
    );
    const pricesData: TokenPricesData = {};

    for (const priceItem of priceItems) {
      const priceAddress = getAddress(priceItem.bsc_token_addr);
      const token = tokensByPriceSymbol[priceItem.symbol];
      const contractPrice = toBigNumberWithDecimals(priceItem.price, USD_DECIMALS);
      const price = {
        symbol: priceItem.symbol,
        minPrice: contractPrice,
        maxPrice: contractPrice,
      };
      pricesData[priceAddress] = price;
      if (tokensData[priceAddress]?.isWrapped) {
        pricesData[NATIVE_TOKEN_ADDRESS] = price;
      }
      if (token) {
        pricesData[token.address] = price;
        if (token.isNative && token.wrappedAddress) {
          pricesData[token.wrappedAddress] = price;
        }
      }
    }

    setInternalUsdPriceAliases(this.chainId, pricesData);
    return { pricesData, updatedAt: Date.now() };
  }

  getTokensBalances(
    account?: string,
    tokensList?: {
      address: string;
      isSynthetic?: boolean;
    }[]
  ) {
    account = account || this.sdk.config.account;
    tokensList = tokensList || getV2Tokens(this.chainId);

    return this.sdk
      .executeMulticall(
        tokensList.reduce(
          (acc, token) => {
            // Skip synthetic tokens
            if (token.isSynthetic) return acc;

            const address = token.address;

            if (address === NATIVE_TOKEN_ADDRESS) {
              acc[address] = {
                contractAddress: getContract(this.chainId, "Multicall"),
                abiId: "Multicall",
                calls: {
                  balance: {
                    methodName: "getEthBalance",
                    params: [account],
                  },
                },
              } satisfies ContractCallsConfig<any>;
            } else {
              acc[address] = {
                contractAddress: address,
                abiId: "Token",
                calls: {
                  balance: {
                    methodName: "balanceOf",
                    params: [account],
                  },
                },
              } satisfies ContractCallsConfig<any>;
            }

            return acc;
          },
          {} as Record<string, ContractCallsConfig<any>>
        )
      )
      .then((res) => {
        return Object.keys(res.data).reduce((tokenBalances: TokenBalancesData, tokenAddress) => {
          tokenBalances[tokenAddress] = res.data[tokenAddress].balance.returnValues[0];

          return tokenBalances;
        }, {} as TokenBalancesData);
      });
  }

  private getTokensTotalSupplies(
    tokensList?: {
      address: string;
      isSynthetic?: boolean;
    }[]
  ) {
    const tokens = tokensList || getV2Tokens(this.chainId);

    return this.sdk
      .executeMulticall(
        tokens.reduce(
          (acc, token) => {
            const address = token.address;

            // Native token does not have totalSupply
            if (address === NATIVE_TOKEN_ADDRESS) {
              return acc;
            }

            acc[address] = {
              contractAddress: address,
              abiId: "Token",
              calls: {
                totalSupply: {
                  methodName: "totalSupply",
                  params: [],
                },
              },
            } satisfies ContractCallsConfig<any>;

            return acc;
          },
          {} as Record<string, ContractCallsConfig<any>>
        )
      )
      .then((res) => {
        return Object.keys(res.data).reduce((totalSupplies: TokenTotalSuppliesData, tokenAddress) => {
          totalSupplies[tokenAddress] = res.data[tokenAddress].totalSupply.returnValues[0];

          return totalSupplies;
        }, {} as TokenTotalSuppliesData);
      });
  }

  getNativeToken(): TToken {
    return this.tokensConfig[NATIVE_TOKEN_ADDRESS];
  }

  _tokensData: TokensData | undefined = undefined;
  _tokensDataUpdatedAt = 0;
  _tokensDataCacheTimeMs = TOKENS_DATA_CACHE_TIME_MS;
  _tokensDataPromise: Promise<TokensDataResult> | undefined = undefined;

  async getTokensData(): Promise<TokensDataResult> {
    if (
      this._tokensData &&
      (!this.tokensLoader ||
        Date.now() - this._tokensDataUpdatedAt < this._tokensDataCacheTimeMs)
    ) {
      return {
        tokensData: this._tokensData,
      };
    }
    if (this._tokensDataPromise) {
      return this._tokensDataPromise;
    }
    this._tokensDataPromise = this._fetchTokensData();
    try {
      const result = await this._tokensDataPromise;
      return result;
    } finally {
      this._tokensDataPromise = undefined;
    }
  }

  private async _fetchTokensData(): Promise<TokensDataResult> {
    let providedTokens: TokensData | undefined;
    let refreshFailed = false;
    try {
      providedTokens = await this.tokensLoader?.();
    } catch (error) {
      refreshFailed = true;
      this.sdk.logger.warn("Failed to refresh token metadata; using cached and static token configuration", error);
      providedTokens = this._tokensData;
    }
    const configuredTokens = this.tokensConfig;
    const tokensData = mergeTokenData(
      getUnknownProviderTokens(providedTokens, configuredTokens),
      configuredTokens
    );

    this._tokensData = Object.keys(tokensData).length ? tokensData : undefined;
    this._tokensDataUpdatedAt = Date.now();
    this._tokensDataCacheTimeMs = refreshFailed ? TOKENS_DATA_FAILURE_RETRY_TIME_MS : TOKENS_DATA_CACHE_TIME_MS;

    return {
      tokensData: tokensData,
    };
  }

  async getTokenMetadata(tokenAddresses: Address[]) {
    // Filter out native token addresses as they don't have contracts to query
    const filteredAddresses = tokenAddresses.filter((address) => address !== NATIVE_TOKEN_ADDRESS);

    if (filteredAddresses.length === 0) {
      return {};
    }

    // Prepare multicall configuration
    const callsConfig = filteredAddresses.reduce(
      (acc, address) => {
        acc[address] = {
          contractAddress: address,
          abiId: "Token" as const,
          calls: {
            name: {
              methodName: "name",
              params: [],
            },
            symbol: {
              methodName: "symbol",
              params: [],
            },
            decimals: {
              methodName: "decimals",
              params: [],
            },
          },
        } satisfies ContractCallsConfig<any>;
        return acc;
      },
      {} as Record<string, ContractCallsConfig<any>>
    );

    // Execute multicall
    const result = await this.sdk.executeMulticall(callsConfig);

    // Process results
    const metadata: Record<string, { name: string; symbol: string; decimals: number }> = {};

    Object.keys(result.data).forEach((address) => {
      const data = result.data[address];

      if (data.name.success && data.symbol.success && data.decimals.success) {
        metadata[address] = {
          name: data.name.returnValues[0] as string,
          symbol: data.symbol.returnValues[0] as string,
          decimals: Number(data.decimals.returnValues[0]),
        };
      }
    });

    return metadata;
  }
}
