import { FC, useMemo } from 'react';

import { FEE_BPS_POWER, FeeKey } from '@hertzflow/sdk';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { calc, ROUND_MODE } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import { cn } from '@repo/ui';
import { useHzSdk } from '../../../../chainClient/hooks';
import CoinIcon from '../../../../components/CoinIcon';
import {
  useBorrowFee,
  useProtocolStoreData,
} from '../../../../services/rest/liqPool';
import { usePositions } from '../../../../services/rest/position';
import { usePriceTickerStream } from '../../../../services/ws/tickers';
import { useGlobalStore } from '../../../../stores/globalStore';
import { useInstStore } from '../../../../stores/instStore';
import { useContextData } from '../../context';
import { useStore } from '../../store';
import ListLayout from '../components/ListLayout';

const PositionItem = ({
  targetCoin,
  leverage,
  size,
  isLong,
  entryPrice,
  collateral,
  entryFundingRate,
}: {
  targetCoin: string;
  leverage: string;
  isLong: boolean;
  size: string;
  entryPrice: string;
  collateral: string;
  entryFundingRate: string;
}) => {
  const { t } = useLingui();

  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const leverDecimal = useGlobalStore((state) => state.leverDecimal);
  const inst = useInstStore((state) => state.getInstsArr()).find(
    (v) => v.coinType === targetCoin,
  );
  const usdcCoin = useInstStore((state) => state.getUsdcCoin(state));
  const coinObj = useInstStore((state) => state.getCoins())[targetCoin];

  const { data: protocolStore } = useProtocolStoreData();
  const hzSdk = useHzSdk();
  const coinPx = usePriceTickerStream(inst?.id, { throttleWait: 5000 }).data[0]
    ?.p;
  const { data: borrowFee } = useBorrowFee({
    collateralCoinType: isLong ? inst?.baseCoin : usdcCoin?.coinType,
    isLong,
    size: size,
    entryFundingRate: entryFundingRate,
  });
  const netPnl = useMemo(() => {
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
    if (!inst?.baseCoin || !coinPx) {
      return '0';
    } else {
      const pnl = calc(size)
        .div(entryPrice)
        .times(coinPx)
        .minus(size)
        .times(isLong ? 1 : -1);
      const netPnl = pnl.minus(borrowFee).minus(_closeFee);
      return netPnl;
    }
  }, [coinPx, inst, entryPrice, isLong, size, hzSdk, protocolStore, borrowFee]);

  return (
    <div className="border-border hover:bg-bg-3 cursor-pointer rounded-xl border p-4 text-base transition-[background] duration-400">
      <div className="flex items-center gap-2">
        <CoinIcon size={24} src={inst?.icon} alt={inst?.name} />
        <span className="font-medium">{inst?.name || ''}</span>
        <span
          className={cn(
            'ml-1 rounded-sm px-2 py-1 text-xs',
            isLong ? 'text-up bg-up/10' : 'text-down bg-down/10',
          )}
        >
          <span className="font-plex">{`${truncateFormat(
            leverage,
            leverDecimal,
            {
              stripTrailingZeros: true,
              round: ROUND_MODE.ROUND,
            },
          )}x`}</span>{' '}
          {isLong ? t`Long` : t`Short`}
        </span>
      </div>
      <div className="mt-3 grid w-full grid-cols-[4fr_3fr_3fr]">
        <div className="flex flex-col gap-1">
          <span className="text-secondary-foreground text-xs">{t`Size`}</span>
          <span className="font-plex text-sm">
            {truncateFormat(size, usdAmountDisplayDecimal, {
              style: 'currency',
              currency: 'USD',
            })}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-secondary-foreground text-xs">{t`Net Value`}</span>
          <span className={cn('font-plex text-sm')}>
            {truncateFormat(
              calc(netPnl).plus(collateral),
              usdAmountDisplayDecimal,
              {
                style: 'currency',
                currency: 'USD',
              },
            )}
          </span>
        </div>
        <div className="flex flex-col gap-1 text-right">
          <span className="text-secondary-foreground text-xs">{t`Price`}</span>
          <span className="font-plex text-sm">
            {truncateFormat(entryPrice, coinObj?.pxDispDecimal, {
              style: 'currency',
              currency: 'USD',
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

const Positions: FC = () => {
  const { i18n } = useLingui();
  const { locale } = i18n;
  const { inTradePage } = useContextData();

  const { data: positions } = usePositions();
  const count = positions?.length;
  const [positionOpen, setPositionOpen] = useStore(
    useShallow((state) => [state.positionOpen, state.setPositionOpen]),
  );

  if (!count) return null;

  return (
    <ListLayout
      open={positionOpen}
      onOpenChange={setPositionOpen}
      title={
        <div className="text-t-350 flex w-full justify-between">
          <span>
            {i18n._({
              id: 'header.positions',
              message:
                '{count, plural, one {Perp Position (#)} other {Perp Positions (#)}}',
              values: { count },
            })}
          </span>
        </div>
      }
      listContent={
        <>
          {positions.map(
            ({
              id,
              targetCoin,
              leverage,
              size,
              isLong,
              collateral,
              entryPrice,
              entryFundingRate,
            }) => {
              //  jump to trade
              return inTradePage ? (
                <PositionItem
                  key={id}
                  leverage={leverage}
                  targetCoin={targetCoin}
                  isLong={isLong}
                  size={size}
                  entryPrice={entryPrice}
                  collateral={collateral}
                  entryFundingRate={entryFundingRate}
                />
              ) : (
                <a
                  key={id}
                  href={`${process.env.NEXT_PUBLIC_TRADE_URL || ''}/${locale}/trade?tab=positions`}
                >
                  <PositionItem
                    key={id}
                    leverage={leverage}
                    targetCoin={targetCoin}
                    isLong={isLong}
                    size={size}
                    entryPrice={entryPrice}
                    collateral={collateral}
                    entryFundingRate={entryFundingRate}
                  />
                </a>
              );
            },
          )}
        </>
      }
    />
  );
};

export default Positions;
