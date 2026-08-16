'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useLingui } from '@lingui/react/macro';
import { zeroAddress } from 'viem';
import { useShallow } from 'zustand/react/shallow';
import { useInstStore, useMarketIsDisabled, TradeTabs } from '@/common';
import { useHydrated } from '@/common/hooks/useHydrated';
import ModuleCard from '@/components/ModuleCard';
import {
  LiqTradeType,
  usePoolsTradeStore,
  HZLP_NAME,
  HZV_NAME,
  getTradeKey,
} from '@/stores/pools/trade';
import { useVaultDetailData } from '@/stores/synthetics/marketsData/selectors';
import { ActivityTabType } from '../PoolsDetail/components/ActivityPanel';
import EstimatedEarningsCard from './EstimatedEarningsCard';
import PoolTradeContent from './PoolTradeContent';
import { useTradeData } from './useTradeData';

export default function PoolTradeTabs({
  type,
  variant = 'desktop',
}: {
  type: ActivityTabType;
  variant?: 'desktop' | 'dialog';
}) {
  const isHydrated = useHydrated();
  const { t } = useLingui();
  const params = useParams();
  const marketAddress = params?.market_address as string | undefined;
  const pageKey = marketAddress ?? zeroAddress;
  const tradeKey = getTradeKey(pageKey, type);
  const insts = useInstStore((state) => state.getInsts());
  const marketTokenAddress =
    type === ActivityTabType.POOL
      ? (insts[marketAddress ?? '']?.marketTokenAddress ?? marketAddress)
      : undefined;
  const marketIsDisabled = useMarketIsDisabled(marketTokenAddress);
  const vaultDetail = useVaultDetailData(
    type === ActivityTabType.VAULT ? marketAddress : undefined,
  );
  const vaultIsDisabled = !!vaultDetail?.is_disabled;
  const initializedTradeKeyRef = useRef<string | null>(null);

  const [tradeType, setTradeType, formRefs, formData, updateFormData] =
    usePoolsTradeStore(
      useShallow((state) => [
        state.tradeType,
        state.setTradeType,
        state.formRefs,
        state.formData,
        state.updateFormData,
      ]),
    );
  const isTransacting = usePoolsTradeStore(
    (state) => state.isTransactingByKey[tradeKey] ?? false,
  );
  const depositInputValue = formData[LiqTradeType.Deposit].paySz.value ?? '';
  const { estimatedApy, underlyingTokenSymbol } = useTradeData({
    type,
    direction: LiqTradeType.Deposit,
  });
  const baseTokenName = underlyingTokenSymbol;
  const isDialog = variant === 'dialog';

  const handleTabChange = useCallback(
    (value: string) => {
      const newType = value as LiqTradeType;
      setTradeType(newType, tradeKey);
      const tokenName = type === 'pool' ? HZLP_NAME : HZV_NAME;
      const curr = formData[newType];
      const nextVals =
        newType === LiqTradeType.Deposit
          ? {
              paySz: { ...curr.paySz, coin: baseTokenName, value: '' },
              receiveSz: { ...curr.receiveSz, coin: tokenName, value: '' },
            }
          : {
              paySz: { ...curr.paySz, coin: tokenName, value: '' },
              receiveSz: { ...curr.receiveSz, coin: baseTokenName, value: '' },
            };
      formRefs[newType]?.reset(nextVals);
      updateFormData(newType, nextVals);
    },
    [
      baseTokenName,
      formData,
      formRefs,
      setTradeType,
      tradeKey,
      type,
      updateFormData,
    ],
  );
  useEffect(() => {
    const shouldForceWithdraw =
      type === ActivityTabType.VAULT ? vaultIsDisabled : !!marketIsDisabled;

    const isNewDetailPage = initializedTradeKeyRef.current !== tradeKey;
    if (!isNewDetailPage && !shouldForceWithdraw) {
      return;
    }

    const nextTradeType = shouldForceWithdraw
      ? LiqTradeType.Withdraw
      : LiqTradeType.Deposit;
    if (tradeType !== nextTradeType) {
      setTradeType(nextTradeType, tradeKey);
    }
    initializedTradeKeyRef.current = tradeKey;
  }, [
    marketIsDisabled,
    vaultIsDisabled,
    type,
    tradeKey,
    tradeType,
    setTradeType,
  ]);

  // reset values when page changes (pool/vault switched)

  useEffect(() => {
    const tokenName = type === 'pool' ? HZLP_NAME : HZV_NAME;
    const resetFor = (tt: LiqTradeType) => {
      const curr = formData[tt];
      if (tt === LiqTradeType.Deposit) {
        const nextVals = {
          paySz: { ...curr.paySz, coin: baseTokenName, value: '' },
          receiveSz: { ...curr.receiveSz, coin: tokenName, value: '' },
        };
        formRefs[tt]?.reset(nextVals);
        updateFormData(tt, nextVals);
      } else {
        const nextVals = {
          paySz: { ...curr.paySz, coin: tokenName, value: '' },
          receiveSz: { ...curr.receiveSz, coin: baseTokenName, value: '' },
        };
        formRefs[tt]?.reset(nextVals);
        updateFormData(tt, nextVals);
      }
    };
    resetFor(LiqTradeType.Deposit);
    resetFor(LiqTradeType.Withdraw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseTokenName, pageKey, type]);

  if (!isHydrated) {
    return (
      <div className="space-y-2 p-1">
        <div className="bg-bg-3 h-8 w-full rounded-xl" />
        <div className="bg-bg-3 h-52 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <ModuleCard className="relative flex flex-col">
        <div className="poolTradeContainer relative">
          {isTransacting ? (
            <div className="absolute inset-0 z-10 cursor-not-allowed" />
          ) : null}
          <TradeTabs
            key={tradeKey}
            value={tradeType}
            onValueChange={handleTabChange}
            className={
              isTransacting ? 'pointer-events-none opacity-60 select-none' : ''
            }
            listClassName="grid-cols-2"
            activeBarClassName="h-full rounded-xl"
            contentWrapClassName="pb-1"
            options={[
              {
                value: LiqTradeType.Deposit,
                label: t`Deposit`,
                labelClassName: 'data-[state=active]:text-accent',
                activeBarClassName: 'bg-accent/15',
                content: (
                  <PoolTradeContent
                    key={`${tradeKey}-${LiqTradeType.Deposit}`}
                    direction={LiqTradeType.Deposit}
                    type={type}
                    estimatedEarnings={
                      isDialog
                        ? { inputValue: depositInputValue, apy: estimatedApy }
                        : undefined
                    }
                  />
                ),
              },
              {
                value: LiqTradeType.Withdraw,
                label: t`Withdraw`,
                labelClassName: 'data-[state=active]:text-down',
                activeBarClassName: 'bg-down/10',
                content: (
                  <PoolTradeContent
                    key={`${tradeKey}-${LiqTradeType.Withdraw}`}
                    direction={LiqTradeType.Withdraw}
                    type={type}
                  />
                ),
              },
            ]}
          />
        </div>
      </ModuleCard>
      {!isDialog && tradeType === LiqTradeType.Deposit ? (
        <EstimatedEarningsCard
          inputValue={depositInputValue}
          apy={estimatedApy}
        />
      ) : null}
    </div>
  );
}
