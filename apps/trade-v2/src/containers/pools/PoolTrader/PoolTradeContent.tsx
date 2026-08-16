'use client';

import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useParams } from 'next/navigation';
import { USD_DECIMALS } from '@hertzflow/sdk-v2/utils/numbers';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { intervalToDuration } from 'date-fns';
import { useForm, UseFormReturn } from 'react-hook-form';
import { formatUnits, parseUnits, zeroAddress } from 'viem';
import { z } from 'zod';
import { truncate } from '@repo/lib/calc';
import { truncateFormat, unitFormat } from '@repo/lib/format';
import {
  Button,
  cn,
  Form as BasicForm,
  FormControl,
  FormField,
  FormItem,
} from '@repo/ui';
import { HZLP_TOKEN_DECIMALS, HZV_TOKEN_DECIMALS } from '@/common';
import { MeritsBoostLostWarningDialog } from '@/containers/genesis/dialogs/MeritsBoostLostWarningDialog';
import { useGenesisVaultData } from '@/containers/genesis/hooks/useGenesisVaultData';
import {
  calculateAffectedUnmaturedUsd,
  calculateGenesisMeritsLockedPreview,
  calculateProportionalWithdrawUsd,
  hasGenesisWithdrawalLoss,
  isLpEstimateEpochCurrent,
  isLpEstimateWithoutActiveEpoch,
  sumGenesisDecimalValues,
} from '@/containers/genesis/lib/genesisMeritsProjection';
import {
  getAffectedUnmaturedUsd,
  sharesRawToUsd,
} from '@/containers/genesis/lib/genesisOverview';
import { useWatchFormChange } from '@/hooks/useWatchFormChange';
import {
  useGenesisUserPosition,
  useGenesisLpEstimate,
  useGenesisMeritsSeasons,
  useGenesisMeritsUserSummary,
  useGenesisVaultConfig,
} from '@/queries/bsc/genesis';
import { useVaultsList } from '@/queries/bsc/vaults';
import { useHzvConfigs } from '@/queries/bsc/vaults/configs';
import type { FormDataType } from '@/stores/pools/trade';
import {
  HZLP_NAME,
  HZV_NAME,
  LiqTradeType,
  getTradeKey,
  usePoolsTradeStore,
} from '@/stores/pools/trade';
import { useWithdrawWarningStore } from '@/stores/pools/withdrawWarning';
import { ActivityTabType } from '../PoolsDetail/components/ActivityPanel';
import EstimatedEarningsCard from './EstimatedEarningsCard';
import PoolFeeContent from './PoolFeeContent';
import PoolTradeFormBtn from './PoolTradeFormBtn';
import PoolTradeInput, {
  HZLP_SUFFIX,
  HZV_SUFFIX,
  TokenSuffix,
} from './PoolTradeInput';
import { getMaxPoolTradeAmount } from './poolTradeLimit';
import { useFormAction } from './useFormAction';
import { usePoolPnlFactorPrecheck } from './usePoolPnlFactorPrecheck';
import {
  PoolTradeButtonState,
  usePoolTradeValidation,
} from './usePoolTradeValidation';
import { useTradeData } from './useTradeData';

export type PoolTradeDirection = {
  direction: LiqTradeType;
  type: ActivityTabType;
  marketAddress?: string;
  onExecutionResolved?: () => void;
  enforcePredepositMinimum?: boolean;
  estimatedEarnings?: {
    inputValue: string;
    apy?: string | number | null;
  };
};

const DISPLAY_DECIMALS = 6;
const RECEIVE_EMPTY_CLEAR_DELAY_MS = 200;
const USD_SCALE = 10n ** BigInt(USD_DECIMALS);
const MIN_PREDEPOSIT_DEPOSIT_DELTA_USD = 10n * USD_SCALE;

type PoolTradeFieldsProps = {
  form: UseFormReturn<FormDataType>;
  direction: LiqTradeType;
  type: ActivityTabType;
  disabled: boolean;
  payBalanceUnit: string;
  payTokenIcon?: string;
  receiveBalanceUnit: string;
  receiveTokenIcon?: string;
  walletBalanceFormatted?: string;
  isBalanceLoading: boolean;
  paySzCalcDecimals: number;
  getUsdPxFor: (coin: string | undefined) => string | undefined;
  onPaySzChange: (
    value: { value?: string; coin?: string },
    rawAmount?: bigint,
  ) => void;
  isQuoteLoading: boolean;
  payingLabel: string;
  receiveLabel: string;
  limitErrorMessage?: string;
  onLimitErrorClick: () => void;
};

