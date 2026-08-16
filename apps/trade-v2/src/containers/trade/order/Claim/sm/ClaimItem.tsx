import { FC, useMemo, useRef } from 'react';
import { getViemChain } from '@hertzflow/sdk-v2/configs/chains';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { CoinIcon } from '@repo/common/components';
import { calc } from '@repo/lib/calc';
import { dateFormat, thoFormat, truncateFormat } from '@repo/lib/format';
import {
  ArrowUpRightIcon,
  Button,
  CreditIcon,
  LoaderCircleIcon,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui';
import { CREDIT_MARKET_CATEGORY, useGlobalStore, useInstStore } from '@/common';
import { useHzSdk } from '@/common/chainClient';
import { getClaimMarketInst } from '../getClaimMarketInst';
import { getClaimHistoryValueUsd } from '../historyMapper';
import { useFormatClaimDetails, useClaim } from '../hooks';
import { useClaimStore } from '../store';
import {
  ClaimHistoryDetailDataType,
  ClaimTableDataType,
  ClaimType,
} from '../type';

interface ClaimItemProps {
  data: ClaimTableDataType;
}

const TOOLTIP_CLAIM_TYPE_ORDER: ClaimType[] = ['funding_fees', 'collateral'];

const getTooltipMarketLabel = (detail: ClaimHistoryDetailDataType) => {
  return detail.market_symbol || detail.market;
};

const ClaimItem: FC<ClaimItemProps> = ({ data }) => {
  const { t } = useLingui();
  const hzSdk = useHzSdk();
  const explorerHost = hzSdk
    ? getViemChain(hzSdk.config.chainId).blockExplorers?.default.url
    : '';
  const insts = useInstStore((state) => state.getInsts());
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const [processingId, setProcessingId] = useClaimStore(
    useShallow((state) => [state.processingId, state.setProcessingId]),
  );
  const { mutateAsync: onClaim } = useClaim();

  const onClaimRef = useRef(onClaim);
  onClaimRef.current = onClaim;

  const isHistory = data.kind === 'history';
  const historyItem = isHistory ? data : null;

  const handleClaim = async () => {
    if (data.kind !== 'pending' || processingId) return;
    setProcessingId(data.id);
    try {
      await onClaimRef.current({
        claimType: data.claim_type,
        claimedUsd: totalUsd.toFixed(),
        marketAddress: data.marketAddress,
        tokenAddress: data.tokenAddress,
        timeKey: data.timeKey,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const disabled = !!processingId;
  const showLoading = processingId === data.id;

  const formatDetails = useFormatClaimDetails(
    data.kind === 'pending' && data.marketAddress
      ? {
          [data.marketAddress]: [data],
        }
      : {},
  );
  const totalUsd =
    data.kind === 'pending'
      ? formatDetails.reduce((acc, cur) => {
          return acc.plus(cur.usd);
        }, calc(0))
      : calc(getClaimHistoryValueUsd(data.valueUsd));

  const primaryMarket =
    data.kind === 'pending'
      ? formatDetails[0]?.marketAddress
      : data.primaryMarketAddress;
  const inst = getClaimMarketInst(insts, primaryMarket);

  const dispValue = truncateFormat(totalUsd, usdAmountDisplayDecimal, {
    style: 'currency',
    currency: 'USD',
    signDisplay: 'always',
    showMinDecimalValue: true,
  });

  const symbolLabel = historyItem?.symbolLabel ?? inst?.name ?? '--';
  const isCreditClaim =
    data.kind === 'pending'
      ? inst?.category === CREDIT_MARKET_CATEGORY
      : data.details.some(
          (detail) =>
            getClaimMarketInst(insts, detail.market)?.category ===
            CREDIT_MARKET_CATEGORY,
        );
  const typeLabel =
    historyItem?.typeLabel ??
    (data.claim_type === 'funding_fees' ? t`Funding Fee` : t`Price Impact`);
  const extraMarketCount = historyItem?.extraMarketCount ?? 0;

  const tooltipSections = useMemo(() => {
    if (!historyItem?.isBatch) {
      return [];
    }

    return TOOLTIP_CLAIM_TYPE_ORDER.map((claimType) => {
      const items = historyItem.details
        .filter(
          (detail) =>
            detail.claim_type === claimType &&
            detail.amount_usd &&
            getTooltipMarketLabel(detail),
        )
        .map((detail) => ({
          label: getTooltipMarketLabel(detail)!,
          value: truncateFormat(
            calc(getClaimHistoryValueUsd(detail.amount_usd)),
            usdAmountDisplayDecimal,
            {
              style: 'currency',
              currency: 'USD',
              signDisplay: 'always',
              showMinDecimalValue: true,
            },
          ),
          rawValue: calc(getClaimHistoryValueUsd(detail.amount_usd)),
        }));

      if (items.length === 0) {
        return null;
      }

      return {
        key: claimType,
        title:
          claimType === 'funding_fees'
            ? t`Claimed Funding`
            : t`Claimed Price Impact`,
        total: truncateFormat(
          items.reduce((sum, item) => sum.plus(item.rawValue), calc(0)),
          usdAmountDisplayDecimal,
          {
            style: 'currency',
            currency: 'USD',
            signDisplay: 'always',
            showMinDecimalValue: true,
          },
        ),
        items,
      };
    }).filter((section) => section !== null);
  }, [historyItem, t, usdAmountDisplayDecimal]);

  const hasValueTooltip = tooltipSections.length > 0;

  const valueNode = hasValueTooltip ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="decoration-t-430 text-up cursor-pointer text-sm font-medium underline decoration-dotted underline-offset-2"
        >
          {dispValue}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="w-65 rounded-xl px-2 py-2 text-sm">
        <div className="flex flex-col gap-2">
          {tooltipSections.map((section) => (
            <div className="flex flex-col gap-1" key={section.key}>
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-t-270">{section.title}</span>
                <span className="text-t-1100">{section.total}</span>
              </div>
              <div className="bg-bg-3 flex flex-col gap-2 rounded-lg px-2 py-2 text-xs">
                {section.items.map((item) => (
                  <div
                    className="flex items-center justify-between gap-3"
                    key={`${section.key}-${item.label}-${item.value}`}
                  >
                    <span className="text-t-270">{item.label}</span>
                    <span className="text-t-270">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Separator />
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-t-270">{t`Total Claimed`}</span>
            <span className="text-t-1100">{dispValue}</span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  ) : (
    <span className="text-up text-sm font-medium">{dispValue}</span>
  );

  return (
    <div className="flex items-center justify-between p-2">
      <div className="flex flex-1 items-start justify-between">
        <div className="flex flex-col justify-center gap-3">
          <div className="flex items-center gap-2">
            <CoinIcon
              src={inst?.icon}
              alt={symbolLabel}
              size={24}
              className="shrink-0 rounded-full"
            />
            <span className="text-t-1100 flex min-w-0 items-center gap-1 text-sm font-medium">
              <span className="min-w-0 truncate">
                {symbolLabel}
                {extraMarketCount > 0
                  ? ` +${thoFormat(extraMarketCount)}`
                  : ''}
              </span>
              {isCreditClaim ? (
                <CreditIcon size={14} className="text-accent shrink-0" />
              ) : null}
            </span>
          </div>
          <div className="text-t-350 flex gap-3 text-sm">
            <span>{typeLabel}</span>
          </div>
        </div>
        <div className="flex flex-col items-end justify-center gap-4">
          {valueNode}
          {!isHistory ? (
            <Button
              size="sm"
              variant="accent"
              className="h-6 px-3 py-0.5 text-xs"
              disabled={disabled}
              onClick={handleClaim}
            >
              {showLoading ? (
                <>
                  <LoaderCircleIcon size={12} className="animate-spin" />
                  {t`Claiming`}
                </>
              ) : (
                t`Claim`
              )}
            </Button>
          ) : data.tx_hash && explorerHost ? (
            <a
              href={`${explorerHost}/tx/${data.tx_hash}`}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex items-center justify-end gap-1"
            >
              {
                <span className="text-t-350 justify-end text-sm">
                  {dateFormat(data.claim_time_ms, 'yyyy/MM/dd HH:mm:ss')}
                </span>
              }
              <span className="text-t-270">
                <ArrowUpRightIcon size={16} />
              </span>
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ClaimItem;
