'use client';

import { ReactNode, useId } from 'react';
import { formatAmount, USD_DECIMALS } from '@hertzflow/sdk-v2/utils/numbers';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { calc, ROUND_MODE } from '@repo/lib/calc';
import { percentFormat, unitFormat } from '@repo/lib/format';
import { Skeleton } from '@repo/ui';
import { useGlobalStore } from '@/common';
import type { UserPerformanceResourceType } from '@/stores/synthetics/userPerformance/store';

function NoPerformanceIcon() {
  const iconId = useId().replace(/:/g, '');
  const gradientId = (name: string) => `${iconId}-${name}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="78"
      height="91"
      viewBox="0 0 78 91"
      fill="none"
      className="h-[91px] w-[78px] shrink-0"
    >
      <rect
        opacity="0.5"
        x="0.280996"
        y="0.25174"
        width="33.8364"
        height="33.8364"
        transform="matrix(0.978664 0.205465 0.311394 0.950281 5.39635 50.6013)"
        fill={`url(#${gradientId('paint0')})`}
        stroke={`url(#${gradientId('paint1')})`}
        strokeWidth="0.435632"
      />
      <rect
        opacity="0.5"
        x="0.213169"
        y="0.0447537"
        width="33.8364"
        height="33.8364"
        transform="matrix(0.66727 -0.744816 0.311394 0.950281 39.0648 57.8504)"
        fill={`url(#${gradientId('paint2')})`}
        stroke={`url(#${gradientId('paint3')})`}
        strokeWidth="0.435632"
      />
      <rect
        opacity="0.5"
        x="0.0678266"
        y="0.206987"
        width="33.8364"
        height="33.8364"
        transform="matrix(0.978664 0.205465 -0.66727 0.744816 28.4755 25.16)"
        fill={`url(#${gradientId('paint4')})`}
        stroke={`url(#${gradientId('paint5')})`}
        strokeWidth="0.435632"
      />
      <path
        opacity="0.5"
        d="M24.4942 33.2357C26.4559 34.8522 28.0533 36.8927 28.8315 38.9673C29.6102 41.0431 29.4098 42.7186 28.5355 43.7799C27.661 44.8411 26.0547 45.3579 23.8683 44.9905C21.6832 44.6232 19.3743 43.4461 17.4126 41.8297C15.4509 40.2132 13.8542 38.172 13.0759 36.0974C12.2972 34.0215 12.4974 32.346 13.3719 31.2848C14.2465 30.2237 15.8527 29.7066 18.0391 30.0742C20.2242 30.4415 22.5325 31.6193 24.4942 33.2357Z"
        fill={`url(#${gradientId('paint6')})`}
        stroke={`url(#${gradientId('paint7')})`}
        strokeWidth="0.435632"
      />
      <path
        d="M25.7754 31.6752C27.7371 33.2917 29.3345 35.3322 30.1128 37.4067C30.8915 39.4825 30.6911 41.1581 29.8167 42.2193C28.9423 43.2805 27.3359 43.7974 25.1495 43.43C22.9644 43.0627 20.6555 41.8856 18.6939 40.2691C16.7321 38.6527 15.1354 36.6114 14.3571 34.5368C13.5784 32.4609 13.7787 30.7855 14.6532 29.7242C15.5277 28.6631 17.134 28.1461 19.3204 28.5136C21.5055 28.8809 23.8138 30.0587 25.7754 31.6752Z"
        fill={`url(#${gradientId('paint8')})`}
        stroke={`url(#${gradientId('paint9')})`}
        strokeWidth="0.435632"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.2535 29.9117C13.5204 31.0517 13.4293 32.6874 14.1532 34.6173C15.7429 38.8548 20.6496 42.898 25.1129 43.6483C27.0974 43.9818 28.6587 43.607 29.6426 42.7166L28.9701 43.5328C28.1101 44.9425 26.2947 45.6245 23.824 45.2094C19.3609 44.4591 14.4541 40.4157 12.8643 36.1784C11.9957 33.8628 12.2992 31.9704 13.4797 30.8507L14.2535 29.9117Z"
        fill={`url(#${gradientId('paint10')})`}
      />
      <path
        opacity="0.5"
        d="M48.9535 9.37836C50.1829 7.15354 51.8958 5.20905 53.7925 4.06357C55.6903 2.91742 57.3742 2.80718 58.5778 3.47208C59.7813 4.13711 60.584 5.62147 60.6237 7.83818C60.6634 10.0536 59.9296 12.5391 58.7003 14.764C57.4709 16.9888 55.7571 18.9328 53.8604 20.0783C51.9625 21.2245 50.2787 21.3348 49.0752 20.6698C47.8717 20.0046 47.0689 18.5204 47.0292 16.3037C46.9896 14.0883 47.7242 11.6032 48.9535 9.37836Z"
        fill={`url(#${gradientId('paint11')})`}
        stroke={`url(#${gradientId('paint12')})`}
        strokeWidth="0.435632"
      />
      <path
        d="M47.1879 8.4018C48.4172 6.17697 50.1302 4.23249 52.0269 3.08701C53.9247 1.94086 55.6086 1.83062 56.8122 2.49552C58.0157 3.16055 58.8184 4.64491 58.8581 6.86161C58.8977 9.07701 58.164 11.5626 56.9347 13.7874C55.7053 16.0123 53.9915 17.9562 52.0948 19.1017C50.1969 20.2479 48.5131 20.3583 47.3095 19.6932C46.106 19.0281 45.3032 17.5439 45.2636 15.3271C45.224 13.1117 45.9585 10.6266 47.1879 8.4018Z"
        fill={`url(#${gradientId('paint13')})`}
        stroke={`url(#${gradientId('paint14')})`}
        strokeWidth="0.435632"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M47.5936 20.0559C48.8456 20.5557 50.4614 20.3414 52.215 19.2824C56.0891 16.9427 59.164 11.3776 59.0832 6.8525C59.047 4.82809 58.3839 3.35671 57.3167 2.55605L58.2724 3.08408C59.8072 3.67619 60.804 5.33227 60.8486 7.82912C60.9294 12.3542 57.8545 17.9193 53.9805 20.259C51.8584 21.5405 49.9384 21.5861 48.621 20.6236L47.5936 20.0559Z"
        fill={`url(#${gradientId('paint15')})`}
      />
      <defs>
        <linearGradient
          id={gradientId('paint0')}
          x1="93.9079"
          y1="-35.8475"
          x2="23.7388"
          y2="-41.9278"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00DFEB" stopOpacity="0.4" />
          <stop offset="1" stopColor="#00DFEB" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient
          id={gradientId('paint1')}
          x1="42.7199"
          y1="-7.27154"
          x2="5.64718"
          y2="15.8551"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0.1" />
          <stop offset="1" stopColor="white" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient
          id={gradientId('paint2')}
          x1="17.136"
          y1="0"
          x2="17.136"
          y2="34.272"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00DFEB" stopOpacity="0.4" />
          <stop offset="1" stopColor="#00DFEB" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient
          id={gradientId('paint3')}
          x1="17.136"
          y1="0"
          x2="17.136"
          y2="34.272"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0.1" />
          <stop offset="1" stopColor="white" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient
          id={gradientId('paint4')}
          x1="17.136"
          y1="0"
          x2="17.136"
          y2="34.272"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00DFEB" stopOpacity="0.4" />
          <stop offset="1" stopColor="#00DFEB" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient
          id={gradientId('paint5')}
          x1="17.136"
          y1="0"
          x2="17.136"
          y2="34.272"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0.1" />
          <stop offset="1" stopColor="white" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient
          id={gradientId('paint6')}
          x1="24.6326"
          y1="33.0676"
          x2="17.2743"
          y2="41.9974"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00DFEB" stopOpacity="0.4" />
          <stop offset="1" stopColor="#00DFEB" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient
          id={gradientId('paint7')}
          x1="24.6326"
          y1="33.0676"
          x2="17.2743"
          y2="41.9974"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0.1" />
          <stop offset="1" stopColor="white" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient
          id={gradientId('paint8')}
          x1="25.9138"
          y1="31.5071"
          x2="18.5555"
          y2="40.4368"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00DFEB" />
          <stop offset="1" stopColor="#00DFEB" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient
          id={gradientId('paint9')}
          x1="25.9138"
          y1="31.5071"
          x2="18.5555"
          y2="40.4368"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0.1" />
          <stop offset="1" stopColor="white" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient
          id={gradientId('paint10')}
          x1="20.5159"
          y1="38.1215"
          x2="16.6842"
          y2="45.9963"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00DFEB" stopOpacity="0" />
          <stop offset="1" stopColor="#00DFEB" />
        </linearGradient>
        <linearGradient
          id={gradientId('paint11')}
          x1="48.7628"
          y1="9.27313"
          x2="58.8905"
          y2="14.8692"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00DFEB" stopOpacity="0.4" />
          <stop offset="1" stopColor="#00DFEB" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient
          id={gradientId('paint12')}
          x1="48.7628"
          y1="9.27313"
          x2="58.8905"
          y2="14.8692"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0.1" />
          <stop offset="1" stopColor="white" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient
          id={gradientId('paint13')}
          x1="46.9972"
          y1="8.29657"
          x2="57.1249"
          y2="13.8926"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00DFEB" />
          <stop offset="1" stopColor="#00DFEB" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient
          id={gradientId('paint14')}
          x1="46.9972"
          y1="8.29657"
          x2="57.1249"
          y2="13.8926"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0.1" />
          <stop offset="1" stopColor="white" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient
          id={gradientId('paint15')}
          x1="54.5062"
          y1="12.3911"
          x2="62.9143"
          y2="14.7126"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00DFEB" stopOpacity="0" />
          <stop offset="1" stopColor="#00DFEB" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function getPnlDisplayData({
  value,
  totalBought,
  usdAmountDisplayDecimal,
}: {
  value: bigint | undefined;
  totalBought: bigint | undefined;
  usdAmountDisplayDecimal: number;
}) {
  const valueHuman =
    value !== undefined
      ? calc(value.toString(10)).div(calc(10).pow(USD_DECIMALS))
      : undefined;
  const totalBoughtHuman =
    totalBought !== undefined && totalBought > 0n
      ? calc(totalBought.toString(10)).div(calc(10).pow(USD_DECIMALS))
      : undefined;

  const showNa = value === undefined || value === 0n;
  const returnRate =
    valueHuman !== undefined &&
    totalBoughtHuman !== undefined &&
    totalBoughtHuman.gt(0)
      ? valueHuman.div(totalBoughtHuman)
      : undefined;
  const displayValue =
    valueHuman !== undefined
      ? unitFormat(valueHuman.toString(), usdAmountDisplayDecimal, {
          style: 'currency',
          currency: 'USD',
          round: ROUND_MODE.ROUND,
          showMinDecimalValue: true,
          signDisplay: 'always',
          stripTrailingZeros: true,
        })
      : '';
  const displayReturnRate =
    returnRate !== undefined
      ? percentFormat(returnRate.toString(), 2, {
          signDisplay: 'always',
          stripTrailingZeros: true,
        })
      : showNa
        ? ''
        : 'N/A';

  return {
    showNa,
    displayValue,
    displayReturnRate,
  };
}

function PerformancePnlRow({
  title,
  value,
  totalBought,
}: {
  title: ReactNode;
  value: bigint | undefined;
  totalBought: bigint | undefined;
}) {
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const { showNa, displayValue, displayReturnRate } = getPnlDisplayData({
    value,
    totalBought,
    usdAmountDisplayDecimal,
  });

  return (
    <div className="flex flex-col items-start gap-2 py-3 last:pb-0">
      <div className="text-t-270 text-xs">{title}</div>
      <div>
        {value === undefined ? (
          <Skeleton className="h-[19.2px] w-28 rounded-xl" />
        ) : showNa ? (
          <div className="text-t-350 text-base font-medium">N/A</div>
        ) : (
          <div className="flex flex-wrap items-end gap-1">
            <span
              className={
                value! > 0n
                  ? 'text-up text-base font-medium'
                  : value! < 0n
                    ? 'text-down text-base font-medium'
                    : 'text-t-350 text-base font-medium'
              }
            >
              {displayValue}
            </span>
            <span
              className={
                value! > 0n
                  ? 'text-up text-[11px]'
                  : value! < 0n
                    ? 'text-down text-[11px]'
                    : 'text-t-350 text-[11px]'
              }
            >
              {displayReturnRate}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function PerformanceRows({
  positionUsd,
  positionAmount,
  positionSymbol,
  positionDecimals,
  totalPnl,
  unrealizedPnl,
  totalBought,
  unrealizedPnlBasis,
}: {
  positionUsd: bigint | undefined;
  positionAmount?: bigint;
  positionSymbol?: string;
  positionDecimals?: number;
  totalPnl: bigint | undefined;
  unrealizedPnl: bigint | undefined;
  totalBought: bigint | undefined;
  unrealizedPnlBasis: bigint | undefined;
}) {
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const positionDisplay =
    positionUsd !== undefined
      ? unitFormat(
          calc(positionUsd.toString(10))
            .div(calc(10).pow(USD_DECIMALS))
            .toString(),
          usdAmountDisplayDecimal,
          {
            style: 'currency',
            currency: 'USD',
            round: ROUND_MODE.ROUND,
            showMinDecimalValue: true,
            stripTrailingZeros: true,
          },
        )
      : '';
  const showPositionNa = positionUsd === undefined || positionUsd === 0n;
  const positionAmountDisplay =
    positionAmount !== undefined && positionSymbol
      ? `${formatAmount(positionAmount, positionDecimals ?? 18, 2, true)} ${positionSymbol}`
      : undefined;

  return (
    <div className="divide-border divide-y">
      <div className="pb-3">
        <p className="text-t-270 text-xs">
          <Trans>Your Position</Trans>
        </p>
        {positionUsd === undefined ? (
          <Skeleton className="mt-2 h-[19.2px] w-32 rounded-xl" />
        ) : showPositionNa ? (
          <p className="text-t-350 mt-2 text-base font-medium">N/A</p>
        ) : (
          <div className="text-t-1100 mt-2 flex items-end gap-1">
            <span className="text-base font-medium">
              {positionAmountDisplay ?? positionDisplay}
            </span>
            {positionAmountDisplay ? (
              <span className="text-[11px]">≈ {positionDisplay}</span>
            ) : null}
          </div>
        )}
      </div>
      <PerformancePnlRow
        title={<Trans>All-time PnL</Trans>}
        value={totalPnl}
        totalBought={totalBought}
      />
      <PerformancePnlRow
        title={<Trans>Unrealized PnL</Trans>}
        value={unrealizedPnl}
        totalBought={unrealizedPnlBasis ?? totalBought}
      />
    </div>
  );
}

type UserPerformanceCardsProps = {
  shouldShowEmptyState: boolean;
  resourceType: UserPerformanceResourceType;
  positionUsd?: bigint;
  positionAmount?: bigint;
  positionSymbol?: string;
  positionDecimals?: number;
  totalPnl?: bigint;
  unrealizedPnl?: bigint;
  totalBought?: bigint;
  unrealizedPnlBasis?: bigint;
};

export function UserPerformanceCards({
  shouldShowEmptyState,
  resourceType,
  positionUsd,
  positionAmount,
  positionSymbol,
  positionDecimals,
  totalPnl,
  unrealizedPnl,
  totalBought,
  unrealizedPnlBasis,
}: UserPerformanceCardsProps) {
  const typeText = resourceType === 'vault' ? t`vault` : t`pool`;

  if (shouldShowEmptyState) {
    return (
      <div className="flex flex-col items-center justify-center py-3 text-center">
        <NoPerformanceIcon />
        <p className="mt-3 text-[14px] font-medium">
          <Trans>No Performance Data</Trans>
        </p>
        <p className="text-t-350 mt-2 text-xs">
          <Trans>
            Deposit into this {typeText} to track your PNL and performance
          </Trans>
        </p>
      </div>
    );
  }

  return (
    <PerformanceRows
      positionUsd={positionUsd}
      positionAmount={positionAmount}
      positionSymbol={positionSymbol}
      positionDecimals={positionDecimals}
      totalPnl={totalPnl}
      unrealizedPnl={unrealizedPnl}
      totalBought={totalBought}
      unrealizedPnlBasis={unrealizedPnlBasis}
    />
  );
}
