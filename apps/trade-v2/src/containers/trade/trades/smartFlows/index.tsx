import { useLingui } from '@lingui/react/macro';
import { Loading, ScrollBox } from '@repo/ui';
import { useInstStore } from '@/common';
import { useSmartMoneyTrades } from '@/common/services';
import { useTradeGlobalStore } from '@/stores/trade/global';
import Item from './Item';

const SmartFlows = () => {
  const { t } = useLingui();
  const instId = useTradeGlobalStore((state) => state.instId);
  const { data, isLoading } = useSmartMoneyTrades({ instId });
  const pxDispDecimal = useInstStore(
    (state) => state.getInst(state, instId)?.pxDispDecimal,
  );
  return (
    <div className="h-full">
      <div className="text-t-270 flex border-b p-2 max-md:text-xs">
        <span className="w-4/9">{t`Price`}</span>
        <span className="w-1/3">{t`Size`}</span>
        <span className="w-2/9 text-right">{t`Time`}</span>
      </div>
      {isLoading ? (
        <Loading className="h-[calc(100%-32px)]" />
      ) : (
        <ScrollBox className="h-[calc(100%-32px)]">
          {!data || !data.length ? (
            <div className="text-t-270 mt-10 text-center">{t`No Results`}</div>
          ) : (
            data?.map((v, i) => (
              <Item
                key={i}
                price={v.price}
                pxDispDecimal={pxDispDecimal}
                size={v.sizeUsd}
                time={v.action_time_ms}
                isBuy={
                  (v.action_type === 'increase' && v.is_long) ||
                  (v.action_type !== 'increase' && !v.is_long)
                }
              />
            ))
          )}
        </ScrollBox>
      )}
    </div>
  );
};

export default SmartFlows;
