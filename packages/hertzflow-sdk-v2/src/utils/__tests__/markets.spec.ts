import { describe, expect, it } from "vitest";

import { SOURCE_BSC_TESTNET } from "configs/chains";
import { TOKENS } from "configs/tokens";

import { MarketInfo } from "../../types/markets";
import { Token, TokenData, TokenPrices, TokensData } from "../../types/tokens";
import {
  getMarketFullName,
  getMarketIndexName,
  getMarketPoolName,
  getContractMarketPrices,
  getTokenPoolType,
  getPoolUsdWithoutPnl,
  getCappedPoolPnl,
  getMaxLeverageByMinCollateralFactor,
  getMaxAllowedLeverage,
  getMaxAllowedLeverageByMinCollateralFactor,
  getMinLeverageByMaxCollateralFactor,
  getOppositeCollateral,
  getAvailableUsdLiquidityForCollateral,
  getReservedUsd,
  getMarketDivisor,
  getMarketPnl,
  getOpenInterestUsd,
  getOpenInterestInTokens,
  getPriceForPnl,
  getMaxReservedUsd,
  getAvailableUsdLiquidityForPosition,
  MAX_RESERVED_USD_FRONTEND_BUFFER_BPS,
} from "../markets";
import { BASIS_POINTS_DIVISOR, BASIS_POINTS_DIVISOR_BIGINT, expandDecimals, PRECISION } from "../numbers";

function getToken(symbol: string) {
  return TOKENS[SOURCE_BSC_TESTNET].find((token) => token.symbol === symbol) as Token;
}

describe("getMarketFullName", () => {
  it("returns proper full name", () => {
    const longToken = getToken("ETH");
    const shortToken = getToken("USDC");
    const indexToken = getToken("BTC");

    const name = getMarketFullName({
      longToken,
      shortToken,
      indexToken,
      isSpotOnly: false,
    });
    expect(name).toBe("BTC/USD [ETH-USDC]");
  });

  it("returns swap-only name", () => {
    const indexToken = { symbol: "ETH", address: "0xeth", decimals: 18 } as Token;
    const name = getMarketFullName({
      longToken: indexToken,
      shortToken: indexToken,
      indexToken,
      isSpotOnly: true,
    });
    expect(name).toBe("SWAP-ONLY [ETH-ETH]");
  });
});

describe("getMarketIndexName", () => {
  it("returns 'SWAP-ONLY' if isSpotOnly is true", () => {
    expect(
      getMarketIndexName({
        indexToken: getToken("ETH"),
        isSpotOnly: true,
      })
    ).toBe("SWAP-ONLY");
  });

  it("returns prefix + baseSymbol/symbol + /USD", () => {
    const eth = getToken("ETH");
    expect(getMarketIndexName({ indexToken: eth, isSpotOnly: false })).toBe("ETH/USD");

    const pepe = getToken("PEPE");
    expect(getMarketIndexName({ indexToken: pepe, isSpotOnly: false })).toBe("kPEPE/USD");
  });
});

describe("getMarketPoolName", () => {
  it("returns single token symbol if long and short are the same", () => {
    const token = getToken("ETH");
    expect(getMarketPoolName({ longToken: token, shortToken: token })).toBe("ETH-ETH");
  });

  it("returns combined symbol otherwise", () => {
    const longToken = getToken("ETH");
    const shortToken = getToken("USDC");
    expect(getMarketPoolName({ longToken, shortToken })).toBe("ETH-USDC");
  });
});

