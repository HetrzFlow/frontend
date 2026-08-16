import { useLingui } from '@lingui/react/macro';

import { calc } from '@repo/lib/calc';
import { percentFormat } from '@repo/lib/format';
import {
  cn,
  Separator,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui';
import {
  CONTRACT_PRECISION_MULTIPLIER,
  useInstStore,
  useMarketValues,
} from '@/common';
import { useTradeGlobalStore } from '@/stores/trade/global';

const calcNetRate = ({
  fundingFactorPerSecond,
  longsPayShorts,
  longInterestUsd,
  shortInterestUsd,
  borrowingFactorPerSecondForLongs,
  borrowingFactorPerSecondForShorts,
}: {
  fundingFactorPerSecond: bigint;
  longsPayShorts: boolean;
  longInterestUsd: bigint;
  shortInterestUsd: bigint;
  borrowingFactorPerSecondForLongs: bigint;
  borrowingFactorPerSecondForShorts: bigint;
}) => {
  const payFundingFeeRate = calc(fundingFactorPerSecond.toString()).times(
    60 * 60,
  );
  const receiveFundingFeeRate = payFundingFeeRate.times(
    longsPayShorts
      ? shortInterestUsd
        ? calc(longInterestUsd.toString()).div(shortInterestUsd.toString())
        : 0
      : longInterestUsd
        ? calc(shortInterestUsd.toString()).div(longInterestUsd.toString())
        : 0,
  );
  const fundingFeeRateLong = (
    longsPayShorts ? payFundingFeeRate : receiveFundingFeeRate
  )
    .times(longsPayShorts ? -1 : 1)
    .div(CONTRACT_PRECISION_MULTIPLIER);
  const fundingFeeRateShort = (
    longsPayShorts ? receiveFundingFeeRate : payFundingFeeRate
  )
    .times(longsPayShorts ? 1 : -1)
    .div(CONTRACT_PRECISION_MULTIPLIER);
  const borrowRateLong = calc(borrowingFactorPerSecondForLongs.toString())
    .times(60 * 60)
    .times(-1)
    .div(CONTRACT_PRECISION_MULTIPLIER);

  const borrowRateShort = calc(borrowingFactorPerSecondForShorts.toString())
    .times(60 * 60)
    .times(-1)
    .div(CONTRACT_PRECISION_MULTIPLIER);

  const netRateLong = calc(fundingFeeRateLong).plus(borrowRateLong);
  const netRateShort = calc(fundingFeeRateShort).plus(borrowRateShort);
  return {
    fundingFeeRateLong,
    fundingFeeRateShort,
    borrowRateLong,
    borrowRateShort,
    netRateLong,
    netRateShort,
  };
};

const NetRate = () => {
  const instId = useTradeGlobalStore((state) => state.instId);
  const insts = useInstStore((state) => state.getInsts());
  const inst = insts[instId];

  const { data: marketValues } = useMarketValues(inst);

  const { t } = useLingui();
  const {
    fundingFactorPerSecond = 0n,
    longsPayShorts = true,
    longInterestUsd = 0n,
    shortInterestUsd = 0n,
    borrowingFactorPerSecondForLongs = 0n,
    borrowingFactorPerSecondForShorts = 0n,
  } = marketValues || {};

  const {
    fundingFeeRateLong,
    fundingFeeRateShort,
    borrowRateLong,
    borrowRateShort,
    netRateLong,
    netRateShort,
  } = calcNetRate({
    fundingFactorPerSecond,
    longsPayShorts,
    longInterestUsd,
    shortInterestUsd,
    borrowingFactorPerSecondForLongs,
    borrowingFactorPerSecondForShorts,
  });

  const dispFundingFeeRateLong = percentFormat(fundingFeeRateLong, 4, {
    signDisplay: 'exceptZero',
    stripTrailingZeros: true,
  });
  const dispBorrowFeeRateLong = percentFormat(borrowRateLong, 4, {
    signDisplay: borrowRateLong.eq(0) ? 'exceptZero' : 'always',
    stripTrailingZeros: true,
  });
  const dispFundingFeeRateShort = percentFormat(fundingFeeRateShort, 4, {
    signDisplay: 'exceptZero',
    stripTrailingZeros: true,
  });
  const dispBorrowFeeRateShort = percentFormat(borrowRateShort, 4, {
    signDisplay: borrowRateShort.eq(0) ? 'exceptZero' : 'always',
    stripTrailingZeros: true,
  });

  const longTextColor = cn(
    netRateLong.gt(0) ? 'text-up' : '',
    netRateLong.lt(0) ? 'text-down' : '',
  );
  const shortTextColor = cn(
    netRateShort.gt(0) ? 'text-up' : '',
    netRateShort.lt(0) ? 'text-down' : '',
  );

  return (
    <Tooltip>
      <TooltipTrigger className="hover:bg-bg-3 flex h-full shrink-0 flex-col items-start justify-between rounded-lg px-2 py-1 max-md:gap-1 max-md:p-0">
        <p className="text-t-270 text-[10px] max-md:text-xs">{t`1H Net Rate(L/S)`}</p>
        {marketValues ? (
          <div className={'font-plex text-left font-medium max-md:text-base'}>
            <span className={longTextColor}>
              {percentFormat(netRateLong, 4, {
                stripTrailingZeros: true,
                signDisplay: 'exceptZero',
              })}
            </span>
            {' / '}
            <span className={shortTextColor}>
              {percentFormat(netRateShort, 4, {
                stripTrailingZeros: true,
                signDisplay: 'exceptZero',
              })}
            </span>
          </div>
        ) : (
          <Skeleton className="h-3.5 w-20" />
        )}
      </TooltipTrigger>
      <TooltipContent className="text-t-270 w-80 rounded-2xl p-3">
        <div className="text-t-1100">{t`1h Net Rate = 1h Funding Rate + 1h Borrow Rate.`}</div>
        <div className="mt-1">{t`Accrues hourly, dynamically adjusts with market imbalance and liquidity usage, and settles on position close.`}</div>
        <Separator className="my-2" />
        <div className="text-t-1100">{t`Long`}</div>
        <div className="bg-bg-5 mt-1 flex gap-2 rounded-lg p-2">
          <div className="w-1/2">
            <div>{t`Hourly Rate`}</div>
            <div className="mt-1 flex justify-between">
              <span className="text-t-1100">{t`Funding`}</span>
              <span
                className={cn(
                  calc(fundingFeeRateLong).gt(0) ? 'text-up' : '',
                  calc(fundingFeeRateLong).lt(0) ? 'text-down' : '',
                )}
              >
                {dispFundingFeeRateLong}
              </span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-t-1100">{t`Borrow`}</span>
              <span
                className={cn(
                  calc(borrowRateLong).gt(0) ? 'text-up' : '',
                  calc(borrowRateLong).lt(0) ? 'text-down' : '',
                )}
              >
                {dispBorrowFeeRateLong}
              </span>
            </div>
          </div>
          <div className="w-1/2">
            <div>{t`Net Rate`}</div>
            <div className="mt-1 flex justify-between">
              <span className="text-t-1100">{t`8H`}</span>
              <span className={longTextColor}>
                {percentFormat(netRateLong.times(8), 4, {
                  signDisplay: 'exceptZero',
                  stripTrailingZeros: true,
                })}
              </span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-t-1100">{t`24H`}</span>
              <span className={longTextColor}>
                {percentFormat(netRateLong.times(24), 4, {
                  signDisplay: 'exceptZero',
                  stripTrailingZeros: true,
                })}
              </span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-t-1100">{t`365D`}</span>
              <span className={longTextColor}>
                {percentFormat(netRateLong.times(24 * 365), 2, {
                  signDisplay: 'exceptZero',
                  stripTrailingZeros: true,
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="text-t-1100 mt-2">{t`Short`}</div>
        <div className="bg-bg-5 mt-1 flex gap-2 rounded-lg p-2">
          <div className="w-1/2">
            <div>{t`Hourly Rate`}</div>
            <div className="mt-1 flex justify-between">
              <span className="text-t-1100">{t`Funding`}</span>
              <span
                className={cn(
                  calc(fundingFeeRateShort).gt(0) ? 'text-up' : '',
                  calc(fundingFeeRateShort).lt(0) ? 'text-down' : '',
                )}
              >
                {dispFundingFeeRateShort}
              </span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-t-1100">{t`Borrow`}</span>
              <span
                className={cn(
                  calc(borrowRateShort).gt(0) ? 'text-up' : '',
                  calc(borrowRateShort).lt(0) ? 'text-down' : '',
                )}
              >
                {dispBorrowFeeRateShort}
              </span>
            </div>
          </div>
          <div className="w-1/2">
            <div>{t`Net Rate`}</div>
            <div className="mt-1 flex justify-between">
              <span className="text-t-1100">{t`8H`}</span>
              <span className={shortTextColor}>
                {percentFormat(netRateShort.times(8), 4, {
                  signDisplay: 'exceptZero',
                  stripTrailingZeros: true,
                })}
              </span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-t-1100">{t`24H`}</span>
              <span className={shortTextColor}>
                {percentFormat(netRateShort.times(24), 4, {
                  signDisplay: 'exceptZero',
                  stripTrailingZeros: true,
                })}
              </span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-t-1100">{t`365D`}</span>
              <span className={shortTextColor}>
                {percentFormat(netRateShort.times(24 * 365), 2, {
                  signDisplay: 'exceptZero',
                  stripTrailingZeros: true,
                })}
              </span>
            </div>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default NetRate;
