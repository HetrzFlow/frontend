import { useCallback, useMemo } from 'react';

import { ProtocolStoreObjectInfo, VaultObjectInfo } from '@hertzflow/sdk';
import { useLingui } from '@lingui/react/macro';
import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

import { debounce } from 'lodash-es';
import { UseFormReturn } from 'react-hook-form';
import { useShallow } from 'zustand/react/shallow';
import { calc } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import { queryClient, useQuery } from '@repo/lib/queryClient';
import { toast, tradeToast } from '@repo/ui';
import type { Position } from '@/common';
import {
  useHzSdk,
  useSetTxBasicParams,
  CoinIcon,
  OrderToastContent,
  useCustomSignAndExecuteTransaction,
  useGlobalStore,
  useWalletStore,
  getProtocolStoreDataFromCache,
  getVaultDataFromCache,
  getOrdersByInstFromCache,
  refetchOrders,
  getCachedPriceTickerData,
  useInstStore,
} from '@/common';
import { MAX_ORDER_COUNT_SINGLE_MARKET } from '@/constants/common';
import { ORDER_TYPE } from '@/constants/enum';

import { useCalcClosePosition } from '@/services/rest/trade';
import { subOrder } from '@/services/ws/order';
import { usePreferenceStore } from '@/stores/trade/preference';

const closePositionIsSubmittingKey = ['closePosition', 'isSubmitting'];

// market close
const buildMarketOrderTx = ({
  position,
  marketPx,
  receiveCoinPx,
  size,
  isLong,
  receiveCoinType,
  collateralCoinType,
  collateralCoinDecimal,
  collateralCoinPx,
  baseCoinDecimal,
  receiveCoinDecimal,
  slippage,
  protocolStore,
  vaultData,
  hzSdk,
  tx,
}: {
  position: Position;
  size: string;
  isLong: boolean;
  marketPx: string;
  receiveCoinPx: string;
  collateralCoinType: string;
  receiveCoinType: string;
  baseCoinType: string;
  collateralCoinPx: string;
  collateralCoinDecimal: number;
  baseCoinDecimal: number;
  receiveCoinDecimal: number;
  slippage: string;
  protocolStore: ProtocolStoreObjectInfo;
  vaultData?: VaultObjectInfo;
  hzSdk: ReturnType<typeof useHzSdk>;
  tx: Transaction;
}) => {
  const realtimeConfig = vaultData
    ? hzSdk.QueryModule.getRealtimeConfig({
        collateralToken: position.collateralCoin,
        protocolStore: protocolStore,
        vaultObject: vaultData,
      })
    : undefined;
  tx.add(
    hzSdk.VaultModule.createDecreasePositionRequestWithPositionPayload({
      positionId: position.id,
      sizeDelta: size,
      currentSize: position.size,
      currentCollateral: position.collateral,
      receiverCoinMarketPrice: receiveCoinPx,
      receiverCoinDecimals: receiveCoinDecimal,
      indexCoinMarketPrice: marketPx,
      collateralCoinMarketPrice: collateralCoinPx,
      collateralCoinDecimals: collateralCoinDecimal,
      indexCoinDecimals: baseCoinDecimal,
      isLong,
      slippage: +slippage,
      protocolStore,
      borrowFee: realtimeConfig
        ? hzSdk.QueryModule.calculatePositionFundingFee({
            realtimeConfig: realtimeConfig,
            positionSize: position.size,
            entryFundingFeeRate: position.entryFundingRate,
          }).positionFundingFeeFormatted
        : '',
      typeArguments: [collateralCoinType, receiveCoinType],
    }),
  );
  return tx;
};

