'use client';

import { useState } from 'react';

import { useLingui } from '@lingui/react/macro';

import { CoinIcon } from '@repo/common/components';
import { ArrowDownUpIcon, Skeleton, cn } from '@repo/ui';
import { CoinSzInput } from '@/common';
import {
  COIN_SELECTOR_TRIGGER_CLASS_NAME,
  COIN_SELECTOR_TRIGGER_ICON_SIZE,
} from '@/common/components/CoinSelector';

import { formatSwapTokenAmount } from './format';
import CaretDownIcon from './icons/CaretDown';
import TokenSelector from './TokenSelector';
import type { SwapPanelController } from './useSwapPanel';
import type { SwapToken } from './useSwapTokens';

type TokenFieldsModel = SwapPanelController['model']['tokenFields'];
type SwapPanelActions = SwapPanelController['actions'];

const TokenButton = ({
  token,
  loading,
  disabled,
  widget,
  genesisPresentation,
  onClick,
}: {
  token?: SwapToken;
  loading?: boolean;
  disabled?: boolean;
  widget?: boolean;
  genesisPresentation?: boolean;
  onClick: () => void;
}) =>
  loading ? (
    <Skeleton
      className={cn(
        'bg-bg-7 h-9 w-[123px] rounded-xl',
        widget && 'bg-bg-5 h-8',
      )}
    />
  ) : (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        COIN_SELECTOR_TRIGGER_CLASS_NAME,
        'w-fit max-w-[124px] shrink-0 cursor-pointer',
        genesisPresentation
          ? 'max-w-none gap-2 px-4 font-medium'
          : 'gap-1 px-3',
        widget
          ? 'bg-bg-5 hover:bg-bg-6 h-8'
          : genesisPresentation
            ? 'enabled:hover:bg-bg-5 transition-[background-color,border-color] duration-200'
            : 'enabled:hover:bg-bg-4 enabled:hover:border-transparent transition-[background-color,border-color] duration-200',
        'disabled:cursor-not-allowed disabled:opacity-50',
      )}
      onClick={(event) => {
        event.preventDefault();
        onClick();
      }}
    >
      {token ? (
        <>
          <CoinIcon
            src={token.logoURI}
            alt={token.symbol}
            size={widget ? 20 : COIN_SELECTOR_TRIGGER_ICON_SIZE}
            className="shrink-0"
          />
          <span className="min-w-0 truncate">{token.symbol}</span>
        </>
      ) : (
        <span className="min-w-0 truncate">--</span>
      )}
      <CaretDownIcon className="shrink-0 text-white" />
    </button>
  );

const AmountCard = ({
  label,
  value,
  placeholder = '0.00',
  usdValue,
  balance,
  token,
  tokenLoading,
  valueLoading,
  valueStale,
  disabled,
  editable,
  widget,
  genesisPresentation,
  onValueChange,
  onPercentChange,
  onSelectToken,
}: {
  label: string;
  value: string;
  placeholder?: string;
  usdValue: string;
  balance?: string;
  token?: SwapToken;
  tokenLoading?: boolean;
  valueLoading?: boolean;
  valueStale?: boolean;
  disabled?: boolean;
  editable?: boolean;
  widget?: boolean;
  genesisPresentation?: boolean;
  onValueChange?: (value: string) => void;
  onPercentChange?: (value: string) => void;
  onSelectToken: () => void;
}) => (
  <CoinSzInput
    percentActionSource="none"
    label={label}
    value={value}
    showBalance={false}
    showPercentActionsOnFocus={editable && !disabled}
    balance={balance}
    decimal={token?.decimals}
    placeholder={placeholder}
    readOnly={!editable || disabled}
    disabled={disabled}
    preservePrecision
    isLoading={valueLoading}
    labelClassName={genesisPresentation ? 'text-t-350' : undefined}
    className={cn(
      widget && editable && 'bg-bg-4 has-disabled:bg-bg-4',
      genesisPresentation && editable && 'bg-bg-4 has-disabled:bg-bg-4',
      !editable &&
        'border-border bg-transparent focus-within:!border-border [&_[data-slot=skeleton]]:bg-bg-3',
    )}
    inputWrapClassName={cn(
      widget && 'h-8',
      !editable && 'cursor-not-allowed',
    )}
    inputClassName={cn(
      widget && 'h-6 text-xl',
      !editable && 'pointer-events-none',
      valueStale && 'text-t-350',
    )}
    extraClassName={genesisPresentation ? 'h-[14px] min-h-0' : undefined}
    percentButtonClassName={widget || genesisPresentation ? 'bg-bg-5' : undefined}
    inputSuffix={
      <TokenButton
        token={token}
        loading={tokenLoading}
        disabled={disabled}
        widget={widget}
        genesisPresentation={genesisPresentation}
        onClick={onSelectToken}
      />
    }
    extra={
      <div
        className={cn(
          'flex items-center justify-between text-xs',
          genesisPresentation ? 'text-t-270' : 'text-t-350',
        )}
      >
        <span
          className={cn(
            'flex h-[1lh] items-center',
            valueStale && 'opacity-50',
          )}
        >
          {valueLoading ? (
            <Skeleton className="h-3 w-16 rounded-sm" />
          ) : (
            usdValue
          )}
        </span>
        {editable && token ? (
          <span>
            {formatSwapTokenAmount(balance || 0)} {token.symbol}
          </span>
        ) : null}
      </div>
    }
    onValueChange={onValueChange}
    onPercentChange={(nextValue) =>
      (onPercentChange ?? onValueChange)?.(nextValue)
    }
  />
);

