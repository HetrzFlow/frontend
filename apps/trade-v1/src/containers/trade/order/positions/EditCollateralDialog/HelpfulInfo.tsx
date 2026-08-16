import { memo } from 'react';

import { useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';
import { useShallow } from 'zustand/react/shallow';

import { calc, ROUND_MODE } from '@repo/lib/calc';
import { EMPTY_DISPLAY, truncateFormat } from '@repo/lib/format';
import {
  cn,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui';
import {
  dwFeeDoc,
  useGlobalStore,
  useLiqPx,
  usePriceTickerStream,
  useInstStore,
} from '@/common';
import ListItem from '@/components/ListItem';
import { usePosition } from '../context';
import { TYPE } from './enum';
import { useCalcEditableParams } from './useFormAction';

const HelpfulInfo = () => {
  const { t } = useLingui();

  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const leverDecimal = useGlobalStore((state) => state.leverDecimal);

  const {
    targetCoin,
    entryPrice: entryPrice,
    size: prevSz,
    collateral: prevCollateral,
    isLong,
    leverage: lever,
    entryFundingRate,
  } = usePosition();
  const [inst, baseCoin, usdcCoin, coins] = useInstStore(
    useShallow((state) => [
      state.getInstsArr().find((v) => v.coinType === targetCoin),
      state.getCoins()[targetCoin],
      state.getUsdcCoin(state),
      state.getCoins(),
    ]),
  );

  const type = useWatch({ name: 'type' });
  const size = useWatch({ name: 'size' });
  const isDeposit = type === TYPE.deposit;

  const { borrowFee, nextCollateral } = useCalcEditableParams({
    isDeposit,
    isLong,
    baseCoin,
    usdcCoin,
    entryFundingRate,
    size,
    curSize: prevSz,
    curCollateral: prevCollateral,
  });

  const pxDispDecimal = coins[inst?.baseCoin || '']?.pxDispDecimal;
  const collateralCoin = isLong ? baseCoin : usdcCoin;

  const { data: priceData } = usePriceTickerStream(inst?.id);
  const marketPx = priceData[0]?.p;

  const { data: liqPx } = useLiqPx({
    collateralCoinType: collateralCoin?.coinType,
    collateral: prevCollateral,
    size: prevSz,
    isLong,
    entryPrice,
  });

  const { data: nextLiqPx } = useLiqPx({
    collateralCoinType: collateralCoin?.coinType,
    collateral: nextCollateral.toFixed(),
    size: prevSz,
    isLong,
    entryPrice,
  });

  // const networkFee = 0.03;
  // const networkFeeCoinSymbol = coins[NETWORK_FEE_COIN]?.symbol ?? '';
  // const networkFeeCoinPx =
  //   useCoinPrice(networkFeeCoinSymbol ? `${networkFeeCoinSymbol}/USD` : '') ??
  //   '1';
  // const networkFeeUsdValue = calc(networkFee).times(networkFeeCoinPx);
  const fees = borrowFee;

  const dispFees = truncateFormat(
    calc(fees).times(-1),
    usdAmountDisplayDecimal,
    {
      style: 'currency',
      currency: 'USD',
      showNegativeZero: true,
    },
  );

  return (
    <div className="flex flex-col gap-3 text-sm">
      {/* leverage */}
      <ListItem
        label={t`Leverage`}
        value={
          size ? (
            <>
              <span className="text-t-270">
                {truncateFormat(lever, leverDecimal, {
                  stripTrailingZeros: true,
                  round: ROUND_MODE.ROUND,
                })}
                x{' → '}
              </span>
              {truncateFormat(calc(prevSz).div(nextCollateral), leverDecimal, {
                stripTrailingZeros: true,
                round: ROUND_MODE.ROUND,
              })}
              x
            </>
          ) : (
            `${truncateFormat(lever, leverDecimal, {
              stripTrailingZeros: true,
              round: ROUND_MODE.ROUND,
            })}x`
          )
        }
      />
      {/* collateral */}
      <ListItem
        label={t`Collateral`}
        value={
          size ? (
            <>
              <span className="text-t-270">
                {truncateFormat(prevCollateral, usdAmountDisplayDecimal, {
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
            truncateFormat(prevCollateral, usdAmountDisplayDecimal, {
              style: 'currency',
              currency: 'USD',
            })
          )
        }
      />
      {/* liq price */}
      <ListItem
        label={t`Liq. Price`}
        value={
          size ? (
            <>
              <span className="text-t-270">
                {truncateFormat(liqPx, pxDispDecimal, {
                  style: 'currency',
                  currency: 'USD',
                })}
                {' → '}
              </span>
              {truncateFormat(nextLiqPx, pxDispDecimal, {
                style: 'currency',
                currency: 'USD',
              })}
            </>
          ) : (
            truncateFormat(liqPx, pxDispDecimal, {
              style: 'currency',
              currency: 'USD',
            })
          )
        }
      />
      <ListItem
        label={t`Fees`}
        value={
          <Tooltip>
            <TooltipTrigger
              className={cn(
                'decoration-t-430 text-right decoration-dotted underline-offset-3',
                dispFees === EMPTY_DISPLAY
                  ? 'cursor-auto no-underline'
                  : 'underline',
              )}
            >
              {dispFees}
            </TooltipTrigger>
            {dispFees !== EMPTY_DISPLAY && (
              <TooltipContent
                side="right"
                className="flex w-[224px] flex-col gap-0.5"
                inDialog
              >
                <>
                  <ListItem
                    label={`${t`Borrow Fee Due`}:`}
                    value={truncateFormat(
                      calc(borrowFee).times(-1),
                      usdAmountDisplayDecimal,
                      {
                        style: 'currency',
                        currency: 'USD',
                        showNegativeZero: true,
                      },
                    )}
                  />
                  {/* <ListItem
                    label={`${t`Network Fee`}:`}
                    value={`${thoFormat(networkFee)} ${networkFeeCoinSymbol} (${truncateFormat(
                      networkFeeUsdValue,
                      usdAmountDisplayDecimal,
                      {
                        style: 'currency',
                        currency: 'USD',
                      },
                    )})`}
                  /> */}
                  <span>
                    <a
                      className="text-accent underline underline-offset-2"
                      href={dwFeeDoc || 'https://'}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t`Read more`}
                    </a>
                  </span>
                </>
              </TooltipContent>
            )}
          </Tooltip>
        }
      />
      <Separator />
      <ListItem
        label={t`Entry Price`}
        value={truncateFormat(entryPrice, pxDispDecimal, {
          style: 'currency',
          currency: 'USD',
        })}
      />
      <ListItem
        label={t`Mark Price`}
        value={truncateFormat(marketPx, pxDispDecimal, {
          style: 'currency',
          currency: 'USD',
        })}
      />
      {/* position size */}
      <ListItem
        label={t`Size`}
        value={truncateFormat(prevSz, usdAmountDisplayDecimal, {
          style: 'currency',
          currency: 'USD',
        })}
      />
    </div>
  );
};

export default memo(HelpfulInfo);