// limit close
const buildLimitOrderTx = ({
  position,
  px,
  size,
  baseCoinDecimal,
  isLong,
  hzSdk,
  tx,
}: {
  position: Position;
  px: string;
  marketPx: string;
  size: string;
  isLong: boolean;
  collateralCoinType: string;
  receiveCoinType: string;
  baseCoinType: string;
  baseCoinDecimal: number;
  collateralCoinDecimal: number;
  slippage: string;
  hzSdk: ReturnType<typeof useHzSdk>;
  tx: Transaction;
}) => {
  tx.add(
    hzSdk.VaultModule.createCreateDecreaseOrderPayload({
      positionId: position.id,
      sizeDelta: size,
      currentSize: position.size,
      currentCollateral: position.collateral,
      indexCoinDecimals: baseCoinDecimal,
      triggerPrice: px,
      leverage: +(position.leverage as string),
      triggerAboveThreshold: isLong ? true : false,
      positionFundingFee: position.metadata.entryFundingRate,
    }),
  );
  return tx;
};

// form action hook
export const useFormAction = ({
  onOpenChange,
  position,
}: {
  position: Position;
  onOpenChange: (open: boolean) => void;
}) => {
  const { t } = useLingui();
  const { mutate: signAndExecute, isPending } =
    useCustomSignAndExecuteTransaction({ mutationKey: ['closePosition'] });
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const explorerHost = useWalletStore((state) => state.getExplorerHost());
  const currentAccount = useCurrentAccount();
  const { refetch } = useSuiClientQuery('getAllBalances', {
    owner: currentAccount?.address || '',
  });
  const { isLong, targetCoin } = position;

  const slippage = usePreferenceStore((state) => state.slippage);
  const [inst, usdcCoin, coins] = useInstStore(
    useShallow((state) => [
      state.getInstsArr().find((v) => v.coinType === targetCoin),
      state.getUsdcCoin(state),
      state.getCoins(),
    ]),
  );
  const baseCoin = coins[targetCoin];
  const hzSdk = useHzSdk();
  const setTxBasicParams = useSetTxBasicParams();

  const onSubmit = useCallback(
    (data: {
      orderType: string;
      size: string;
      px: string;
      receiveCoinType: string;
    }) => {
      const { orderType, size, px, receiveCoinType } = data;
      const pxData = getCachedPriceTickerData(inst?.id);
      const marketPx = pxData?.[0]?.p;
      const receiveCoinPx = getCachedPriceTickerData(
        coins[receiveCoinType] ? `${coins[receiveCoinType].symbol}/USD` : '',
      )?.[0]?.p;
      const protocolStore = getProtocolStoreDataFromCache(
        hzSdk.fullClient.network,
      );
      const vaultData = getVaultDataFromCache(hzSdk.fullClient.network);

      const collateralCoin = isLong ? baseCoin : usdcCoin;
      const collateralCoinPx = getCachedPriceTickerData(
        collateralCoin ? `${collateralCoin.symbol}/USD` : '',
      )?.[0]?.p;

      if (
        !currentAccount?.address ||
        !protocolStore ||
        !size ||
        !px ||
        !marketPx ||
        !baseCoin ||
        !collateralCoin ||
        !coins[receiveCoinType] ||
        !receiveCoinPx ||
        !collateralCoinPx
      ) {
        return;
      }

      let tx = new Transaction();
      // basic settings
      tx = setTxBasicParams(tx);

      queryClient.setQueryData(closePositionIsSubmittingKey, true);

      try {
        // build tx
        if (orderType === ORDER_TYPE.market) {
          tx = buildMarketOrderTx({
            size,
            isLong,
            collateralCoinType: collateralCoin.coinType,
            collateralCoinDecimal: collateralCoin.decimal,
            baseCoinDecimal: baseCoin.decimal,
            receiveCoinDecimal: coins[receiveCoinType].decimal,
            baseCoinType: baseCoin.coinType,
            marketPx,
            receiveCoinPx: receiveCoinPx,
            collateralCoinPx: collateralCoinPx,
            receiveCoinType,
            position,
            slippage,
            protocolStore,
            vaultData,
            hzSdk,
            tx,
          });
        } else if (orderType === ORDER_TYPE.limit) {
          // order count validation
          const openOrders = getOrdersByInstFromCache({
            address: currentAccount.address,
            indexCoinType: baseCoin.coinType,
            network: hzSdk.fullClient.network,
          });
          if (openOrders.length >= MAX_ORDER_COUNT_SINGLE_MARKET) {
            tradeToast({
              type: 'error',
              title: t`Limit Order`,
              ordType: 'limit',
              icon: <CoinIcon size={24} src={inst?.icon} alt={inst?.name} />,
              description: t`Failed`,
              showClose: true,
              content: t`You have reached the maximum of 20 active limit orders for this market.`,
            });

            queryClient.setQueryData(closePositionIsSubmittingKey, false);
            return;
          }
          tx = buildLimitOrderTx({
            px,
            size,
            isLong,
            collateralCoinType: collateralCoin.coinType,
            collateralCoinDecimal: collateralCoin.decimal,
            baseCoinType: baseCoin.coinType,
            baseCoinDecimal: baseCoin.decimal,
            receiveCoinType,
            position,
            marketPx,
            slippage,
            hzSdk,
            tx,
          });
        }

        const isCloseAll = !calc(size).lt(position.size);

        signAndExecute(
          { transaction: tx },
          {
            onSuccess: (result) => {
              if (result.status === 'failed') {
                queryClient.setQueryData(closePositionIsSubmittingKey, false);
                return;
              }
              refetch();
              if (orderType === ORDER_TYPE.market) {
                const event = result.events?.find((v) =>
                  v.type.includes('DecreasePositionRequestEvent'),
                );
                const parsedJson = event?.parsedJson as
                  | undefined
                  | { request_id: string };
                const request_id = parsedJson?.request_id;
                if (request_id) {
                  let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

                  const unsubOrder = subOrder({
                    callback: ({ data: wsData }) => {
                      const data = wsData.find(
                        ({ r, d }) => r === request_id && d === 'decr',
                      );
                      if (data) {
                        // success: exec; failed：cancel
                        tradeToast(
                          {
                            type: data.a === 'exec' ? 'success' : 'error',
                            title: t`Market Order`,
                            ordType: 'market',
                            icon: (
                              <CoinIcon
                                size={24}
                                src={inst?.icon}
                                alt={inst?.name}
                              />
                            ),
                            description:
                              data.a === 'exec' ? t`Closed` : t`Failed`,
                            showClose: true,
                            content: (
                              <OrderToastContent
                                isLong={isLong}
                                size={truncateFormat(
                                  `-${size}`,
                                  usdAmountDisplayDecimal,
                                  {
                                    style: 'currency',
                                    currency: 'USD',
                                    signDisplay: 'always',
                                    stripTrailingZeros: true,
                                  },
                                )}
                                px={truncateFormat(
                                  marketPx,
                                  baseCoin.pxDispDecimal,
                                  {
                                    style: 'currency',
                                    currency: 'USD',
                                  },
                                )}
                              />
                            ),
                            href: `${explorerHost}/txblock/${data.x}`,
                          },
                          {
                            id: result.toastId,
                          },
                        );
                        if (timeoutTimer) {
                          clearTimeout(timeoutTimer);
                        }

                        unsubOrder();
                        queryClient.setQueryData(
                          closePositionIsSubmittingKey,
                          false,
                        );

                        onOpenChange(false);
                      }
                    },
                  });

                  timeoutTimer = setTimeout(() => {
                    unsubOrder();
                    // timeout toast
                    tradeToast(
                      {
                        type: 'success',
                        title: t`Market Order`,
                        ordType: 'market',
                        icon: (
                          <CoinIcon
                            size={24}
                            src={inst?.icon}
                            alt={inst?.name}
                          />
                        ),
                        description: t`Submitted`,
                        showClose: true,
                        content: t`Execution taking longer than usual. Please check later for the latest status.`,
                        href: `${explorerHost}/txblock/${result.digest}`,
                      },
                      {
                        id: result.toastId,
                      },
                    );
                    queryClient.setQueryData(
                      closePositionIsSubmittingKey,
                      false,
                    );

                    onOpenChange(false);
                  }, 5000);

                  return;
                }
              } else {
                refetchOrders(currentAccount.address, hzSdk.fullClient.network);
              }
              queryClient.setQueryData(closePositionIsSubmittingKey, false);

              onOpenChange(false);
            },
            onError: () => {
              queryClient.setQueryData(closePositionIsSubmittingKey, false);
            },
          },
          {
            showDefaultSuccess: orderType !== ORDER_TYPE.market,
            ordType: orderType === ORDER_TYPE.market ? 'market' : 'limit',
            title:
              orderType === ORDER_TYPE.market
                ? isCloseAll
                  ? t`Close Position`
                  : t`Partial Close`
                : t`Limit Order`,
            icon: (
              <CoinIcon size={24} src={baseCoin.icon} alt={baseCoin.name} />
            ),
            resultDescription:
              orderType === ORDER_TYPE.market ? t`Closed` : t`Opened`,
          },
        );
      } catch (error) {
        toast.error((error as Error).message);
        queryClient.setQueryData(closePositionIsSubmittingKey, false);
      }
    },
    [
      inst,
      currentAccount,
      setTxBasicParams,
      isLong,
      position,
      baseCoin,
      usdcCoin,
      hzSdk,
      coins,
      refetch,
      signAndExecute,
      onOpenChange,
      slippage,
      t,
      explorerHost,
      usdAmountDisplayDecimal,
    ],
  );

  return {
    onSubmit,
    isSubmitting: isPending,
  };
};

