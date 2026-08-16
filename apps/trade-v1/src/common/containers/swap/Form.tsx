'use client';

import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
} from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { useForm, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import { useShallow } from 'zustand/react/shallow';
import { Form as BasicForm, FormControl, FormField } from '@repo/ui';

import { useWatchFormChange } from '../../hooks/useWatchFormChange';
import { TRADE_TYPE } from '../../services/enum';
import CoinSzInput from './CoinSzInput';
import FormBtn from './FormBtn';

import { useFormAction } from './hooks/useFormAction';
import { SwapForm, useSwapStore } from './store';
import SwitchBtn from './SwitchBtn';

interface SwapProps {
  onChange?: (value: Partial<SwapForm>) => void;
}

const Form = forwardRef<unknown, SwapProps>((_, ref) => {
  const { t } = useLingui();
  const [formData, updateFormData] = useSwapStore(
    useShallow((state) => [state.formData, state.updateFormData]),
  );
  const FormSchema = useMemo(
    () =>
      z.object({
        px: z.string(),
        pxIsReversed: z.boolean(),
        paySz: z.object({
          value: z.string(),
          coin: z.string(),
        }),
        receiveSz: z.object({
          value: z.string(),
          coin: z.string(),
        }),
      }),
    [],
  );

  const onChange = useCallback(
    (values: Partial<SwapForm>) => {
      updateFormData(TRADE_TYPE.swap, values);
    },
    [updateFormData],
  );

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: formData[TRADE_TYPE.swap],
  });

  const {
    onSubmit,
    isSubmitting,
    onPaySzChange,
    onReceiveSzChange,
    onSwitchCoins,
    // onPxChange,
  } = useFormAction(form as UseFormReturn<SwapForm>);

  useImperativeHandle(ref, () => {
    return { form, onPaySzChange, onReceiveSzChange };
  }, [form, onPaySzChange, onReceiveSzChange]);

  // watch form
  useWatchFormChange<z.infer<typeof FormSchema>>(form, onChange);

  return (
    <BasicForm {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto flex w-full flex-col gap-3"
      >
        {/* <div className="text-4xl/[0.9] font-semibold">{t`Swap`}</div> */}
        {/* order tyep */}
        {/* price input */}
        {/* <div className="mt-6 flex w-full flex-col">
          <FormField
            control={form.control}
            name="px"
            render={({ field }) => (
              <FormItem className="shrink-1 grow-1 gap-3">
                <div className="flex h-7.5 items-start justify-between gap-4">
                  <OrderTypeTabs />
                  <Slippage className="h-8" />
                </div>
                <FormControl>
                  <PriceInput value={field.value} onChange={onPxChange} />
                </FormControl>
              </FormItem>
            )}
          /> */}
        <div className="relative flex w-full flex-col items-center gap-1">
          {/* pay size input */}
          <FormField
            control={form.control}
            name="paySz"
            render={({ field }) => (
              <FormControl>
                <CoinSzInput
                  className="w-full"
                  label={t`Pay`}
                  showBalance
                  value={field.value.value}
                  coin={field.value.coin}
                  onChange={onPaySzChange}
                />
              </FormControl>
            )}
          />

          <div className="relative h-0">
            <SwitchBtn onSwitch={onSwitchCoins} />
          </div>

          {/* receive size input */}
          <FormField
            control={form.control}
            name="receiveSz"
            render={({ field }) => (
              <FormControl>
                <CoinSzInput
                  className="w-full"
                  defaultCoin={'quoteCoin'}
                  showBalance={false}
                  label={t`Receive`}
                  value={field.value.value}
                  coin={field.value.coin}
                  onChange={onReceiveSzChange}
                />
              </FormControl>
            )}
          />
        </div>
        {/* </div> */}

        <FormBtn isPending={isSubmitting} />
      </form>
    </BasicForm>
  );
});

Form.displayName = 'Swap';

export default Form;
