import { memo } from 'react';

import { useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';
import { useShallow } from 'zustand/react/shallow';

import { ROUND_MODE } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import { useGlobalStore, usePriceTickerStream, useInstStore } from '@/common';

import ListItem from '@/components/ListItem';
import { useOrder } from './context';
import { useCalcEditableParams } from './useFormAction';

const HelpfulInfo = () => {
  const { t } = useLingui();

  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const leverDecimal = useGlobalStore((state) => state.leverDecimal);

  const {
    targetCoin,
    size,
    payCoin,
    payCoinAmount,
    triggerPrice,
    collateralUsd,
  } = useOrder();
  const [coins] = useInstStore(useShallow((state) => [state.getCoins()]));

  const px = useWatch({ name: 'px' });

  const payCoinObj = coins[payCoin];
  const payCoinPx = usePriceTickerStream(
    payCoinObj ? `${payCoinObj?.symbol}/USD` : '',
    { throttleWait: 5000 },
  ).data[0]?.p;

  const payCoinIsTargetCoin = payCoin === targetCoin;
  const { curCollateral, nextCollateral, curLever, nextLever } =
    useCalcEditableParams({
      payCoinIsTargetCoin,
      triggerPrice,
      payCoinPx,
      px,
      payCoinAmount,
      payCoin: payCoinObj,
      size,
      collateralUsd,
    });

  return (
    <div className="flex flex-col gap-3 text-sm">
      {/* collateral */}
      <ListItem
        label={t`Collateral (at limit price)`}
        value={
          nextCollateral !== curCollateral ? (
            <>
              <span className="text-t-270">
                {truncateFormat(curCollateral, usdAmountDisplayDecimal, {
                  style: 'currency',
                  currency: 'USD',
                })}
                {' → '}
              </span>
              {truncateFormat(nextCollateral, usdAmountDisplayDecimal, {
                style: 'currency',
                currency: 'USD',
              })}
            </>
          ) : (
            `${truncateFormat(curCollateral, usdAmountDisplayDecimal, {
              style: 'currency',
              currency: 'USD',
            })}`
          )
        }
      />
      {/* size */}
      <ListItem
        label={t`Size`}
        value={truncateFormat(size, usdAmountDisplayDecimal, {
          style: 'currency',
          currency: 'USD',
        })}
      />
      {/* leverage */}
      <ListItem
        label={t`Leverage`}
        value={
          curLever !== nextLever ? (
            <>
              <span className="text-t-270">
                {truncateFormat(curLever, leverDecimal, {
                  stripTrailingZeros: true,
                  round: ROUND_MODE.ROUND,
                })}
                x{' → '}
              </span>
              {truncateFormat(nextLever, leverDecimal, {
                stripTrailingZeros: true,
                round: ROUND_MODE.ROUND,
              })}
              x
            </>
          ) : (
            `${truncateFormat(curLever, leverDecimal, {
              stripTrailingZeros: true,
              round: ROUND_MODE.ROUND,
            })}x`
          )
        }
      />
    </div>
  );
};

export default memo(HelpfulInfo);
