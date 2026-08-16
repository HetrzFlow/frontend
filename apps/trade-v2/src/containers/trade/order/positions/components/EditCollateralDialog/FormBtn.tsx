import React from 'react';

import { getTradePayTokenAddress } from '@hertzflow/sdk-v2/configs/internalUsd';
import { useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';

import { Address } from 'viem';
import { Button, cn, LoaderCircleIcon } from '@repo/ui';
import {
  CREDIT_MARKET_CATEGORY,
  CREDIT_TOKEN_SYMBOL,
  useHzSdk,
  useInstStore,
  useMarketIsPausing,
} from '@/common';
import ApproveBtn from '@/components/ApproveBtn';
import { usePosition } from '../../context';
import { TYPE } from './enum';
import { useValidate } from './hooks/useValidate';

interface FormBtnProps {
  isPending?: boolean;
}

const FormBtn: React.FC<FormBtnProps> = ({ isPending }) => {
  const { t } = useLingui();
  const position = usePosition();
  const hzSdk = useHzSdk();
  const { collateralTokenAddress } = position;
  const isZFP = position.isZFP;
  const coins = useInstStore((state) => state.getCoins());
  const insts = useInstStore((state) => state.getInsts());
  const type = useWatch({ name: 'type' });
  const size = useWatch({ name: 'size' });
  const isDeposit = type === TYPE.deposit;
  const inst = insts[position.marketAddress];
  const payTokenAddress = getTradePayTokenAddress({
    chainId: hzSdk?.chainId,
    inst,
    collateralTokenAddress,
  });
  const approveTokenAddress = isDeposit ? payTokenAddress : collateralTokenAddress;
  const tokenSymbol =
    inst?.category === CREDIT_MARKET_CATEGORY
      ? CREDIT_TOKEN_SYMBOL
      : coins[approveTokenAddress ?? collateralTokenAddress]?.symbol;

  const text = useValidate();
  const hasError = !!text;

  const marketIsPausing = useMarketIsPausing(position.marketAddress);
  const isWithdrawDisabled = isZFP && !isDeposit;
  const isDepositDisabled = marketIsPausing && isDeposit;
  const showError =
    !isPending && hasError && !isWithdrawDisabled && !isDepositDisabled;
  const showAble =
    !isPending && !hasError && !isWithdrawDisabled && !isDepositDisabled;
  const enableText = isDeposit ? t`Deposit` : t`Withdraw`;

  return (
    <ApproveBtn
      tokenAddress={approveTokenAddress as Address}
      tokenSymbol={tokenSymbol ?? ''}
      tokenAmount={size}
      skipApprove={!isDeposit || hasError}
      className="w-full text-xs disabled:bg-bg-4 disabled:hover:bg-bg-4"
    >
      <Button
        type="submit"
        disabled={
          hasError || isPending || isWithdrawDisabled || isDepositDisabled
        }
        onClick={() => {}}
        className={cn(
          'bg-accent text-accent-foreground hover:bg-accent/70 disabled:bg-bg-4 disabled:hover:bg-bg-4 w-full text-xs',
        )}
      >
        {isPending && (
          <>
            <LoaderCircleIcon size={16} className="animate-spin" />
            {enableText}
          </>
        )}
        {showError && text}
        {showAble && enableText}
        {isWithdrawDisabled && enableText}
        {isDepositDisabled && enableText}
      </Button>
    </ApproveBtn>
  );
};

export default FormBtn;
