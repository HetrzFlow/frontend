import { FC, useMemo } from 'react';

import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';

import { calc } from '@repo/lib/calc';
import { EMPTY_DISPLAY, truncateFormat } from '@repo/lib/format';
import { cn, Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui';
import {
  openPosFeeDoc,
  useLiqPx,
  useBorrowFee,
  usePositions,
  usePriceTickerStream,
  useInstStore,
  useGlobalStore as useCommonGlobalStore,
} from '@/common';
import ListItem from '@/components/ListItem';
import { MARKET_PX } from '@/constants/common';
import { TRADE_TYPE } from '@/constants/enum';
import { usePositionSizeAndFees } from '@/services/rest/trade';
import { useGlobalStore } from '@/stores/trade/global';
import { PositionForm, useTradeStore } from '../store';
import Details from './Details';

interface PositionInfoProps {
  isLong: boolean;
}

const PositionInfo: FC<PositionInfoProps> = ({ isLong }) => {
  const { t } = useLingui();
  const usdAmountDisplayDecimal = useCommonGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const [tradeType, formData] = useTradeStore(
    useShallow((state) => [state.tradeType, state.formData]),
  );

  const instId = useGlobalStore((state) => state.instId);
  const [inst, coins] = useInstStore(
    useShallow((state) => [state.getInst(state, instId), state.getCoins()]),
  );

  const usdcCoin = Object.values(coins).find((v) => v.symbol === 'USDC');
  const { data: positionData } = usePositions();

  const { data } = usePriceTickerStream(inst?.id || '');
  const { p: last } = data[0] || {};
  const position = useMemo(
    () =>
      positionData?.find(
        (v) => v.targetCoin === inst?.coinType && v.isLong === isLong,
      ),
    [inst?.coinType, positionData, isLong],
  );
  const {
    paySz: { coin: payCoin = '' },
    px,
  } = formData[tradeType as TRADE_TYPE.long | TRADE_TYPE.short] as PositionForm;

  const curAvgPx = px === MARKET_PX ? last : px;
  const {
    entryPrice: prevAvgPx = curAvgPx,
    size: prevSz = '0',
    collateral: prevCollateral = '0',
    entryFundingRate = '0',
  } = position || {};

  const baseCoin = inst?.baseCoin ?? '';
  const collateralCoin = isLong ? baseCoin : usdcCoin?.coinType;
  const needSwap = payCoin !== collateralCoin;

  const { data: prevLiqPx } = useLiqPx({
    collateralCoinType: collateralCoin,
    collateral: prevCollateral,
    size: prevSz,
    isLong,
    entryPrice: prevAvgPx ?? '',
    entryFundingRate: entryFundingRate,
    hasPosition: true,
  });

  const { data: feeData } = usePositionSizeAndFees(payCoin, collateralCoin);
  const { data: borrowFee } = useBorrowFee({
    collateralCoinType: collateralCoin,
    isLong,
    size: prevSz,
    entryFundingRate: entryFundingRate,
  });

  const finalPrevCollateral = calc(prevCollateral).minus(borrowFee);
  const openFee = feeData?.openFee || 0;
  const swapFee = feeData?.swapFee || 0;
  const priceImpact = feeData?.priceImpact || 0;
  const curCollateral = feeData?.collateral || '';
  const size = feeData?.size || '';

  // calc average price
  const avgPx = useMemo(() => {
    return curAvgPx && size
      ? calc(finalPrevCollateral)
          .plus(curCollateral)
          .div(
            calc(finalPrevCollateral)
              .div(prevAvgPx || curAvgPx)
              .plus(calc(curCollateral).div(curAvgPx)),
          )
      : '';
  }, [prevAvgPx, finalPrevCollateral, size, curAvgPx, curCollateral]);

  const totalSize = calc(prevSz).plus(size);
  const collateral = calc(curCollateral).plus(finalPrevCollateral);

  const { data: liqPx } = useLiqPx({
    collateralCoinType: collateralCoin,
    collateral: collateral.toFixed(),
    size: totalSize.toFixed(),
    isLong,
    entryPrice: calc(avgPx).toFixed(),
  });

  // calc liq price
  const finalLever = calc(totalSize).div(collateral);

  // const networkFee = 0.03;
  // const networkFeeCoinSymbol = coins[NETWORK_FEE_COIN]?.symbol ?? '';
  // const networkFeeCoinPx =
  //   useCoinPrice(networkFeeCoinSymbol ? `${networkFeeCoinSymbol}/USD` : '') ??
  //   '1';
  // const networkFeeUsdValue = calc(networkFee).times(networkFeeCoinPx);

  const fees = calc(openFee).plus(swapFee).plus(priceImpact).plus(borrowFee); // networkFeeUsdValue.plus(

  const dispFees = truncateFormat(
    calc(fees).times(-1),
    usdAmountDisplayDecimal,
    {
      style: 'currency',
      currency: 'USD',
      signDisplay: 'always',
      showNegativeZero: true,
    },
  );
  const smDialogOpen = useTradeStore((state) => state.smDialogOpen);

  return (
    <div className="flex flex-col gap-3 text-sm">
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
                side="left"
                className="flex w-[224px] flex-col gap-0.5"
                inDialog={smDialogOpen}
              >
                <>
                  {needSwap && (
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
                    label={`${t`Open Fee`}:`}
                    value={truncateFormat(
                      calc(openFee).times(-1),
                      usdAmountDisplayDecimal,
                      {
                        style: 'currency',
                        currency: 'USD',
                        showNegativeZero: true,
                      },
                    )}
                  />
                  {position && (
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
                  )}
                  {/* <ListItem
                    label={`${t`Network Fee`}:`}
                    value={`${thoFormat(networkFee)} ${networkFeeCoinSymbol} (${truncateFormat(
                      networkFeeUsdValue,
                      usdAmountDisplayDecimal,
                      {
                        style: 'currency',
                        currency: 'USD',
                        showMinDecimalValue: true,
                      },
                    )})`}
                  /> */}
                  <span>
                    <a
                      className="text-accent underline underline-offset-2"
                      href={openPosFeeDoc || 'https://'}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t`Read more`}
                    </a>{' '}
                  </span>
                </>
              </TooltipContent>
            )}
          </Tooltip>
        }
      />

      <div className={cn('flex flex-col gap-3')}>
        <Details
          position={position}
          curEntryPrice={prevAvgPx}
          nextEntryPrice={avgPx}
          curPx={curAvgPx}
          curSize={prevSz}
          curCollateral={finalPrevCollateral}
          nextLever={finalLever}
          curLiqPrice={prevLiqPx}
          nextLiqPrice={size ? liqPx : ''}
        />
      </div>
    </div>
  );
};

export default PositionInfo;
