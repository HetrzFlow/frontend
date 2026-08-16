import { memo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ORDER_TYPE } from '@/common/services/enum';
import BasicSlippage from '@/components/Slippage';

import { useTradeStore } from '../store';

const Slippage = () => {
  const [smDialogOpen, orderType] = useTradeStore(
    useShallow((state) => [state.smDialogOpen, state.orderType]),
  );

  if (orderType === ORDER_TYPE.limit) {
    return null;
  }

  return (
    <BasicSlippage
      inDialog={smDialogOpen}
      collisionBoundary={document.querySelector('.tradingContainer')}
      collisionPadding={smDialogOpen ? 16 : 8}
    />
  );
};

export default memo(Slippage);
