import { FC, useCallback } from 'react';
import { useLingui } from '@lingui/react/macro';
import { calc } from '@repo/lib/calc';
import { thoFormat } from '@repo/lib/format';
import { cn, toast } from '@repo/ui';
import {
  IMAGES_MAP,
  CoinIcon,
  MIN_REMAINING_SUI,
  useInstStore,
  CoinSelector,
} from '@/common';
import CoinSzInput from '@/components/hzlp/CoinSzInput';
import { NORMALIZED_SUI_TYPE_ARG } from '@/constants/hzlp/common';
import { useCoinSzInputData } from '@/hooks/hzlp/useCoinSzInputData';

interface CoinSzInputContainerProps {
  label: string;
  value: {
    value?: string;
    coin?: string;
  };
  showBalance: boolean;
  disabledSelector: boolean;
  disabled?: boolean;
  isBuy: boolean;
  onChange: (value: { value?: string; coin?: string }) => void;
}

const CoinSzInputContainer: FC<CoinSzInputContainerProps> = ({
  label,
  value,
  showBalance,
  disabled,
  disabledSelector,
  isBuy,
  onChange,
}) => {
  const { t } = useLingui();
  const coins = useInstStore((state) => state.getCoins());

  const { coinObj, coinPx, isCalcing, balance, maxValue, isHzlp, hzlpData } =
    useCoinSzInputData({
      coin: value.coin,
      isBuy,
      disabled,
    });

  const handleSzChange = useCallback(
    (v: string) => {
      onChange({
        value: v,
        coin: value.coin,
      });
    },
    [onChange, value],
  );

  const handlePercentClick = useCallback(
    (percentValue: string) => {
      if (calc(maxValue).lte(0)) {
        const minSUI = thoFormat(MIN_REMAINING_SUI);
        toast.error(
          t`Wallet balance must contain at least ${minSUI} SUI for gas fee`,
        );
        return;
      }
      if (isBuy && coinObj?.coinType === NORMALIZED_SUI_TYPE_ARG) {
        handleSzChange(
          calc(percentValue).minus(MIN_REMAINING_SUI).toString(10),
        );
      } else {
        handleSzChange(percentValue);
      }
    },
    [maxValue, isBuy, coinObj?.coinType, t, handleSzChange],
  );

  const inputSuffix = isHzlp ? (
    <div
      role="button"
      className={cn(
        'bg-bg-7 hover:bg-bg-7/90 pointer-events-none flex h-10 items-center gap-1.5 rounded-full px-2 text-sm font-semibold',
        disabled ? 'border bg-transparent hover:bg-transparent' : '',
      )}
    >
      <CoinIcon
        src={IMAGES_MAP.coinIcons.HzLP}
        alt={hzlpData?.symbol}
        size={24}
      />
      {hzlpData?.symbol}
    </div>
  ) : (
    <CoinSelector
      className={
        disabled
          ? 'pointer-events-auto border bg-transparent hover:bg-transparent'
          : ''
      }
      value={coinObj?.coinType || ''}
      onSelect={(v) => {
        onChange({
          value: '',
          coin: coins[v]?.symbol,
        });
      }}
      disabled={disabledSelector}
    />
  );

  return (
    <CoinSzInput
      disabled={disabled}
      label={label}
      balance={balance}
      usdPx={coinPx}
      isLoading={!!isCalcing && !!disabled}
      showBalance={showBalance}
      balanceUnit={coinObj?.symbol || ''}
      value={value.value || ''}
      decimal={coinObj?.decimal}
      onValueChange={handleSzChange}
      onPercentChange={handlePercentClick}
      inputSuffix={inputSuffix}
    />
  );
};

export default CoinSzInputContainer;
