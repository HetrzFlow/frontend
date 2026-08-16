import { useLingui } from '@lingui/react/macro';
import { Separator } from '@repo/ui';

import Status from '@/containers/trade/status';
import {
  Kline,
  TradingSm,
  Order,
  MarketTickerBar,
  MarketSm,
  TradesSm,
  // Widgets,
} from '../modules';

const LayoutSm: React.FC = () => {
  const { t } = useLingui();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 h-full">
      <Status />
      <Separator />
      <MarketTickerBar />
      <Separator />
      <div className="scrollbar-none h-full overflow-x-hidden overflow-y-auto">
        <h2 className="sr-only">{t`Market Selection`}</h2>
        <MarketSm />
        <Separator />
        <h2 className="sr-only">{t`Price Chart`}</h2>
        <Kline />
        <Separator />
        <div className="flex justify-between gap-4 px-4 py-3">
          <TradesSm className="w-full" />
          {/* <Separator orientation="vertical" className="h-auto" />
          <Widgets className="w-1/2" /> */}
        </div>
        <Separator />
        <Order className="min-h-full" />
      </div>
      <TradingSm />
    </div>
  );
};

export default LayoutSm;
