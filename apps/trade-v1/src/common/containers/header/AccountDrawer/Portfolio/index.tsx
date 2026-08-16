import { memo } from 'react';
import { ScrollBox } from '@repo/ui';
import Assets from './Assets';
import PerpOrders from './PerpOrders';
import Positions from './Positions';

const Portfolia = () => {
  return (
    <ScrollBox
      shadowClassName="to-bg-drawer-shadow absolute bottom-0 mx-6 h-12 w-[calc(100%-calc(var(--spacing)*12))] bg-gradient-to-b from-transparent"
      scrollClassName="scrollbar-none relative flex max-md:h-[calc(100dvh-380px)] h-[calc(100dvh-218px)] flex-col gap-[12px] overflow-y-auto px-6 pb-6 max-md:pb-4"
    >
      <Assets />
      <PerpOrders />
      <Positions />
      {/* <SwapOrders /> */}
    </ScrollBox>
  );
};

export default memo(Portfolia);
