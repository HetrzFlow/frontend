import { useCallback, useMemo, useState } from 'react';

import { ProtocolStoreObjectInfo, RealtimeConfig } from '@hertzflow/sdk';
import { useLingui } from '@lingui/react/macro';
import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import debounce from 'lodash-es/debounce';
import { UseFormReturn } from 'react-hook-form';
import { useShallow } from 'zustand/react/shallow';

import { truncateFormat } from '@repo/lib/format';
import { toast, tradeToast } from '@repo/ui';
import {
  useHzSdk,
  useSetTxBasicParams,
  CoinIcon,
  OrderToastContent,
  useCustomSignAndExecuteTransaction,
  useGlobalStore as useCommonGlobalStore,
  useWalletStore,
  getProtocolStoreDataFromCache,
  useRealtimeConfig,
  getOrdersByInstFromCache,
  refetchOrders,
  getPositionByInstFromCache,
  getCachedPriceTickerData,
  useInstStore,
  usePriceTickerStream,
} from '@/common';
import type { Position } from '@/common';

import { MAX_ORDER_COUNT_SINGLE_MARKET } from '@/constants/common';
import { ORDER_TYPE, TRADE_TYPE } from '@/constants/enum';

import {
  getOpenPositionSizeFromCache,
  useCalcPositionSize,
} from '@/services/rest/trade';
import { subOrder } from '@/services/ws/order';
import { useGlobalStore } from '@/stores/trade/global';
import { usePreferenceStore } from '@/stores/trade/preference';
import { PositionForm, useTradeStore } from '../../../store';

// market open position
const buildMarketOrderTx = ({
  payCoinType,
  baseCoinPx,
  payCoinDecimal,
  payCoinSz,
  collateralCoinType,
  collateralCoinDecimal,
  collateralCoinPx,
  baseCoinType,
  baseCoinDecimal,
  lever,
  slippage,
  isLong,
  hzSdk,
  tx,
  prevPosition,
  protocolStore,
  realtimeConfig,
}: {
  isLong: boolean;
  payCoinType: string;
  payCoinPx: string;
  baseCoinPx: string;
  collateralCoinType: string;
  payCoinSz: string;
  payCoinDecimal: number;
  collateralCoinDecimal: number;
  baseCoinDecimal: number;
  collateralCoinPx: string;
  baseCoinType: string;
  lever: string;
  slippage: string;
  hzSdk: ReturnType<typeof useHzSdk>;
  tx: Transaction;
  prevPosition?: Position;
  protocolStore: ProtocolStoreObjectInfo;
  realtimeConfig: RealtimeConfig | undefined;
}) => {
  if (prevPosition) {
    tx.add(
      hzSdk.VaultModule.createIncreasePositionRequestWithPositionPayload({
        protocolStore: protocolStore,
        positionId: prevPosition.id,
        amountIn: payCoinSz,
        borrowFee: realtimeConfig
          ? hzSdk.QueryModule.calculatePositionFundingFee({
              realtimeConfig: realtimeConfig,
              positionSize: prevPosition.size,
              entryFundingFeeRate: prevPosition.entryFundingRate,
            }).positionFundingFeeFormatted
          : '',
        payCoinDecimals: payCoinDecimal,
        indexCoinMarketPrice: baseCoinPx,
        indexCoinDecimals: baseCoinDecimal,
        collateralCoinDecimals: collateralCoinDecimal,
        collateralCoinMarketPrice: collateralCoinPx,
        isLong,
        leverage: +lever,
        slippage: +slippage,
        typeArguments: [payCoinType, collateralCoinType, baseCoinType],
      }),
    );
  } else {
    tx.add(
      hzSdk.VaultModule.createPositionRequestPayload({
        protocolStore: protocolStore,
        amountIn: payCoinSz,
        payCoinDecimals: payCoinDecimal,
        indexCoinMarketPrice: baseCoinPx,
        indexCoinDecimals: baseCoinDecimal,
        collateralCoinDecimals: collateralCoinDecimal,
        collateralCoinMarketPrice: collateralCoinPx,
        isLong,
        leverage: +lever,
        slippage: +slippage,
        typeArguments: [payCoinType, collateralCoinType, baseCoinType],
      }),
    );
  }
  return tx;
};

