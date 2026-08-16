'use client';

import HertzFlowText from './HertzFlowText';
import TradePageImage from './TradePageImage';

const TradePage = () => {
  return (
    <div className="relative mt-15 lg:mt-30">
      <h2 className="sr-only">HertzFlow Trading Platform</h2>
      <HertzFlowText />
      <TradePageImage />
    </div>
  );
};

export default TradePage;
