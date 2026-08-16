import { memo } from 'react';
import { FEE_BPS_POWER } from '@hertzflow/sdk';
import { useLingui } from '@lingui/react/macro';

import { calc } from '@repo/lib/calc';
import { percentFormat, unitFormat } from '@repo/lib/format';
import {
  useGlobalStore as useCommonGlobalStore,
  useRealtimeConfig,
  usePositionLiqPoolData,
  useInstStore,
} from '@/common';
import { useGlobalStore } from '@/stores/trade/global';

const Liq = () => {
  const instId = useGlobalStore((state) => state.instId);
  const usdAmountDisplayDecimal = useCommonGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const inst = useInstStore((state) => state.getInst(state, instId));

  const { data } = usePositionLiqPoolData(instId);
  const realtimeConfig = useRealtimeConfig({
    coinType: inst?.baseCoin,
  });

  const { t } = useLingui();

  return (
    <>
      <div className="flex h-full shrink-0 flex-col justify-between max-md:justify-self-end md:mr-2">
        <p className="text-t-270 text-xs">{t`Liquidity(L/S)`}</p>
        <span className="font-plex text-sm font-medium">
          {unitFormat(data?.longLiq || '', usdAmountDisplayDecimal, {
            style: 'currency',
            currency: 'USD',
          })}
          {' / '}
          {unitFormat(data?.shortLiq || '', usdAmountDisplayDecimal, {
            style: 'currency',
            currency: 'USD',
          })}
        </span>
      </div>
      <div className="flex h-full shrink-0 flex-col justify-between md:mr-2">
        <p className="text-t-270 text-xs">{t`Open Interest(L/S)`}</p>
        <span className="font-plex text-sm font-medium">
          {unitFormat(data?.longOpenInterest || '', usdAmountDisplayDecimal, {
            style: 'currency',
            currency: 'USD',
          })}
          {' / '}
          {unitFormat(data?.shortOpenInterest || '', usdAmountDisplayDecimal, {
            style: 'currency',
            currency: 'USD',
          })}
        </span>
      </div>
      <div className="flex h-full shrink-0 flex-col justify-between">
        <p className="text-t-270 text-xs">{t`Borrow Rate(L/S)`}</p>
        <span className="font-plex text-sm font-medium">
          {percentFormat(
            calc(realtimeConfig?.fundingRateBps || '').div(FEE_BPS_POWER),
            3,
            { stripTrailingZeros: true },
          )}
          {' / '}
          {percentFormat(
            calc(realtimeConfig?.stableFundingRateBps || '').div(FEE_BPS_POWER),
            3,
            { stripTrailingZeros: true },
          )}
        </span>
      </div>
    </>
  );
};

export default memo(Liq);
