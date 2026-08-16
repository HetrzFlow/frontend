import { useState } from 'react';
import { t } from '@lingui/core/macro';
import { LightningChargeIcon, Loading } from '@repo/ui';
import { useSmartMoneyTrades, useWhaleTrades } from '@/common/services';
import Item from './Item';
import Tabs from './Tabs';

const Content = () => {
  const [tabValue, setTabValue] = useState('all');
  const { data: smartMoneyTrades = [], isLoading: isLoadingSmart } =
    useSmartMoneyTrades();
  const { data: whaleTrades = [], isLoading: isLoadingWhale } =
    useWhaleTrades();

  const listData =
    tabValue === 'whales'
      ? whaleTrades
      : tabValue === 'smartFlows'
        ? smartMoneyTrades
        : whaleTrades.concat(smartMoneyTrades).sort((a, b) => {
            return a.action_time_ms - b.action_time_ms > 0 ? -1 : 1;
          });

  return (
    <div className="flex flex-col text-xs">
      <div className="text-t-1100 mb-3 flex items-center gap-1 text-sm font-medium">
        <LightningChargeIcon size={16} />
        {t`Smart Flows`}
      </div>
      <Tabs value={tabValue} onChange={setTabValue} />
      <div className="scrollbar-none mt-3 flex h-60 flex-col gap-1 overflow-y-auto">
        {isLoadingSmart || isLoadingWhale ? (
          <Loading />
        ) : (
          listData?.map((v, i) => {
            return (
              <Item
                key={i}
                userAvatar={v.userAvatar}
                userAddress={v.user_address}
                isLong={v.is_long}
                time={v.action_time_ms}
                symbol={v.symbol}
                size={v.sizeUsd}
                price={v.price}
                pnl={v.realized_pnl}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default Content;
