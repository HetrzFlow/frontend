import { useCallback } from 'react';

import { ProtocolStoreObjectInfo } from '@hertzflow/sdk';
import { useLingui } from '@lingui/react/macro';
import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

import { useQuery } from '@tanstack/react-query';
import { UseFormReturn } from 'react-hook-form';
import { useShallow } from 'zustand/react/shallow';

import { calc } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import { queryClient } from '@repo/lib/queryClient';
import { toast } from '@repo/ui';
import type { Coin, Position } from '@/common';
import {
  useHzSdk,
  useSetTxBasicParams,
  CoinIcon,
  useCustomSignAndExecuteTransaction,
  useGlobalStore,
  getProtocolStoreDataFromCache,
  useBorrowFee,
  getCachedPriceTickerData,
  usePriceTickerStream,
  useInstStore,
} from '@/common';

import { usePreferenceStore } from '@/stores/trade/preference';
import { TYPE } from './enum';

const editCollateralIsSubmittingKey = ['editCollateral', 'isSubmitting'];

// deposit
const buildDepositTx = ({
  position,
  size,
  isLong,
  collateralCoinType,
  collateralCoinDecimal,
  collateralCoinPx,
  baseCoinPx,
  baseCoinType,
  baseCoinDecimal,
  slippage,
  protocolStore,
  tx,
  hzSdk,
}: {
  position: Position;
  size: string;
  isLong: boolean;
  collateralCoinType: string;
  baseCoinType: string;
  baseCoinDecimal: number;
  collateralCoinPx: string;
  baseCoinPx: string;
  slippage: string;
  collateralCoinDecimal: number;
  protocolStore: ProtocolStoreObjectInfo;
  hzSdk: ReturnType<typeof useHzSdk>;
  tx: Transaction;
}) => {
  tx.add(
    hzSdk.VaultModule.createAddMarginPayload({
      protocolStore,
      positionId: position.id,
      amountIn: size,
      payCoinDecimals: collateralCoinDecimal,
      indexCoinMarketPrice: baseCoinPx,
      indexCoinDecimals: baseCoinDecimal,
      collateralCoinMarketPrice: collateralCoinPx,
      collateralCoinDecimals: collateralCoinDecimal,
      slippage: +slippage,
      isLong,
      typeArguments: [collateralCoinType, collateralCoinType, baseCoinType],
    }),
  );
  return tx;
};

// withdraw
const buildWithdrawTx = ({
  position,
  size,
  isLong,
  collateralCoinType,
  collateralCoinDecimal,
  collateralCoinPx,
  baseCoinPx,
  baseCoinDecimal,
  slippage,
  tx,
  hzSdk,
}: {
  position: Position;
  size: string;
  isLong: boolean;
  collateralCoinType: string;
  baseCoinType: string;
  baseCoinDecimal: number;
  collateralCoinDecimal: number;
  collateralCoinPx: string;
  baseCoinPx: string;
  slippage: string;
  hzSdk: ReturnType<typeof useHzSdk>;
  tx: Transaction;
}) => {
  tx.add(
    hzSdk.VaultModule.createReduceMarginPayload({
      positionId: position.id,
      collateralDelta: size,
      receiverCoinMarketPrice: collateralCoinPx,
      receiverCoinDecimals: collateralCoinDecimal,
      indexCoinMarketPrice: baseCoinPx,
      indexCoinDecimals: baseCoinDecimal,
      isLong: isLong,
      slippage: +slippage,
      typeArguments: [collateralCoinType],
    }),
  );
  return tx;
};

