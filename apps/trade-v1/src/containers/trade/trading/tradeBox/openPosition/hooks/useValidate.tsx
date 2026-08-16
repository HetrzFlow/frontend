import { useMemo } from 'react';
import { FEE_BPS_POWER, FeeKey } from '@hertzflow/sdk';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useShallow } from 'zustand/react/shallow';
import { calc } from '@repo/lib/calc';
import { thoFormat, truncateFormat } from '@repo/lib/format';
import {
  useBalances,
  useHzSdk,
  useMaxDepositWithdraw,
  balanceValidator,
  getProtocolStoreDataFromCache,
  useBorrowFee,
  usePoolDetail,
  usePositionLiqPoolData,
  useGlobalStore as useCommonGlobalStore,
  getPositionByInstFromCache,
  getCachedPriceTickerData,
  useInstStore,
} from '@/common';
import {
  MARKET_PX,
  MIN_RESIDUAL_COLLATERAL,
  NORMALIZED_SUI_TYPE_ARG,
} from '@/constants/common';
import { PositionSizeAndFeesResultType } from '@/services/rest/trade';
import { useGlobalStore } from '@/stores/trade/global';
import { useTradeStore } from '../../../store';
import { priceValidator } from '../validators/price';

export const useValidate = ({
  px,
  sz,
  coin,
  instId,
  isLong,
  coinName = '',
  feeData,
}: {
  px: string;
  sz: string;
  coin: string;
  instId: string;
  isLong: boolean;
  coinName?: string;
  feeData?:
    | PositionSizeAndFeesResultType
    | {
        openFee: number;
        swapFee: number;
        size: string;
        collateral: string;
        isPending: boolean;
      };
}) => {
  const [inst, coins, usdcCoin] = useInstStore(
    useShallow((state) => [
      state.getInst(state, instId),
      state.getCoins(),
      state.getUsdcCoin(state),
    ]),
  );
  const balances = useBalances([coin, NORMALIZED_SUI_TYPE_ARG]);

  let preValidateText: string | undefined;

  preValidateText = useMemo(() => {
    // empty validation
    if (!+px || !+sz || !coin) {
      return isLong
        ? i18n._(msg`Long ${coinName}`)
        : i18n._(msg`Short ${coinName}`);
    }
  }, [px, sz, coin, coinName, isLong]);

  preValidateText = useMemo(() => {
    if (preValidateText) return preValidateText;

    // price validation
    if (px !== MARKET_PX) {
      const priceValidateResult = priceValidator({
        isLong,
        px,
        instId,
      });
      if (priceValidateResult) {
        return priceValidateResult;
      }
    }
  }, [preValidateText, instId, isLong, px]);

  preValidateText = useMemo(() => {
    if (preValidateText) return preValidateText;

    // coin balance validation
    return balanceValidator({
      coin: coins[coin],
      coinSize: sz,
      coinBalance: balances?.[0]?.totalBalance,
      suiCoin: coins[NORMALIZED_SUI_TYPE_ARG],
      suiBalance: balances?.[1]?.totalBalance,
    });
  }, [sz, coins, balances, coin, preValidateText]);

  const { baseCoin = '' } = inst || {};
  const collateralCoinType = isLong ? baseCoin : usdcCoin?.coinType;

  preValidateText = useMemo(() => {
    if (preValidateText) return preValidateText;

    // min collateral validation
    if (
      feeData?.collateral &&
      calc(feeData.collateral).lt(MIN_RESIDUAL_COLLATERAL)
    ) {
      const dispMinValue = thoFormat(MIN_RESIDUAL_COLLATERAL);
      return i18n._(msg`Min Collateral: ${dispMinValue} USD`);
    }
  }, [preValidateText, feeData]);

  const currentAccount = useCurrentAccount();
  const hzSdk = useHzSdk();
  const curPositions = getPositionByInstFromCache({
    address: currentAccount?.address,
    network: hzSdk.fullClient.network,
    indexCoinType: baseCoin,
    isLong,
  });
  const { data: borrowFee } = useBorrowFee({
    collateralCoinType: collateralCoinType,
    isLong,
    size: curPositions[0]?.size || '0',
    entryFundingRate: curPositions[0]?.entryFundingRate || '0',
  });
  const usdAmountDisplayDecimal = useCommonGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const maxPositionSize = useGlobalStore((state) => state.maxPositionSize);
  const leverage = useTradeStore((state) => state.lever);
  const { data: posLiqPoolData } = usePositionLiqPoolData(instId);
  preValidateText = useMemo(() => {
    if (preValidateText) return preValidateText;
    // max position size validation
    if (feeData?.size) {
      const curPosSizeTotal = curPositions.reduce(
        (acc, pos) => acc.plus(pos.size),
        calc(0),
      );
      const maxRemainingSize = calc(maxPositionSize).minus(curPosSizeTotal);
      const maxLiq = isLong
        ? posLiqPoolData?.longLiq
        : posLiqPoolData?.shortLiq;
      const maxOpenSize = calc.min(maxLiq || Infinity, maxRemainingSize);

      if (calc(feeData.size).gt(maxOpenSize)) {
        const protocolStore = getProtocolStoreDataFromCache(
          hzSdk.fullClient.network,
        );
        const dispMaxValue = truncateFormat(
          // collateral = size * (1 / leverage + openFeeRate) + borrowFee
          calc
            .max(0, maxOpenSize)
            .times(
              calc(1)
                .div(leverage)
                .plus(
                  calc(
                    protocolStore
                      ? hzSdk.QueryModule.getFeeRate({
                          feeKey: FeeKey.IncreasePositionFee,
                          protocolStore: protocolStore,
                        })
                      : 0,
                  ).div(FEE_BPS_POWER),
                ),
            )
            .plus(borrowFee || 0),
          usdAmountDisplayDecimal,
        );
        return i18n._(msg`Max Collateral: ${dispMaxValue} USD`);
      }
    }
  }, [
    preValidateText,
    borrowFee,
    curPositions,
    feeData,
    hzSdk,
    leverage,
    maxPositionSize,
    usdAmountDisplayDecimal,
    posLiqPoolData,
    isLong,
  ]);

  const { data: liqPoolData } = usePoolDetail();
  const { calculateMaxSwapSize } = useMaxDepositWithdraw();

  preValidateText = useMemo(() => {
    if (preValidateText) return preValidateText;

    const payCoinData = liqPoolData?.coin_details?.find(
      (detail) => detail.coin_type === coin,
    );
    const receiveCoinData = liqPoolData?.coin_details?.find(
      (detail) => detail.coin_type === collateralCoinType,
    );
    const payCoinPx = getCachedPriceTickerData(
      coins[coin] ? `${coins[coin].symbol}/USD` : '',
    )?.[0]?.p;
    if (
      coin !== collateralCoinType &&
      payCoinData?.current_weight &&
      payCoinData.target_weight &&
      receiveCoinData?.current_weight &&
      receiveCoinData.target_weight &&
      feeData?.collateral &&
      payCoinPx
    ) {
      const result = calculateMaxSwapSize({
        coinInCurrentWeight: payCoinData.current_weight,
        coinInTargetWeight: payCoinData.target_weight,
        coinOutCurrentWeight: receiveCoinData.current_weight,
        coinOutTargetWeight: receiveCoinData.target_weight,
        coinOutUsdValue: feeData.collateral,
        coinInPrice: payCoinPx,
      });
      if (
        result?.maxCoinInUsd &&
        calc(sz).times(payCoinPx).gt(result.maxCoinInUsd)
      ) {
        const maxSwapSize = truncateFormat(
          result.maxCoinInUsd,
          usdAmountDisplayDecimal,
          {
            stripTrailingZeros: true,
          },
        );
        return i18n._(msg`Max Swap Size: ${maxSwapSize} USD`);
      }
    }
  }, [
    preValidateText,
    coin,
    sz,
    calculateMaxSwapSize,
    liqPoolData,
    usdAmountDisplayDecimal,
    coins,
    collateralCoinType,
    feeData?.collateral,
  ]);

  return preValidateText;
};
