import { FC, useCallback, useMemo } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';

import { useForm } from 'react-hook-form';
import z from 'zod';

import { Form, FormControl, FormField, FormItem } from '@repo/ui';
import type { Position } from '@/common';

import { ORDER_TYPE } from '@/constants/enum';
import { MARKET_PX } from '@/constants/trade';

import { Context } from '../../context';
import { useFormAction } from './hooks/useFormAction';
import OrderTypeTabs from './OrderTypeTabs';
import OrderTypeTabsContent from './OrderTypeTabsContent';

export interface ContentProps {
  defaultValues?: {
    orderType: ORDER_TYPE;
  };
  /** When 'tpsl-only', hides Market/Limit tabs and defaults to TP/SL order type */
  mode?: 'default' | 'tpsl-only';
  position: Position;
  onOpenChange: (open: boolean) => void;
}

const Content: FC<ContentProps> = ({
  position,
  onOpenChange,
  defaultValues,
  mode = 'default',
}) => {
  const isTpSlOnly = mode === 'tpsl-only';

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
      orderType: isTpSlOnly
        ? ORDER_TYPE['tp/sl']
        : defaultValues?.orderType || ORDER_TYPE.market,
      px: isTpSlOnly ? '' : MARKET_PX,
      size: '',
      receiveCoinType: position.collateralTokenAddress,
    },
  });

  const { onSubmit } = useFormAction({
    onOpenChange,
    position,
  });

  const handleOrderTypeChange = useCallback(
    (value: string) => {
      form.setValue('orderType', value);
      if (value === ORDER_TYPE.market) {
        form.setValue('px', MARKET_PX);
      }
    },
    [form],
  );

  return (
    <Context.Provider value={position}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex w-full flex-col gap-4"
        >
          {isTpSlOnly ? (
            /* tpsl-only mode: render TP/SL content directly, no tabs */
            <OrderTypeTabsContent orderType={ORDER_TYPE['tp/sl']} mode={mode} />
          ) : (
            /* default mode: show order type tabs */
            <FormField
              control={form.control}
              name="orderType"
              render={({ field }) => {
                return (
                  <FormItem className="shrink-1 grow-1 gap-0">
                    <FormControl>
                      <OrderTypeTabs
                        value={field.value}
                        onChange={handleOrderTypeChange}
                      />
                    </FormControl>
                  </FormItem>
                );
              }}
            />
          )}
        </form>
      </Form>
    </Context.Provider>
  );
};

export default Content;
