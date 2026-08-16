import { useMemo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { calc } from '@repo/lib/calc';
import { truncateFormat } from '@repo/lib/format';
import {
  NORMALIZED_SUI_TYPE_ARG,
  useBalances,
} from '../../../chainClient/hooks';
import { useMaxDepositWithdraw } from '../../../hooks/useMaxDepositInput';
import { usePoolDetail } from '../../../services/rest/liqPool';
import { usePriceTickerStream } from '../../../services/ws/tickers';
import { useGlobalStore } from '../../../stores/globalStore';
import { useInstStore } from '../../../stores/instStore';
import { balanceValidator } from '../../../validators/balance';
import { useAvailLiq } from './useAvailLiq';

export const useValidate = ({
  payCoin,
  receiveCoin,
  paySzValue,
  receiveSzValue,
}: {
  payCoin: string;
  receiveCoin: string;
  paySzValue: string;
  receiveSzValue: string;
}) => {
  const { t } = useLingui();
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const coins = useInstStore((state) => state.getCoins());

  // empty validation
  let preValidateText = useMemo(() => {
    if (payCoin === receiveCoin) {
      return t`Select different tokens`;
    }
    if (!+paySzValue) {
      return t`Enter an amount`;
    }
  }, [t, paySzValue, payCoin, receiveCoin]);

  // balance vaidation
  const balances = useBalances([payCoin, NORMALIZED_SUI_TYPE_ARG]);
  preValidateText = useMemo(() => {
    if (preValidateText) {
      return preValidateText;
    }

    return balanceValidator({
      coin: coins[payCoin],
      coinSize: paySzValue,
      coinBalance: balances?.[0]?.totalBalance,
      suiCoin: coins[NORMALIZED_SUI_TYPE_ARG],
      suiBalance: balances?.[1]?.totalBalance,
    });
  }, [preValidateText, balances, coins, payCoin, paySzValue]);

  // liquidity validation
  const { availLiqUsd } = useAvailLiq({
    payCoinType: payCoin,
    receiveCoinType: receiveCoin,
  });
  const payCoinPx = usePriceTickerStream(
    coins[payCoin]?.symbol ? `${coins[payCoin]?.symbol}/USD` : '',
    { throttleWait: 5000 },
  ).data[0]?.p;
  preValidateText = useMemo(() => {
    if (preValidateText) return preValidateText;

    if (payCoinPx && calc(paySzValue).times(payCoinPx).gt(availLiqUsd)) {
      return t`Insufficient Available Liquidity`;
    }
  }, [t, preValidateText, payCoinPx, paySzValue, availLiqUsd]);

  //  Impact on Weightage validation
  const { data: liqPoolData } = usePoolDetail();
  const { calculateMaxSwapSize } = useMaxDepositWithdraw();
  const receiveCoinPx = usePriceTickerStream(
    coins[receiveCoin]?.symbol ? `${coins[receiveCoin]?.symbol}/USD` : '',
    { throttleWait: 5000 },
  ).data[0]?.p;
  preValidateText = useMemo(() => {
    if (preValidateText) return preValidateText;

    const payCoinData = liqPoolData?.coin_details?.find(
      (detail) => detail.coin_type === payCoin,
    );
    const receiveCoinData = liqPoolData?.coin_details?.find(
      (detail) => detail.coin_type === receiveCoin,
    );
    if (
      payCoinData?.current_weight &&
      payCoinData.target_weight &&
      receiveCoinData?.current_weight &&
      receiveCoinData.target_weight &&
      receiveCoinPx &&
      receiveSzValue &&
      payCoinPx
    ) {
      const result = calculateMaxSwapSize({
        coinInCurrentWeight: payCoinData.current_weight,
        coinInTargetWeight: payCoinData.target_weight,
        coinOutCurrentWeight: receiveCoinData.current_weight,
        coinOutTargetWeight: receiveCoinData.target_weight,
        coinOutUsdValue: calc(receiveSzValue).times(receiveCoinPx).toFixed(),
        coinInPrice: payCoinPx,
      });
      if (
        result?.maxCoinInUsd &&
        calc(paySzValue).times(payCoinPx).gt(result.maxCoinInUsd)
      ) {
        const maxSwapSize = truncateFormat(
          result.maxCoinInUsd,
          usdAmountDisplayDecimal,
          {
            stripTrailingZeros: true,
          },
        );
        return t`Max Swap Size: ${maxSwapSize} USD`;
      }
    }
  }, [
    t,
    preValidateText,
    payCoinPx,
    paySzValue,
    calculateMaxSwapSize,
    liqPoolData,
    payCoin,
    receiveCoin,
    receiveCoinPx,
    receiveSzValue,
    usdAmountDisplayDecimal,
  ]);

  return preValidateText;
};