export const SwapTokenFields = ({
  model,
  actions,
  quickTokenPreset,
  genesisPresentation = false,
}: {
  model: TokenFieldsModel;
  actions: Pick<
    SwapPanelActions,
    | 'changePayAmount'
    | 'changePayAmountByPercent'
    | 'selectPayToken'
    | 'selectReceiveToken'
    | 'reverseTokens'
  >;
  quickTokenPreset?: SwapToken[];
  genesisPresentation?: boolean;
}) => {
  const { t } = useLingui();
  const [selectorSide, setSelectorSide] = useState<'pay' | 'receive'>();
  const widget = model.variant === 'widget';

  return (
    <>
      <div className="grid grid-cols-1 grid-rows-[auto_8px_auto]">
        <AmountCard
          label={t`You're Paying`}
          value={model.payAmount}
          usdValue={model.payUsdValue}
          balance={model.payBalance}
          token={model.payToken}
          tokenLoading={model.payTokenLoading}
          editable
          widget={widget}
          genesisPresentation={genesisPresentation}
          disabled={model.disabled}
          onValueChange={actions.changePayAmount}
          onPercentChange={actions.changePayAmountByPercent}
          onSelectToken={() => setSelectorSide('pay')}
        />
        <button
          type="button"
          disabled={model.disabled}
          className={cn(
            'text-accent z-10 col-start-1 row-start-2 flex size-8 items-center justify-center place-self-center rounded-full',
            widget || genesisPresentation ? 'bg-bg-5' : 'bg-bg-4',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
          aria-label={t`Reverse tokens`}
          onClick={actions.reverseTokens}
        >
          <ArrowDownUpIcon size={16} />
        </button>
        <AmountCard
          label={t({ message: 'Receive', context: 'Swap' })}
          value={model.receiveAmount}
          placeholder={model.receivePlaceholder}
          valueLoading={model.receiveLoading}
          valueStale={model.receiveStale}
          usdValue={model.receiveUsdValue}
          token={model.receiveToken}
          widget={widget}
          genesisPresentation={genesisPresentation}
          disabled={model.disabled}
          onSelectToken={() => setSelectorSide('receive')}
        />
      </div>

      <TokenSelector
        open={!!selectorSide}
        side={selectorSide || 'pay'}
        selected={
          selectorSide === 'receive' ? model.receiveToken : model.payToken
        }
        quickTokenPreset={quickTokenPreset}
        onOpenChange={(open) => {
          if (!open) setSelectorSide(undefined);
        }}
        onSelect={
          selectorSide === 'receive'
            ? actions.selectReceiveToken
            : actions.selectPayToken
        }
      />
    </>
  );
};