// limit open position
const buildLimitOrderTx = ({
  isLong,
  collateralCoinType,
  collateralCoinPx,
  baseCoinType,
  baseCoinDecimal,
  payCoinSz,
  collateralCoinDecimal,
  px,
  lever,
  hzSdk,
  protocolStore,
  realtimeConfig,
  tx,
  prevPosition,
}: {
  isLong: boolean;
  lever: string;
  protocolStore: ProtocolStoreObjectInfo;
  realtimeConfig: RealtimeConfig | undefined;
  payCoinType: string;
  collateralCoinType: string;
  collateralCoinPx: string;
  baseCoinType: string;
  baseCoinDecimal: number;
  payCoinSz: string;
  payCoinDecimal: number;
  collateralCoinDecimal: number;
  px: string;
  slippage: string;
  hzSdk: ReturnType<typeof useHzSdk>;
  tx: Transaction;
  prevPosition?: Position;
}) => {
  if (prevPosition) {
    tx.add(
      hzSdk.VaultModule.createIncreaseOrderWithPositionPayload({
        protocolStore: protocolStore,
        positionId: prevPosition.id,
        borrowFee: realtimeConfig
          ? hzSdk.QueryModule.calculatePositionFundingFee({
              realtimeConfig: realtimeConfig,
              positionSize: prevPosition.size,
              entryFundingFeeRate: prevPosition.entryFundingRate,
            }).positionFundingFeeFormatted
          : '',
        amountIn: payCoinSz,
        collateralCoinDecimals: collateralCoinDecimal,
        collateralCoinPrice: collateralCoinPx,
        indexCoinDecimals: baseCoinDecimal,
        leverage: +lever,
        triggerPrice: px,
        triggerAboveThreshold: !isLong,
        isLong,
        typeArguments: [collateralCoinType, baseCoinType], // payCoinType,
      }),
    );
  } else {
    tx.add(
      hzSdk.VaultModule.createCreateIncreaseOrderPayload({
        protocolStore: protocolStore,
        amountIn: payCoinSz,
        collateralCoinDecimals: collateralCoinDecimal,
        collateralCoinPrice: collateralCoinPx,
        indexCoinDecimals: baseCoinDecimal,
        leverage: +lever,
        triggerPrice: px,
        triggerAboveThreshold: !isLong,
        isLong,
        typeArguments: [collateralCoinType, baseCoinType], // payCoinType,
      }),
    );
  }

  return tx;
};