describe("getContractMarketPrices", () => {
  it("returns undefined if any token is missing", () => {
    const market = {
      indexTokenAddress: "0xbtc",
      longTokenAddress: "0xeth",
      shortTokenAddress: "0xusdc",
    };
    expect(getContractMarketPrices({}, market as any, {})).toBeUndefined();
  });

  it("returns converted contract prices if all tokens exist", () => {
    const tokensData = {
      "0xbtc": { decimals: 8, prices: { minPrice: 1000n, maxPrice: 2000n } },
      "0xeth": { decimals: 18, prices: { minPrice: 3000n, maxPrice: 4000n } },
      "0xusdc": { decimals: 6, prices: { minPrice: 1n, maxPrice: 2n } },
    } as unknown as TokensData;
    const prices = {
      "0xbtc": { minPrice: 1000n, maxPrice: 2000n },
      "0xeth": { minPrice: 3000n, maxPrice: 4000n },
      "0xusdc": { minPrice: 1n, maxPrice: 2n },
    };
    const market = {
      indexTokenAddress: "0xbtc",
      longTokenAddress: "0xeth",
      shortTokenAddress: "0xusdc",
    };
    const result = getContractMarketPrices(tokensData, market as any, prices);
    expect(result).toBeDefined();
    expect(result?.indexTokenPrice?.min).toBeDefined();
  });
});

describe("getTokenPoolType", () => {
  it("returns 'long' for single-token markets if matches address", () => {
    const token = getToken("ETH");
    expect(getTokenPoolType({ longToken: token, shortToken: token }, token.address)).toBe("long");
  });

  it("returns 'short' for shortToken match", () => {
    const longToken = getToken("ETH");
    const shortToken = getToken("USDC");
    expect(getTokenPoolType({ longToken, shortToken }, shortToken.address)).toBe("short");
  });
});

describe("getPoolUsdWithoutPnl", () => {
  const marketInfo = {
    longPoolAmount: 1n,
    shortPoolAmount: 1n,
    longToken: { decimals: 18 },
    shortToken: { decimals: 18 },
  } as MarketInfo;

  it("calculates poolUsd for isLong = true", () => {
    expect(
      getPoolUsdWithoutPnl(
        marketInfo,
        true,
        "minPrice",
        { minPrice: expandDecimals(5, 30), maxPrice: expandDecimals(15, 30) },
        { minPrice: expandDecimals(2, 30), maxPrice: expandDecimals(4, 30) },
        {}
      )
    ).toBe(5000000000000n);
    expect(
      getPoolUsdWithoutPnl(
        marketInfo,
        true,
        "maxPrice",
        { minPrice: expandDecimals(5, 30), maxPrice: expandDecimals(15, 30) },
        { minPrice: expandDecimals(2, 30), maxPrice: expandDecimals(4, 30) },
        {}
      )
    ).toBe(15000000000000n);
  });

  it("calculates poolUsd for isLong = false", () => {
    expect(
      getPoolUsdWithoutPnl(
        marketInfo,
        false,
        "minPrice",
        { minPrice: expandDecimals(5, 30), maxPrice: expandDecimals(15, 30) },
        { minPrice: expandDecimals(2, 30), maxPrice: expandDecimals(4, 30) },
        {}
      )
    ).toBe(2000000000000n);
    expect(
      getPoolUsdWithoutPnl(
        marketInfo,
        false,
        "maxPrice",
        { minPrice: expandDecimals(5, 30), maxPrice: expandDecimals(15, 30) },
        { minPrice: expandDecimals(2, 30), maxPrice: expandDecimals(4, 30) },
        {}
      )
    ).toBe(4000000000000n);
  });
});

describe("getCappedPoolPnl", () => {
  it("returns capped pnl if poolPnl > maxPnl", () => {
    const marketInfo = {
      maxPnlFactorForTradersLong: 20000n,
      maxPnlFactorForTradersShort: 10000n,
    } as MarketInfo;
    const result = getCappedPoolPnl({
      marketInfo,
      poolUsd: expandDecimals(1000, 30),
      poolPnl: 30000n,
      isLong: true,
    });
    expect(result).toBe(30000n);
  });

  it("returns poolPnl if below maxPnl", () => {
    const marketInfo = { maxPnlFactorForTradersLong: 20000n } as MarketInfo;
    expect(
      getCappedPoolPnl({
        marketInfo,
        poolUsd: expandDecimals(1000, 30),
        poolPnl: 5000n,
        isLong: true,
      })
    ).toBe(5000n);
  });
});

