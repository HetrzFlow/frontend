import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { type BN, calc } from '@repo/lib/calc';
import { thoFormat, truncateFormat } from '@repo/lib/format';

const getMinResidualCollateralText = (
  minResidualCollateral: number,
  minCollateralUnit: string,
) => {
  const dispMinCollateral = thoFormat(minResidualCollateral);
  return i18n._(
    msg`Min Residual Collateral: ${dispMinCollateral} ${minCollateralUnit}`,
  );
};

export const residualCollateralValidator = ({
  nextCollateralUsd,
  collateralTokenSymbol,
  collateralTokenPx,
  minResidualCollateral,
  isCreditMarket = false,
}: {
  nextCollateralUsd?: string | BN;
  collateralTokenSymbol?: string;
  collateralTokenPx?: string | BN;
  minResidualCollateral: number;
  isCreditMarket?: boolean;
}) => {
  if (!nextCollateralUsd) return;

  if (
    (isCreditMarket || collateralTokenSymbol === 'USDT') &&
    collateralTokenPx &&
    calc(nextCollateralUsd)
      .div(collateralTokenPx)
      // calc buffer
      .lt(minResidualCollateral - 0.01)
  ) {
    return getMinResidualCollateralText(
      minResidualCollateral,
      isCreditMarket ? 'Credit' : 'USDT',
    );
  }

  if (
    !isCreditMarket &&
    collateralTokenSymbol !== 'USDT' &&
    calc(nextCollateralUsd).lt(minResidualCollateral)
  ) {
    return getMinResidualCollateralText(minResidualCollateral, 'USD');
  }
};

export const maxLeverageValidator = ({
  nextLeverage,
  nextCollateralUsd,
  nextSizeUsd,
  finalMaxLeverage,
  leverDecimal,
}: {
  nextLeverage?: string | BN;
  nextCollateralUsd?: string | BN;
  nextSizeUsd?: string | number | BN;
  finalMaxLeverage: string | number | BN;
  leverDecimal: number;
}) => {
  const normalizedNextLeverage =
    nextLeverage ??
    (nextCollateralUsd !== undefined && nextSizeUsd !== undefined
      ? calc(nextCollateralUsd).lte(0)
        ? calc(Infinity)
        : calc(nextSizeUsd).div(nextCollateralUsd)
      : undefined);

  if (!normalizedNextLeverage) return;

  // add 0.1% buffer
  if (calc(normalizedNextLeverage).times(0.999).gt(finalMaxLeverage)) {
    const dispMaxLev = truncateFormat(finalMaxLeverage, leverDecimal);
    return i18n._(msg`Above Max Lev ${dispMaxLev}x`);
  }
};

export const minLeverageValidator = ({
  nextLeverage,
  nextCollateralUsd,
  nextSizeUsd,
  finalMinLeverage,
  leverDecimal,
  isZFP = false,
}: {
  nextLeverage?: string | BN;
  nextCollateralUsd?: string | BN;
  nextSizeUsd?: string | number | BN;
  finalMinLeverage: string | number | BN;
  leverDecimal: number;
  isZFP?: boolean;
}) => {
  const normalizedNextLeverage =
    nextLeverage ??
    (nextCollateralUsd !== undefined && nextSizeUsd !== undefined
      ? calc(nextCollateralUsd).lte(0)
        ? calc(Infinity)
        : calc(nextSizeUsd).div(nextCollateralUsd)
      : undefined);

  if (!normalizedNextLeverage) return;

  // add 0.1% buffer
  if (calc(normalizedNextLeverage).times(1.001).lt(finalMinLeverage)) {
    if (isZFP) {
      const dispMinLev = truncateFormat(finalMinLeverage, leverDecimal, {
        stripTrailingZeros: true,
      });
      return i18n._(msg`Below Min Lev ${dispMinLev}x (Hyper mode)`);
    }
    return i18n._(msg`Below Min Lev 1.1x`);
  }
};
