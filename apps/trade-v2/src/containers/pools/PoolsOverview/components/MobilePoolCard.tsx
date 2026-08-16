import { memo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { USD_DECIMALS } from '@hertzflow/sdk-v2/utils/numbers';
import { Trans } from '@lingui/react/macro';
import { IMAGES_MAP } from '@repo/common';
import { calc } from '@repo/lib/calc';
import { percentFormat, unitFormat } from '@repo/lib/format';
import {
  SkeletonLayout,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui';
import { HZLP_TOKEN_DECIMALS, ZERO_STR } from '@/common';
import FavoriteBtn from '@/common/components/FavoriteBtn';
import StatusMarker from '@/components/StatusMarker';
import { usePoolFavoritesStore } from '@/stores/pools/favorites';
import { HZLP_NAME } from '@/stores/pools/trade';
import type { PoolsListItem } from '@/stores/synthetics/marketTokens/selectors';
import MobilePoolCardSkeleton from './MobilePoolCardSkeleton';
import { FeeApyInfoContent } from './PoolsList/columns';
import MiniLineChart from './PoolsList/MiniLineChart';

type MobilePoolCardProps = {
  item: PoolsListItem;
};

const stopCardInteraction = (event: React.SyntheticEvent) => {
  event.stopPropagation();
};

const MobilePoolCard: React.FC<MobilePoolCardProps> = ({
  item,
}: {
  item: PoolsListItem;
}) => {
  const { push } = useRouter();
  const marketAddress = item.marketAddress;
  const iconSrc =
    IMAGES_MAP.instIcons[item.symbol as keyof typeof IMAGES_MAP.instIcons];
  const displayName = item.displayName;
  const isLoading = displayName === undefined;
  const isFavorite = usePoolFavoritesStore((state) =>
    marketAddress ? state.isFavorite(marketAddress) : false,
  );
  const toggleFavorite = usePoolFavoritesStore((state) => state.toggleFavorite);
  const formattedTvl = unitFormat(
    calc(item.tvl?.toString() ?? ZERO_STR)
      .div(calc(10).pow(USD_DECIMALS))
      .toString(),
    2,
    {
      style: 'currency',
      currency: 'USD',
      showMinDecimalValue: true,
      stripTrailingZeros: true,
    },
  );
  const formattedSupply = unitFormat(
    calc(item.supply?.toString() ?? ZERO_STR)
      .div(calc(10).pow(HZLP_TOKEN_DECIMALS))
      .toString(),
    2,
    {
      stripTrailingZeros: true,
    },
  );
  const chartData =
    item.aprHistory?.map((entry) => ({
      timestamp: entry.timestamp,
      value: Number(entry.fee_apr),
    })) ?? [];

  if (isLoading) {
    return <MobilePoolCardSkeleton />;
  }

  const handleCardClick = () => {
    if (marketAddress) {
      push(`/pools/${marketAddress}`);
    }
  };

  const handleCardKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    handleCardClick();
  };

  const card = (
    <div className="border-border-h5 space-y-3 rounded-xl border p-3">
      <div
        className="flex items-center justify-between gap-3"
        id="mobile-pool-card-header"
      >
        <div className="flex items-center gap-2">
          <SkeletonLayout isLoading={isLoading} className="size-8 rounded-full">
            {iconSrc ? (
              <Image
                src={iconSrc}
                alt={displayName ?? ''}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="bg-bg-5 flex size-8 items-center justify-center rounded-full text-xs">
                {displayName?.slice(0, 2)}
              </div>
            )}
          </SkeletonLayout>
          <SkeletonLayout isLoading={isLoading} className="h-[17px] w-24">
            <div className="flex items-center gap-1 text-sm font-medium">
              <span>{HZLP_NAME}: </span>
              <span className="mr-[1px]">{displayName}</span>
              <StatusMarker inst={item.inst} />
            </div>
          </SkeletonLayout>
        </div>
        {!isLoading && marketAddress ? (
          <FavoriteBtn
            className="size-[14px]"
            isFavorite={isFavorite}
            onToggle={() => toggleFavorite(marketAddress)}
          />
        ) : null}
      </div>
      <SkeletonLayout isLoading={!chartData.length} className="h-12 w-9/10">
        <MiniLineChart data={chartData} className="h-12 w-9/10" />
      </SkeletonLayout>
      <div className="space-y-1">
        <div className="text-t-350 flex items-center text-xs">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="decoration-t-430 inline-flex items-center underline decoration-dotted underline-offset-3"
                aria-label="Fee APY info"
                onClick={stopCardInteraction}
                onKeyDown={stopCardInteraction}
              >
                <Trans>Fee APY</Trans>
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="flex max-w-90 flex-col gap-2 rounded-2xl p-3 text-xs"
            >
              <FeeApyInfoContent />
            </TooltipContent>
          </Tooltip>
        </div>
        <SkeletonLayout
          isLoading={item.feeApy === undefined}
          className="h-10 w-24"
        >
          <div className="text-[32px] font-medium">
            {item.feeApy !== undefined
              ? percentFormat(item.feeApy, 2, {
                  showMinDecimalValue: true,
                  stripTrailingZeros: true,
                })
              : '--'}
          </div>
        </SkeletonLayout>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-t-350 text-xs">
            <Trans>TVL</Trans>
          </div>
          <SkeletonLayout
            isLoading={item.tvl === undefined}
            className="h-[14.4px] w-16"
          >
            <div className="font-medium">{formattedTvl}</div>
          </SkeletonLayout>
        </div>
        <div>
          <div className="text-t-350 text-xs">
            <Trans>Supply</Trans>
          </div>
          <SkeletonLayout
            isLoading={item.supply === undefined}
            className="h-[14.4px] w-20"
          >
            <div className="font-medium">
              {formattedSupply} {HZLP_NAME}
            </div>
          </SkeletonLayout>
        </div>
      </div>
    </div>
  );

  if (!marketAddress) {
    return <div className="block">{card}</div>;
  }

  return (
    <div
      role="link"
      tabIndex={0}
      className="block cursor-pointer"
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      {card}
    </div>
  );
};

export default memo(MobilePoolCard);
