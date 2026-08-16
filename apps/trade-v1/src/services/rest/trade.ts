import { calc } from '@repo/lib/calc';
import { queryClient, useMutation, useQuery } from '@repo/lib/queryClient';
import { toast } from '@repo/ui';
import type { Coin } from '@/common';
import {
  useHzSdk,
  useInstStore,
  getCachedPriceTickerData,
  getProtocolStoreDataFromCache,
  getVaultDataFromCache,
} from '@/common';
import { MARKET_PX } from '@/constants/common';
import { usePreferenceStore } from '@/stores/trade/preference';

export type PositionSizeAndFeesResultType = {
  openFee: string;
  swapFee: string;
  priceImpact: string;
  size: string;
  collateral: string;
  isPending: boolean;
};

const positionSizeAndFeesQueryKeyPrefix = ['rest', 'trade', 'tradeFee'];
// const calcPositionSizeParamsKey = ['params', 'trade', 'positionSize'];
const closePosQueryKeyPrefix = ['rest', 'trade', 'tradeCloseFee'];
// const calcClosePosSizeParamsKey = ['params', 'trade', 'closePosition'];

type CalcPositionSizeParamsType = {
  payCoinType: string;
  payCoinAmount: string;
  collateralCoin?: Coin;
  targetCoinPx?: string;
  isLong: boolean;
  lever: string;
  borrowFee?: string;
};

type ClosePosSizeAndFeesResultType = {
  closeFee: string;
  swapFee: string;
  priceImpact: string;
  size: string;
  collateral: string;
  fundingFee: string;
  receiveCoinAmount: string;
  isPending: boolean;
};

type CalcClosePosParamsType = {
  sizeDelta: string;
  collateralCoin?: Coin;
  receiveCoin?: Coin;
  targetCoinPx?: string;
  isLong: boolean;
  lever: string;
  entryFundingRate: string;
};

let calcPositionSizeParams: CalcPositionSizeParamsType | null = null;

// calc position size
export const useCalcPositionSize = () => {
  const slippage = usePreferenceStore((state) => state.slippage);
  const coins = useInstStore((state) => state.getCoins());
  const hzSdk = useHzSdk();
  return useMutation({
    mutationFn: async (params: CalcPositionSizeParamsType) => {
      calcPositionSizeParams = params;

      const {
        payCoinType,
        payCoinAmount,
        collateralCoin,
        isLong,
        lever,
        targetCoinPx,
        borrowFee,
      } = params;
      const tradeFeeResult =
        queryClient.getQueryData<PositionSizeAndFeesResultType>([
          positionSizeAndFeesQueryKeyPrefix,
          payCoinType,
          collateralCoin?.coinType,
        ]);

      queryClient.setQueryData(
        [
          positionSizeAndFeesQueryKeyPrefix,
          payCoinType,
          collateralCoin?.coinType,
        ],
        {
          ...tradeFeeResult,
          isPending: true,
        },
      );
      try {
        const pxData = getCachedPriceTickerData(
          collateralCoin?.symbol ? `${collateralCoin.symbol}/USD` : '',
        );
        const marketPx = pxData?.[0]?.p;
        const collateralCoinPx =
          targetCoinPx && targetCoinPx !== MARKET_PX && isLong
            ? targetCoinPx
            : marketPx;
        const protocolStore = getProtocolStoreDataFromCache(
          hzSdk.fullClient.network,
        );
        if (
          collateralCoin &&
          coins[payCoinType]?.decimal &&
          coins[collateralCoin?.coinType || '']?.decimal &&
          collateralCoinPx &&
          protocolStore
        ) {
          const result = payCoinAmount
            ? await hzSdk.QueryModule.calculateDisplayPositionDataForOpenOperation(
                {
                  borrowFee: borrowFee,
                  protocolStore: protocolStore,
                  typeArguments: [payCoinType, collateralCoin.coinType],
                  amountIn: payCoinAmount,
                  leverage: +lever,
                  collateralCoinPrice: collateralCoinPx,
                  collateralCoinDecimals:
                    coins[collateralCoin.coinType]!.decimal,
                  payCoinDecimals: coins[payCoinType].decimal,
                  slippage: +slippage,
                },
              )
            : {
                displayOpenFee: 0,
                displaySwapFee: 0,
                displayPriceImpact: 0,
                displaySizeDelta: 0,
                displayAdjustedCollateralUsd: 0,
              };

          if (params === calcPositionSizeParams) {
            queryClient.setQueryData(
              [
                positionSizeAndFeesQueryKeyPrefix,
                payCoinType,
                collateralCoin.coinType,
              ],
              {
                openFee: result.displayOpenFee,
                swapFee: result.displaySwapFee,
                priceImpact: result.displayPriceImpact,
                size: result.displaySizeDelta,
                collateral: result.displayAdjustedCollateralUsd,
                isPending: false,
              },
            );
            return result;
          }
          return;
        }
      } catch (error) {
        toast.error((error as Error).message);
      }

      queryClient.setQueryData(
        [
          positionSizeAndFeesQueryKeyPrefix,
          payCoinType,
          collateralCoin?.coinType,
        ],
        {
          ...tradeFeeResult,
          isPending: false,
        },
      );
    },
  });
};

