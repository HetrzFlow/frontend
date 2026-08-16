import { useLingui } from '@lingui/react/macro';

import { calc } from '@repo/lib/calc';
import { unitFormat } from '@repo/lib/format';
import { Skeleton, Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui';
import {
  useGlobalStore,
  useInstStore,
  useMarketValues,
  CONTRACT_USD_MULTIPLIER,
  CREDIT_MARKET_CATEGORY,
} from '@/common';
import { useAvailableLiquidity } from '@/common/hooks/useAvailableLiq';
import OpenInterestRatio from '@/components/OpenInterestRatio';
import { useTradeGlobalStore } from '@/stores/trade/global';
import LossRebate from './LossRebate';
import NetRate from './NetRate';

const Liq = () => {
  const { t } = useLingui();
  const instId = useTradeGlobalStore((state) => state.instId);
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const inst = useInstStore((state) => state.getInst(state, instId));
  const { data: marketValues } = useMarketValues(inst);

  const { longAvailableLiquidity, shortAvailableLiquidity } =
    useAvailableLiquidity(inst?.marketTokenAddress);

  const longOi = calc(marketValues?.longInterestUsd.toString() || '').div(
    CONTRACT_USD_MULTIPLIER,
  );
  const shortOi = calc(marketValues?.shortInterestUsd.toString() || '').div(
    CONTRACT_USD_MULTIPLIER,
  );
  return (
    <>
      <Tooltip>
        <TooltipTrigger className="hover:bg-bg-3 flex h-full shrink-0 flex-col items-start justify-between rounded-lg px-2 py-1 max-md:gap-1 max-md:p-0 md:mr-0">
          <p className="text-t-270 text-[10px] max-md:text-xs">{t`Liquidity(L/S)`}</p>
          {marketValues ? (
            <span className="font-plex font-medium max-md:text-base">
              {unitFormat(longAvailableLiquidity, usdAmountDisplayDecimal, {
                style: 'currency',
                currency: 'USD',
              })}
              {' / '}
              {unitFormat(shortAvailableLiquidity, usdAmountDisplayDecimal, {
                style: 'currency',
                currency: 'USD',
              })}
            </span>
          ) : (
            <Skeleton className="h-3.5 w-16" />
          )}
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="text-t-270 flex w-90 flex-col gap-2 rounded-2xl p-3"
        >
          {t`The remaining OI for long and short positions. Limited by pool reserves and other constrains under HertzFlow's risk management framework.`}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger className="hover:bg-bg-3 flex h-full min-w-28 shrink-0 flex-col items-start justify-between rounded-lg px-2 py-1 max-md:gap-1 max-md:p-0 md:mr-0">
          <p className="text-t-270 text-[10px] whitespace-nowrap max-md:text-xs">{t`Open Interest(L/S)`}</p>
          {marketValues ? (
            <span className="font-plex font-medium max-md:text-base">
              {unitFormat(longOi, usdAmountDisplayDecimal, {
                style: 'currency',
                currency: 'USD',
              })}
              {' / '}
              {unitFormat(shortOi, usdAmountDisplayDecimal, {
                style: 'currency',
                currency: 'USD',
              })}
            </span>
          ) : (
            <Skeleton className="h-3.5 w-20" />
          )}
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="text-t-270 flex w-90 flex-col gap-2 rounded-2xl p-3"
        >
          <div>{t`Total USDT value of all open long/short positions in this market.`}</div>
          <div className="bg-bg-5 mt-3 rounded-lg p-2">
            <OpenInterestRatio
              longOiUsd={longOi.toString()}
              shortOiUsd={shortOi.toString()}
              usdAmountDisplayDecimal={usdAmountDisplayDecimal}
            />
          </div>
        </TooltipContent>
      </Tooltip>
      {inst?.category !== CREDIT_MARKET_CATEGORY && (
        <LossRebate marketAddress={inst?.marketTokenAddress || ''} />
      )}
      <NetRate />
    </>
  );
};

export default Liq;