// form action hook
export const useFormAction = ({
  position,
  form,
  onOpenChange,
}: {
  position: Position;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<{ type: string; size: string }, any, undefined>;
  onOpenChange: (open: boolean) => void;
}) => {
  const { t } = useLingui();
  const usdAmountDecimal = useGlobalStore((state) => state.usdAmountDecimal);
  const { mutate: signAndExecute } = useCustomSignAndExecuteTransaction({
    mutationKey: ['editCollateral'],
  });
  const currentAccount = useCurrentAccount();
  const { refetch } = useSuiClientQuery('getAllBalances', {
    owner: currentAccount?.address || '',
  });

  const slippage = usePreferenceStore((state) => state.slippage);
  const [insts, usdcCoin, coins] = useInstStore(
    useShallow((state) => [
      state.getInsts(),
      state.getUsdcCoin(state),
      state.getCoins(),
    ]),
  );

  const baseCoin = coins[position.targetCoin];
  const inst = insts[position.targetCoin];
  const hzSdk = useHzSdk();
  const setTxBasicParams = useSetTxBasicParams();

  const onSubmit = useCallback(
    (data: { type: string; size: string }) => {
      const { type, size } = data;
      const collateralCoin = position.isLong ? baseCoin : usdcCoin;
      const pxData = getCachedPriceTickerData(inst?.id);
      const marketPx = pxData?.[0]?.p;

      const collateralCoinPx = getCachedPriceTickerData(
        collateralCoin ? `${collateralCoin.symbol}/USD` : '',
      )?.[0]?.p;
      const protocolStore = getProtocolStoreDataFromCache(
        hzSdk.fullClient.network,
      );
      if (
        !currentAccount?.address ||
        !size ||
        !marketPx ||
        !baseCoin ||
        !collateralCoin ||
        !collateralCoinPx ||
        !protocolStore
      ) {
        return;
      }

      queryClient.setQueryData(editCollateralIsSubmittingKey, true);

      let tx = new Transaction();
      // basic settings
      tx = setTxBasicParams(tx);

      try {
        let dispSize = '';
        // build tx
        if (type === TYPE.deposit) {
          dispSize = `${truncateFormat(size, collateralCoin.decimal, { stripTrailingZeros: true })} ${collateralCoin.symbol}`;
          tx = buildDepositTx({
            protocolStore,
            position,
            size,
            isLong: position.isLong,
            collateralCoinType: collateralCoin.coinType,
            collateralCoinDecimal: collateralCoin.decimal,
            baseCoinType: baseCoin.coinType,
            baseCoinDecimal: baseCoin.decimal,
            baseCoinPx: marketPx,
            collateralCoinPx: collateralCoinPx,
            slippage,
            tx,
            hzSdk,
          });
        } else if (type === TYPE.withdraw) {
          dispSize = truncateFormat(size, usdAmountDecimal, {
            stripTrailingZeros: true,
            style: 'currency',
            currency: 'USD',
          });
          tx = buildWithdrawTx({
            position,
            size,
            isLong: position.isLong,
            collateralCoinType: collateralCoin.coinType,
            collateralCoinDecimal: collateralCoin.decimal,
            baseCoinType: baseCoin.coinType,
            baseCoinDecimal: baseCoin.decimal,
            collateralCoinPx: collateralCoinPx,
            baseCoinPx: marketPx,
            slippage,
            tx,
            hzSdk,
          });
        }

        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => {
              queryClient.setQueryData(editCollateralIsSubmittingKey, false);
              if (result.status === 'failed') {
                return;
              }

              onOpenChange(false);
              refetch();
            },
            onError: () => {
              queryClient.setQueryData(editCollateralIsSubmittingKey, false);
            },
          },
          {
            ordType: 'market',
            title: t`Edit Collateral`,
            icon: (
              <CoinIcon size={24} src={baseCoin.icon} alt={baseCoin.name} />
            ),
            resultDescription:
              type === TYPE.withdraw
                ? t`Withdraw ${dispSize}`
                : t`Deposited ${dispSize}`,
          },
        );
      } catch (error) {
        toast.error((error as Error).message);
        queryClient.setQueryData(editCollateralIsSubmittingKey, false);
      }
    },
    [
      currentAccount,
      setTxBasicParams,
      signAndExecute,
      onOpenChange,
      refetch,
      position,
      baseCoin,
      hzSdk,
      usdcCoin,
      slippage,
      inst?.id,
      usdAmountDecimal,
      t,
    ],
  );

  const onTypeChange = useCallback(
    (type: string) => {
      form.setValue('type', type);
      form.setValue('size', '');
    },
    [form],
  );

  return {
    onSubmit,
    onTypeChange,
  };
};

// form is submitting
export const useFormIsSubmitting = () => {
  const { data: isSubmitting } = useQuery({
    queryKey: editCollateralIsSubmittingKey,
    queryFn: () => false,
  });

  return isSubmitting;
};

// calc collateral，lever
export const useCalcEditableParams = ({
  isDeposit,
  isLong,
  baseCoin,
  usdcCoin,
  entryFundingRate,
  curSize,
  size,
  curCollateral,
}: {
  isDeposit: boolean;
  isLong: boolean;
  baseCoin?: Coin;
  usdcCoin?: Coin;
  entryFundingRate: string;
  curSize: string;
  size: string;
  curCollateral: string;
}) => {
  const { data: borrowFee } = useBorrowFee({
    collateralCoinType: isLong ? baseCoin?.coinType : usdcCoin?.coinType,
    isLong,
    size: curSize,
    entryFundingRate: entryFundingRate,
  });
  // when withdraw, borrowFee is from withdraw collateral, so not minus borrowFee
  const finalPrevCollateral = isDeposit
    ? calc(curCollateral).minus(borrowFee)
    : curCollateral;

  const collateralCoin = isLong ? baseCoin : usdcCoin;

  const collateralCoinPx = usePriceTickerStream(
    collateralCoin ? `${collateralCoin?.symbol}/USD` : '',
    {
      throttleWait: 5000,
    },
  ).data[0]?.p;

  const deltaCollateral = isDeposit
    ? collateralCoin && collateralCoinPx
      ? calc(size).times(collateralCoinPx)
      : ''
    : calc(size).times(-1);

  let nextCollateral = calc(finalPrevCollateral).plus(deltaCollateral);
  nextCollateral = nextCollateral.lt(0) ? calc(0) : nextCollateral;

  return {
    borrowFee,
    nextCollateral,
    deltaCollateral,
  };
};
