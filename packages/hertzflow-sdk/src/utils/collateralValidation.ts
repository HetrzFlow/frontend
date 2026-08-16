import BigNumber from 'bignumber.js';
import { COMMON_CONSTS } from '../constants';
import { HertzflowError, CustomErrorCode } from '../errors/errors';
import { PRICE_MULTIPLIER_DECIMAL } from '../math';
import { fromDecimalsAmount } from './numbers';

export function validateMinCollateral(collateralUsdValue: string): void {
  const collateralBN = new BigNumber(collateralUsdValue);
  const minCollateralBN = new BigNumber(COMMON_CONSTS.MIN_COLLATERAL_USD);

  if (collateralBN.isLessThan(minCollateralBN)) {
    throw new HertzflowError(
      ` ${fromDecimalsAmount(collateralUsdValue, PRICE_MULTIPLIER_DECIMAL)} USDT  ${fromDecimalsAmount(minCollateralBN.toString(10), PRICE_MULTIPLIER_DECIMAL)} USDT`,
      CustomErrorCode.CollateralBelowMinimum,
    );
  }
}