// form action hook
export const useFormAction = (form: UseFormReturn<PositionForm>) => {
  const { t } = useLingui();
  const { mutate: signAndExecute } = useCustomSignAndExecuteTransaction({
    mutationKey: ['openPosition'],
  });
  const usdAmountDisplayDecimal = useCommonGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const currentAccount = useCurrentAccount();
  const explorerHost = useWalletStore((state) => state.getExplorerHost());

  const { refetch } = useSuiClientQuery('getAllBalances', {
    owner: currentAccount?.address || '',
  });

  const [tradeType, orderType, lever] = useTradeStore(
    useShallow((state) => [state.tradeType, state.orderType, state.lever]),
  );
  const instId = useGlobalStore((state) => state.instId);
  const [inst, coins, baseCoin, usdcCoin] = useInstStore(
    useShallow((state) => [
      state.getInst(state, instId),
      state.getCoins(),
      state.getBaseCoin(state, instId),
      state.getUsdcCoin(state),
    ]),
  );
  // query usdc price, because usdc is collateral coin when short
  usePriceTickerStream('USDC/USD', { throttleWait: 60000 });

  const hzSdk = useHzSdk();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLong = tradeType === TRADE_TYPE.long;
  const realtimeConfig = useRealtimeConfig({
    coinType: (isLong ? baseCoin : usdcCoin)?.coinType,
  });
  const setTxBasicParams = useSetTxBasicParams();

  const { mutateAsync: calcPositionSize } = useCalcPositionSize();

  // handle pay sz change
  const handlePaySzChange = useMemo(() => {
    const debounceUpdate = debounce(async ({ value, px }) => {
      const collateralCoin = (isLong ? baseCoin : usdcCoin)!;
      const lever = useTradeStore.getState().lever;
      const curPosition = getPositionByInstFromCache({
        address: currentAccount?.address,
        network: hzSdk.fullClient.network,
        indexCoinType: baseCoin?.coinType || '',
        isLong,
      })[0];

      await calcPositionSize({
        borrowFee:
          curPosition && realtimeConfig
            ? hzSdk.QueryModule.calculatePositionFundingFee({
                realtimeConfig: realtimeConfig,
                positionSize: curPosition.size,
                entryFundingFeeRate: curPosition.entryFundingRate,
              }).positionFundingFeeFormatted
            : '',
        payCoinType: value.coin,
        payCoinAmount: value.value,
        collateralCoin: collateralCoin,
        isLong,
        targetCoinPx: px,
        lever,
      });
    }, 200);

    return (value: { value?: string; coin?: string }) => {
      form.setValue('paySz', value);
      const px = form.getValues('px');

      debounceUpdate({ value, px });
    };
  }, [
    form,
    calcPositionSize,
    baseCoin,
    isLong,
    usdcCoin,
    currentAccount,
    hzSdk,
    realtimeConfig,
  ]);

  const onSubmit = useCallback(
    (data: PositionForm) => {
      const { paySz, px } = data;
      if (!currentAccount?.address || !paySz.coin) {
        return;
      }

      let tx = new Transaction();
      // basic settings
      tx = setTxBasicParams(tx);

      const marketPx = getCachedPriceTickerData(inst?.id)?.[0]?.p;
      const usdcPx = getCachedPriceTickerData('USDC/USD')?.[0]?.p;
      const payCoinPx = getCachedPriceTickerData(
        `${coins[paySz.coin]?.symbol}/USD`,
      )?.[0]?.p;
      const protocolStore = getProtocolStoreDataFromCache(
        hzSdk.fullClient.network,
      );
      const { slippage } = usePreferenceStore.getState();

      // required params
      if (
        !paySz.value ||
        !coins[paySz.coin] ||
        !baseCoin ||
        !marketPx ||
        (!isLong && (!usdcCoin || !usdcPx)) ||
        !payCoinPx ||
        !protocolStore
      ) {
        toast.error('Required parameter is missing');
        return;
      }

      const collateralCoin = (isLong ? baseCoin : usdcCoin)!;
      const prevPosition = getPositionByInstFromCache({
        address: currentAccount.address,
        indexCoinType: baseCoin.coinType,
        isLong,
        network: hzSdk.fullClient.network,
      })[0];
      setIsSubmitting(true);
      try {
        // build tx
        if (orderType === ORDER_TYPE.market) {
          tx = buildMarketOrderTx({
            isLong,
            protocolStore: protocolStore,
            realtimeConfig,
            lever,
            payCoinType: coins[paySz.coin]!.coinType,
            payCoinSz: paySz.value,
            payCoinPx: payCoinPx,
            payCoinDecimal: coins[paySz.coin]!.decimal,
            collateralCoinType: collateralCoin.coinType,
            collateralCoinDecimal: collateralCoin.decimal,
            collateralCoinPx: isLong ? marketPx : usdcPx!,
            baseCoinType: baseCoin.coinType,
            baseCoinDecimal: baseCoin.decimal,
            baseCoinPx: marketPx,
            slippage,
            hzSdk,
            tx,
            prevPosition,
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
            setIsSubmitting(false);
            return;
          }

          tx = buildLimitOrderTx({
            protocolStore: protocolStore,
            realtimeConfig,
            isLong,
            lever,
            px,
            payCoinType: coins[paySz.coin]!.coinType,
            payCoinSz: paySz.value,
            payCoinDecimal: coins[paySz.coin]!.decimal,
            collateralCoinType: collateralCoin.coinType,
            collateralCoinDecimal: collateralCoin.decimal,
            baseCoinType: baseCoin.coinType,
            baseCoinDecimal: baseCoin.decimal,
            collateralCoinPx: isLong ? marketPx : usdcPx!,
            slippage,
            hzSdk,
            tx,
            prevPosition,
          });
        }
        const posData = getOpenPositionSizeFromCache({
          payCoinType: coins[paySz.coin]!.coinType,
          collateralCoinType: collateralCoin.coinType,
        });

        signAndExecute(
          { transaction: tx },
          {
            onSuccess(result) {
              if (result.status === 'failed') {
                setIsSubmitting(false);
                return;
              }
              const paySz = form.getValues('paySz');
              handlePaySzChange({
                ...paySz,
                value: '',
              });
              refetch();
              if (orderType === ORDER_TYPE.market) {
                const event = result.events?.find((v) =>
                  v.type.includes('IncreasePositionRequestEvent'),
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
                        ({ r, d }) => r === request_id && d === 'incr',
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
                              data.a === 'exec' ? t`Opened` : t`Failed`,
                            showClose: true,
                            content: (
                              <OrderToastContent
                                isLong={isLong}
                                size={truncateFormat(
                                  posData?.size,
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
                        setIsSubmitting(false);
                        useTradeStore
                          .getState()
                          .setStore({ smDialogOpen: false });
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

                    setIsSubmitting(false);
                    useTradeStore.getState().setStore({ smDialogOpen: false });
                  }, 5000);

                  return;
                }
              } else {
                refetchOrders(currentAccount.address, hzSdk.fullClient.network);
              }

              setIsSubmitting(false);
              useTradeStore.getState().setStore({ smDialogOpen: false });
            },
            onError() {
              setIsSubmitting(false);
            },
          },
          {
            showDefaultSuccess: orderType !== ORDER_TYPE.market,
            ordType: 'market',
            title:
              orderType === ORDER_TYPE.market
                ? t`Market Order`
                : t`Limit Order`,
            icon: <CoinIcon size={24} src={inst?.icon} alt={inst?.name} />,
            resultDescription:
              orderType === ORDER_TYPE.market ? undefined : t`Opened`,
          },
        );
      } catch (error) {
        toast.error((error as Error).message);
        setIsSubmitting(false);
      }
    },
    [
      currentAccount,
      setTxBasicParams,
      isLong,
      baseCoin,
      usdcCoin,
      coins,
      orderType,
      hzSdk,
      signAndExecute,
      lever,
      inst,
      form,
      refetch,
      realtimeConfig,
      t,
      handlePaySzChange,
      explorerHost,
      usdAmountDisplayDecimal,
    ],
  );

  // handle leverage change
  const handleLeverChange = useCallback(() => {
    const paySz = form.getValues('paySz');
    handlePaySzChange(paySz);
  }, [handlePaySzChange, form]);

  // handle price change
  const handlePxChange = useCallback(
    (px: string) => {
      form.setValue('px', px);
      const paySz = form.getValues('paySz');
      handlePaySzChange(paySz);
    },
    [handlePaySzChange, form],
  );

  return {
    onSubmit,
    isSubmitting,
    onPaySzChange: handlePaySzChange,
    onLeverChange: handleLeverChange,
    onPxChange: handlePxChange,
  };
};
