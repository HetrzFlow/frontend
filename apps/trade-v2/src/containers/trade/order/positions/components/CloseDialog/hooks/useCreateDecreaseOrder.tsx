import { getViemChain } from '@hertzflow/sdk-v2/configs/chains';
import { getInternalUsdParamsForInst } from '@hertzflow/sdk-v2/configs/internalUsd';
import {
  DecreasePositionSwapType,
  OrderPositionType,
  OrderType,
} from '@hertzflow/sdk-v2/types/orders';
import { createRevertedTransactionError } from '@hertzflow/sdk-v2/utils/callContract';
import { MaxUint256 } from '@hertzflow/sdk-v2/utils/numbers';
import { isMarketOrderType } from '@hertzflow/sdk-v2/utils/orders';
import { getAcceptablePriceInfo } from '@hertzflow/sdk-v2/utils/prices';
import { applySlippageToPrice } from '@hertzflow/sdk-v2/utils/trade/trade';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Address, withTimeout } from 'viem';
import { CoinIcon } from '@repo/common/components';
import { calc } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import { useMutation } from '@repo/lib/queryClient';
import { toast, tradeToast } from '@repo/ui';
import {
  CONTRACT_PRECISION_MULTIPLIER,
  CONTRACT_USD_MULTIPLIER,
  Inst,
  OrderToastContent,
  useGlobalStore,
  useHzSdk,
  useInstStore,
  useMarketsConfigs,
  useMarketsValues,
  usePriceStore,
} from '@/common';
import { useCustomSignAndExecuteTransaction } from '@/common/hooks/useExecTransaction';
import { useGasLimits, useGasPrice } from '@/common/services/rest/gas';
import { usePositionTimestampStore } from '@/common/services/rest/position';
import { getPositionModeKey } from '@/lib/trade/position';
import {
  getMarketOrderEventKey,
  handleMarketOrderEvent,
  TIMEOUT,
} from '@/lib/trade/transaction';
import { refetchPlatformHistoryOrders } from '@/services/rest/order';
import { usePreferenceStore } from '@/stores/trade/preference';

