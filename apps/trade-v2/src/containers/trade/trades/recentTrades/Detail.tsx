import { FC, useEffect, useRef, useState } from 'react';
import { getViemChain } from '@hertzflow/sdk-v2/configs/chains';
import { useLingui } from '@lingui/react/macro';
import { CoinIcon } from '@repo/common/components';
import { calc, ROUND_MODE } from '@repo/lib/calc';
import {
  dateFormat,
  EMPTY_DISPLAY,
  formatAddress,
  percentFormat,
  truncateFormat,
  unitFormat,
} from '@repo/lib/format';
import {
  ArrowUpRightIcon,
  cn,
  CreditIcon,
  Dialog,
  DialogContent,
  DialogTitle,
  HyperLevIcon,
  MEDIA_SIZES,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  VerifiedIcon,
  useMediaQuery,
  ArrowUpRight2Icon,
} from '@repo/ui';
import {
  CONTRACT_USD_MULTIPLIER,
  CREDIT_MARKET_CATEGORY,
  useGlobalStore,
  useHzSdk,
  useInstStore,
  useMarketConfigs,
} from '@/common';
import { useHydrated } from '@/common/hooks/useHydrated';
import { useTradeEventType } from '@/common/hooks/useTradeEventType';
import { PlatformHistoryOrder } from '@/services/rest/order';

interface DetailProps {
  open: boolean;
  top: number;
  instId: string;
  itemData?: PlatformHistoryOrder;
  onOpenChange?: (open: boolean) => void;
}

interface ContentProps {
  instId: string;
  itemData?: PlatformHistoryOrder;
}

const Content: FC<ContentProps> = ({ instId, itemData }) => {
  const { t } = useLingui();

  const insts = useInstStore((state) => state.getInsts());
  const leverDecimal = useGlobalStore((state) => state.leverDecimal);
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );

  const inst = insts[instId];
  const { data: marketConfig } = useMarketConfigs(inst);

  const isOpen = itemData?.isOpen ?? false;
  const isZFP = itemData?.is_zfp === true;
  const isCreditMarket = inst?.category === CREDIT_MARKET_CATEGORY;

  const deltaCollateralUsd = calc(
    itemData?.collateral_delta_amount || '',
  ).times(itemData?.collateralTokenPrice || '');

  const collateralBasisUsd = calc(itemData?.initialCollateralAmount || 0)
    .abs()
    .times(itemData?.collateralTokenPrice || 0);
  const sizeDeltaUsdAbs = calc(itemData?.size_delta_usd || 0).abs();
  const positionSizeBeforeDecreaseUsd = calc(itemData?.size_in_usd || 0)
    .abs()
    .plus(sizeDeltaUsdAbs);
  const sizeDeltaRatio = positionSizeBeforeDecreaseUsd.gt(0)
    ? sizeDeltaUsdAbs.div(positionSizeBeforeDecreaseUsd)
    : null;
  const pnlPercentBasisUsd =
    sizeDeltaRatio !== null
      ? collateralBasisUsd.times(sizeDeltaRatio)
      : calc(0);

  const { getLabel: getTradeEventLabel } = useTradeEventType();
  const hzSdk = useHzSdk();
  const explorerHost = hzSdk
    ? getViemChain(hzSdk.config.chainId).blockExplorers?.default.url
    : '';

  // PnL calculation (same as history records PnL)
  const grossPnl = itemData?.uncapped_base_pnl_usd
    ? calc(itemData.uncapped_base_pnl_usd)
    : null;
  const lossRebate = itemData?.loss_rebate_usd
    ? calc(itemData.loss_rebate_usd)
    : null;
  const totalFeesUsd = calc(itemData?.totalFeeUsd || 0);
  const priceImpact = itemData?.price_impact_usd
    ? calc(itemData.price_impact_usd)
    : null;
  const liqFee = itemData?.liquidation_fee
    ? calc(itemData.liquidation_fee)
    : null;
  const profitSharing = itemData?.profit_sharing_usd
    ? calc(itemData.profit_sharing_usd)
    : null;

  const netPnl =
    !isOpen && grossPnl !== null
      ? grossPnl
          .plus(lossRebate || 0)
          .minus(totalFeesUsd)
          .plus(priceImpact || 0)
          .minus(liqFee || 0)
          .minus(profitSharing || 0)
      : null;

  const netPnlPercent =
    netPnl && pnlPercentBasisUsd.gt(0) ? netPnl.div(pnlPercentBasisUsd) : null;

  const hasLossRebate =
    !isOpen &&
    !isZFP &&
    !isCreditMarket &&
    lossRebate !== null &&
    lossRebate.gt(0);

  const lossRebateRate =
    hasLossRebate && marketConfig?.lossRebateRate
      ? percentFormat(
          calc(marketConfig.lossRebateRate.toString()).div(
            CONTRACT_USD_MULTIPLIER,
          ),
          0,
        )
      : null;

  return (
    <div>
      <div className="mt-1 flex items-center gap-1">
        <CoinIcon size={20} src={inst?.icon} />
        <div className="ml-1 flex grow flex-col">
          <div className="flex items-center gap-1">
            <span className="text-t-1100">{inst?.name}</span>
            {isCreditMarket && (
              <CreditIcon size={14} className="text-accent shrink-0" />
            )}
            <ArrowUpRight2Icon
              size={14}
              className={cn(
                'ml-auto',
                itemData?.is_long ? 'text-up' : 'text-down rotate-90',
              )}
            />
            <div className="text-t-1100">
              {getTradeEventLabel(itemData?.action_type || '')}
            </div>
          </div>
          {(isZFP || itemData?.leverage) && (
            <span
              className={cn(
                'flex w-max items-center gap-0.5 text-[10px]',
                isZFP
                  ? 'bg-hyper-lev/10 text-hyper-lev rounded-sm px-1 py-0.5'
                  : 'text-t-1100',
              )}
            >
              {isZFP && <HyperLevIcon size={14} />}
              {itemData?.leverage && (
                <span>
                  {truncateFormat(itemData.leverage, leverDecimal, {
                    stripTrailingZeros: true,
                    round: ROUND_MODE.ROUND,
                  })}
                  x
                </span>
              )}
            </span>
          )}
        </div>
      </div>
      <Separator className="my-2" />
      <div className="mt-1 flex items-center justify-between">
        <span className="text-t-270">{t`Size`}</span>
        <span className="text-t-1100">
          {unitFormat(
            calc(itemData?.size_delta_usd || '').times(isOpen ? 1 : -1),
            usdAmountDisplayDecimal,
            {
              style: 'currency',
              currency: 'USD',
              signDisplay: 'always',
            },
          )}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-t-270">{t`Collateral`}</span>
        <span className="text-t-1100">
          {unitFormat(
            deltaCollateralUsd.times(isOpen ? 1 : -1),
            usdAmountDisplayDecimal,
            {
              style: 'currency',
              currency: 'USD',
              signDisplay: 'exceptZero',
            },
          )}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-t-270">
          {isOpen ? t`Entry Price` : t`Exit Price`}
        </span>
        <span className="text-t-1100">
          {truncateFormat(
            itemData?.execution_price || '',
            inst?.pxDispDecimal,
            {
              style: 'currency',
              currency: 'USD',
            },
          )}
        </span>
      </div>
      {hasLossRebate && (
        <div className="mt-1 flex items-center justify-between">
          <span className="text-t-270 flex items-center gap-0.5">
            {t`Loss Rebate`}
            {lossRebateRate && (
              <span className="text-loss-rebate flex items-center gap-0.5">
                <VerifiedIcon size={12} />
                {/* {lossRebateRate} */}
              </span>
            )}
          </span>
          <span className="text-up text-xs font-medium">
            {truncateFormat(lossRebate, usdAmountDisplayDecimal, {
              style: 'currency',
              currency: 'USD',
              signDisplay: 'always',
            })}
          </span>
        </div>
      )}
      {!isOpen && (
        <div className="mt-1 flex items-center justify-between">
          <span className="text-t-270">{t`PnL(%)`}</span>
          <span
            className={
              netPnl && netPnl.gt(0)
                ? 'text-up'
                : netPnl && netPnl.lt(0)
                  ? 'text-down'
                  : 'text-t-1100'
            }
          >
            {netPnl
              ? `${unitFormat(netPnl, usdAmountDisplayDecimal, {
                  style: 'currency',
                  currency: 'USD',
                  signDisplay: 'always',
                })} (${percentFormat(netPnlPercent || 0, 2, {
                  signDisplay: 'always',
                })})`
              : EMPTY_DISPLAY}
          </span>
        </div>
      )}

      <Separator className="my-2" />
      <div className="flex items-center justify-between gap-2">
        <span className="bg-bg-5 origin-left rounded-full px-2 py-1 text-[10px]">
          {formatAddress(itemData?.user_address || '', { prefixLength: 2 })}
        </span>
        <a
          href={`${explorerHost}/tx/${itemData?.tx_hash}`}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="bg-bg-5 hover:text-t-1100 flex origin-right items-center gap-0.5 rounded-full px-2 py-1 text-[10px]"
        >
          {dateFormat(itemData?.action_time_ms || '', 'yyyy/MM/dd HH:mm:ss')}
          <ArrowUpRightIcon size={12} />
        </a>
      </div>
    </div>
  );
};

