import { FC, useMemo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '@repo/ui';
import BasicOrderTypeTabs from '../../components/OrderTypeTabs';
import { ORDER_TYPE } from '../../services/enum';
import { useSwapStore } from './store';

const OrderTypeTabs: FC = () => {
  const { t } = useLingui();
  const [orderType, setOrderType] = useSwapStore(
    useShallow((state) => [
      state.orderType as ORDER_TYPE.limit | ORDER_TYPE.market,
      state.setOrderType,
    ]),
  );

  const shapes = useMemo(() => {
    return {
      [ORDER_TYPE.market]: {
        className: cn(`h-8 rounded-full bg-bg-3 dark:bg-bg-3`),
        widthCompensation: 0,
        xOffset: 0,
      },
      [ORDER_TYPE.limit]: {
        className: cn('h-8 rounded-full bg-bg-3 dark:bg-bg-3'),
        widthCompensation: 0,
        xOffset: 0,
      },
    };
  }, []);

  const options = useMemo(() => {
    return [
      {
        value: ORDER_TYPE.market,
        label: t`Swap`,
        activeBarProps: shapes[ORDER_TYPE.market],
        className: 'px-4 py-2',
      },
      // {
      //   value: ORDER_TYPE.limit,
      //   label: t`Limit`,
      //   activeBarProps: shapes[ORDER_TYPE.limit],
      //   className: 'px-4 py-2',
      // },
    ];
  }, [t, shapes]);

  return (
    <BasicOrderTypeTabs
      className={cn('h-full w-auto')}
      value={orderType}
      onValueChange={setOrderType as (value: string) => void}
      options={options}
    />
  );
};

export default OrderTypeTabs;
