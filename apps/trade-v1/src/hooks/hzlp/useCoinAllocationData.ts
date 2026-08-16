import { useMemo } from 'react';
import { addHexPrefix, calc } from '@hertzflow/sdk';
import {
  buildPriceId,
  CoinDetailItem,
  useGlobalStore,
  useInstStore,
  useMaxDepositWithdraw,
  usePriceTickerStream,
} from '@/common';

export const useCoinAllocationData = (
  coinDetail: CoinDetailItem,
  aprPeriod: '24h' | '7d' | '1m' = '24h',
) => {
  const {
    coin_type,
    coin_name,
    coin_amount,
    target_weight,
    current_weight,
    utilization,
    apr,
  } = coinDetail;

  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const coins = useInstStore((state) => state.getCoins());
  const coinObjFromInstStore = coins[addHexPrefix(coin_type)];

  const mixedCoinObj = useMemo(
    () => ({
      coin_type,
      coin_name,
      coin_amount,
      target_weight,
      current_weight,
      utilization,
      apr,
      ...coinObjFromInstStore,
    }),
    [
      coin_type,
      coin_name,
      coin_amount,
      target_weight,
      current_weight,
      utilization,
      apr,
      coinObjFromInstStore,
    ],
  );

  const instSymbol = buildPriceId(mixedCoinObj?.coin_name ?? '');
  const px = usePriceTickerStream(instSymbol, { throttleWait: 5000 }).data[0]
    ?.p;

  const availableForBorrow = useMemo(
    () =>
      calc(coin_amount)
        .div(Math.pow(10, mixedCoinObj?.decimal ?? 8))
        .times(px || '')
        .times(1 - utilization)
        .toString(10),
    [coin_amount, mixedCoinObj?.decimal, px, utilization],
  );

  const { calculateMaxDepositInput, calculateMaxWithdrawal } =
    useMaxDepositWithdraw();

  const maxDepositResult = useMemo(
    () =>
      calculateMaxDepositInput({
        currentWeight: current_weight,
        targetWeight: target_weight,
        tokenPrice: px,
      }),
    [calculateMaxDepositInput, current_weight, target_weight, px],
  );

  const maxWithdrawalResult = useMemo(
    () =>
      calculateMaxWithdrawal({
        currentWeight: current_weight,
        targetWeight: target_weight,
        tokenPrice: px,
      }),
    [calculateMaxWithdrawal, current_weight, target_weight, px],
  );

  const selectedApr = useMemo(() => {
    if (aprPeriod === '24h') return apr?.['24h'];
    if (aprPeriod === '7d') return apr?.['7d'];
    return apr?.['1m'];
  }, [apr, aprPeriod]);

  return {
    mixedCoinObj,
    px,
    availableForBorrow,
    maxDepositResult,
    maxWithdrawalResult,
    selectedApr,
    usdAmountDisplayDecimal,
  };
};
