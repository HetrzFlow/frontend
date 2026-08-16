import { FC } from 'react';

import { useLingui } from '@lingui/react/macro';
import RecentTrades from './recentTrades';
// import SmartFlows from './smartFlows';

export interface TradesProps {
  className?: string;
}

const Trades: FC<TradesProps> = ({ className }) => {
  const { t } = useLingui();

  return (
    <>
      <h2 className="sr-only">{t`Recent Trades`}</h2>
      <RecentTrades className={className} />
      {/* <TradeTabs
        value={tabValue}
        onValueChange={setTabValue}
        className={cn('h-full gap-2', className)}
        listClassName="flex gap-2 font-medium justify-start"
        labelClassName="rounded-xl px-4 py-2 data-[state=active]:text-t-1100 grow-0"
        contentWrapClassName={'h-[calc(100%-40px)] shrink-0'}
        activeBarClassName="bg-bg-3 max-md:bg-bg-3-h5 rounded-xl px-4 py-2"
        options={[
          {
            value: 'recentTrades',
            label: t`Recent Trades`,
            content: <RecentTrades />,
          },
          {
            value: 'smartFlows',
            label: t`Smart Flows`,
            content: <SmartFlows />,
          },
        ]}
      /> */}
    </>
  );
};

export default Trades;
