'use client';

import { memo, useMemo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { CoinIcon } from '@repo/common/components';
import { calc } from '@repo/lib/calc';
import {
  ArrowUpRightIcon,
  cn,
  CreditIcon,
  HyperLevIcon,
  HzIcon,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  VerifiedIcon,
} from '@repo/ui';
import HashTooltipLink from './HashTooltipLink';
import type { ActivityTimelineChildItem, ActivityTimelineItem } from './types';

type Props = {
  item: ActivityTimelineItem;
};

type TimelineMetric = {
  key: 'primary' | 'secondary' | 'tertiary';
  label: string;
  text: string;
  tone: ActivityTimelineItem['primaryTone'];
  skeleton?: boolean;
  align: 'text-left' | 'text-right';
};

const tagToneClassName = {
  accent: 'bg-accent/10 text-accent',
  down: 'bg-destructive/10 text-destructive',
  neutral: 'bg-t-270/10 text-t-270',
} as const;

const valueToneClassName = {
  default: 'text-t-1100',
  accent: 'text-accent',
  down: 'text-down',
} as const;

function hasPositiveValue(value?: string) {
  if (!value) return false;

  try {
    return calc(value).gt(0);
  } catch {
    return false;
  }
}

function ReferralRebateIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M14 8.25C12.8954 8.25 12 9.08947 12 10.125C12 11.1605 12.8954 12 14 12C15.1046 12 16 12.8395 16 13.875C16 14.9105 15.1046 15.75 14 15.75M14 8.25C14.8708 8.25 15.6116 8.77175 15.8862 9.5M14 8.25V7M14 15.75C13.1292 15.75 12.3884 15.2282 12.1138 14.5M14 15.75V17"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle
        cx="14"
        cy="12"
        r="9"
        stroke="white"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 20.777C11.3568 20.9229 10.6874 21 10 21C5.02944 21 1 16.9706 1 12C1 7.02944 5.02944 3 10 3C10.6874 3 11.3568 3.07706 12 3.22302"
        stroke="white"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DefaultTimelineIcon() {
  return (
    <div className="bg-bg-3 flex size-6 shrink-0 items-center justify-center rounded-full">
      <HzIcon className="text-accent" size={12} />
    </div>
  );
}

function TimelineIcon({ icon }: { icon: ActivityTimelineItem['icon'] }) {
  if (icon.kind === 'credit') {
    return <CreditIcon className="text-accent rounded-full" size={24} />;
  }

  if (icon.kind === 'referralRebate') {
    return <ReferralRebateIcon />;
  }

  if (icon.kind === 'coin') {
    return (
      <CoinIcon size={24} src={icon.src} alt={icon.alt} className="shrink-0" />
    );
  }

  return <DefaultTimelineIcon />;
}

function TimelineTag({
  text,
  tone,
  className,
}: {
  text: string;
  tone: ActivityTimelineItem['tagTone'];
  className?: string;
}) {
  return (
    <span
      className={cn(
        'rounded-sm px-2 py-0.5 text-xs',
        tagToneClassName[tone],
        className,
      )}
    >
      {text}
    </span>
  );
}

function PositionBadges({
  item,
  compact = false,
}: Props & { compact?: boolean }) {
  if (!item.isHyper && !item.leverageText && !item.directionText) {
    return null;
  }

  if (compact) {
    return (
      <div className="mt-1 flex flex-wrap items-center gap-1">
        {(item.isHyper || item.leverageText) && (
          <span
            className={cn(
              'flex items-center gap-0.5 rounded-sm text-[10px]',
              item.isHyper
                ? 'bg-hyper-lev/10 text-hyper-lev px-1 py-0.5'
                : 'text-t-270',
            )}
          >
            {item.isHyper ? <HyperLevIcon size={14} /> : null}
            <span>{item.leverageText}</span>
          </span>
        )}
        {item.directionText ? (
          <span
            className={cn(
              'text-[10px]',
              valueToneClassName[item.directionTone || 'default'],
            )}
          >
            {item.directionText}
          </span>
        ) : null}
      </div>
    );
  }

  const hasPositionBadge = !!(
    item.isHyper ||
    item.leverageText ||
    item.directionText
  );

  if (!hasPositionBadge) {
    return null;
  }

  return (
    <span
      className={cn(
        'flex items-center gap-0.5 rounded-sm px-2 py-0.5 text-xs',
        item.isHyper
          ? 'bg-hyper-lev/10 text-hyper-lev'
          : item.directionText
            ? item.directionTone === 'accent'
              ? 'bg-up/10 text-up'
              : 'bg-down/10 text-down'
            : 'text-t-270',
      )}
    >
      {item.isHyper ? <HyperLevIcon size={14} /> : null}
      {item.leverageText ? <span>{item.leverageText}</span> : null}
      {item.directionText ? <span>{item.directionText}</span> : null}
    </span>
  );
}

function TimelineCreditMarker({ item }: Props) {
  return item.isCreditMarket ? (
    <CreditIcon size={14} className="text-accent shrink-0" />
  ) : null;
}

function TimelineHeader({
  item,
  isTradeItem,
}: Props & { isTradeItem: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <TimelineIcon icon={item.icon} />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <div className="text-t-1100 truncate text-sm/tight font-medium">
              {item.entityName}
            </div>
            {isTradeItem ? (
              <div className="ml-1 flex shrink-0 flex-wrap items-center gap-1">
                <PositionBadges item={item} />
                <TimelineTag text={item.tagText} tone={item.tagTone} />
                <TimelineCreditMarker item={item} />
              </div>
            ) : (
              <div className="flex shrink-0 items-center gap-1">
                <TimelineTag
                  text={item.tagText}
                  tone={item.tagTone}
                  className="shrink-0"
                />
                <TimelineCreditMarker item={item} />
              </div>
            )}
          </div>
        </div>
        {!isTradeItem ? <PositionBadges item={item} compact /> : null}
      </div>
    </div>
  );
}

function TimelineSection({ child }: { child: ActivityTimelineChildItem }) {
  return (
    <div className="flex flex-col gap-2">
      {child.title ? (
        <div className="flex items-center gap-2">
          {child.icon ? <TimelineIcon icon={child.icon} /> : null}
          <div className="text-t-1100 truncate text-sm/tight font-medium">
            {child.title}
          </div>
          {child.tagText ? (
            <>
              <span
                className={cn(
                  'shrink-0 rounded-sm px-2 py-0.5 text-xs',
                  tagToneClassName[child.tagTone || 'neutral'],
                )}
              >
                {child.tagText}
              </span>
              {child.isCreditMarket ? (
                <CreditIcon size={14} className="text-accent shrink-0" />
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0">
          <div className="text-t-350 text-xs">{child.primaryLabel}</div>
          <div
            className={cn(
              'mt-1 truncate text-sm',
              valueToneClassName[child.primaryTone],
            )}
          >
            {child.primaryText}
          </div>
        </div>
        <div className="min-w-0 text-right">
          <div className="text-t-350 text-xs">{child.secondaryLabel}</div>
          <div
            className={cn(
              'mt-1 truncate text-sm',
              valueToneClassName[child.secondaryTone],
            )}
          >
            {child.secondaryText}
          </div>
        </div>
      </div>
      <TimelineFooter
        timestampText={child.timestampText}
        txHref={child.txHref}
      />
    </div>
  );
}

function FigmaArrowIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.6679 2.33447H5.25119V3.50114H9.67623L2.3322 10.8406L3.15716 11.6656L10.5012 4.3261V8.75114H11.6679V2.33447Z"
        fill="currentColor"
      />
    </svg>
  );
}

function TimelineFooter({
  timestampText,
  txHref,
  label,
  linkIcon,
  className,
}: {
  timestampText: string;
  txHref?: string;
  label?: string;
  linkIcon?: ActivityTimelineItem['txLinkIcon'];
  className?: string;
}) {
  const { t } = useLingui();
  const labelText = label || t`Time / Hash`;

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="text-t-350 text-xs">{labelText}</div>
      {txHref ? (
        <HashTooltipLink
          href={txHref}
          className="group/inner inline-flex items-center gap-1 text-xs"
        >
          <span>{timestampText}</span>
          {linkIcon === 'figmaArrow' ? (
            <span className="text-t-430 group-hover/inner:text-t-1100">
              <FigmaArrowIcon />
            </span>
          ) : (
            <span className="text-t-430 group-hover/inner:text-t-1100">
              <ArrowUpRightIcon size={14} />
            </span>
          )}
        </HashTooltipLink>
      ) : (
        <div className="text-t-1100 text-xs">{timestampText}</div>
      )}
    </div>
  );
}

function MetricValue({
  item,
  metric,
  showLossRebate,
}: {
  item: ActivityTimelineItem;
  metric: TimelineMetric;
  showLossRebate: boolean;
}) {
  if (metric.skeleton) {
    return (
      <Skeleton
        className={cn(
          'mt-1 h-[16.8px] w-16',
          metric.align === 'text-right' ? 'ml-auto' : '',
        )}
      />
    );
  }

  if (metric.key === 'secondary' && showLossRebate) {
    return (
      <div className="mt-1 text-sm/tight">
        <CollateralWithLr
          text={metric.text}
          lossRebateText={item.lossRebateText}
          lossRebateRateText={item.lossRebateRateText}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'mt-1 truncate text-sm/tight',
        valueToneClassName[metric.tone],
      )}
    >
      {metric.text}
    </div>
  );
}

function MetricGrid({
  item,
  metrics,
  showLossRebate,
  isTradeItem,
}: {
  item: ActivityTimelineItem;
  metrics: TimelineMetric[];
  showLossRebate: boolean;
  isTradeItem: boolean;
}) {
  return (
    <div
      className={cn(
        'mt-2 grid gap-3',
        item.tertiaryText
          ? isTradeItem
            ? 'grid-cols-[4fr_3fr_3fr]'
            : 'grid-cols-3'
          : 'grid-cols-2',
      )}
    >
      {metrics.map((metric) => (
        <div key={metric.key} className={cn('min-w-0', metric.align)}>
          <div className="text-t-350 text-xs">{metric.label}</div>
          <MetricValue
            item={item}
            metric={metric}
            showLossRebate={showLossRebate}
          />
        </div>
      ))}
    </div>
  );
}

function DetailRow({ item }: Props) {
  if (!item.detailLabel || !item.detailText) return null;

  return (
    <div className="mt-2 flex items-center justify-between gap-3">
      <div className="text-t-350 text-xs">{item.detailLabel}</div>
      <div
        className={cn(
          'text-right text-xs',
          valueToneClassName[item.detailTone || 'default'],
        )}
      >
        {item.detailText}
      </div>
    </div>
  );
}

function CollateralWithLr({
  text,
  lossRebateText,
  lossRebateRateText,
}: {
  text: string;
  lossRebateText?: string;
  lossRebateRateText?: string;
}) {
  const { t } = useLingui();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="decoration-t-430 inline-flex cursor-pointer items-center gap-1 underline decoration-dotted underline-offset-2">
          <VerifiedIcon size={14} className="text-loss-rebate shrink-0" />
          {text}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[280px]">
        <p>
          {t`Loss Rebate is determined at execution, based on post-trade OI skew, and remains fixed for the position's lifetime.`}
        </p>
        <p className="mt-3 flex items-center justify-between gap-2">
          <span>
            {t`Loss Rebate:`}{' '}
            {lossRebateRateText ? `(${lossRebateRateText})` : ''}
          </span>
          <span className="text-accent">{lossRebateText}</span>
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

function getChildKey(child: ActivityTimelineChildItem, index: number) {
  return `${child.txHash || 'child'}-${child.title || 'untitled'}-${child.secondaryText}-${index}`;
}

function TimelineItem({ item }: Props) {
  const isTradeItem = item.source === 'trade';
  const isClaimItem = item.source === 'claim';
  const childSections = item.children?.length ? item.children : undefined;
  const showSummary = !isClaimItem || !childSections;
  const showLossRebate = hasPositiveValue(item.lossRebateUsd);
  const metrics = useMemo<TimelineMetric[]>(() => {
    const nextMetrics: TimelineMetric[] = [
      {
        key: 'primary',
        label: item.primaryLabel,
        text: item.primaryText,
        tone: item.primaryTone,
        skeleton: item.showPrimarySkeleton,
        align: 'text-left',
      },
      {
        key: 'secondary',
        label: item.secondaryLabel,
        text: item.secondaryText,
        tone: item.secondaryTone,
        skeleton: item.showSecondarySkeleton,
        align: item.tertiaryText ? 'text-left' : 'text-right',
      },
    ];

    if (item.tertiaryText) {
      nextMetrics.push({
        key: 'tertiary',
        label: item.tertiaryLabel || '',
        text: item.tertiaryText,
        tone: item.tertiaryTone || 'default',
        skeleton: item.showTertiarySkeleton,
        align: 'text-right',
      });
    }

    return nextMetrics;
  }, [
    item.primaryLabel,
    item.primaryText,
    item.primaryTone,
    item.secondaryLabel,
    item.secondaryText,
    item.secondaryTone,
    item.showPrimarySkeleton,
    item.showSecondarySkeleton,
    item.showTertiarySkeleton,
    item.tertiaryLabel,
    item.tertiaryText,
    item.tertiaryTone,
  ]);

  return (
    <div className="border-border rounded-xl border p-3">
      {showSummary ? (
        <TimelineHeader item={item} isTradeItem={isTradeItem} />
      ) : null}

      {showSummary ? (
        <>
          <MetricGrid
            item={item}
            metrics={metrics}
            showLossRebate={showLossRebate}
            isTradeItem={isTradeItem}
          />

          <DetailRow item={item} />

          <TimelineFooter
            className="mt-2"
            linkIcon={item.txLinkIcon}
            timestampText={item.timestampText}
            txHref={item.txHref}
          />
        </>
      ) : null}

      {childSections ? (
        <div className={cn('flex flex-col', isClaimItem ? 'mt-0' : 'mt-3')}>
          {childSections.map((child, index) => (
            <div
              key={getChildKey(child, index)}
              className={cn(
                index > 0 ? 'border-border mt-3 border-t pt-3' : '',
              )}
            >
              <TimelineSection child={child} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default memo(TimelineItem);
