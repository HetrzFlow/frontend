import { memo } from 'react';

import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  Alert,
  AlertDescription,
  FormControl,
  FormField,
  FormItem,
} from '@repo/ui';

import { usePosition } from '../../context';
import { TYPE } from './enum';
import FormBtn from './FormBtn';
import HelpfulInfo from './HelpfulInfo';
import { useFormIsSubmitting } from './hooks/useFormAction';
import SzInput from './SzInput';

const TypeTabContent = () => {
  const { t } = useLingui();
  const isSubmitting = useFormIsSubmitting();
  const form = useFormContext();
  const position = usePosition();
  const isHyperMode = position.isZFP;
  const type = useWatch({ name: 'type' });
  const isWithdraw = type === TYPE.withdraw;

  return (
    <div className="flex w-full flex-col gap-4">
      {isHyperMode && isWithdraw ? (
        <Alert open={true} showClose={false}>
          <AlertDescription>
            {t`Withdrawal is disabled for Hyper Leverage Mode`}
          </AlertDescription>
        </Alert>
      ) : null}
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