describe("getMaxLeverageByMinCollateralFactor", () => {
  it("returns default if minCollateralFactor is undefined", () => {
    expect(getMaxLeverageByMinCollateralFactor(undefined)).toBe(1000000);
  });

  it("returns correct leverage for a given factor", () => {
    expect(getMaxLeverageByMinCollateralFactor(1000000000000000000n)).toBe(10000000000000000);
  });
});

describe("getMaxAllowedLeverageByMinCollateralFactor", () => {
  const pct = (percent: number) => expandDecimals(percent * 100, 26);
  const bps = (lev: number) => lev * BASIS_POINTS_DIVISOR;

  it("returns default 100x when required factors are missing", () => {
    expect(getMaxAllowedLeverageByMinCollateralFactor(1000000000000000000n)).toBe(bps(100));
  });

  it("uses opening and liquidation constraints, floored to 5x", () => {
    expect(
      getMaxAllowedLeverageByMinCollateralFactor(pct(1), {
        minCollateralFactorForLiquidation: pct(0.5),
        positionFeeFactor: pct(0.06),
      })
    ).toBe(bps(85));
  });
});

describe("getMaxAllowedLeverage", () => {
  const pct = (percent: number) => expandDecimals(percent * 100, 26);
  const bps = (lev: number) => lev * BASIS_POINTS_DIVISOR;

  it("returns default 100x when any required factor is undefined or zero", () => {
    expect(
      getMaxAllowedLeverage({
        minCollateralFactor: undefined,
        minCollateralFactorForLiquidation: undefined,
        positionFeeFactorForBalanceWasNotImproved: undefined,
      })
    ).toBe(bps(100));

    expect(
      getMaxAllowedLeverage({
        minCollateralFactor: 0n,
        minCollateralFactorForLiquidation: pct(0.5),
        positionFeeFactorForBalanceWasNotImproved: pct(0.05),
      })
    ).toBe(bps(100));
  });

  it("returns 100x when liquidation bound dominates", () => {
    expect(
      getMaxAllowedLeverage({
        minCollateralFactor: pct(0.5),
        minCollateralFactorForLiquidation: pct(0.5),
        positionFeeFactorForBalanceWasNotImproved: pct(0.05),
      })
    ).toBe(bps(100));
  });

  it("returns 85x when opening bound dominates", () => {
    expect(
      getMaxAllowedLeverage({
        minCollateralFactor: pct(1),
        minCollateralFactorForLiquidation: pct(0.5),
        positionFeeFactorForBalanceWasNotImproved: pct(0.06),
      })
    ).toBe(bps(85));
  });

  it("returns 25x when liquidation factor is restrictive", () => {
    expect(
      getMaxAllowedLeverage({
        minCollateralFactor: pct(0.5),
        minCollateralFactorForLiquidation: pct(2),
        positionFeeFactorForBalanceWasNotImproved: pct(0.05),
      })
    ).toBe(bps(25));
  });
});

describe("getMinLeverageByMaxCollateralFactor", () => {
  it("returns leverage derived directly from max collateral factor", () => {
    expect(getMinLeverageByMaxCollateralFactor(1000000000000000000n)).toBe(10000000000000000);
  });

  it("rounds min leverage up", () => {
    expect(getMinLeverageByMaxCollateralFactor(expandDecimals(31, 30) / 1000n)).toBe(350000);
  });
});

describe("getOppositeCollateral", () => {
  const marketInfo = {
    longToken: getToken("ETH"),
    shortToken: getToken("USDC"),
  } as MarketInfo;
  it("returns shortToken if token is long", () => {
    expect(getOppositeCollateral(marketInfo, marketInfo.longToken.address)).toEqual(marketInfo.shortToken);
  });

  it("returns undefined if pool type is not found", () => {
    expect(getOppositeCollateral(marketInfo, "0xbtc")).toBeUndefined();
  });
});