const PoolTradeFields = memo(function PoolTradeFields({
  form,
  direction,
  type,
  disabled,
  payBalanceUnit,
  payTokenIcon,
  receiveBalanceUnit,
  receiveTokenIcon,
  walletBalanceFormatted,
  isBalanceLoading,
  paySzCalcDecimals,
  getUsdPxFor,
  onPaySzChange,
  isQuoteLoading,
  payingLabel,
  receiveLabel,
  limitErrorMessage,
  onLimitErrorClick,
}: PoolTradeFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-2">
      <FormField
        control={form.control}
        name="paySz"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <PoolTradeInput
                label={payingLabel}
                disabled={disabled}
                disabledSelector={true}
                showBalance={true}
                balanceUnit={payBalanceUnit}
                balance={isBalanceLoading ? '' : walletBalanceFormatted || '0'}
                isLoading={isBalanceLoading}
                keepInputOnLoading
                direction={direction}
                value={field.value}
                decimal={DISPLAY_DECIMALS}
                displayDecimal={DISPLAY_DECIMALS}
                calcDecimal={paySzCalcDecimals}
                usdPx={
                  field.value?.value
                    ? getUsdPxFor(field.value?.coin)
                    : undefined
                }
                onChange={onPaySzChange}
                errorMessage={limitErrorMessage}
                onErrorMessageClick={onLimitErrorClick}
                inputSuffix={
                  direction === LiqTradeType.Deposit ? (
                    <TokenSuffix image={payTokenIcon} token={payBalanceUnit} />
                  ) : type === ActivityTabType.POOL ? (
                    <HZLP_SUFFIX />
                  ) : (
                    <HZV_SUFFIX />
                  )
                }
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
              <PoolTradeInput
                label={receiveLabel}
                disabled={true}
                disabledSelector={true}
                showBalance={false}
                balanceUnit={receiveBalanceUnit}
                direction={direction}
                value={field.value}
                decimal={DISPLAY_DECIMALS}
                displayDecimal={DISPLAY_DECIMALS}
                usdPx={
                  field.value?.value
                    ? getUsdPxFor(field.value?.coin)
                    : undefined
                }
                onChange={onPaySzChange}
                isLoading={isQuoteLoading}
                inputSuffix={
                  direction === LiqTradeType.Deposit ? (
                    type === ActivityTabType.POOL ? (
                      <HZLP_SUFFIX />
                    ) : (
                      <HZV_SUFFIX />
                    )
                  ) : (
                    <TokenSuffix
                      image={receiveTokenIcon}
                      token={receiveBalanceUnit}
                    />
                  )
                }
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
});

type MarketOpenCountdownButtonProps = {
  direction: LiqTradeType;
  now: number;
  nextMarketOpenTime?: number;
  label: string;
  className?: string;
};

export const MarketOpenCountdownButton = memo(
  function MarketOpenCountdownButton({
    direction,
    now,
    nextMarketOpenTime,
    label,
    className,
  }: MarketOpenCountdownButtonProps) {
    const {
      days = 0,
      hours = 0,
      minutes = 0,
      seconds = 0,
    } = intervalToDuration({
      start: now,
      end: nextMarketOpenTime ?? now,
    });
    const countdown = `${days}D:${hours < 10 ? `0${hours}` : hours}H:${minutes < 10 ? `0${minutes}` : minutes}M:${seconds < 10 ? `0${seconds}` : seconds}S`;

    return (
      <Button
        disabled={true}
        className={cn(
          'w-full text-sm',
          direction === LiqTradeType.Deposit
            ? 'disabled:bg-up/10 disabled:text-up/50 disabled:opacity-100'
            : 'disabled:bg-down/10 disabled:text-down/50 disabled:opacity-100',
          className,
        )}
      >
        {label} {countdown}
      </Button>
    );
  },
);

