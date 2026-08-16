import { TRADE_TYPE } from '@/constants/enum';
import { useTradeStore } from '../store';

import PositionInfo from './PositionInfo';

const HelpfulInfo = () => {
  const tradeType = useTradeStore((state) => state.tradeType);
  return <PositionInfo isLong={tradeType === TRADE_TYPE.long} />;
};

export default HelpfulInfo;
