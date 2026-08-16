import BigNumber from 'bignumber.js';
import { calc } from '@repo/lib/calc';

type Num = BigNumber | string | number;

/**
 * calc liq price
 * @param collateral collateral usd
 * @param size position size usd
 * @param isLong long or short
 * @param entryPrice average price
 * @param maxLevel maxLevel
 */
export const calcLiqPx = ({
  collateral,
  size,
  isLong,
  entryPrice,
  maxLevel,
}: {
  collateral: Num;
  size: Num;
  isLong: boolean;
  entryPrice: Num;
  maxLevel?: Num;
}) => {
  // long:  entryPrice * (1 - (collateral - size / maxLevel) / size)
  // short: entryPrice * (1 + (collateral - size / maxLevel) / size)
  let liqPx: BigNumber | string = calc(1)
    .minus(
      calc(collateral)
        .minus(maxLevel ? calc(size).div(maxLevel) : 0)
        .div(size)
        .times(isLong ? 1 : -1),
    )
    .times(entryPrice);
  liqPx = calc(liqPx).lte(0) ? '0' : liqPx;
  return liqPx;
};

/**
 * calc collateral and size
 * @param inputCollateral input collateral
 * @param needSwap whether need swap
 * @param lever leverage
 * @param swapFeeRate swap fee rate
 * @param openFeeRate open fee rate
 */
export const calcOpenPosValues = ({
  inputCollateral,
  needSwap,
  lever,
  swapFeeRate,
  openFeeRate,
}: {
  inputCollateral: Num;
  needSwap: boolean;
  lever: Num;
  swapFeeRate: Num;
  openFeeRate: Num;
}) => {
  let collateral = calc(inputCollateral);
  // swap fee: swapFee = inputCollateral * swapFeeRate
  const swapFee = needSwap ? calc(inputCollateral).times(swapFeeRate) : 0;

  // size = (inputCollateral - swapFee - size * openFeeRate) * lever
  // size = (inputCollateral - swapFee) / (lever * openFeeRate + 1)
  const size = collateral
    .minus(swapFee)
    .times(lever)
    .div(calc(lever).times(openFeeRate).plus(1));

  // openFee: size * openFeeRate
  const openFee = size.times(openFeeRate);

  // collateral
  collateral = size.div(lever);

  return {
    swapFee,
    openFee,
    collateral,
    size,
  };
};
