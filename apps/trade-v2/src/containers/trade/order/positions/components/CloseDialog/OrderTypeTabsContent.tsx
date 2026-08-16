import { FC, useEffect } from 'react';

import { useFormContext, UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem } from '@repo/ui';

import { ORDER_TYPE } from '@/constants/enum';
import { usePosition } from '../../context';
import FormBtn from './FormBtn';
import HelpfulInfo from './HelpfulInfo';
import {
  useFormChangeAction,
  useFormIsSubmitting,
} from './hooks/useFormAction';
import PriceInput from './PriceInput';
import ReceiveInput from './ReceiveInput';
import SzInput from './SzInput';

interface OrderTypeTabsContentProps {
  orderType: ORDER_TYPE;
  /** When 'tpsl-only', changes submit button text to "Add Take Profit Order" / "Add Stop Loss Order" */
  mode?: 'default' | 'tpsl-only';
}

const OrderTypeTabsContent: FC<OrderTypeTabsContentProps> = ({ orderType, mode }) => {
  const form = useFormContext();
  const isSubmitting = useFormIsSubmitting();
  const position = usePosition();
  const { onSzChange, onPxChange, onReceiveCoinTypeChange } =
    useFormChangeAction({
      form: form as unknown as UseFormReturn<{
        orderType: ORDER_TYPE;
        px: string;
        size: string;
        receiveCoinType: string;
      }>,
      position,
    });

  const { getValues } = form;
  // calc receive coin amount，fee
  useEffect(() => {
    onSzChange(getValues('size'));
  }, [getValues, onSzChange]);

  return (
    <div className="flex w-full flex-col gap-4">
      <div>
        {/* size input */}
        <FormField
          control={form.control}
          name="size"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <SzInput value={field.value} onChange={onSzChange} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* price input */}
        {orderType === ORDER_TYPE['tp/sl'] && (
          <FormField
            control={form.control}
            name="px"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormControl>
                    <PriceInput
                      orderType={orderType}
                      value={field.value}
                      onChange={onPxChange}
                    />
                  </FormControl>
                </FormItem>
              );
            }}
          />
        )}

        <FormField
          control={form.control}
          name="receiveCoinType"
          render={() => {
            return (
              <FormItem>
                <FormControl>
                  <ReceiveInput
                    className="mt-2"
                    onChange={onReceiveCoinTypeChange}
                  />
                </FormControl>
              </FormItem>
            );
          }}
        />
      </div>

      <HelpfulInfo orderType={orderType} />
      <FormBtn isPending={isSubmitting} orderType={orderType} mode={mode} />
    </div>
  );
};

export default OrderTypeTabsContent;
