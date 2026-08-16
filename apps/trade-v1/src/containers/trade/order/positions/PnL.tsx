import { FC, memo, useMemo } from 'react';
import { FEE_BPS_POWER, FeeKey } from '@hertzflow/sdk';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';

import { calc } from '@repo/lib/calc';
import { percentFormat, truncateFormat } from '@repo/lib/format';
import {
  cn,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui';
import {
  useHzSdk,
  useBorrowFee,
  useProtocolStoreData,
  usePriceTickerStream,
  useInstStore,
  useGlobalStore,
} from '@/common';

import ListItem from '@/components/ListItem';

interface PnLProps {
  targetCoin: string;
  size: string;
  collateral: string;
  entryPrice: string;
  isLong: boolean;
  entryFundingRate: string;
}

const PnL: FC<PnLProps> = ({
  targetCoin,
  size,
  entryPrice,
  collateral,
  isLong,
  entryFundingRate,
}) => {
  const { t } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const [inst, usdcCoin] = useInstStore(
    useShallow((state) => [
      state.getInstsArr().find((v) => v.coinType === targetCoin),
      state.getUsdcCoin(state),
    ]),
  );
  const { data: protocolStore } = useProtocolStoreData();
  const hzSdk = useHzSdk();
  const collateralCoinType = isLong ? inst?.baseCoin : usdcCoin?.coinType;
  const { data: priceData } = usePriceTickerStream(inst?.id);
  const marketPx = priceData[0]?.p;
  const { data: borrowFee } = useBorrowFee({
    collateralCoinType,
    isLong,
    size,
    entryFundingRate,
  });
  // net PnL = ((Size / entry price)*mark price  - Size) * (isLong ? 1 : -1) - Borrow Fee - Close Fee
  // net value = Collateral + PnL
  const [pnl, pnlPercent, netPnl, closeFee] = useMemo(() => {
    const _closeFee = protocolStore
      ? calc(size)
          .times(
            hzSdk.QueryModule.getFeeRate({
              feeKey: FeeKey.DecreasePositionFee,
              protocolStore,
            }),
          )
          .div(FEE_BPS_POWER)
      : 0;

    if (!inst?.baseCoin || !marketPx) {
      return ['', '', '0', _closeFee];
    }
    const _pnl = calc(size)
      .div(entryPrice)
      .times(marketPx)
      .minus(size)
      .times(isLong ? 1 : -1);
    const _netPnl = _pnl.minus(borrowFee).minus(_closeFee);
    return [_pnl, _pnl.div(collateral), _netPnl, _closeFee];
  }, [
    size,
    entryPrice,
    collateral,
    marketPx,
    inst,
    protocolStore,
    hzSdk,
    isLong,
    borrowFee,
  ]);

  const isPositive = calc(pnl).gt(0);
  const isNegtive = calc(pnl).lt(0);

  return (
    <div className="font-plex flex flex-col justify-between gap-0.5 leading-tight">
      <div className="flex gap-1">
        <Tooltip>
          <TooltipTrigger
            className={cn(
              'decoration-t-430 cursor-pointer underline decoration-dotted underline-offset-2 max-md:text-2xl max-md:font-medium',
            )}
          >
            {truncateFormat(
              calc(netPnl).plus(collateral),
              usdAmountDisplayDecimal,
              {
                style: 'currency',
                currency: 'USD',
              },
            )}
          </TooltipTrigger>
          <TooltipContent side="top" className="w-[224px]">
            <p>{t`Net Value = Collateral + Gross PnL - Borrow fee - Close fee`}</p>
            <Separator className="my-2" />
            <div className="flex flex-col gap-1">
              <ListItem
                label={t`Collateral`}
                value={truncateFormat(collateral, usdAmountDisplayDecimal, {
                  style: 'currency',
                  currency: 'USD',
                })}
              />
              <ListItem
                label={t`Gross PnL`}
                valueClassName={calc(pnl).lt(0) ? 'text-down' : 'text-up'}
                value={truncateFormat(pnl, usdAmountDisplayDecimal, {
                  style: 'currency',
                  currency: 'USD',
                  signDisplay: 'always',
                })}
              />
              <ListItem
                label={t`Borrow Fee Due`}
                labelClassName="ml-2.5 text-t-350"
                value={truncateFormat(
                  calc(borrowFee).times(-1),
                  usdAmountDisplayDecimal,
                  {
                    style: 'currency',
                    currency: 'USD',
                    signDisplay: 'always',
                    showNegativeZero: true,
                  },
                )}
              />
              <ListItem
                label={t`Close Fee`}
                labelClassName="ml-2.5 text-t-350"
                value={truncateFormat(
                  calc(closeFee).times(-1),
                  usdAmountDisplayDecimal,
                  {
                    style: 'currency',
                    currency: 'USD',
                    signDisplay: 'always',
                  },
                )}
              />
              <ListItem
                label={t`PnL After Fee`}
                valueClassName={calc(netPnl).lt(0) ? 'text-down' : 'text-up'}
                value={truncateFormat(netPnl, usdAmountDisplayDecimal, {
                  style: 'currency',
                  currency: 'USD',
                  signDisplay: 'always',
                })}
              />
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
      <div
        className={cn(
          'text-sm max-md:text-xs',
          isNegtive ? 'text-down' : '',
          isPositive ? 'text-up' : '',
        )}
      >
        {`${truncateFormat(pnl, usdAmountDisplayDecimal, {
          signDisplay: 'always',
          style: 'currency',
          currency: 'USD',
        })} (${percentFormat(pnlPercent, 2, { signDisplay: 'always' })})`}
      </div>
    </div>
  );
};

export default memo(PnL);
