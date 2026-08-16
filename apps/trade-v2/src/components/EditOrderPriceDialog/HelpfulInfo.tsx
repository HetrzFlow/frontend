import { FC } from 'react';

import { useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';

import { calc, ROUND_MODE } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import { useGlobalStore, useInstStore } from '@/common';
import type { Position } from '@/common/services';

import ListItem from '@/components/ListItem';
import { useCalcFinalPosition } from '@/hooks/useCalcPosition';
import { useOrder } from './context';

interface HelpfulInfoProps {
  position?: Position;
}

const HelpfulInfo: FC<HelpfulInfoProps> = ({ position }) => {
  const { t } = useLingui();

  const leverDecimal = useGlobalStore((state) => state.leverDecimal);

  const {
    marketAddress,
    isLong,
    sizeDeltaUsd,
    initialCollateralDeltaAmount,
    initialCollateralTokenAddress,
    triggerPrice,
    isLimit,
    isTpSl,
  } = useOrder();
  const insts = useInstStore((state) => state.getInsts());

  const px = useWatch({ name: 'px' });

  const { curLiqPx } = useCalcFinalPosition({
    inst: insts[marketAddress],
    isLong,
    deltaSize: sizeDeltaUsd,
    deltaCollateralAmount: initialCollateralDeltaAmount,
    collateralTokenAddress: initialCollateralTokenAddress,
    px: triggerPrice,
    position,
    isZFP: position?.isZFP,
  });

  const { curLeverage, nextLeverage, nextLiqPx } = useCalcFinalPosition({
    inst: insts[marketAddress],
    isLong,
    deltaSize: sizeDeltaUsd,
    deltaCollateralAmount: initialCollateralDeltaAmount,
    collateralTokenAddress: initialCollateralTokenAddress,
    px: px,
    position,
    isZFP: position?.isZFP,
  });

  const pxDispDecimal = insts[marketAddress]?.pxDispDecimal;
  const showNextOnly = isLimit && !position;

  return (
    <div className="flex flex-col gap-2 text-xs">
      {/* leverage */}
      {!isTpSl && (
        <ListItem
          label={t`Leverage`}
          value={
            showNextOnly ? (
              `${truncateFormat(nextLeverage, leverDecimal, {
                stripTrailingZeros: true,
                round: ROUND_MODE.ROUND,
              })}${nextLeverage.isNaN() ? '' : 'x'}`
            ) : !curLeverage.eq(nextLeverage) &&
              (!curLeverage.isNaN() || !nextLeverage.isNaN()) ? (
              <>
                <span className="text-t-270">
                  {truncateFormat(curLeverage, leverDecimal, {
                    stripTrailingZeros: true,
                    round: ROUND_MODE.ROUND,
                  })}
                  {curLeverage.isNaN() ? '' : 'x'}
                  {' → '}
                </span>
                {truncateFormat(nextLeverage, leverDecimal, {
                  stripTrailingZeros: true,
                  round: ROUND_MODE.ROUND,
                })}
                {nextLeverage.isNaN() ? '' : 'x'}
              </>
            ) : (
              `${truncateFormat(curLeverage, leverDecimal, {
                stripTrailingZeros: true,
                round: ROUND_MODE.ROUND,
              })}${curLeverage.isNaN() ? '' : 'x'}`
            )
          }
        />
      )}
      {/* liqPx */}
      {
        <ListItem
          label={t`Liq. Price`}
          value={truncateFormat(
            calc(showNextOnly ? nextLiqPx : curLiqPx).lte(0)
              ? ''
              : showNextOnly
                ? nextLiqPx
                : curLiqPx,
            pxDispDecimal,
            {
              style: 'currency',
              currency: 'USD',
            },
          )}
        />
      }
    </div>
  );
};

export default HelpfulInfo;
