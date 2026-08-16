import { FC, useEffect } from 'react';

import { getTradePayTokenAddress } from '@hertzflow/sdk-v2/configs/internalUsd';
import { useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';

import { useShallow } from 'zustand/react/shallow';
import { calc } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import { cn, NumberInput } from '@repo/ui';
import {
  CREDIT_TOKEN_DISPLAY_DECIMALS,
  useGlobalStore,
  CoinSelector,
  useHzSdk,
  useInstStore,
} from '@/common';

import { usePreferenceStore } from '@/stores/trade/preference';
import { usePosition } from '../../context';
import { useClosePosSizeAndFees } from './hooks/closePositionSizeAndFees';

const ReceiveInput: FC<{
  className?: string;
  onChange: (value: string) => void;
}> = ({ className, onChange }) => {
  const {
    t,
    i18n: { locale },
  } = useLingui();
  const hzSdk = useHzSdk();
  const position = usePosition();
  const { collateralTokenAddress, marketAddress, sizeInUsd } = position;
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const [coins, inst] = useInstStore(
    useShallow((state) => [
      state.getCoins(),
      state.getInsts()[marketAddress],
    ]),
  );

  const collateralCoin = coins[collateralTokenAddress];
  const usdtCoin = Object.values(coins).find((coin) => coin.symbol === 'USDT');
  const tradePayTokenAddress = getTradePayTokenAddress({
    chainId: hzSdk?.chainId,
    inst,
    collateralTokenAddress,
  });
  const value = position.isCreditMarket
    ? usdtCoin?.address || collateralTokenAddress
    : tradePayTokenAddress || collateralTokenAddress;
  const receiveCoin = coins[value] || collateralCoin;

  const { data } = useClosePosSizeAndFees(collateralTokenAddress, value);

  const keepLeverageFromStore = usePreferenceStore(
    (state) => state.keepLeverage,
  );
  const keepLeverage = position.isZFP ? true : keepLeverageFromStore;
  const size = useWatch({ name: 'size' });
  const isFullClose = calc(size || 0).gte(sizeInUsd);
  const showKeepLeverageHint =
    !keepLeverage && !isFullClose && !!size && !+(data?.receiveCoinAmount || 0);

  useEffect(() => {
    onChange(value);
  }, [onChange, value]);

  return (
    <div
      className={cn(
        'flex flex-col gap-2 overflow-hidden transition-[height]',
        className,
      )}
    >
      <NumberInput
        className="p-3"
        variant="ghost"
        isLoading={data?.isPending}
        label={
          <div className="text-secondary-foreground flex w-full items-center text-sm">
            <span>{t`Receive In`}</span>
          </div>
        }
        inputWrapClassName="h-12"
        inputClassName="font-plex text-2xl h-[28px]"
        labelClassName="text-muted-foreground text-sm font-normal"
        suffix={
          <div className="flex items-center gap-2 text-2xl font-medium">
            <CoinSelector className="border" value={value} disabled />
          </div>
        }
        innerExtra={
          data?.receiveCoinAmount && +data.receiveCoinAmount > 0 ? (
            <p
              className={cn(
                'flex items-center overflow-hidden text-xs duration-200',
              )}
            >
              {truncateFormat(
                data?.collateralTokenPx
                  ? calc(data.receiveCoinAmount).times(data.collateralTokenPx)
                  : '',
                usdAmountDisplayDecimal,
                {
                  style: 'currency',
                  currency: 'USD',
                  showMinDecimalValue: true,
                },
              )}
            </p>
          ) : null
        }
        extra={
          showKeepLeverageHint ? (
            <p className="text-t-270 bg-bg-4 w-max rounded-lg px-2 py-1 text-xs">
              {t`Keep Leverage off: collateral not released on partial close`}
            </p>
          ) : null
        }
        extraClassName="mt-1.5"
        disabled
        value={data?.receiveCoinAmount}
        decimal={receiveCoin?.szInputDecimal ?? CREDIT_TOKEN_DISPLAY_DECIMALS}
        locale={locale}
        placeholder={'0.00'}
      />
    </div>
  );
};

export default ReceiveInput;
