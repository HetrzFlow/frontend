import { HertzFlowSDK } from '@hertzflow/sdk-v2';
import { getInternalUsdParamsForInst } from '@hertzflow/sdk-v2/configs/internalUsd';
import {
  DecreasePositionSwapType,
  OrderPositionType,
  OrderType,
} from '@hertzflow/sdk-v2/types/orders';
import { getAcceptablePriceInfo } from '@hertzflow/sdk-v2/utils/prices';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Address } from 'viem';
import { CoinIcon } from '@repo/common/components';
import { calc } from '@repo/lib/calc';
import { useMutation } from '@repo/lib/queryClient';
import { toast } from '@repo/ui';
import {
  CONTRACT_PRECISION_MULTIPLIER,
  CONTRACT_USD_MULTIPLIER,
  getCachedPriceTickerData,
  Position,
  useHzSdk,
  useInstStore,
  useMarketsConfigs,
  useMarketsValues,
  usePriceStore,
} from '@/common';
import { useCustomSignAndExecuteTransaction } from '@/common/hooks/useExecTransaction';
import { useGasLimits, useGasPrice } from '@/common/services/rest/gas';
import { getCachedMarketExecutionPrice } from '@/lib/trade/executionPrice';
import { usePreferenceStore } from '@/stores/trade/preference';

// close all positions
export const useClosePositions = (positions?: Position[]) => {
  const hzSdk = useHzSdk();
  const { executeTransaction } = useCustomSignAndExecuteTransaction();

  const insts = useInstStore((state) => state.getInsts());
  const coins = useInstStore((state) => state.getCoins());
  const positionMarkets = positions?.map(
    (position) => insts[position.marketAddress],
  );
  const { data: marketsConfigs } = useMarketsConfigs({
    markets: positionMarkets,
  });
  const { data: marketsValues } = useMarketsValues(undefined, {
    markets: positionMarkets,
  });
  const slippage = usePreferenceStore((state) => state.slippage);
  const { data: gasLimits } = useGasLimits();
  const { data: gasPrice } = useGasPrice();

  return useMutation({
    mutationKey: ['closePositions'],
    mutationFn: async ({
      positions,
      cb,
    }: {
      positions: Position[];
      cb: () => void;
    }) => {
      const decreaseOrdersParams: Parameters<
        HertzFlowSDK['orders']['createDecreaseOrder']
      >[0] = [];

      for (let i = 0; i < positions.length; i++) {
        const {
          isLong,
          isZFP,
          marketAddress,
          sizeInUsd,
          collateralAmount,
          collateralTokenAddress,
        } = positions[i]!;
        const inst = insts[marketAddress];
        const indexToken = coins[inst?.indexTokenAddress || ''];
        const collateralToken = coins[collateralTokenAddress];
        const prices = usePriceStore.getState().pricesMap;
        const marketConfigs = marketsConfigs?.[inst?.marketTokenAddress || ''];
        const marketValues = marketsValues?.[inst?.marketTokenAddress || ''];
        const internalUsd = getInternalUsdParamsForInst(hzSdk?.chainId, inst);

        const markPx =
          getCachedMarketExecutionPrice({
            symbol: inst?.symbol,
            indexTokenAddress: inst?.indexTokenAddress,
            isIncrease: false,
            isLong,
          }) || getCachedPriceTickerData(inst?.symbol)?.[0]?.p;

        if (
          !inst ||
          !indexToken ||
          !collateralToken ||
          !markPx ||
          !prices[inst.indexTokenAddress]
        ) {
          continue;
        }
        const triggerPrice = BigInt(
          calc(markPx).times(CONTRACT_PRECISION_MULTIPLIER).toFixed(0),
        );
        const sizeDeltaUsd = BigInt(
          calc(sizeInUsd).abs().times(CONTRACT_USD_MULTIPLIER).toFixed(0),
        );

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

        decreaseOrdersParams.push({
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
            acceptablePrice: getAcceptablePriceInfo({
              marketInfo: safeMarketInfo,
              indexTokenPrices: prices[inst.indexTokenAddress]!,
              indexTokenDecimals: indexToken.decimals,
              isIncrease: false,
              isLimit: false,
              isLong,
              indexPrice: triggerPrice,
              sizeDeltaUsd: sizeDeltaUsd,
            }).acceptablePrice,
            sizeDeltaUsd: sizeDeltaUsd,
          },
          collateralToken,
          allowedSlippage: Number(Math.floor(+slippage * 10000)),
          isLong,
          orderPositionType: isZFP
            ? OrderPositionType.ZFP
            : OrderPositionType.Normal,
          referralCode: undefined,
          orderType: OrderType.MarketDecrease,
          indexToken,
          gasLimits,
          gasPrice,
          internalUsd,
        });
      }

      if (!decreaseOrdersParams.length || !hzSdk) {
        toast.error('Required parameter is missing');
        return;
      }

      const isMulti = positions.length > 1;
      const _inst = insts[positions[0]?.marketAddress || ''];
      const icon =
        !isMulti && _inst ? (
          <CoinIcon size={24} src={_inst.icon} alt={_inst.name} />
        ) : undefined;

      const title = isMulti
        ? i18n._(msg`Close Positions`)
        : i18n._(msg`Close Position`);

      await executeTransaction({
        toast: {
          title,
          description: i18n._(msg`Submitting`),
          successDescription: i18n._(msg`Submitted`),
          icon: icon || (
            <CoinIcon size={24} src={_inst?.icon} alt={_inst?.name} />
          ),
          id: 'toast-closePositions',
        },
        executeTransaction: async () => {
          return await hzSdk.orders.createDecreaseOrder(decreaseOrdersParams);
        },
        onSuccess: async () => {
          cb();
        },
      });
    },
  });
};
