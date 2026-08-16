'use client';
import React, { FC, useCallback, useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { useForm, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import { Form as BasicForm, FormControl, FormField, FormItem } from '@repo/ui';

import { HzlpTraderType } from '@/constants/hzlp/enum';
import { useFormAction } from '@/hooks/hzlp/useFormAction';
import { useWatchFormChange } from '@/hooks/hzlp/useWatchFormChange';
import { useTradeStore } from '@/stores/hzlp/trade';
import type { FormDataType } from '@/stores/hzlp/trade';
import CoinSzInputContainer from './CoinSzInputContainer';
import FeeContentContainer from './FeeContentContainer';
import FormBtnContainer from './FormBtnContainer';
import ImpactAlert from './ImpactAlert';

const HzlpTraderMain: FC<{ isBuy: boolean }> = ({ isBuy }) => {
  const { t } = useLingui();
  const formData = useTradeStore((state) => state.formData);
  const updateFormData = useTradeStore((state) => state.updateFormData);
  const setFormRef = useTradeStore((state) => state.setFormRef);

  const FormSchema = useMemo(
    () =>
      z.object({
        paySz: z.object({
          value: z.string().refine(
            (value) => {
              if (!value || isNaN(Number(value)) || Number(value) < 0) {
                return false;
              }
              return true;
            },
            {
              message: t`Please enter a valid amount`,
            },
          ),
          coin: z.string().min(1, t`Please select a coin`),
        }),
        receiveSz: z.object({
          value: z.string(),
          coin: z.string(),
        }),
      }),
    [t],
  );
  const onChange = useCallback(
    (values: Partial<FormDataType>) => {
      updateFormData(isBuy ? HzlpTraderType.Buy : HzlpTraderType.Sell, values);
    },
    [updateFormData, isBuy],
  );
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: formData[isBuy ? HzlpTraderType.Buy : HzlpTraderType.Sell],
  });

  useEffect(() => {
    setFormRef(
      isBuy
        ? { [HzlpTraderType.Buy]: form as UseFormReturn<FormDataType> }
        : {
            [HzlpTraderType.Sell]: form as UseFormReturn<FormDataType>,
          },
    );

    return () => {
      setFormRef(
        isBuy
          ? { [HzlpTraderType.Buy]: null }
          : {
              [HzlpTraderType.Sell]: null,
            },
      );
    };
  }, [form, setFormRef, isBuy]);

  useWatchFormChange<z.infer<typeof FormSchema>>(form, onChange);

  const {
    onSubmit,
    isSubmitting,
    isCalcing,
    handlePaySzChange,
    handleReceiveSzChange,
  } = useFormAction(form as UseFormReturn<FormDataType>);

  return (
    <>
      <BasicForm {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex w-full flex-col gap-4"
        >
          <div className="grid grid-cols-1 gap-2">
            <FormField
              control={form.control}
              name="paySz"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <CoinSzInputContainer
                      label={t`Paying`}
                      showBalance={true}
                      disabledSelector={!isBuy}
                      isBuy={isBuy}
                      value={field.value}
                      onChange={handlePaySzChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="receiveSz"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <CoinSzInputContainer
                      label={t`Receive`}
                      showBalance={false}
                      disabled
                      disabledSelector={isBuy}
                      isBuy={isBuy}
                      value={field.value}
                      onChange={handleReceiveSzChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <FeeContentContainer
            form={form as UseFormReturn<FormDataType>}
            handlePaySzChange={handlePaySzChange}
          />
          <ImpactAlert />
          <FormBtnContainer
            isBuy={isBuy}
            isPending={isSubmitting}
            isCalculating={isCalcing}
          />
        </form>
      </BasicForm>
    </>
  );
};

HzlpTraderMain.displayName = 'HzlpTraderMain';

export default HzlpTraderMain;