const Detail: FC<DetailProps> = ({
  open: outterOpen,
  top,
  instId,
  itemData,
  onOpenChange,
}) => {
  const { t } = useLingui();
  const isHydrated = useHydrated();
  const isMobile = useMediaQuery() === MEDIA_SIZES.SM && isHydrated;
  const [innerOpen, setInnerOpen] = useState(outterOpen);

  const outterOpenRef = useRef(outterOpen);
  const innerOpenRef = useRef(false);
  outterOpenRef.current = outterOpen;

  useEffect(() => {
    if (outterOpen) {
      setInnerOpen(true);
      return;
    }

    const timeoutId = setTimeout(() => {
      if (!outterOpenRef.current && !innerOpenRef.current) {
        setInnerOpen(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [outterOpen]);

  if (isMobile) {
    if (!outterOpen || !itemData) {
      return null;
    }

    return (
      <Dialog
        open
        onOpenChange={(open) => {
          if (onOpenChange) {
            onOpenChange(open);
          }
        }}
      >
        <DialogTitle className="hidden">{t`Detail`}</DialogTitle>
        <DialogContent
          className="text-sm"
          closeClassName="hidden"
          aria-describedby={undefined}
        >
          <Content instId={instId} itemData={itemData} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="absolute top-5 h-0 w-full">
      <Tooltip
        open={innerOpen && !!itemData}
        onOpenChange={(open) => {
          if (outterOpen) {
            return;
          } else {
            setInnerOpen(open);
          }
        }}
      >
        <TooltipTrigger aria-label="settings" className="w-full">
          <div className="w-full"></div>
        </TooltipTrigger>

        <TooltipContent
          side="left"
          sideOffset={-2}
          align="start"
          alignOffset={-16}
          className="min-w-60 transition-[translate]"
          style={{
            translate: `0 ${top}px`,
          }}
          onMouseEnter={() => (innerOpenRef.current = true)}
          onMouseLeave={() => (innerOpenRef.current = false)}
        >
          <Content instId={instId} itemData={itemData} />
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default Detail;
