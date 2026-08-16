import { FC, memo, useEffect } from 'react';

import { useFormContext, UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem } from '@repo/ui';

import { ORDER_TYPE } from '@/constants/enum';
import { usePosition } from '../context';
import FormBtn from './FormBtn';
import HelpfulInfo from './HelpfulInfo';
import PriceInput from './PriceInput';
import ReceiveInput from './ReceiveInput';
import SzInput from './SzInput';
import { useFormChangeAction, useFormIsSubmitting } from './useFormAction';

interface OrderTypeTabsContentProps {
  orderType: ORDER_TYPE;
}

const OrderTypeTabsContent: FC<OrderTypeTabsContentProps> = ({ orderType }) => {
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
        {orderType === ORDER_TYPE.limit && (
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
      </div>

      <FormField
        control={form.control}
        name="receiveCoinType"
        render={({ field }) => {
          return (
            <FormItem>
              <FormControl>
                <ReceiveInput
                  orderType={orderType}
                  value={field.value}
                  onChange={onReceiveCoinTypeChange}
                />
              </FormControl>
            </FormItem>
          );
        }}
      />

      <HelpfulInfo orderType={orderType} />
      <FormBtn isPending={isSubmitting} orderType={orderType} />
    </div>
  );
};

export default memo(OrderTypeTabsContent);