// form is submitting
export const useFormIsSubmitting = () => {
  const { data: isSubmitting } = useQuery({
    queryKey: closePositionIsSubmittingKey,
    queryFn: () => false,
  });

  return isSubmitting;
};

export const useFormChangeAction = ({
  form,
  position,
}: {
  form: UseFormReturn<{
    orderType: ORDER_TYPE;
    px: string;
    size: string;
    receiveCoinType: string;
  }>;
  position: Position;
}) => {
  const { isLong, targetCoin, leverage: lever, entryFundingRate } = position;
  const { getValues, setValue } = form;

  const [usdcCoin, coins] = useInstStore(
    useShallow((state) => [state.getUsdcCoin(state), state.getCoins()]),
  );
  const baseCoin = coins[targetCoin];

  const { mutate: calcClosePos } = useCalcClosePosition();

  // handle sz input change
  const handleSzChange = useMemo(() => {
    const decounceUpdate = debounce(async ({ value, px, receiveCoinType }) => {
      const collateralCoin = (isLong ? baseCoin : usdcCoin)!;

      await calcClosePos({
        sizeDelta: value,
        collateralCoin: collateralCoin,
        receiveCoin: coins[receiveCoinType],
        isLong,
        targetCoinPx: px,
        lever,
        entryFundingRate,
      });
    }, 200);

    return (value: string) => {
      setValue('size', value);
      const px = getValues('px');
      const receiveCoinType = getValues('receiveCoinType');

      decounceUpdate({ value, px, receiveCoinType });
    };
  }, [
    setValue,
    getValues,
    calcClosePos,
    baseCoin,
    isLong,
    entryFundingRate,
    coins,
    lever,
    usdcCoin,
  ]);

  // handle px change
  const handlePxChange = useCallback(
    (px: string) => {
      setValue('px', px);
      const size = getValues('size');
      handleSzChange(size);
    },
    [handleSzChange, setValue, getValues],
  );

  // handle receiveve coin type change
  const handleReceiveCoinTypeChange = useCallback(
    (receiveCoinType: string) => {
      setValue('receiveCoinType', receiveCoinType);
      const size = getValues('size');
      handleSzChange(size);
    },
    [handleSzChange, setValue, getValues],
  );
  return {
    onSzChange: handleSzChange,
    onPxChange: handlePxChange,
    onReceiveCoinTypeChange: handleReceiveCoinTypeChange,
  };
};