// create decrease order
export const useCreateDecreaseOrder = () => {
  const hzSdk = useHzSdk();
  const { executeTransaction } = useCustomSignAndExecuteTransaction();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );

  const coins = useInstStore((state) => state.getCoins());
  // Cache reader: the owning close dialog registers its position market.
  const { data: marketsConfigs } = useMarketsConfigs({ markets: [] });
  // Cache reader: CloseDialog registers the submitted position market.
  const { data: marketsValues } = useMarketsValues(undefined, { markets: [] });
  const slippage = usePreferenceStore((state) => state.slippage);
  const { data: gasLimits } = useGasLimits();
  const { data: gasPrice } = useGasPrice();
  return useMutation({
    mutationKey: ['closePosition'],
    mutationFn: async ({
      inst,
      orderType,
      collateralTokenAddress,
      px,
      collateralAmount,
      sizeInUsd,
      isLong,
      isZFP,
      isCloseAll,
      autoCancel,
      cb,
    }: {
      inst: Inst;
      orderType: OrderType;
      collateralTokenAddress: string;
      px: string;
      collateralAmount: string;
      sizeInUsd: string;
      isLong: boolean;
      isZFP?: boolean;
      isCloseAll: boolean;
      autoCancel?: boolean;
      cb: () => void;
    }) => {
      const indexToken = coins[inst.indexTokenAddress];
      const collateralToken = coins[collateralTokenAddress];
      const prices = usePriceStore.getState().pricesMap;
      const marketConfigs = marketsConfigs?.[inst.marketTokenAddress];
      const marketValues = marketsValues?.[inst.marketTokenAddress];
      const internalUsd = getInternalUsdParamsForInst(hzSdk?.chainId, inst);

      if (
        !hzSdk ||
        !indexToken ||
        !collateralToken ||
        !px ||
        !prices[inst.indexTokenAddress]
      ) {
        toast.error('Required parameter is missing');
        return;
      }

      // Fall back to zero-impact values when market data is unavailable (e.g. network error).
      // getAcceptablePriceInfo treats all-zero factors as no price impact, so acceptablePrice
      // equals indexPrice ± slippage — a safe, conservative fallback.
      const safeMarketInfo = {
        maxPositionImpactFactorPositive:
          marketConfigs?.maxPositionImpactFactorPositive ?? 0n,
        maxPositionImpactFactorNegative:
          marketConfigs?.maxPositionImpactFactorNegative ?? 0n,
        positionImpactFactorPositive:
          marketConfigs?.positionImpactFactorPositive ?? 0n,
        positionImpactFactorNegative:
          marketConfigs?.positionImpactFactorNegative ?? 0n,
        positionImpactExponentFactor:
          marketConfigs?.positionImpactExponentFactor ?? 0n,
        longInterestUsd: marketValues?.longInterestUsd ?? 0n,
        shortInterestUsd: marketValues?.shortInterestUsd ?? 0n,
        virtualInventoryForPositions:
          marketValues?.virtualInventoryForPositions ?? 0n,
      };

      const isMarket = orderType === OrderType.MarketDecrease;
      const isTp = orderType === OrderType.LimitDecrease;
      const isSl = orderType === OrderType.StopLossDecrease;
      const title = isMarket
        ? isCloseAll
          ? i18n._(msg`Close Position`)
          : i18n._(msg`Partial Close`)
        : isTp
          ? i18n._(msg`Take Profit Order`)
          : i18n._(msg`Stop Loss Order`);

      const triggerPrice = BigInt(
        calc(px).times(CONTRACT_PRECISION_MULTIPLIER).toFixed(0),
      );
      const sizeDeltaUsd = BigInt(
        calc(sizeInUsd).abs().times(CONTRACT_USD_MULTIPLIER).toFixed(0),
      );
      const isMarketOrder = isMarketOrderType(orderType);
      const acceptablePrice = isSl
        ? isLong
          ? 0n
          : MaxUint256
        : isTp
          ? applySlippageToPrice(
              Number(Math.floor(+slippage * 10000)),
              triggerPrice,
              false,
              isLong,
            )
          : getAcceptablePriceInfo({
              marketInfo: safeMarketInfo,
              indexTokenPrices: prices[inst.indexTokenAddress]!,
              indexTokenDecimals: indexToken.decimals,
              isIncrease: false,
              isLimit: false,
              isLong,
              indexPrice: triggerPrice,
              sizeDeltaUsd: sizeDeltaUsd,
              maxNegativePriceImpactBps: undefined,
            }).acceptablePrice;

      await executeTransaction({
        toast: {
          title,
          description: i18n._(msg`Submitting`),
          successDescription: isMarketOrder
            ? i18n._(msg`Filled`)
            : i18n._(msg`Submitted`),
          icon: <CoinIcon size={24} src={inst?.icon} alt={inst?.name} />,
          showDefaultSuccess: !isMarketOrder, // Market orders will show custom toast in handleMarketOrderEvent
          id: 'toast-createOrder',
        },
        waitTransaction: isMarketOrder ? false : true,
        executeTransaction: async () => {
          const txPromise = hzSdk.orders.createDecreaseOrder([
            {
              marketAddress: inst.marketTokenAddress as Address,
              tokensData: coins,
              prices,
              decreaseAmounts: {
                decreaseSwapType: DecreasePositionSwapType.NoSwap,
                triggerPrice: triggerPrice,
                collateralDeltaAmount: BigInt(
                  calc(collateralAmount)
                    .times(calc(10).pow(collateralToken.decimals))
                    .toFixed(0),
                ),
                acceptablePrice: acceptablePrice,
                sizeDeltaUsd,
              },
              collateralToken,
              allowedSlippage: Number(Math.floor(+slippage * 10000)),
              isLong,
              orderType: orderType as
                | OrderType.MarketDecrease
                | OrderType.StopLossDecrease
                | OrderType.LimitDecrease,
              orderPositionType: isZFP
                ? OrderPositionType.ZFP
                : OrderPositionType.Normal,
              indexToken,
              autoCancel,
              gasLimits,
              gasPrice,
              internalUsd,
            },
          ]);

          let eventPromise = Promise.resolve('');
          if (isMarketOrder) {
            const explorerHost = getViemChain(hzSdk.config.chainId)
              .blockExplorers?.default.url;
            const toastId = 'toast-createOrder';

            eventPromise = withTimeout(
              () =>
                new Promise((resolve, reject) => {
                  handleMarketOrderEvent({
                    hzSdk,
                    orderKey: getMarketOrderEventKey({
                      marketAddress: inst.marketTokenAddress,
                      isLong,
                      orderType,
                      isZFP,
                    }),
                    onsubmit: (txHash) => {
                      tradeToast(
                        {
                          type: isMarketOrder ? 'loading' : 'success',
                          title: title,
                          description: i18n._(msg`Submitted`),
                          showClose: isMarketOrder ? false : true,
                          icon: (
                            <CoinIcon
                              size={24}
                              src={inst?.icon}
                              alt={inst?.name}
                            />
                          ),
                          content: (
                            <OrderToastContent
                              isLong={isLong}
                              size={truncateFormat(
                                calc(sizeInUsd).times(-1),
                                usdAmountDisplayDecimal,
                                {
                                  style: 'currency',
                                  currency: 'USD',
                                  signDisplay: 'always',
                                  stripTrailingZeros: true,
                                },
                              )}
                              px={truncateFormat(px, inst?.pxDispDecimal, {
                                style: 'currency',
                                currency: 'USD',
                              })}
                              href={
                                txHash ? `${explorerHost}/tx/${txHash}` : ''
                              }
                            />
                          ),
                        },
                        {
                          id: toastId,
                          duration: isMarketOrder ? Infinity : undefined,
                        },
                      );
                    },
                    onSuccess: (txHash) => {
                      tradeToast(
                        {
                          type: 'success',
                          title: title,
                          description: i18n._(msg`Filled`),
                          showClose: true,
                          icon: (
                            <CoinIcon
                              size={24}
                              src={inst?.icon}
                              alt={inst?.name}
                            />
                          ),
                          content: (
                            <OrderToastContent
                              isLong={isLong}
                              size={truncateFormat(
                                calc(sizeInUsd).times(-1),
                                usdAmountDisplayDecimal,
                                {
                                  style: 'currency',
                                  currency: 'USD',
                                  signDisplay: 'always',
                                  stripTrailingZeros: true,
                                },
                              )}
                              px={truncateFormat(px, inst?.pxDispDecimal, {
                                style: 'currency',
                                currency: 'USD',
                              })}
                              href={
                                txHash ? `${explorerHost}/tx/${txHash}` : ''
                              }
                            />
                          ),
                        },
                        {
                          id: toastId,
                        },
                      );
                      resolve('');
                    },
                    onFailed: ({ reason }) => {
                      reject(
                        new Error(
                          reason
                            ? `${i18n._(msg`Order has been cancelled`)}: ${reason}.`
                            : i18n._(msg`Order has been cancelled`),
                        ),
                      );
                    },
                  });

                  void txPromise.then((txHash) => {
                    void hzSdk?.publicClient
                      ?.waitForTransactionReceipt({
                        hash: txHash as `0x${string}`,
                      })
                      .then(async (receipt) => {
                        if (receipt.status === 'reverted') {
                          reject(
                            await createRevertedTransactionError({
                              sdk: hzSdk,
                              receipt,
                              txHash,
                            }),
                          );
                          return;
                        }
                        if (isMarketOrder) {
                          // Fallback for market decrease: subscribe to
                          // decreasedAtTime changes in the positions store.
                          const positionKey = getPositionModeKey({
                            marketAddress: inst.marketTokenAddress,
                            isLong,
                            isZFP,
                          });
                          const snapshotDecreasedAtTime =
                            usePositionTimestampStore.getState()
                              .lastDecreasedAtTime[positionKey] ?? 0n;
                          const unsubscribe =
                            usePositionTimestampStore.subscribe(() => {
                              const latest =
                                usePositionTimestampStore.getState()
                                  .lastDecreasedAtTime[positionKey] ?? 0n;
                              if (latest > snapshotDecreasedAtTime) {
                                unsubscribe();
                                refetchPlatformHistoryOrders(inst.id);
                                tradeToast(
                                  {
                                    type: 'success',
                                    title: title,
                                    description: i18n._(msg`Filled`),
                                    showClose: true,
                                    icon: (
                                      <CoinIcon
                                        size={24}
                                        src={inst?.icon}
                                        alt={inst?.name}
                                      />
                                    ),
                                    content: (
                                      <OrderToastContent
                                        isLong={isLong}
                                        size={truncateFormat(
                                          calc(sizeInUsd).times(-1),
                                          usdAmountDisplayDecimal,
                                          {
                                            style: 'currency',
                                            currency: 'USD',
                                            signDisplay: 'always',
                                            stripTrailingZeros: true,
                                          },
                                        )}
                                        px={truncateFormat(
                                          px,
                                          inst?.pxDispDecimal,
                                          {
                                            style: 'currency',
                                            currency: 'USD',
                                          },
                                        )}
                                        href={
                                          txHash
                                            ? `${explorerHost}/tx/${txHash}`
                                            : ''
                                        }
                                      />
                                    ),
                                  },
                                  { id: toastId },
                                );
                                resolve('');
                              }
                            });
                          setTimeout(() => unsubscribe(), TIMEOUT);
                        }
                      })
                      .catch(reject);
                  }, reject);
                }),
              {
                timeout: TIMEOUT,
                errorInstance: new Error('timeout'),
              },
            );
          }

          return (await Promise.all([txPromise, eventPromise]))[0];
        },
        onSuccess: async () => {
          if (!isMarketOrder) {
            // For limit/SL/TP orders, just refetch history
            refetchPlatformHistoryOrders(inst.id);
          }
          cb();
        },
      });
    },
  });
};
