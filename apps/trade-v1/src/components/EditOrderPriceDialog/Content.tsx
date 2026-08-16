import { FC, useMemo } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';

import { useForm } from 'react-hook-form';
import z from 'zod';

import { Form, FormControl, FormField, FormItem } from '@repo/ui';
import type { Order } from '@/common';

import { Context } from './context';
import FormBtn from './FormBtn';
import HelpfulInfo from './HelpfulInfo';
import PriceInput from './PriceInput';
import { useFormAction } from './useFormAction';

interface ContentProps {
  order: Order;
  initialValues?: { price?: string };
  onOpenChange: (open: boolean, modified?: boolean) => void;
}

const Content: FC<ContentProps> = ({ order, initialValues, onOpenChange }) => {
  const FormSchema = useMemo(
    () =>
      z.object({
        px: z.string(),
      }),
    [],
  );

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      px: initialValues?.price || order.triggerPrice,
    },
  });

  const { onSubmit } = useFormAction({
    onOpenChange,
    form,
    order,
  });

  return (
    <Context.Provider value={order}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex w-full flex-col gap-4"
        >
          <FormField
            control={form.control}
            name="px"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <PriceInput value={field.value} onChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <HelpfulInfo />
          <FormBtn />
        </form>
      </Form>
    </Context.Provider>
  );
};

export default Content;
