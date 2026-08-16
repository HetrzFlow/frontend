'use client';

import { useInstStore } from '@/common';
import BaseStatus from '@/common/containers/status';
import { useTradeGlobalStore } from '@/stores/trade/global';

const Status = () => {
  const instId = useTradeGlobalStore((state) => state.instId);
  const insts = useInstStore((state) => state.getInsts());

  if (!instId || !insts[instId]) {
    return null;
  }

  return (
    <BaseStatus
      className="mt-[2px]"
      marketAddress={insts[instId].marketTokenAddress}
    />
  );
};

export default Status;
