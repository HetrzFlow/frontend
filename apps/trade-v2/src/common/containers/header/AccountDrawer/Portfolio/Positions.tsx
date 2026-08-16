import { FC, useMemo } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { CoinIcon } from '@repo/common/components';
import { useNavItems } from '@repo/common/hooks';
import { calc, ROUND_MODE } from '@repo/lib/calc';
import { thoFormat, truncateFormat } from '@repo/lib/format';
import { cn, CreditIcon, HyperLevIcon, VerifiedIcon } from '@repo/ui';
import {
  CREDIT_MARKET_CATEGORY,
  getCreditAwareUsdPriceSymbol,
} from '@/common/constants';
import { useCalcFinalPosition } from '@/hooks/useCalcPosition';
import { buildTradeRouteInstIdByCategory } from '@/lib/credit/creditMarkets';
import { usePriceTickerExecutionPrice } from '@/lib/trade/executionPrice';
import { useTradeGlobalStore } from '@/stores/trade/global';

import {
  usePositions,
  type Position,
} from '../../../../services/rest/position';
import { useGlobalStore } from '../../../../stores/globalStore';
import { useInstStore } from '../../../../stores/instStore';
import { useStore } from '../../store';
import ListLayout from '../components/ListLayout';

const PositionItem = ({
  instId,
  marketAddress,
  sizeInUsd,
  isLong,
  entryPrice,
  collateralAmount,
  collateralTokenAddress,
  position,
}: {
  instId?: string;
  marketAddress?: string;
  isLong: boolean;
  sizeInUsd: string;
  entryPrice: string;
  collateralAmount: string;
  collateralTokenAddress: string;
  position: Position;
}) => {
  const { t } = useLingui();

  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const leverDecimal = useGlobalStore((state) => state.leverDecimal);
  const insts = useInstStore((state) => state.getInsts());
  const coins = useInstStore((state) => state.getCoins());
  const inst = insts[instId || marketAddress || ''];
  const isCreditMarket =
    position.isCreditMarket || inst?.category === CREDIT_MARKET_CATEGORY;

  const marketPx = usePriceTickerExecutionPrice({
    symbol: inst?.symbol,
    isIncrease: false,
    isLong,
    throttleWait: 5000,
  });
  const collateralCoinPx = usePriceTickerExecutionPrice({
    symbol: getCreditAwareUsdPriceSymbol({
      isCreditMarket,
      tokenSymbol: coins[collateralTokenAddress]?.symbol,
    }),
    isIncrease: false,
    isLong,
    priceType: 'min',
    throttleWait: 5000,
  });

  const { curBorrowFee, curFundingFee, curCloseFee, curTotalPriceImpact } =
    useCalcFinalPosition({
      inst,
      isLong,
      deltaSize: '0',
      deltaCollateralAmount: '0',
      collateralTokenAddress,
      px: entryPrice,
      position,
    });

  const collateralInUsd = calc(collateralAmount).times(collateralCoinPx || '');
  // net PnL = ((Size / entry price)*mark price  - Size) * (isLong ? 1 : -1) - Borrow Fee - Close Fee
  // net value = Collateral + PnL
  const [uPnl, netPnl] = useMemo(() => {
    if (!marketPx) {
      return ['', ''];
    }

    const _uPnl = calc(sizeInUsd)
      .div(entryPrice)
      .times(marketPx)
      .minus(sizeInUsd)
      .times(isLong ? 1 : -1);
    const _netPnl = calc(_uPnl)
      .minus(curBorrowFee)
      .minus(curFundingFee)
      .minus(curCloseFee)
      .plus(curTotalPriceImpact);
    return [_uPnl, _netPnl];
  }, [
    sizeInUsd,
    entryPrice,
    curBorrowFee,
    curFundingFee,
    curCloseFee,
    curTotalPriceImpact,
    marketPx,
    isLong,
  ]);

  const { isZFP } = position;

  return (
    <div className="group/self relative cursor-pointer border-t py-3 text-xs">
      <div className="group-hover/self:bg-bg-4 absolute inset-1 -right-2 -left-2 -z-1 rounded-lg transition-[background] duration-400" />
      <div className="flex items-center gap-2">
        <CoinIcon size={24} src={inst?.icon} alt={inst?.name} />
        <span className="font-medium">{inst?.name || ''}</span>
        <span
          className={cn(
            'ml-1 flex items-center gap-0.5 rounded-sm px-2 py-0.5 text-xs',
            isZFP
              ? 'bg-hyper-lev/10 text-hyper-lev'
              : isLong
                ? 'text-up bg-up/10'
                : 'text-down bg-down/10',
          )}
        >
          {isZFP ? <HyperLevIcon size={14} /> : null}
          <span className="">{`${truncateFormat(
            calc(sizeInUsd).div(collateralInUsd),
            leverDecimal,
            {
              stripTrailingZeros: true,
              round: ROUND_MODE.ROUND,
            },
          )}x`}</span>
          {isLong ? t`Long` : t`Short`}
        </span>
        {isCreditMarket ? (
          <CreditIcon size={14} className="text-accent shrink-0" />
        ) : null}
      </div>
      <div className="mt-3 grid w-full grid-cols-[4fr_3fr_3fr]">
        <div className="flex flex-col gap-1">
          <span className="text-secondary-foreground text-xs">{t`Size`}</span>
          <span className="font-plex text-sm">
            {truncateFormat(sizeInUsd, usdAmountDisplayDecimal, {
              style: 'currency',
              currency: 'USD',
            })}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-secondary-foreground text-xs">{t`Net Value`}</span>
          <span className={'font-plex flex items-center gap-1 text-sm'}>
            {!isCreditMarket &&
              !position.isZFP &&
              position.pendingLossRebateUsd &&
              calc(position.pendingLossRebateUsd).gt(0) && (
                <VerifiedIcon size={14} className="text-loss-rebate" />
              )}
            {truncateFormat(
              calc(netPnl).plus(collateralInUsd),
              usdAmountDisplayDecimal,
              {
                style: 'currency',
                currency: 'USD',
              },
            )}
          </span>
        </div>
        <div className="flex flex-col gap-1 text-right">
          <span className="text-secondary-foreground text-xs">{t`uPnL`}</span>
          <span
            className={cn(
              'text-sm',
              calc(uPnl).gt(0) ? 'text-up' : '',
              calc(uPnl).lt(0) ? 'text-down' : '',
            )}
          >
            {truncateFormat(uPnl, usdAmountDisplayDecimal, {
              style: 'currency',
              currency: 'USD',
              signDisplay: 'always',
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

const Positions: FC = () => {
  const { t } = useLingui();
  const router = useRouter();
  const insts = useInstStore((state) => state.getInsts());
  const setInst = useTradeGlobalStore((state) => state.setInst);

  const { data: positions } = usePositions();
  const count = positions?.length;
  const [positionOpen, setPositionOpen] = useStore(
    useShallow((state) => [state.positionOpen, state.setPositionOpen]),
  );
  const { trade } = useNavItems();

  if (!count) return null;

  return (
    <ListLayout
      open={positionOpen}
      onOpenChange={setPositionOpen}
      title={
        <div className="text-t-1100 flex items-center gap-1 font-medium">
          {t`Positions`}
          <span className="bg-t-1100/10 inline-block min-w-5 rounded-sm p-0.5 align-middle text-xs">
            {thoFormat(count)}
          </span>
        </div>
      }
      listContent={
        <>
          {positions.map((position) => {
            const {
              id,
              marketAddress,
              collateralTokenAddress,
              sizeInUsd,
              isLong,
              collateralAmount,
              entryPrice,
            } = position;
            const inst = insts[marketAddress];
            const href = inst
              ? `${trade.link}/${buildTradeRouteInstIdByCategory(
                  inst.name,
                  inst.category,
                )}?orderTab=positions&positionFocus=${encodeURIComponent(id)}`
              : `${trade.link}?orderTab=positions&positionFocus=${encodeURIComponent(id)}`;
            //  jump to trade
            return (
              <Link
                key={id}
                href={href}
                prefetch={false}
                onMouseEnter={() => router.prefetch(href)}
                onClick={() => inst && setInst(inst)}
              >
                <PositionItem
                  key={id}
                  marketAddress={marketAddress}
                  isLong={isLong}
                  sizeInUsd={sizeInUsd}
                  entryPrice={entryPrice}
                  collateralAmount={collateralAmount}
                  collateralTokenAddress={collateralTokenAddress}
                  position={position}
                />
              </Link>
            );
          })}
        </>
      }
    />
  );
};

export default Positions;
