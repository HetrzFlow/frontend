import { PEACH_NATIVE_TOKEN_ADDRESS } from '@hertzflow/sdk-v2';
import {
  getViemChain,
  SOURCE_BSC_MAINNET,
} from '@hertzflow/sdk-v2/configs/chains';
import {
  getInternalUsdParamsForInst,
  getTradePayTokenAddress,
} from '@hertzflow/sdk-v2/configs/internalUsd';
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
import { withTimeout, zeroAddress } from 'viem';
import { CoinIcon } from '@repo/common/components';
import { calc } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import { useMutation } from '@repo/lib/queryClient';
import { toast, tradeToast } from '@repo/ui';
import {
  CONTRACT_PRECISION_MULTIPLIER,
  CONTRACT_USD_MULTIPLIER,
  CREDIT_MARKET_CATEGORY,
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
import { getShortInstName } from '@/common/utils/inst';
import { swapMessages, translateSwapMessage } from '@/components/Swap/messages';
import { ENABLE_SWAP } from '@/constants/common';
import { getPositionModeKey } from '@/lib/trade/position';
import {
  getMarketOrderEventKey,
  handleMarketOrderEvent,
  TIMEOUT,
} from '@/lib/trade/transaction';
import { refetchPlatformHistoryOrders } from '@/services/rest/order';
import { usePreferenceStore } from '@/stores/trade/preference';
import { useIsZFP } from './useIsZFP';
import type { PayToken } from '../../../store';
import type { ExternalSwapQuote } from '@hertzflow/sdk-v2/types/externalSwap';

const normalizePaymentTokenAddress = (address: string) =>
  address.toLowerCase() === PEACH_NATIVE_TOKEN_ADDRESS ? zeroAddress : address;

// create increase order
export const useCreateIncreaseOrder = () => {
  const hzSdk = useHzSdk();
  const { executeTransaction } = useCustomSignAndExecuteTransaction();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );

  const coins = useInstStore((state) => state.getCoins());
  // Cache reader: TradeBox registers the submitted instrument as active.
  const { data: marketsConfigs } = useMarketsConfigs({ markets: [] });
  // Cache reader: TradeBox registers the current instrument as active.
  const { data: marketsValues } = useMarketsValues(undefined, { markets: [] });
  const slippage = usePreferenceStore((state) => state.slippage);
  const swapSlippage = usePreferenceStore((state) => state.swapSlippage);
  const { data: gasLimits } = useGasLimits();
  const { data: gasPrice } = useGasPrice();
  const isZFP = useIsZFP();
  return useMutation({
    mutationKey: ['createOrder'],
    mutationFn: async ({
      inst,
      orderType,
      collateralTokenAddress,
      payTokenAddress,
      paymentAmount,
      payToken: payTokenMetadata,
      externalSwapQuote: suppliedExternalSwapQuote,
      px,
      collateralAmount,
      sizeInUsd,
      createTpSlEntries,
      tpSlSizeInUsd,
      tpSlCollateralAmount,
      isLong,
      cb,
    }: {
      inst: Inst;
      orderType: OrderType;
      collateralTokenAddress: string;
      /** Token selected in the paying-token selector. */
      payTokenAddress?: string;
      /** User-entered amount in the selected paying token. */
      paymentAmount?: string;
      /** Metadata for a Peach token that is not in the market token list. */
      payToken?: PayToken;
      externalSwapQuote?: ExternalSwapQuote;
      px: string;
      collateralAmount: string;
      sizeInUsd: string;
      isLong: boolean;
      createTpSlEntries?: {
        orderType: OrderType;
        triggerPrice: string;
        autoCancel: boolean;
      }[];
      /** Full position size (existing + new) for TP/SL orders */
      tpSlSizeInUsd?: string;
      /** Full position collateral (existing + new) for TP/SL orders */
      tpSlCollateralAmount?: string;
      cb: () => void;
    }) => {
      const indexToken = coins[inst.indexTokenAddress];
      const internalUsd = getInternalUsdParamsForInst(hzSdk?.chainId, inst);
      const defaultPayTokenAddress = getTradePayTokenAddress({
        chainId: hzSdk?.chainId,
        inst,
        collateralTokenAddress,
      });
      const selectedPayTokenAddress = normalizePaymentTokenAddress(
        payTokenAddress || defaultPayTokenAddress || collateralTokenAddress,
      );
      const swapOutputTokenAddress =
        internalUsd?.underlyingTokenAddress || defaultPayTokenAddress;
      const collateralToken = coins[collateralTokenAddress];
      const payToken =
        payTokenMetadata ||
        coins[selectedPayTokenAddress] ||
        coins[payTokenAddress || ''];
      const prices = usePriceStore.getState().pricesMap;
      const marketConfig = marketsConfigs?.[inst.marketTokenAddress];
      const marketValue = marketsValues?.[inst.marketTokenAddress];

      if (
        !hzSdk ||
        !indexToken ||
        !collateralToken ||
        !payToken ||
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
          marketConfig?.maxPositionImpactFactorPositive ?? 0n,
        maxPositionImpactFactorNegative:
          marketConfig?.maxPositionImpactFactorNegative ?? 0n,
        positionImpactFactorPositive:
          marketConfig?.positionImpactFactorPositive ?? 0n,
        positionImpactFactorNegative:
          marketConfig?.positionImpactFactorNegative ?? 0n,
        positionImpactExponentFactor:
          marketConfig?.positionImpactExponentFactor ?? 0n,
        longInterestUsd: marketValue?.longInterestUsd ?? 0n,
        shortInterestUsd: marketValue?.shortInterestUsd ?? 0n,
        virtualInventoryForPositions:
          marketValue?.virtualInventoryForPositions ?? 0n,
      };

      const isLimit = orderType === OrderType.LimitIncrease;
      const orderTitle = isLimit
        ? i18n._(msg`Limit Order`)
        : i18n._(msg`Market Order`);

      const triggerPrice = BigInt(
        calc(px).times(CONTRACT_PRECISION_MULTIPLIER).toFixed(0),
      );
      // Round down the last digit to 0 to meet contract size precision requirements
      const sizeDeltaUsd =
        (BigInt(
          calc(sizeInUsd).abs().times(CONTRACT_USD_MULTIPLIER).toFixed(0),
        ) /
          10n) *
        10n;
      const collateralAmountDelta = BigInt(
        calc(paymentAmount || collateralAmount)
          .times(calc(10).pow(payToken.decimals))
          .toFixed(0),
      );

      let externalSwapQuote = suppliedExternalSwapQuote;
      if (
        !externalSwapQuote &&
        swapOutputTokenAddress &&
        selectedPayTokenAddress.toLowerCase() !==
          normalizePaymentTokenAddress(swapOutputTokenAddress).toLowerCase()
      ) {
        if (!internalUsd || !hzSdk.externalSwap) {
          toast.error(
            i18n._(msg`Selected paying token is not supported for this market`),
          );
          return;
        }
        if (
          hzSdk.chainId !== SOURCE_BSC_MAINNET ||
          !ENABLE_SWAP ||
          inst.category === CREDIT_MARKET_CATEGORY
        ) {
          toast.error(
            i18n._(msg`Swap is not supported on this network or market`),
          );
          return;
        }

        try {
          externalSwapQuote = await hzSdk.externalSwap.getOrderQuote({
            tokenIn: selectedPayTokenAddress as `0x${string}`,
            tokenOut: normalizePaymentTokenAddress(
              swapOutputTokenAddress,
            ) as `0x${string}`,
            amountIn: collateralAmountDelta,
            slippageBps: Number(Math.floor(+swapSlippage * 10000)),
          });
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : i18n._(msg`Failed to get swap quote`),
          );
          return;
        }
      }

      const title = externalSwapQuote
        ? translateSwapMessage(
            i18n,
            isLong ? swapMessages.swapAndLong : swapMessages.swapAndShort,
            { market: getShortInstName(inst) },
          )
        : orderTitle;

      // TP/SL size = full position size (existing + new order)
      const tpSlSizeDeltaUsd = BigInt(
        calc(tpSlSizeInUsd || sizeInUsd)
          .abs()
          .times(CONTRACT_USD_MULTIPLIER)
          .toFixed(0),
      );
      const tpSlCollateralAmountDelta = BigInt(
        calc(tpSlCollateralAmount || collateralAmount)
          .times(calc(10).pow(collateralToken.decimals))
          .toFixed(0),
      );

      const isMarketOrder = isMarketOrderType(orderType);

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
          const txPromise = hzSdk.orders.createIncreaseOrder({
            isLimit: orderType === OrderType.LimitIncrease,
            marketAddress: inst.marketTokenAddress,
            prices: prices,
            allowedSlippage: Number(Math.floor(+slippage * 10000)),
            collateralTokenAddress: collateralTokenAddress,
            receiveTokenAddress: collateralTokenAddress,
            fromTokenAddress: selectedPayTokenAddress,
            internalUsd,
            externalSwapQuote,
            triggerPrice,
            increaseAmounts: {
              initialCollateralAmount: collateralAmountDelta,
              sizeDeltaUsd: sizeDeltaUsd,
              acceptablePrice: isMarketOrder
                ? getAcceptablePriceInfo({
                    marketInfo: safeMarketInfo,
                    indexTokenPrices: prices[inst.indexTokenAddress]!,
                    indexTokenDecimals: indexToken.decimals,
                    isIncrease: true,
                    isLimit: isLimit,
                    isLong,
                    indexPrice: triggerPrice,
                    sizeDeltaUsd: sizeDeltaUsd,
                    maxNegativePriceImpactBps: undefined,
                  }).acceptablePrice
                : // limit order not set Acceptable price impact, so set 0 or MaxUint256 to make sure the order will be executed
                  isLong
                  ? MaxUint256
                  : 0n,
            },
            createSltpEntries:
              createTpSlEntries?.map((v) => {
                const isSl = v.orderType === OrderType.StopLossDecrease;
                const entryTriggerPrice = BigInt(
                  calc(v.triggerPrice)
                    .times(CONTRACT_PRECISION_MULTIPLIER)
                    .toFixed(0),
                );
                return {
                  collateralDeltaAmount: tpSlCollateralAmountDelta,
                  sizeDeltaUsd: tpSlSizeDeltaUsd,
                  acceptablePrice: isSl
                    ? isLong
                      ? 0n
                      : MaxUint256
                    : applySlippageToPrice(
                        Number(Math.floor(+slippage * 10000)),
                        entryTriggerPrice,
                        false,
                        isLong,
                      ),
                  triggerPrice: entryTriggerPrice,
                  orderType: v.orderType,
                  decreaseSwapType: DecreasePositionSwapType.NoSwap,
                  autoCancel: v.autoCancel,
                };
              }) ?? [],
            cancelSltpEntries: [],
            updateSltpEntries: [],
            isLong,
            indexToken,
            tokensData: coins,
            skipSimulation: true,
            gasLimits,
            gasPrice,
            orderPositionType: isZFP
              ? OrderPositionType.ZFP
              : OrderPositionType.Normal,
          });
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
                                sizeInUsd,
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
                                sizeInUsd,
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
                    void hzSdk.publicClient
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
                        // Fallback: subscribe to usePositionTimestampStore
                        // which is updated on every positions poll. If events
                        // are unreliable this will resolve as soon as the next
                        // positions refetch detects the new increasedAtTime.
                        const positionKey = getPositionModeKey({
                          marketAddress: inst.marketTokenAddress,
                          isLong,
                          isZFP,
                        });
                        const snapshotIncreasedAtTime =
                          usePositionTimestampStore.getState()
                            .lastIncreasedAtTime[positionKey] ?? 0n;

                        const unsubscribe = usePositionTimestampStore.subscribe(
                          () => {
                            const latest =
                              usePositionTimestampStore.getState()
                                .lastIncreasedAtTime[positionKey] ?? 0n;
                            if (latest > snapshotIncreasedAtTime) {
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
                                        sizeInUsd,
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
                          },
                        );

                        // Clean up subscription when the outer withTimeout expires.
                        setTimeout(() => unsubscribe(), TIMEOUT);
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
          // For market orders, wait for execution event with custom toast
          if (!isMarketOrder) {
            // For limit orders, just refetch history
            refetchPlatformHistoryOrders(inst.id);
          }
          cb();
        },
      });
    },
  });
};
