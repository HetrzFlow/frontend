import React, { FC, useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { calc } from '@repo/lib/calc';
import { EMPTY_DISPLAY } from '@repo/lib/format';
import {
  ArrowLeftRightIcon,
  cn,
  CountdownCircle,
  LoaderCircleIcon,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui';
import FormatRate from '@/components/hzlp/FormatRate';

interface FeeContentProps {
  paySzValue?: string;
  paySzCoin?: string;
  receiveSzValue?: string;
  receiveSzCoin?: string;
  pxUnit: (string | undefined)[];
  isFetching: boolean;
  isReady: boolean;
  formattedPriceImpact: string;
  formattedLpFee: string;
  formattedPriceImpactUSD: string;
  formattedLpFeeUSD: string;
  showOptimalTokenSwitch: boolean;
  priceDifferencePercent: number;
  bestTokenSymbol?: string;
  onRefetch: () => void;
  onSwitchToOptimalToken: () => void;
  slippageComponent: React.ReactNode;
}

const FeeContent: FC<FeeContentProps> = ({
  paySzValue,
  paySzCoin,
  receiveSzValue,
  pxUnit,
  isFetching,
  isReady,
  formattedPriceImpact,
  formattedLpFee,
  formattedPriceImpactUSD,
  formattedLpFeeUSD,
  showOptimalTokenSwitch,
  priceDifferencePercent,
  bestTokenSymbol,
  onRefetch,
  onSwitchToOptimalToken,
  slippageComponent,
}) => {
  const { t } = useLingui();
  const [pxIsReversed, setPxIsReversed] = useState(false);

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between text-sm">
        <div className="text-t-270">{t`Rate`}</div>
        <div className="font-plex flex items-center justify-end gap-2">
          {isFetching || !paySzValue || !+paySzValue ? (
            <LoaderCircleIcon
              size={14}
              className={cn('text-accent', isFetching ? 'animate-spin' : '')}
            />
          ) : (
            <CountdownCircle
              size={14}
              duration={5.5}
              className={cn('text-accent cursor-pointer')}
              onClick={onRefetch}
            />
          )}
          <span>1 {pxIsReversed ? pxUnit[1] : pxUnit[0]}</span>
          <ArrowLeftRightIcon
            className="text-accent cursor-pointer"
            onClick={() => setPxIsReversed(!pxIsReversed)}
            size={14}
          />
          <span className="flex items-center" id="rateDisplay">
            {isFetching ? (
              <Skeleton className="mr-1 inline-flex shrink-0 rounded-md">
                <span className="invisible">1,234.56</span>
              </Skeleton>
            ) : paySzValue && receiveSzValue ? (
              <FormatRate
                rate={
                  pxIsReversed
                    ? calc(paySzValue).div(receiveSzValue)
                    : calc(receiveSzValue).div(paySzValue)
                }
                payCoin={paySzCoin}
              />
            ) : (
              EMPTY_DISPLAY
            )}{' '}
            {pxIsReversed ? pxUnit[0] : pxUnit[1]}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="text-t-270">
          <div className="flex items-center gap-1">
            {t`Price Impact/LP Fee Rate`}
          </div>
        </div>
        <Tooltip>
          {isReady && paySzValue ? (
            <TooltipTrigger
              className={`${isReady && paySzValue && 'decoration-t-430 underline decoration-dotted underline-offset-3'}`}
            >
              <div className="font-plex text-right">
                {!isReady && paySzValue ? (
                  <Skeleton className="inline-flex items-center rounded-md">
                    <span className="invisible">-0.00%</span>
                  </Skeleton>
                ) : (
                  formattedPriceImpact
                )}{' '}
                /{' '}
                {!isReady && paySzValue ? (
                  <Skeleton className="inline-flex items-center rounded-md">
                    <span className="invisible">0.00%</span>
                  </Skeleton>
                ) : (
                  formattedLpFee
                )}
              </div>
            </TooltipTrigger>
          ) : (
            <div className="font-plex text-right">
              {!isReady && paySzValue ? (
                <Skeleton className="inline-flex items-center rounded-md">
                  <span className="invisible">-0.00%</span>
                </Skeleton>
              ) : (
                formattedPriceImpact
              )}{' '}
              /{' '}
              {!isReady && paySzValue ? (
                <Skeleton className="inline-flex items-center rounded-md">
                  <span className="invisible">0.00%</span>
                </Skeleton>
              ) : (
                formattedLpFee
              )}
            </div>
          )}
          {isReady && paySzValue && (
            <TooltipContent side="bottom">
              <div className="flex items-center justify-between gap-4">
                <div>Price Impact:</div>
                <div>{formattedPriceImpactUSD}</div>
              </div>
              <div className="flex items-center justify-between">
                <div>LP Fee:</div>
                <div>{formattedLpFeeUSD}</div>
              </div>
              {showOptimalTokenSwitch && (
                <div className="text-accent cursor-pointer space-y-1 underline">
                  <div onClick={onSwitchToOptimalToken}>
                    Save ~{priceDifferencePercent.toFixed(2)}% on Fees with{' '}
                    {bestTokenSymbol}.
                  </div>
                </div>
              )}
            </TooltipContent>
          )}
        </Tooltip>
      </div>

      <div className="flex items-center justify-between text-sm">
        <Tooltip>
          <TooltipTrigger
            className={
              'decoration-t-430 text-t-270 underline decoration-dotted underline-offset-3'
            }
          >
            {t`Slippage`}
          </TooltipTrigger>

          <TooltipContent side="top" className="w-[224px]">
            <p>{t`Slippage below 1% in versatile markets may cause failed execution and gas loss.`}</p>
          </TooltipContent>
        </Tooltip>
        {slippageComponent}
      </div>
    </div>
  );
};

FeeContent.displayName = 'FeeContent';
export default FeeContent;
