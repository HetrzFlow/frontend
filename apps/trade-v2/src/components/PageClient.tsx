'use client';

import { FC, useEffect } from 'react';
import { useInstStore } from '@/common';
import { selectInstForTradeRoute } from '@/lib/credit/creditMarkets';
import { useTradeGlobalStore } from '@/stores/trade/global';

const PageClient: FC<{ routeName: string; isCreditMarketRoute?: boolean }> = ({
  routeName,
  isCreditMarketRoute = false,
}) => {
  const curInstId = useTradeGlobalStore((state) => state.instId);
  const setInst = useTradeGlobalStore((state) => state.setInst);
  const viewInsts = useInstStore((state) => state.getViewInstsArr());

  useEffect(() => {
    if (!viewInsts.length) return;

    const inst =
      selectInstForTradeRoute({
        insts: viewInsts,
        routeName,
        isCreditMarketRoute,
        preferredInstId: curInstId,
      }) ??
      viewInsts[0];

    if (inst) {
      setInst(inst);
    }
  }, [routeName, isCreditMarketRoute, curInstId, setInst, viewInsts]);

  return null;
};

export default PageClient;
