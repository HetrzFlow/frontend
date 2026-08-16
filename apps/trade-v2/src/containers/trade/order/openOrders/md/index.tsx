import { FC } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { useInstStore } from '@/common';
import type { Order } from '@/common';

import Table from '@/components/Table';
import { buildTradeRouteInstIdByCategory } from '@/lib/credit/creditMarkets';
import { useTradeGlobalStore } from '@/stores/trade/global';
import { useColumns } from './useColumns';

interface OpenOrdersProps {
  data: Order[];
  inactiveOrderIds: Set<string>;
  isLoading: boolean;
  onCancel: (order: Order[]) => void;
  onEditPrice: (id: string) => void;
  focusedOrderId: string | null;
}

const OpenOrdersMd: FC<OpenOrdersProps> = ({
  data,
  inactiveOrderIds,
  isLoading,
  onCancel,
  onEditPrice,
  focusedOrderId,
}) => {
  const { t } = useLingui();
  const columns = useColumns({
    inactiveOrderIds,
    onCancel,
    onEditPrice,
  });

  const router = useRouter();
  const pathname = usePathname();
  const insts = useInstStore((state) => state.getInsts());
  const [curInstId, persistedRouteInstId] = useTradeGlobalStore(
    useShallow((state) => [state.instId, state.routeInstId]),
  );
  const setInst = useTradeGlobalStore((state) => state.setInst);
  return (
    <Table
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      focusedRowId={focusedOrderId}
      isLoading={isLoading}
      emptyMessage={t`No pending orders found.`}
      onRowClick={(data) => {
        const inst = insts[data.marketAddress];
        if (inst) {
          setInst(inst);
          const curInst = insts[curInstId];
          const curRouteInstId = curInst
            ? buildTradeRouteInstIdByCategory(curInst.name, curInst.category)
            : persistedRouteInstId;
          const nextRouteInstId = buildTradeRouteInstIdByCategory(
            inst.name,
            inst.category,
          );
          router.replace(
            pathname.replace(`/${curRouteInstId}`, `/${nextRouteInstId}`),
          );
        }
      }}
      bodyRowClassName="[contain-intrinsic-size:auto_44px] [content-visibility:auto]"
    />
  );
};

export default OpenOrdersMd;
