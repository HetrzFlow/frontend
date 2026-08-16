import { FC, useMemo } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';

import { useForm } from 'react-hook-form';
import z from 'zod';

import { calc } from '@repo/lib/calc';
import { Form, FormControl, FormField, FormItem } from '@repo/ui';
import type { Order, Position } from '@/common/services';

import CloseSizeInput from './CloseSizeInput';
import { Context, SizeEditCtx } from './context';
import FormBtn from './FormBtn';
import HelpfulInfo from './HelpfulInfo';
import { useFormAction } from './hooks/useFormAction';
import PriceInput from './PriceInput';

interface ContentProps {
  order: Order;
  position?: Position;
  initialValues?: { price?: string };
  onOpenChange: (open: boolean, modified?: boolean) => void;
  sizeEditable?: boolean;
  allOrders?: Order[];
}

const Content: FC<ContentProps> = ({
  order,
  position,
  initialValues,
  onOpenChange,
  sizeEditable,
  allOrders,
}) => {
  const maxCloseSize = useMemo(() => {
    if (!sizeEditable || !position) return '0';
    return position.sizeInUsd;
  }, [sizeEditable, position]);

  const FormSchema = useMemo(
    () =>
      z.object({
        px: z.string(),
        size: z.string().optional(),
      }),
    [],
  );

  const form = useForm<{ px: string; size?: string }>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      px: initialValues?.price || order.triggerPrice,
      ...(sizeEditable
        ? { size: calc(order.sizeDeltaUsd).abs().toFixed() }
        : {}),
    },
  });

  const { onSubmit } = useFormAction({
    onOpenChange,
    form,
    order,
    sizeEditable,
  });

  const sizeEditCtxValue = useMemo(
    () => ({
      sizeEditable: !!sizeEditable,
      position,
      allOrders,
      maxCloseSize,
    }),
    [sizeEditable, position, allOrders, maxCloseSize],
  );

  return (
    <Context.Provider value={order}>
      <SizeEditCtx.Provider value={sizeEditCtxValue}>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex w-full flex-col gap-4"
          >
            <div>
              {sizeEditable && (
                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <CloseSizeInput
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          maxCloseSize={maxCloseSize}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="px"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <PriceInput
                        position={position}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <HelpfulInfo position={position} />
            <FormBtn position={position} />
          </form>
        </Form>
      </SizeEditCtx.Provider>
    </Context.Provider>
  );
};

export default Content;
