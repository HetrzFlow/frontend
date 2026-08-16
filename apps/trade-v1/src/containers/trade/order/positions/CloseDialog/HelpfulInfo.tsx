import { FC, memo } from 'react';

import { useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';
import { useShallow } from 'zustand/react/shallow';

import { calc } from '@repo/lib/calc';
import { EMPTY_DISPLAY, percentFormat, truncateFormat } from '@repo/lib/format';
import {
  cn,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui';
import {
  closePosFeeDoc,
  useLiqPx,
  useBorrowFee,
  usePriceTickerStream,
  useInstStore,
  useGlobalStore,
} from '@/common';
import ListItem from '@/components/ListItem';
import { MARKET_PX } from '@/constants/common';
import { ORDER_TYPE } from '@/constants/enum';
import { useClosePosSizeAndFees } from '@/services/rest/trade';
import { usePosition } from '../context';

interface HelpfulInfoProps {
  orderType: ORDER_TYPE;
}

const HelpfulInfo: FC<HelpfulInfoProps> = ({ orderType }) => {
  const { t } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
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
  const collateralCoinType = isLong ? baseCoin?.coinType : usdcCoin?.coinType;
  const { data: borrowFee } = useBorrowFee({
    collateralCoinType,
    isLong,
    size: prevSz,
    entryFundingRate: entryFundingRate,
  });
  // const finalPrevCollateral = calc(prevCollateral).minus(borrowFee);
  // const lever = calc(prevSz).div(finalPrevCollateral);

  const pxDispDecimal = coins[inst?.baseCoin || '']?.pxDispDecimal;

  const px = useWatch({ name: 'px' });
  const size = useWatch({ name: 'size' });
  const receiveCoinType = useWatch({ name: 'receiveCoinType' });

  const { data: priceData } = usePriceTickerStream(inst?.id);
  const marketPx = priceData[0]?.p;

  const curAvgPx = px === MARKET_PX ? marketPx : px;

  const { data: liqPx } = useLiqPx({
    collateralCoinType: collateralCoinType,
    entryPrice,
    collateral: prevCollateral,
    size: prevSz,
    isLong,
    entryFundingRate: `${entryFundingRate}`,
    hasPosition: true,
  });

  // const networkFee = 0.03;
  // const networkFeeCoinSymbol = coins[NETWORK_FEE_COIN]?.symbol ?? '';
  // const networkFeeCoinPx =
  //   useCoinPrice(networkFeeCoinSymbol ? `${networkFeeCoinSymbol}/USD` : '') ??
  //   '1';
  // const networkFeeUsdValue = calc(networkFee).times(networkFeeCoinPx);
  const { data } = useClosePosSizeAndFees(collateralCoinType, receiveCoinType);
  const pnl = calc(curAvgPx)
    .div(entryPrice)
    .minus(1)
    .times(isLong ? 1 : -1)
    .times(size);

  const closeFee = data?.closeFee || 0;
  const needSwapFee = receiveCoinType !== collateralCoinType;
  const swapFee = data?.swapFee || 0;
  const priceImpact = data?.priceImpact || 0;

  const fees = calc(closeFee).plus(borrowFee).plus(swapFee).plus(priceImpact); // networkFeeUsdValue.plus(

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
      {/* trigger price */}
      {/* {orderType === ORDER_TYPE.trigger && (
        <>
          <ListItem
            label={t`Trigger Price`}
            value={`${
              marketPx && px ? (calc(px).gt(marketPx) ? '≥' : '≤') : ''
            }${truncateFormat(px, pxDispDecimal, {
              style: 'currency',
              currency: 'USD',
            })}`}
          />
          <Separator />
        </>
      )} */}
      {/* position size */}
      <ListItem
        label={t`Size`}
        value={
          size ? (
            <>
              <span className="text-t-270">
                {truncateFormat(prevSz, usdAmountDisplayDecimal, {
                  style: 'currency',
                  currency: 'USD',
                })}
                {' → '}
              </span>
              {truncateFormat(
                calc(prevSz).minus(size),
                usdAmountDisplayDecimal,
                {
                  style: 'currency',
                  currency: 'USD',
                },
              )}
            </>
          ) : (
            truncateFormat(prevSz, usdAmountDisplayDecimal, {
              style: 'currency',
              currency: 'USD',
            })
          )
        }
      />
      {/* collateral usd */}
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
              {truncateFormat(
                calc(prevSz).minus(size).div(lever),
                usdAmountDisplayDecimal,
                {
                  style: 'currency',
                  currency: 'USD',
                },
              )}
            </>
          ) : (
            truncateFormat(prevCollateral, usdAmountDisplayDecimal, {
              style: 'currency',
              currency: 'USD',
            })
          )
        }
      />
      {/* PnL */}
      <ListItem
        label={t`Est. RPnL`}
        value={
          <>
            {truncateFormat(pnl, usdAmountDisplayDecimal, {
              style: 'currency',
              currency: 'USD',
              signDisplay: 'always',
            })}
            (
            {percentFormat(
              calc(curAvgPx)
                .div(entryPrice)
                .minus(1)
                .times(isLong ? 1 : -1)
                .times(lever),
              2,
              { signDisplay: 'always' },
            )}
            )
          </>
        }
      />
      <ListItem
        label={t`Liq. Price`}
        value={truncateFormat(liqPx, pxDispDecimal, {
          style: 'currency',
          currency: 'USD',
        })}
      />
      <Separator />
      <ListItem
        label={t`Mark Price`}
        value={truncateFormat(marketPx, pxDispDecimal, {
          style: 'currency',
          currency: 'USD',
        })}
      />
      <ListItem
        label={t`Entry Price`}
        value={truncateFormat(entryPrice, pxDispDecimal, {
          style: 'currency',
          currency: 'USD',
        })}
      />
      <Separator />
      <ListItem
        label={t`Fees`}
        value={
          <Tooltip>
            <TooltipTrigger
              className={cn(
                'decoration-t-430 decoration-dotted underline-offset-3',
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
                  {needSwapFee && (
                    <>
                      <ListItem
                        label={`${t`Swap Fee`}:`}
                        value={truncateFormat(
                          calc(swapFee).times(-1),
                          usdAmountDisplayDecimal,
                          {
                            style: 'currency',
                            currency: 'USD',
                            showNegativeZero: true,
                          },
                        )}
                      />
                      <ListItem
                        label={`${t`Price Impact`}:`}
                        value={truncateFormat(
                          calc(priceImpact).times(-1),
                          usdAmountDisplayDecimal,
                          {
                            style: 'currency',
                            currency: 'USD',
                            showNegativeZero: true,
                            signDisplay: 'exceptZero',
                          },
                        )}
                      />
                    </>
                  )}
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
                  <ListItem
                    label={`${t`Close Fee`}:`}
                    value={truncateFormat(
                      calc(closeFee).times(-1),
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
                      href={closePosFeeDoc || 'https://'}
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
    </div>
  );
};

export default memo(HelpfulInfo);
