import { FC } from 'react';

import { useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';

import { cn, LoaderCircleIcon } from '@repo/ui';

import { useIsCalcing } from '../../services/rest/swap';
import { useInstStore } from '../../stores/instStore';
import AlertBanner from './AlertBanner';
import BaseFormBtn from './BaseFormBtn';
import { useValidate } from './hooks/useValidate';

interface FormBtnProps {
  isPending: boolean;
}

const FormBtn: FC<FormBtnProps> = ({ isPending }) => {
  const { t } = useLingui();
  const coins = useInstStore((state) => state.getCoins());

  const paySz = useWatch({ name: 'paySz' });
  const receiveSz = useWatch({ name: 'receiveSz' });
  const { coin: payCoin, value: paySzValue } = paySz;
  const { coin: receiveCoin, value: receiveSzValue } = receiveSz;
  const payCoinName = coins[payCoin]?.symbol;
  const receiveCoinName = coins[receiveCoin]?.symbol;

  const { data: payIsCalcing } = useIsCalcing(payCoin);
  const { data: receiveIsCalcing } = useIsCalcing(receiveCoin);

  const text = useValidate({
    payCoin,
    receiveCoin,
    paySzValue,
    receiveSzValue,
  });

  const isCalcing = !isPending && (payIsCalcing || receiveIsCalcing);
  const hasError = !!text;
  const showError = !isPending && !isCalcing && hasError;
  const showAble = !isPending && !isCalcing && !hasError;

  return (
    <>
      <AlertBanner payCoinType={payCoin} receiveCoinType={receiveCoin} />
      <BaseFormBtn
        disabled={hasError || isPending || isCalcing}
        className={cn(
          showError
            ? ''
            : 'bg-accent hover:bg-accent/90 text-accent-foreground hover:text-accent-foreground/90',
        )}
      >
        {isPending && (
          <>
            <LoaderCircleIcon size={16} className="animate-spin" />
            {t`Swaping Tokens`}
          </>
        )}
        {isCalcing && (
          <>
            <LoaderCircleIcon size={16} className="animate-spin" />
            {t`Finalizing Quote`}
          </>
        )}
        {showError && text}
        {showAble && t`Swap ${payCoinName} to ${receiveCoinName}`}
      </BaseFormBtn>
    </>
  );
};

export default FormBtn;
