import { memo } from 'react';

import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem } from '@repo/ui';

import FormBtn from './FormBtn';
import HelpfulInfo from './HelpfulInfo';
import SzInput from './SzInput';

import { useFormIsSubmitting } from './useFormAction';

const TypeTabContent = () => {
  const isSubmitting = useFormIsSubmitting();
  const form = useFormContext();
  return (
    <div className="flex w-full flex-col gap-4">
      <FormField
        control={form.control}
        name="size"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <SzInput value={field.value} onChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      <HelpfulInfo />
      <FormBtn isPending={isSubmitting} />
    </div>
  );
};

export default memo(TypeTabContent);
