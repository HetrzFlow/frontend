import { FC, useMemo } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';

import { useForm } from 'react-hook-form';
import z from 'zod';

import { useShallow } from 'zustand/react/shallow';
import { Form, FormControl, FormField, FormItem } from '@repo/ui';
import type { Position } from '@/common';
import { useInstStore } from '@/common';

import { MARKET_PX } from '@/constants/common';
import { ORDER_TYPE } from '@/constants/enum';

import { Context } from '../context';
import OrderTypeTabs from './OrderTypeTabs';
import { useFormAction } from './useFormAction';

interface ContentProps {
  position: Position;
  onOpenChange: (open: boolean) => void;
}

const Content: FC<ContentProps> = ({ position, onOpenChange }) => {
  const [baseCoin, usdcCoin] = useInstStore(
    useShallow((state) => [
      state.getCoins()[position.targetCoin],
      state.getUsdcCoin(state),
    ]),
  );
  const FormSchema = useMemo(
    () =>
      z.object({
        orderType: z.string(),
        px: z.string(),
        size: z.string(),
        receiveCoinType: z.string(),
      }),
    [],
  );

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      orderType: ORDER_TYPE.market,
      px: MARKET_PX,
      size: '',
      receiveCoinType: position.isLong
        ? baseCoin?.coinType
        : usdcCoin?.coinType,
    },
  });

  const { onSubmit } = useFormAction({
    onOpenChange,
    position,
  });

  return (
    <Context.Provider value={position}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex w-full flex-col gap-4"
        >
          {/* order type */}
          <FormField
            control={form.control}
            name="orderType"
            render={({ field }) => {
              return (
                <FormItem className="shrink-1 grow-1 gap-0">
                  <FormControl>
                    <OrderTypeTabs
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              );
            }}
          />
        </form>
      </Form>
    </Context.Provider>
  );
};

export default Content;