describe("getAvailableUsdLiquidityForCollateral", () => {
  it("returns poolUsd if isSpotOnly", () => {
    const marketInfo = {
      isSpotOnly: true,
      longPoolAmount: 1n,
      indexToken: {
        ...getToken("ETH"),
      },
      longToken: { decimals: 18 },
    } as MarketInfo;
    const indexTokenPrices = { minPrice: expandDecimals(10, 18), maxPrice: expandDecimals(15, 18) };
    const longTokenPrices = { minPrice: expandDecimals(1, 18), maxPrice: expandDecimals(2, 18) };
    const shortTokenPrices = { minPrice: expandDecimals(1, 6), maxPrice: expandDecimals(2, 6) };
    expect(
      getAvailableUsdLiquidityForCollateral(marketInfo, true, { [getToken("ETH").address]: indexTokenPrices }, {})
    ).toBe(1n);
  });

  it("calculates liquidity if not spot only", () => {
    const marketInfo = {
      isSpotOnly: false,
      reserveFactorLong: 1n,
      longPoolAmount: expandDecimals(5, 30),
      longInterestInTokens: 1n,
      indexToken: {
        ...getToken("ETH"),
      },
      longToken: { decimals: 18 },
    } as MarketInfo;
    const indexTokenPrices = { minPrice: expandDecimals(10, 18), maxPrice: expandDecimals(15, 18) };
    const longTokenPrices = { minPrice: expandDecimals(1, 18), maxPrice: expandDecimals(2, 18) };
    const shortTokenPrices = { minPrice: expandDecimals(1, 6), maxPrice: expandDecimals(2, 6) };

    expect(
      getAvailableUsdLiquidityForCollateral(marketInfo, true, { [getToken("ETH").address]: indexTokenPrices }, {})
    ).toBe(expandDecimals(35, 30));
  });
});

describe("getReservedUsd", () => {
  it("calculates reservedUsd for long side", () => {
    const marketInfo = {
      longInterestInTokens: 100n,
      indexToken: {
        decimals: 18,
      },
    } as MarketInfo;
    expect(
      getReservedUsd(
        marketInfo,
        true,
        { maxPrice: expandDecimals(10, 18) } as TokenPrices,
        { decimals: 18 } as TokenData
      )
    ).toBe(1000n);
  });

  it("returns shortInterestUsd if isLong=false", () => {
    const marketInfo = { shortInterestUsd: 9999n } as MarketInfo;
    expect(getReservedUsd(marketInfo, false, {} as TokenPrices, { decimals: 18 } as TokenData)).toBe(9999n);
  });
});

describe("getMaxReservedUsd", () => {
  const ethAddress = getToken("ETH").address;
  const usdcAddress = getToken("USDC").address;
  const prices = {
    [ethAddress]: {
      minPrice: expandDecimals(1, 30),
      maxPrice: expandDecimals(1, 30),
    },
    [usdcAddress]: {
      minPrice: expandDecimals(1, 30),
      maxPrice: expandDecimals(1, 30),
    },
  };
  const tokensData = {
    [ethAddress]: { decimals: 18 },
    [usdcAddress]: { decimals: 6 },
  } as TokensData;

  it("applies the frontend max reserved USD buffer", () => {
    const marketInfo = {
      longPoolAmount: expandDecimals(100, 18),
      longTokenAddress: ethAddress,
      shortTokenAddress: usdcAddress,
      reserveFactorLong: PRECISION,
      openInterestReserveFactorLong: PRECISION,
    } as MarketInfo;
    const rawMaxReservedUsd = expandDecimals(100, 30);
    const expectedMaxReservedUsd =
      (rawMaxReservedUsd * (BASIS_POINTS_DIVISOR_BIGINT - MAX_RESERVED_USD_FRONTEND_BUFFER_BPS)) /
      BASIS_POINTS_DIVISOR_BIGINT;

    expect(getMaxReservedUsd(marketInfo, true, prices, tokensData)).toBe(expectedMaxReservedUsd);
  });

  it("uses the buffered max reserved USD when calculating position liquidity", () => {
    const marketInfo = {
      isSpotOnly: false,
      longPoolAmount: expandDecimals(100, 18),
      longInterestInTokens: expandDecimals(10, 18),
      longInterestUsd: expandDecimals(10, 30),
      longTokenAddress: ethAddress,
      shortTokenAddress: usdcAddress,
      indexTokenAddress: ethAddress,
      reserveFactorLong: PRECISION,
      openInterestReserveFactorLong: PRECISION,
      maxOpenInterestLong: expandDecimals(1_000, 30),
      indexToken: { decimals: 18 },
    } as MarketInfo;
    const rawMaxReservedUsd = expandDecimals(100, 30);
    const bufferedMaxReservedUsd =
      (rawMaxReservedUsd * (BASIS_POINTS_DIVISOR_BIGINT - MAX_RESERVED_USD_FRONTEND_BUFFER_BPS)) /
      BASIS_POINTS_DIVISOR_BIGINT;
    const reservedUsd = expandDecimals(10, 30);

    expect(getAvailableUsdLiquidityForPosition(marketInfo, true, prices, tokensData)).toBe(
      bufferedMaxReservedUsd - reservedUsd
    );
  });
});

