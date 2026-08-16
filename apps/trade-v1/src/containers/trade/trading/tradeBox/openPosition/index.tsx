import { forwardRef, useEffect, useImperativeHandle, useMemo } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { useForm, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import { Form, FormControl, FormField, FormItem } from '@repo/ui';

import { POS_SIDE, TRADE_TYPE } from '@/constants/enum';
import { useWatchFormChange } from '@/hooks/useWatchFormChange';
import { PositionForm, useTradeStore } from '../../store';
import CoinSzInput from './CoinSzInput';

import FormBtn from './FormBtn';
import { useFormAction } from './hooks/useFormAction';
import Leverage from './Leverage';
import OrderTypeTabs from './OrderTypeTabs';
import PriceInput from './PriceInput';

interface OpenPositionProps {
  posSide: POS_SIDE;
  onChange?: (value: Partial<PositionForm>) => void;
}

const OpenPosition = forwardRef<unknown, OpenPositionProps>(
  ({ posSide, onChange }, ref) => {
    const { t } = useLingui();

    const formData = useTradeStore((state) => state.formData);
    const isLong = posSide === POS_SIDE.long;

    const FormSchema = useMemo(
      () =>
        z.object({
          px: z.string(),
          paySz: z.object({
            value: z.string(),
            coin: z.string(),
          }),
          lever: z.string(),
        }),
      [],
    );

    const form = useForm<z.infer<typeof FormSchema>>({
      resolver: zodResolver(FormSchema),
      defaultValues: formData[isLong ? TRADE_TYPE.long : TRADE_TYPE.short],
    });

    useImperativeHandle(ref, () => {
      return form;
    }, [form]);

    // watch form
    useWatchFormChange<z.infer<typeof FormSchema>>(form, onChange);

    const { onSubmit, isSubmitting, onPaySzChange, onLeverChange, onPxChange } =
      useFormAction(form as UseFormReturn<PositionForm>);

    // calc size, fee
    useEffect(() => {
      onPaySzChange(form.getValues('paySz'));
    }, [form, onPaySzChange]);

    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex w-full flex-col gap-3"
        >
          <div className="flex flex-col gap-2">
            {/* price input */}
            <FormField
              control={form.control}
              name="px"
              render={({ field }) => {
                return (
                  <FormItem className="shrink-1 grow-1 gap-3">
                    <div className="flex h-7.5 items-start justify-between gap-4">
                      {/* order type tabs */}
                      <OrderTypeTabs className="h-full grow-1" />
                    </div>
                    <FormControl>
                      <PriceInput
                        isLong={isLong}
                        value={field.value}
                        onChange={onPxChange}
                      />
                    </FormControl>
                  </FormItem>
                );
              }}
            />

            {/* size input */}
            <FormField
              control={form.control}
              name="paySz"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <CoinSzInput
                      defaultCoin={isLong ? 'baseCoin' : 'quoteCoin'}
                      label={t`You're paying`}
                      value={field.value.value}
                      coin={field.value.coin}
                      onChange={onPaySzChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="lever"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Leverage
                    isLong={isLong}
                    value={field.value}
                    onChange={onLeverChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormBtn isPending={isSubmitting} isLong={isLong} />
        </form>
      </Form>
    );
  },
);

OpenPosition.displayName = 'OpenPosition';

export default OpenPosition;