// params for calc position size
export const getCalcOpenPositionSizeParams = () => {
  return calcPositionSizeParams;
};

// get fee of open position
export const usePositionSizeAndFees = (
  payCoinType?: string,
  collateralCoinType?: string,
  refetchInterval?: number,
) => {
  const { mutate: calcPositionSize } = useCalcPositionSize();

  return useQuery({
    queryKey: [
      positionSizeAndFeesQueryKeyPrefix,
      payCoinType,
      collateralCoinType,
    ],
    queryFn: () => {
      if (calcPositionSizeParams) {
        calcPositionSize(calcPositionSizeParams);
      }
      return (
        queryClient.getQueryData<PositionSizeAndFeesResultType>([
          positionSizeAndFeesQueryKeyPrefix,
          payCoinType,
          collateralCoinType,
        ]) || {
          openFee: 0,
          swapFee: 0,
          priceImpact: 0,
          size: '',
          collateral: '',
          isPending: false,
        }
      );
    },
    enabled: !!(payCoinType && collateralCoinType),
    refetchInterval: refetchInterval,
    gcTime: 0,
  });
};
export const getOpenPositionSizeFromCache = ({
  payCoinType,
  collateralCoinType,
}: {
  payCoinType: string;
  collateralCoinType: string;
}) => {
  return queryClient.getQueryData<PositionSizeAndFeesResultType>([
    positionSizeAndFeesQueryKeyPrefix,
    payCoinType,
    collateralCoinType,
  ]);
};