describe("getMarketDivisor", () => {
  it("returns 2n if longTokenAddress equals shortTokenAddress", () => {
    expect(
      getMarketDivisor({
        longTokenAddress: "0xsame",
        shortTokenAddress: "0xsame",
      })
    ).toBe(2n);
  });

  it("returns 1n otherwise", () => {
    expect(
      getMarketDivisor({
        longTokenAddress: "0xeth",
        shortTokenAddress: "0xusdc",
      })
    ).toBe(1n);
  });
});

describe("getMarketPnl", () => {
  it("returns 0n if openInterest is 0", () => {
    const marketInfo = {
      indexToken: {
        decimals: 18,
      },
      longInterestUsd: 0n,
      longInterestInTokens: 0n,
    } as MarketInfo;
    expect(
      getMarketPnl(marketInfo, { minPrice: expandDecimals(1000, 18), maxPrice: expandDecimals(2000, 18) }, true, false)
    ).toBe(0n);
  });

  it("calculates pnl for long positions", () => {
    const marketInfo = {
      indexToken: {
        decimals: 18,
      },
      longInterestUsd: 1000n,
      longInterestInTokens: 1n,
    } as MarketInfo;
    // maximize = false => use minPrice for long
    expect(
      getMarketPnl(marketInfo, { minPrice: expandDecimals(1000, 18), maxPrice: expandDecimals(2000, 18) }, true, true)
    ).toBe(0n); // openInterestValue(1000n) - openInterestUsd(1000n) = 0
  });
});

describe("getOpenInterestUsd", () => {
  it("returns longInterestUsd for isLong", () => {
    expect(getOpenInterestUsd({ longInterestUsd: 1234n, shortInterestUsd: 9999n } as MarketInfo, true)).toBe(1234n);
  });

  it("returns shortInterestUsd for !isLong", () => {
    expect(getOpenInterestUsd({ longInterestUsd: 1234n, shortInterestUsd: 9999n } as MarketInfo, false)).toBe(9999n);
  });
});

describe("getOpenInterestInTokens", () => {
  it("returns longInterestInTokens for isLong", () => {
    expect(
      getOpenInterestInTokens({ longInterestInTokens: 100n, shortInterestInTokens: 200n } as MarketInfo, true)
    ).toBe(100n);
  });

  it("returns shortInterestInTokens for !isLong", () => {
    expect(
      getOpenInterestInTokens({ longInterestInTokens: 100n, shortInterestInTokens: 200n } as MarketInfo, false)
    ).toBe(200n);
  });
});

describe("getPriceForPnl", () => {
  it("uses maxPrice for long when maximize=true", () => {
    expect(getPriceForPnl({ minPrice: 1000n, maxPrice: 2000n }, true, true)).toBe(2000n);
  });

  it("uses maxPrice for short when maximize=false", () => {
    expect(getPriceForPnl({ minPrice: 1000n, maxPrice: 2000n }, false, false)).toBe(2000n);
  });
});