export const usePoolTradeController = ({
  direction,
  type,
  marketAddress: marketAddressOverride,
  onExecutionResolved,
  enforcePredepositMinimum = false,
}: PoolTradeDirection) => {
  const { t } = useLingui();
  const params = useParams();
  const routeMarketAddress = params?.market_address as string | undefined;
  const marketAddress = marketAddressOverride ?? routeMarketAddress ?? '';
  const tradeKey = getTradeKey(marketAddress ?? zeroAddress, type);
  const {
    isDeposit,
    rateDisplay,
    isPaused,
    allowance,
    isAllowanceLoading,
    isApproving,
    handleApprove,
    walletBalance,
    walletBalanceFormatted,
    isBalanceLoading,
    depositCapUsd,
    depositCapAmount,
    withdrawCapUsd,
    withdrawCapAmount,
    payTokenDecimals,
    payTokenLimitPriceUsd,
    payTokenMinPriceUsd,
    depositFeeFactor,
    underlyingTokenAddress,
    underlyingTokenDecimals,
    underlyingTokenSymbol,
    internalUsd,
    internalUsdResolutionReady,
    isUnderlyingTokenReady,
    payTokenSymbol,
    payTokenIcon,
    receiveTokenSymbol,
    receiveTokenIcon,
    connectionStatus,
    isMarketClosed,
    nextMarketOpenTime,
    marketLabel,
    marketInfo,
    vaultMarketExposure,
    vaultMarketsInfo,
    vaultDetail,
    isPredeposit,
  } = useTradeData({ type, direction, marketAddress });

  // Get market token (HzLP/HzV) decimals from marketTokensData
  const marketTokenDecimals = HZLP_TOKEN_DECIMALS;

  // Determine decimals for paySz and receiveSz based on direction
  const paySzCalcDecimals = payTokenDecimals ?? marketTokenDecimals;
  const payBalanceUnit = payTokenSymbol;

  const formData = usePoolsTradeStore((state) => state.formData);
  const updateFormData = usePoolsTradeStore((state) => state.updateFormData);
  const setFormRef = usePoolsTradeStore((state) => state.setFormRef);
  const setIsTransacting = usePoolsTradeStore(
    (state) => state.setIsTransacting,
  );
  const isTransacting = usePoolsTradeStore(
    (state) => state.isTransactingByKey[tradeKey] ?? false,
  );

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
            { message: t`Please enter a valid amount` },
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
      updateFormData(direction, values);
    },
    [updateFormData, direction],
  );

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: formData[direction],
  });

  useEffect(() => {
    setFormRef({ [direction]: form as UseFormReturn<FormDataType> });
    return () => {
      setFormRef({ [direction]: null });
    };
  }, [form, setFormRef, direction]);

  useWatchFormChange<z.infer<typeof FormSchema>>(form, onChange);

  const {
    onSubmit,
    handlePaySzChange,
    getUsdPxFor,
    isPending,
    isTradeReady,
    vaultDepositCapacityAmount,
    vaultDepositProjectedCapExceeded,
    vaultDepositFirstDepositSplitUnsupported,
    quoteFeeFactor,
  } = useFormAction(form as UseFormReturn<FormDataType>, {
    direction,
    type,
    vaultMarketExposure,
    vaultMarketsInfoData: vaultMarketsInfo,
    marketAddress,
    fallbackDirectRate: rateDisplay.displayDirectRate,
    fallbackReverseRate: rateDisplay.displayReverseRate,
    underlyingTokenAddress,
    underlyingTokenDecimals,
    underlyingTokenSymbol,
    internalUsd,
    internalUsdResolutionReady,
    onExecutionResolved,
  });

  const remainingCapacity = isDeposit ? depositCapUsd : withdrawCapUsd;
  const remainingAmountCapacity =
    type === ActivityTabType.VAULT && isDeposit
      ? vaultDepositCapacityAmount
      : isDeposit
        ? depositCapAmount
        : withdrawCapAmount;

  const inputValue = form.watch('paySz')?.value ?? '';
  const receiveValue = form.watch('receiveSz')?.value ?? '';
  const inputUsdValue = useMemo(() => {
    try {
      const cleanedValue = inputValue.replace(/[^0-9.]/g, '');
      if (!cleanedValue || Number(cleanedValue) <= 0) return 0n;
      if (!payTokenLimitPriceUsd) return undefined;

      const amount = parseUnits(cleanedValue, paySzCalcDecimals);
      return (
        (amount * payTokenLimitPriceUsd) / 10n ** BigInt(paySzCalcDecimals)
      );
    } catch {
      return undefined;
    }
  }, [inputValue, paySzCalcDecimals, payTokenLimitPriceUsd]);

  const minimumDepositDeltaUsd =
    isDeposit && enforcePredepositMinimum && isPredeposit
      ? MIN_PREDEPOSIT_DEPOSIT_DELTA_USD
      : undefined;

  const [receiveLoading, setReceiveLoading] = useState(false);
  const receiveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const receiveClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [submitLoading, setSubmitLoading] = useState(false);
  const [inputAmountOverride, setInputAmountOverride] = useState<
    bigint | undefined
  >(undefined);
  const [now, setNow] = useState(() => Date.now());
  const depositDeltaUsd = useMemo(() => {
    if (
      minimumDepositDeltaUsd === undefined ||
      payTokenMinPriceUsd === undefined ||
      payTokenMinPriceUsd === null
    ) {
      return undefined;
    }

    const cleanedValue = inputValue.replace(/[^0-9.]/g, '');
    if (!cleanedValue || Number(cleanedValue) <= 0) return undefined;

    try {
      const amount =
        inputAmountOverride ?? parseUnits(cleanedValue, paySzCalcDecimals);
      const inputUsd =
        (amount * payTokenMinPriceUsd) / 10n ** BigInt(paySzCalcDecimals);
      const feeFactor = depositFeeFactor ?? 0n;

      return (inputUsd * USD_SCALE) / (USD_SCALE + feeFactor);
    } catch {
      return undefined;
    }
  }, [
    depositFeeFactor,
    inputAmountOverride,
    inputValue,
    minimumDepositDeltaUsd,
    paySzCalcDecimals,
    payTokenMinPriceUsd,
  ]);

  const hasPayInput = useMemo(() => {
    const raw = inputValue.trim();
    return raw !== '' && Number(raw) > 0;
  }, [inputValue]);

  const isQuoteLoading = useMemo(() => {
    if (!hasPayInput) return false;
    if (receiveLoading) return true;
    if (rateDisplay.isLoading) return true;
    return !receiveValue;
  }, [hasPayInput, receiveLoading, rateDisplay.isLoading, receiveValue]);
  const isQuoteReady = useMemo(() => {
    if (!hasPayInput) return false;
    if (isQuoteLoading) return false;
    return !!receiveValue;
  }, [hasPayInput, isQuoteLoading, receiveValue]);

  const isApprovalReady = useMemo(() => {
    if (!hasPayInput) return false;
    if (isBalanceLoading) return false;
    if (isAllowanceLoading) return false;
    return true;
  }, [hasPayInput, isAllowanceLoading, isBalanceLoading]);

  const isSubmitReady = useMemo(() => {
    if (!isApprovalReady) return false;
    if (connectionStatus === 'connected' && !isTradeReady) return false;
    return true;
  }, [connectionStatus, isApprovalReady, isTradeReady]);

  useEffect(() => {
    if (hasPayInput) {
      if (receiveClearTimerRef.current) {
        clearTimeout(receiveClearTimerRef.current);
        receiveClearTimerRef.current = null;
      }
      return;
    }

    setInputAmountOverride(undefined);
    setReceiveLoading(false);
    if (receiveTimerRef.current) {
      clearTimeout(receiveTimerRef.current);
      receiveTimerRef.current = null;
    }
    if (receiveClearTimerRef.current) {
      clearTimeout(receiveClearTimerRef.current);
    }
    receiveClearTimerRef.current = setTimeout(() => {
      const payValue = form.getValues('paySz')?.value?.trim() ?? '';
      if (payValue === '' || Number(payValue) <= 0) {
        const { receiveSz } = form.getValues();
        form.setValue('receiveSz', { ...receiveSz, value: '' });
      }
      receiveClearTimerRef.current = null;
    }, RECEIVE_EMPTY_CLEAR_DELAY_MS);

    return () => {
      if (receiveClearTimerRef.current) {
        clearTimeout(receiveClearTimerRef.current);
        receiveClearTimerRef.current = null;
      }
    };
  }, [form, hasPayInput]);

  const showCountdown = useMemo(() => {
    if (!isMarketClosed || !nextMarketOpenTime) return false;
    return now < nextMarketOpenTime;
  }, [isMarketClosed, nextMarketOpenTime, now]);
  useEffect(() => {
    if (!showCountdown) return;
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [showCountdown]);

  const approveText = useMemo(() => {
    if (isDeposit) return t`Approve ${payBalanceUnit} Spending`;

    const tokenName = type === ActivityTabType.VAULT ? HZV_NAME : HZLP_NAME;
    return marketLabel
      ? t`Approve ${tokenName}: ${marketLabel} Spending`
      : t`Approve ${tokenName} Spending`;
  }, [isDeposit, marketLabel, payBalanceUnit, t, type]);
  const pnlFactorExceeded = usePoolPnlFactorPrecheck({
    marketInfo: marketInfo ?? undefined,
    isDeposit,
    enabled: type === ActivityTabType.POOL,
  });

  const validation = usePoolTradeValidation({
    marketLabel,
    connectionStatus,
    isDeposit,
    inputValue,
    payTokenDecimals: paySzCalcDecimals,
    payTokenSymbol: payBalanceUnit,
    buttonTokenSymbol: isDeposit ? payBalanceUnit : underlyingTokenSymbol,
    walletBalance,
    allowance,
    remainingCapacity,
    inputUsdValue,
    depositDeltaUsd,
    minimumDepositDeltaUsd,
    remainingAmountCapacity,
    inputAmount: inputAmountOverride,
    isApproving,
    isQuoteReady,
    isApprovalReady,
    isSubmitReady,
    isSubmitting: submitLoading || isPending || (isTransacting && !isApproving),
    isPaused,
    pnlFactorExceeded,
    projectedCapacityExceeded:
      type === ActivityTabType.VAULT &&
      isDeposit &&
      vaultDepositProjectedCapExceeded,
    isFirstDepositSplitUnsupported:
      type === ActivityTabType.VAULT &&
      isDeposit &&
      vaultDepositFirstDepositSplitUnsupported,
    approveText,
  });
  const forceDepositDisabled = isDeposit && isPaused === true;
  const isUnderlyingTokenLoading =
    type === ActivityTabType.VAULT && !isUnderlyingTokenReady;
  const pausedText = useMemo(
    () =>
      type === ActivityTabType.VAULT
        ? t`Vault is disabled`
        : t`Pool is disabled`,
    [t, type],
  );
  const effectiveValidation = useMemo(() => {
    if (isUnderlyingTokenLoading && connectionStatus !== 'disconnected') {
      return {
        buttonState: PoolTradeButtonState.CALCULATING,
        buttonText: t`Finalizing Quote`,
        isDisabled: true,
        isLoading: true,
      };
    }
    if (!forceDepositDisabled) return validation;
    return {
      buttonState: PoolTradeButtonState.POOL_PAUSED,
      buttonText: pausedText,
      isDisabled: true,
      isLoading: false,
    };
  }, [
    connectionStatus,
    forceDepositDisabled,
    isUnderlyingTokenLoading,
    pausedText,
    t,
    validation,
  ]);

  const maxTradeAmount = useMemo(
    () =>
      getMaxPoolTradeAmount({
        remainingCapacity,
        remainingAmountCapacity,
        payTokenLimitPriceUsd,
        payTokenDecimals: paySzCalcDecimals,
      }),
    [
      paySzCalcDecimals,
      payTokenLimitPriceUsd,
      remainingAmountCapacity,
      remainingCapacity,
    ],
  );
  const maxTradeAmountInputValue = useMemo(() => {
    if (maxTradeAmount === undefined) return undefined;
    return truncate(
      formatUnits(maxTradeAmount, paySzCalcDecimals),
      DISPLAY_DECIMALS,
      { stripTrailingZeros: false },
    );
  }, [maxTradeAmount, paySzCalcDecimals]);
  const maxTradeAmountDisplayValue = useMemo(() => {
    if (maxTradeAmount === undefined) return undefined;
    return truncateFormat(
      formatUnits(maxTradeAmount, paySzCalcDecimals),
      DISPLAY_DECIMALS,
      { stripTrailingZeros: true },
    );
  }, [maxTradeAmount, paySzCalcDecimals]);
  const limitErrorMessage = useMemo(() => {
    if (!hasPayInput || maxTradeAmountDisplayValue === undefined) {
      return undefined;
    }
    if (
      effectiveValidation.buttonState ===
      PoolTradeButtonState.ABOVE_DEPOSIT_LIMIT
    ) {
      return t`Max Deposit Amount ${maxTradeAmountDisplayValue} ${payBalanceUnit}`;
    }
    if (
      effectiveValidation.buttonState ===
      PoolTradeButtonState.ABOVE_WITHDRAW_LIMIT
    ) {
      return t`Max Withdraw Amount ${maxTradeAmountDisplayValue} ${payBalanceUnit}`;
    }
    return undefined;
  }, [
    effectiveValidation.buttonState,
    hasPayInput,
    maxTradeAmountDisplayValue,
    payBalanceUnit,
    t,
  ]);

  const handlePaySzChangeWithLoading = useCallback(
    (value: { value?: string; coin?: string }, rawAmount?: bigint) => {
      if (receiveTimerRef.current) clearTimeout(receiveTimerRef.current);

      const nextValue = value.value?.trim() ?? '';
      const hasNextPayInput = nextValue !== '' && Number(nextValue) > 0;
      const currentReceiveValue = form.getValues('receiveSz')?.value?.trim();

      if (!hasNextPayInput) {
        setReceiveLoading(false);
      } else if (!currentReceiveValue) {
        setReceiveLoading(true);
        receiveTimerRef.current = setTimeout(
          () => setReceiveLoading(false),
          300,
        );
      } else {
        setReceiveLoading(false);
      }

      handlePaySzChange(value, rawAmount);
      setInputAmountOverride(rawAmount);
    },
    [form, handlePaySzChange],
  );

  const handleLimitErrorClick = useCallback(() => {
    if (
      maxTradeAmount === undefined ||
      maxTradeAmountInputValue === undefined
    ) {
      return;
    }
    const paySz = form.getValues('paySz');
    handlePaySzChangeWithLoading(
      { ...paySz, value: maxTradeAmountInputValue },
      maxTradeAmount,
    );
  }, [
    form,
    handlePaySzChangeWithLoading,
    maxTradeAmount,
    maxTradeAmountInputValue,
  ]);

  const handleSubmitWithLoading = useCallback(
    async (data: FormDataType) => {
      if (
        effectiveValidation.buttonState !==
          PoolTradeButtonState.DEPOSIT_READY &&
        effectiveValidation.buttonState !== PoolTradeButtonState.WITHDRAW_READY
      ) {
        return;
      }
      setSubmitLoading(true);
      setIsTransacting(tradeKey, true);
      try {
        await onSubmit(data);
      } catch (error) {
        console.error(error);
        setIsTransacting(tradeKey, false);
      } finally {
        setSubmitLoading(false);
      }
    },
    [onSubmit, setIsTransacting, tradeKey, effectiveValidation.buttonState],
  );

  const handleApproveWithLoading = useCallback(async () => {
    if (!handleApprove) return;
    setIsTransacting(tradeKey, true);
    try {
      await handleApprove();
    } catch (error) {
      console.error(error);
    } finally {
      setIsTransacting(tradeKey, false);
    }
  }, [handleApprove, setIsTransacting, tradeKey]);

  useEffect(() => {
    return () => {
      if (receiveTimerRef.current) clearTimeout(receiveTimerRef.current);
    };
  }, []);

  const handleFormSubmit = form.handleSubmit(
    handleSubmitWithLoading,
    (errors) => {
      console.error('Form validation errors:', errors);
    },
  );
  const handleFormSubmitWithGuard = useCallback(
    (event?: React.BaseSyntheticEvent) => {
      if (effectiveValidation.isDisabled) {
        event?.preventDefault();
        return;
      }
      return handleFormSubmit(event);
    },
    [handleFormSubmit, effectiveValidation.isDisabled],
  );

  return {
    form: form as UseFormReturn<FormDataType>,
    direction,
    type,
    rateDisplay,
    showCountdown,
    now,
    nextMarketOpenTime,
    payTokenMinPriceUsd,
    depositFeeFactor,
    isPredeposit,
    vaultDetail,
    effectiveValidation,
    quoteFeeFactor,
    handleApproveWithLoading,
    handleFormSubmitWithGuard,
    fields: {
      disabled: submitLoading || isPending,
      payBalanceUnit,
      payTokenIcon,
      receiveBalanceUnit: receiveTokenSymbol,
      receiveTokenIcon,
      underlyingTokenSymbol,
      walletBalanceFormatted,
      isBalanceLoading,
      paySzCalcDecimals,
      getUsdPxFor,
      onPaySzChange: handlePaySzChangeWithLoading,
      isQuoteLoading,
      payingLabel: t`You're paying`,
      receiveLabel: t`Receive`,
      limitErrorMessage,
      onLimitErrorClick: handleLimitErrorClick,
    },
    labels: {
      marketOpensIn: t`Market Opens In`,
    },
  };
};

