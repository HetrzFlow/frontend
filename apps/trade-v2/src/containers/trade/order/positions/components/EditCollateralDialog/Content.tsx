import { FC, useMemo } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';

import { useForm } from 'react-hook-form';
import z from 'zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from '@repo/ui';
import type { Position } from '@/common';

import { Context } from '../../context';
import { TYPE } from './enum';
import { useFormAction } from './hooks/useFormAction';
import TypeTabs from './TypeTabs';

interface ContentProps {
  position: Position;
  onOpenChange: (open: boolean) => void;
}

const Content: FC<ContentProps> = ({ position, onOpenChange }) => {
  const FormSchema = useMemo(
    () =>
      z.object({
        type: z.string(),
        size: z.string(),
        orderKey: z.string(),
        tpPx: z.string(),
      }),
    [],
  );

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      type: TYPE.deposit,
      size: '',
      orderKey: '',
      tpPx: '',
    },
  });

  const { onSubmit, onTypeChange } = useFormAction({
    onOpenChange,
    form,
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
            name="type"
            render={({ field }) => {
              return (
                <FormItem className="shrink-1 grow-1 gap-0">
                  <FormControl>
                    <TypeTabs value={field.value} onChange={onTypeChange} />
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
