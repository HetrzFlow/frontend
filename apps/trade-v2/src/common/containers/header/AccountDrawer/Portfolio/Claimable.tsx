import { FC, useMemo } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { CoinIcon } from '@repo/common/components';
import { useNavItems } from '@repo/common/hooks';
import { calc } from '@repo/lib/calc';
import { truncateFormat, thoFormat } from '@repo/lib/format';
import { CreditIcon } from '@repo/ui';

import { CREDIT_MARKET_CATEGORY, getUsdPriceSymbol } from '@/common/constants';
import { useInstStore } from '@/common/stores';
import { useGlobalStore } from '@/common/stores/globalStore';
import { getClaimMarketInst } from '@/containers/trade/order/Claim/getClaimMarketInst';
import { buildTradeRouteInstIdByCategory } from '@/lib/credit/creditMarkets';
import { useClaimableFundingFees, useClaimStats } from '@/services/rest/claim';
import { useTradeGlobalStore } from '@/stores/trade/global';
import { usePriceTickerStream } from '../../../../services/ws/tickers';
import { useStore } from '../../store';
import ListLayout from '../components/ListLayout';

type ClaimableItem = {
  marketAddress: string;
  claimType: 'funding_fees' | 'collateral';
  amount: string;
  tokenAddress: string;
};

const ClaimableRow: FC<{ item: ClaimableItem }> = ({ item }) => {
  const { t } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const insts = useInstStore((state) => state.getInsts());
  const coins = useInstStore((state) => state.getCoins());
  const inst = getClaimMarketInst(insts, item.marketAddress);
  const coin = coins[item.tokenAddress];
  const isCreditMarket = inst?.category === CREDIT_MARKET_CATEGORY;

  const tokenPx = usePriceTickerStream(getUsdPriceSymbol(coin?.symbol), {
    throttleWait: 5000,
  }).data[0]?.p;

  const usd = useMemo(() => {
    if (!tokenPx || !coin?.decimals) return '';
    return calc(item.amount)
      .div(calc(10).pow(coin.decimals))
      .times(tokenPx)
      .toFixed();
  }, [item.amount, tokenPx, coin?.decimals]);

  return (
    <div className="group/self relative cursor-pointer border-t py-3 text-xs">
      <div className="group-hover/self:bg-bg-4 absolute inset-1 -right-2 -left-2 -z-1 rounded-lg transition-[background] duration-400" />
      <div className="flex items-center gap-2">
        <CoinIcon size={24} src={inst?.icon} alt={inst?.name} />
        <span className="flex min-w-0 items-center gap-1 font-medium">
          <span className="min-w-0 truncate">{inst?.name || ''}</span>
          {isCreditMarket ? (
            <CreditIcon size={14} className="text-accent shrink-0" />
          ) : null}
        </span>
      </div>
      <div className="mt-3 grid w-full grid-cols-[1fr_1fr]">
        <div className="flex flex-col gap-1">
          <span className="text-secondary-foreground text-xs">{t`Value`}</span>
          <span className="font-plex text-sm">
            {usd
              ? truncateFormat(usd, usdAmountDisplayDecimal, {
                  style: 'currency',
                  currency: 'USD',
                  showMinDecimalValue: true,
                })
              : '-'}
          </span>
        </div>
        <div className="flex flex-col gap-1 text-right">
          <span className="text-secondary-foreground text-xs">{t`Type`}</span>
          <span className="text-sm">
            {item.claimType === 'funding_fees'
              ? t`Funding Fee`
              : t`Price Impact`}
          </span>
        </div>
      </div>
    </div>
  );
};

const Claimable: FC = () => {
  const { t } = useLingui();
  const router = useRouter();
  const insts = useInstStore((state) => state.getInsts());
  const setInst = useTradeGlobalStore((state) => state.setInst);

  const { data: claimableFundingFees } = useClaimableFundingFees();
  const { data: claimStats } = useClaimStats();

  const [claimableOpen, setClaimableOpen] = useStore(
    useShallow((state) => [state.claimableOpen, state.setClaimableOpen]),
  );

  const claimableItems = useMemo((): ClaimableItem[] => {
    const items: ClaimableItem[] = [];

    // Funding fees
    claimableFundingFees?.forEach((v) => {
      if (v.longTokenAddress === v.shortTokenAddress) {
        items.push({
          marketAddress: v.marketAddress,
          claimType: 'funding_fees',
          amount: calc(v.claimableFundingAmountLong)
            .plus(v.claimableFundingAmountShort)
            .toFixed(),
          tokenAddress: v.longTokenAddress,
        });
      } else {
        if (v.claimableFundingAmountLong !== '0') {
          items.push({
            marketAddress: v.marketAddress,
            claimType: 'funding_fees',
            amount: v.claimableFundingAmountLong,
            tokenAddress: v.longTokenAddress,
          });
        }
        if (v.claimableFundingAmountShort !== '0') {
          items.push({
            marketAddress: v.marketAddress,
            claimType: 'funding_fees',
            amount: v.claimableFundingAmountShort,
            tokenAddress: v.shortTokenAddress,
          });
        }
      }
    });

    // Price impact rebates
    claimStats?.claimablePriceImpact?.forEach((v) => {
      items.push({
        marketAddress: v.market_address,
        claimType: 'collateral',
        amount: v.amount,
        tokenAddress: v.token_address,
      });
    });

    return items;
  }, [claimableFundingFees, claimStats?.claimablePriceImpact]);

  const count = claimableItems.length;
  const { trade } = useNavItems();

  if (!count) return null;

  return (
    <ListLayout
      open={claimableOpen}
      onOpenChange={setClaimableOpen}
      title={
        <div className="text-t-1100 flex items-center gap-1 font-medium">
          {t`Claimable`}
          <span className="bg-t-1100/10 inline-block min-w-5 rounded-sm p-0.5 align-middle text-xs">
            {thoFormat(count)}
          </span>
        </div>
      }
      listContent={
        <>
          {claimableItems.map((item, i) => {
            const inst = getClaimMarketInst(insts, item.marketAddress);
            const href = inst
              ? `${trade.link}/${buildTradeRouteInstIdByCategory(
                  inst.name,
                  inst.category,
                )}?orderTab=claim&claimTab=pending&claimFocus=1`
              : `${trade.link}?orderTab=claim&claimTab=pending`;

            return (
              <Link
                key={`${item.marketAddress}-${item.claimType}-${item.tokenAddress}-${i}`}
                href={href}
                prefetch={false}
                onMouseEnter={() => router.prefetch(href)}
                onClick={() => inst && setInst(inst)}
              >
                <ClaimableRow item={item} />
              </Link>
            );
          })}
        </>
      }
    />
  );
};

export default Claimable;