const PoolTradeContent: FC<PoolTradeDirection> = (props) => {
  const { estimatedEarnings } = props;
  const {
    form,
    direction,
    type,
    rateDisplay,
    showCountdown,
    now,
    nextMarketOpenTime,
    effectiveValidation,
    quoteFeeFactor,
    handleApproveWithLoading,
    handleFormSubmitWithGuard,
    fields,
    labels,
    vaultDetail,
    isPredeposit,
  } = usePoolTradeController(props);

  const isPredepositWithdraw =
    type === ActivityTabType.VAULT &&
    direction === LiqTradeType.Withdraw &&
    isPredeposit;
  const [withdrawWarningOpen, setWithdrawWarningOpen] = useState(false);
  const [withdrawWarningCheckPending, setWithdrawWarningCheckPending] =
    useState(false);
  const { data: genesisPosition } = useGenesisUserPosition({
    enabled: isPredepositWithdraw,
  });
  const { data: genesisConfig } = useGenesisVaultConfig({
    enabled: isPredepositWithdraw,
  });
  const { data: meritsSeasons } = useGenesisMeritsSeasons({
    enabled: isPredepositWithdraw,
  });
  const activeSeason = useMemo(
    () =>
      meritsSeasons?.reduce<NonNullable<typeof meritsSeasons>[number] | null>(
        (earliest, season) =>
          !earliest || season.startMs < earliest.startMs ? season : earliest,
        null,
      ),
    [meritsSeasons],
  );
  const meritsPreviewEnabled =
    isPredepositWithdraw &&
    (withdrawWarningOpen || withdrawWarningCheckPending);
  const { data: lpEstimate } = useGenesisLpEstimate({
    enabled: meritsPreviewEnabled,
  });
  const { data: meritsUserSummary } = useGenesisMeritsUserSummary(
    activeSeason?.seasonId,
    { enabled: meritsPreviewEnabled },
  );
  const { data: vaultsData } = useVaultsList({
    enabled: meritsPreviewEnabled,
  });
  const { data: hzvConfigs } = useHzvConfigs({
    enabled: meritsPreviewEnabled,
  });
  const {
    config: projectedGenesisConfig,
    position: projectedGenesisPosition,
    isPositionValuationReady,
  } = useGenesisVaultData({
    config: genesisConfig,
    position: genesisPosition,
    vaults: meritsPreviewEnabled ? vaultsData?.items : undefined,
    hzvConfigs: meritsPreviewEnabled ? hzvConfigs : undefined,
    meritsSeason: activeSeason ?? undefined,
  });
  const predepositAsset = useMemo(() => {
    const address = vaultDetail?.vault_address?.toLowerCase();
    if (!address) return undefined;
    return genesisPosition?.perAsset.find(
      (asset) => asset.vaultAddress?.toLowerCase() === address,
    );
  }, [genesisPosition?.perAsset, vaultDetail?.vault_address]);
  const unmaturedShares = useMemo(() => {
    if (!predepositAsset?.unmaturedDepositsSharesRaw) return 0;
    try {
      return Number(
        formatUnits(
          BigInt(predepositAsset.unmaturedDepositsSharesRaw),
          HZV_TOKEN_DECIMALS,
        ),
      );
    } catch {
      return 0;
    }
  }, [predepositAsset?.unmaturedDepositsSharesRaw]);
  const unmaturedUsd = useMemo(() => {
    const unmaturedUsdFromShares = sharesRawToUsd({
      sharesRaw: predepositAsset?.unmaturedDepositsSharesRaw,
      supply: vaultDetail?.supply,
      tvl: vaultDetail?.tvl,
    });
    return Number(
      unmaturedUsdFromShares ?? predepositAsset?.unmaturedDeposits ?? 0,
    );
  }, [
    predepositAsset?.unmaturedDeposits,
    predepositAsset?.unmaturedDepositsSharesRaw,
    vaultDetail?.supply,
    vaultDetail?.tvl,
  ]);
  const withdrawPayValue = form.watch('paySz')?.value;
  const withdrawAmount = Number(withdrawPayValue ?? 0) || 0;
  const affectedUnmaturedUsd = getAffectedUnmaturedUsd({
    withdrawShares: withdrawAmount,
    unmaturedShares,
    unmaturedUsd,
  });
  const projectedAsset = useMemo(() => {
    const address = vaultDetail?.vault_address?.toLowerCase();
    if (!address) return undefined;
    return projectedGenesisPosition?.perAsset.find(
      (asset) => asset.vaultAddress?.toLowerCase() === address,
    );
  }, [projectedGenesisPosition?.perAsset, vaultDetail?.vault_address]);
  const userRewardEligibleUsd = useMemo(
    () =>
      sumGenesisDecimalValues(
        projectedGenesisPosition?.perAsset.map((asset) => asset.deposited) ??
          [],
      ).toFixed(),
    [projectedGenesisPosition?.perAsset],
  );
  const userBoostEligibleUsd = useMemo(
    () =>
      sumGenesisDecimalValues(
        projectedGenesisPosition?.perAsset.map(
          (asset) => asset.unmaturedDeposits,
        ) ?? [],
      ).toFixed(),
    [projectedGenesisPosition?.perAsset],
  );
  const affectedUnmaturedUsdDecimal = calculateAffectedUnmaturedUsd({
    withdrawShares: withdrawPayValue,
    unmaturedShares: projectedAsset?.unmaturedShares,
    unmaturedUsd: projectedAsset?.unmaturedDeposits,
  });
  const withdrawnPoolUsd = calculateProportionalWithdrawUsd({
    withdrawShares: withdrawPayValue,
    totalShares: projectedAsset?.totalDepositsShares,
    totalUsd: projectedAsset?.deposited,
  });
  const hasNoActiveMeritsEpoch = isLpEstimateWithoutActiveEpoch(
    lpEstimate?.epochStartSec,
    lpEstimate?.epochEndSec,
  );
  const isMeritsPreviewReady =
    meritsPreviewEnabled &&
    lpEstimate !== undefined &&
    activeSeason != null &&
    projectedGenesisConfig?.meritsPoolUsd !== undefined &&
    projectedAsset !== undefined &&
    isPositionValuationReady &&
    meritsUserSummary !== undefined &&
    (isLpEstimateEpochCurrent(lpEstimate?.epochEndSec) ||
      hasNoActiveMeritsEpoch);
  const meritsPreview =
    isMeritsPreviewReady &&
    !hasNoActiveMeritsEpoch &&
    lpEstimate &&
    activeSeason
      ? calculateGenesisMeritsLockedPreview({
          action: 'withdraw',
          currentRewardRate: lpEstimate.rewardShare,
          currentBoostRate: lpEstimate.boostRewardShare,
          userRewardEligibleUsd,
          userBoostEligibleUsd,
          poolEligibleUsd: projectedGenesisConfig.meritsPoolUsd ?? '0',
          boostDeltaUsd: affectedUnmaturedUsdDecimal,
          poolDeltaUsd: withdrawnPoolUsd,
          estimatedMerits: lpEstimate.estimatedMerits,
          estimatedBoostMerits: lpEstimate.estimatedBoostMerits,
          settledMerits: meritsUserSummary?.settledLpMerits ?? '0',
          lpPoolTotal: lpEstimate.lpPoolTotal,
          boostMultiplier: lpEstimate.boostMultiplier,
          epochStartSec: lpEstimate.epochStartSec,
          epochEndSec: lpEstimate.epochEndSec,
          seasonEndSec: activeSeason.endMs / 1000,
          asOfSec: lpEstimate.asOfSec,
          nowSec: Math.floor(Date.now() / 1000),
        })
      : undefined;
  const meritsLost = meritsPreview?.meritsLost ?? '0';
  const hasWithdrawalLoss = hasGenesisWithdrawalLoss({ meritsLost });
  const pendingWithdrawRef = useRef<FormDataType | null>(null);
  const withdrawWarningDismissed = useWithdrawWarningStore(
    (state) => state.dismissed,
  );
  const setWithdrawWarningDismissed = useWithdrawWarningStore(
    (state) => state.setDismissed,
  );

  const handleSubmit = useCallback(
    (event?: React.BaseSyntheticEvent) => {
      if (withdrawWarningOpen || withdrawWarningCheckPending) {
        event?.preventDefault();
        return;
      }
      if (!isPredepositWithdraw || affectedUnmaturedUsd <= 0) {
        return handleFormSubmitWithGuard(event);
      }
      if (withdrawWarningDismissed) {
        return handleFormSubmitWithGuard(event);
      }
      event?.preventDefault();
      pendingWithdrawRef.current = form.getValues();
      setWithdrawWarningCheckPending(true);
    },
    [
      affectedUnmaturedUsd,
      form,
      handleFormSubmitWithGuard,
      isPredepositWithdraw,
      withdrawWarningDismissed,
      withdrawWarningCheckPending,
      withdrawWarningOpen,
    ],
  );

  const handleWarningConfirm = useCallback(
    (dontShowAgain: boolean) => {
      if (dontShowAgain) {
        setWithdrawWarningDismissed(true);
      }
      const pending = pendingWithdrawRef.current;
      pendingWithdrawRef.current = null;
      setWithdrawWarningOpen(false);
      if (pending) {
        handleFormSubmitWithGuard();
      }
    },
    [handleFormSubmitWithGuard, setWithdrawWarningDismissed],
  );
  const handleWarningOpenChange = useCallback((nextOpen: boolean) => {
    setWithdrawWarningOpen(nextOpen);
    if (!nextOpen) {
      setWithdrawWarningCheckPending(false);
      pendingWithdrawRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (
      !withdrawWarningCheckPending ||
      !isMeritsPreviewReady ||
      pendingWithdrawRef.current === null
    ) {
      return;
    }
    setWithdrawWarningCheckPending(false);
    if (hasWithdrawalLoss) {
      setWithdrawWarningOpen(true);
      return;
    }
    const pending = pendingWithdrawRef.current;
    pendingWithdrawRef.current = null;
    if (pending) {
      handleFormSubmitWithGuard();
    }
  }, [
    handleFormSubmitWithGuard,
    hasWithdrawalLoss,
    isMeritsPreviewReady,
    withdrawWarningCheckPending,
  ]);

  return (
    <div>
      <BasicForm {...form}>
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2">
          <div className="flex flex-col">
            <PoolTradeFields
              form={form as UseFormReturn<FormDataType>}
              direction={direction}
              type={type}
              disabled={fields.disabled}
              payBalanceUnit={fields.payBalanceUnit}
              payTokenIcon={fields.payTokenIcon}
              receiveBalanceUnit={fields.receiveBalanceUnit}
              receiveTokenIcon={fields.receiveTokenIcon}
              walletBalanceFormatted={fields.walletBalanceFormatted}
              isBalanceLoading={fields.isBalanceLoading}
              paySzCalcDecimals={fields.paySzCalcDecimals}
              getUsdPxFor={fields.getUsdPxFor}
              onPaySzChange={fields.onPaySzChange}
              isQuoteLoading={fields.isQuoteLoading}
              payingLabel={fields.payingLabel}
              receiveLabel={fields.receiveLabel}
              limitErrorMessage={fields.limitErrorMessage}
              onLimitErrorClick={fields.onLimitErrorClick}
            />
            <div className="mt-2">
              <PoolFeeContent
                direction={direction}
                type={type}
                marketAddress={props.marketAddress}
                baseTokenName={fields.underlyingTokenSymbol}
                displayDirectRate={rateDisplay.displayDirectRate}
                displayReverseRate={rateDisplay.displayReverseRate}
                isRateLoading={rateDisplay.isLoading}
                isRateUnavailable={rateDisplay.isUnavailable}
                onRateRefresh={rateDisplay.refreshRate}
                rateRefreshTick={rateDisplay.refreshTick}
                quoteFeeFactor={quoteFeeFactor}
              />
            </div>
          </div>
          {direction === LiqTradeType.Deposit && estimatedEarnings ? (
            <>
              <EstimatedEarningsCard
                inputValue={estimatedEarnings.inputValue}
                apy={estimatedEarnings.apy}
                variant="inline"
              />
            </>
          ) : null}
          {showCountdown ? (
            <MarketOpenCountdownButton
              direction={direction}
              now={now}
              nextMarketOpenTime={nextMarketOpenTime}
              label={labels.marketOpensIn}
            />
          ) : (
            <PoolTradeFormBtn
              direction={direction}
              buttonState={effectiveValidation.buttonState}
              buttonText={effectiveValidation.buttonText}
              isDisabled={effectiveValidation.isDisabled}
              isLoading={effectiveValidation.isLoading}
              onApprove={handleApproveWithLoading}
              onSubmit={handleSubmit}
            />
          )}
        </form>
      </BasicForm>
      <MeritsBoostLostWarningDialog
        open={withdrawWarningOpen || withdrawWarningCheckPending}
        onOpenChange={handleWarningOpenChange}
        meritsLost={unitFormat(meritsLost, 2)}
        isMeritsLoading={!isMeritsPreviewReady}
        boostLostMultiplier={unitFormat(
          lpEstimate?.boostExtraMultiplier ?? 0,
          0,
        )}
        onConfirm={handleWarningConfirm}
      />
    </div>
  );
};

export default PoolTradeContent;
