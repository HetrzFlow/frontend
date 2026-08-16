import { Separator } from '@repo/ui';

import { Market, Kline, TradingSm, Order } from '../modules';

const LayoutSm: React.FC = () => {
  return (
    <div className="h-full">
      <Separator />
      <div className="scrollbar-none h-full overflow-y-auto">
        <Market />
        <Separator />
        <Kline />
        <Separator />
        <Order className="h-full" />
      </div>
      <TradingSm />
    </div>
  );
};

export default LayoutSm;
