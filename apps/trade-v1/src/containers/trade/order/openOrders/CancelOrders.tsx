import { useLingui } from '@lingui/react/macro';

import { Button, LoaderCircleIcon } from '@repo/ui';
import { useCancelOrder, useOpenOrders, useInstStore } from '@/common';
import { useGlobalStore } from '@/stores/trade/global';
import { useOrdersStore } from '../store';
import { useOpenOrdersStore } from './store';

const CancelOrders = () => {
  const { t } = useLingui();
  const instId = useGlobalStore((state) => state.instId);
  const inst = useInstStore((state) => state.getInst(state, instId));
  const onlyShowCurrentInst = useOrdersStore(
    (state) => state.onlyShowCurrentInst,
  );
  const { data: orders, refetch } = useOpenOrders({
    coinType: onlyShowCurrentInst ? inst?.baseCoin : '',
  });

  const rowSelection = useOpenOrdersStore((state) => state.rowSelection);
  const selectedOrders =
    orders?.filter((order) => rowSelection[order.orderId]) || [];
  const count = selectedOrders.length;
  const { mutate: onCancel, isPending } = useCancelOrder({
    refetchOrders: refetch,
  });

  if (!count) return null;

  return (
    <Button
      size="sm"
      type="button"
      disabled={isPending}
      className="text-secondary-foreground hover:text-t-1100 font-medium"
      onClick={() => onCancel(selectedOrders)}
    >
      {isPending && <LoaderCircleIcon size={16} className="animate-spin" />}
      {t`Cancel ${count} orders`}
    </Button>
  );
};

export default CancelOrders;