let calcClosePosSizeParams: CalcClosePosParamsType | null = null;
// calc close position data
export const useCalcClosePosition = () => {
  const slippage = usePreferenceStore((state) => state.slippage);
  const coins = useInstStore((state) => state.getCoins());
  const hzSdk = useHzSdk();
  return useMutation({
    mutationFn: async (params: CalcClosePosParamsType) => {
      calcClosePosSizeParams = params;
      const {
        sizeDelta,
        collateralCoin,
        receiveCoin,
        isLong,
        lever,
        targetCoinPx,
        entryFundingRate,
      } = params;
      const tradeFeeResult =
        queryClient.getQueryData<PositionSizeAndFeesResultType>([
          closePosQueryKeyPrefix,
          collateralCoin?.coinType,
          receiveCoin?.coinType,
        ]);

      queryClient.setQueryData(
        [
          closePosQueryKeyPrefix,
          collateralCoin?.coinType,
          receiveCoin?.coinType,
        ],
        {
          ...tradeFeeResult,
          isPending: true,
        },
      );
      try {
        const pxData = getCachedPriceTickerData(
          collateralCoin?.symbol ? `${collateralCoin.symbol}/USD` : '',
        );
        const marketPx = pxData?.[0]?.p;
        const collateralCoinPx =
          targetCoinPx !== MARKET_PX && isLong ? targetCoinPx : marketPx;
        const protocolStore = getProtocolStoreDataFromCache(
          hzSdk.fullClient.network,
        );
        const vaultData = getVaultDataFromCache(hzSdk.fullClient.network);
        const receiveCoinPx = getCachedPriceTickerData(
          receiveCoin?.symbol ? `${receiveCoin.symbol}/USD` : '',
        )?.[0]?.p;
        if (
          collateralCoin &&
          receiveCoin?.decimal &&
          coins[collateralCoin?.coinType || '']?.decimal &&
          protocolStore &&
          receiveCoinPx
        ) {
          const result =
            sizeDelta && collateralCoinPx
              ? await hzSdk.QueryModule.calculateDisplayPositionDataForCloseOperation(
                  {
                    sizeDelta,
                    realtimeConfig: hzSdk.QueryModule.getRealtimeConfig({
                      collateralToken: collateralCoin.coinType,
                      protocolStore: protocolStore,
                      vaultObject: vaultData,
                    }),
                    entryFundingRate,
                    typeArguments: [
                      collateralCoin.coinType,
                      receiveCoin.coinType,
                    ],

                    leverage: +lever,
                    collateralCoinPrice: collateralCoinPx,
                    collateralCoinDecimals:
                      coins[collateralCoin.coinType]!.decimal,
                    receiverCoinDecimals: receiveCoin.decimal,
                    receiverCoinPrice: receiveCoinPx,
                    slippage: +slippage,
                  },
                )
              : {
                  displayCloseFee: 0,
                  displaySwapFee: 0,
                  displayPriceImpact: 0,
                  displaySizeDelta: '',
                  displayFundingFee: 0,
                  displayReceiverCoinAmount: '',
                };

          if (params === calcClosePosSizeParams) {
            queryClient.setQueryData(
              [
                closePosQueryKeyPrefix,
                collateralCoin.coinType,
                receiveCoin.coinType,
              ],
              {
                closeFee: result.displayCloseFee,
                swapFee: result.displaySwapFee,
                priceImpact: result.displayPriceImpact,
                size: result.displaySizeDelta,
                collateral: calc(result.displaySizeDelta).div(lever).toFixed(),
                fundingFee: result.displayFundingFee,
                receiveCoinAmount: result.displayReceiverCoinAmount,
                isPending: false,
              },
            );
            return result;
          }
          return;
        }
      } catch (error) {
        toast.error((error as Error).message);
      }

      queryClient.setQueryData(
        [
          closePosQueryKeyPrefix,
          collateralCoin?.coinType,
          receiveCoin?.coinType,
        ],
        {
          ...tradeFeeResult,
          isPending: false,
        },
      );
    },
  });
};

// get close position size params
export const getCalcClosePositionSizeParams = () => {
  return calcClosePosSizeParams;
};

// get fee of close position
export const useClosePosSizeAndFees = (
  collateralCoinType?: string,
  receiveCoinType?: string,
  refetchInterval?: number,
) => {
  const { mutate: calcClosePos } = useCalcClosePosition();

  return useQuery({
    queryKey: [closePosQueryKeyPrefix, collateralCoinType, receiveCoinType],
    queryFn: () => {
      if (calcClosePosSizeParams) {
        calcClosePos(calcClosePosSizeParams);
      }
      return (
        queryClient.getQueryData<ClosePosSizeAndFeesResultType>([
          closePosQueryKeyPrefix,
          collateralCoinType,
          receiveCoinType,
        ]) || {
          closeFee: 0,
          swapFee: 0,
          priceImpact: 0,
          size: '',
          collateral: '',
          fundingFee: 0,
          receiveCoinAmount: '',
          isPending: false,
        }
      );
    },
    enabled: !!(receiveCoinType && collateralCoinType),
    refetchInterval: refetchInterval,
    gcTime: 0,
  });
};
export const getClosePositionSizeFromCache = ({
  receiveCoinType,
  collateralCoinType,
}: {
  receiveCoinType: string;
  collateralCoinType: string;
}) => {
  return queryClient.getQueryData<PositionSizeAndFeesResultType>([
    closePosQueryKeyPrefix,
    collateralCoinType,
    receiveCoinType,
  ]);
};
