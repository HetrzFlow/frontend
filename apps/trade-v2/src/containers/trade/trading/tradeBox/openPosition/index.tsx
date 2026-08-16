import { forwardRef, useImperativeHandle, useMemo } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { type DeepPartial, useForm, type UseFormReturn } from 'react-hook-form';
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
import TpSl from './TpSl';
import type { OpenPositionSwapController } from './hooks/useOpenPositionSwap';

interface OpenPositionProps {
  posSide: POS_SIDE;
  onChange?: (value: DeepPartial<PositionForm>) => void;
  swap: OpenPositionSwapController;
}

export interface OpenPositionHandle {
  getPaySz: () => PositionForm['paySz'];
  setPrice: (price: string) => void;
  syncInstChange: (payload: { coin: string; px: string }) => void;
}

const OpenPosition = forwardRef<OpenPositionHandle, OpenPositionProps>(
  ({ posSide, onChange, swap }, ref) => {
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
            token: z
              .object({
                name: z.string().optional(),
                symbol: z.string(),
                decimals: z.number(),
                decimal: z.number().optional(),
                logoURI: z.string().optional(),
                price: z.string().optional(),
                balance: z.string().optional(),
              })
              .optional(),
          }),
          lever: z.string(),
          tpsl: z.object({
            open: z.boolean(),
            tpPx: z.string(),
            slPx: z.string(),
          }),
        }),
      [],
    );

    const form = useForm<z.infer<typeof FormSchema>>({
      resolver: zodResolver(FormSchema),
      defaultValues: formData[isLong ? TRADE_TYPE.long : TRADE_TYPE.short],
    });
    // watch form
    useWatchFormChange<z.infer<typeof FormSchema>>(form, onChange);

    const {
      onSubmit,
      isSubmitting,
      submitStage,
      onPaySzChange,
      onLeverChange,
      onPxChange,
    } = useFormAction(form as UseFormReturn<PositionForm>, swap);

    useImperativeHandle(
      ref,
      () => ({
        getPaySz: () => form.getValues('paySz'),
        setPrice: onPxChange,
        syncInstChange: ({ coin, px }) => {
          form.setValue('px', px);
          const currentPaySz = form.getValues('paySz');
          onPaySzChange({
            value: currentPaySz?.value || '',
            coin,
          });
        },
      }),
      [form, onPaySzChange, onPxChange],
    );

    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={'flex w-full flex-col gap-2'}
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
                        isPending={isSubmitting}
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
                      className="max-md:border-border"
                      label={t`You're paying`}
                      value={field.value.value}
                      coin={field.value.coin}
                      token={
                        swap.isSwapPayment
                          ? swap.livePayToken || field.value.token
                          : field.value.token
                      }
                      maxBalance={swap.maxPayAmount}
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
            render={() => (
              <FormItem>
                <FormControl>
                  <Leverage isLong={isLong} onChange={onLeverChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tpsl"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <TpSl
                    isPending={isSubmitting}
                    isLong={isLong}
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormBtn
            isPending={isSubmitting}
            submitStage={submitStage}
            isLong={isLong}
            swap={swap}
          />
        </form>
      </Form>
    );
  },
);

OpenPosition.displayName = 'OpenPosition';

export default OpenPosition;
