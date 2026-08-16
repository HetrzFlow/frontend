import { FC, useCallback } from 'react';

import dynamic from 'next/dynamic';
import { ProtocolStoreObjectInfo, VaultObjectInfo } from '@hertzflow/sdk';
import { useLingui } from '@lingui/react/macro';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useShallow } from 'zustand/react/shallow';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Loading,
} from '@repo/ui';
import {
  CoinIcon,
  useHzSdk,
  useSetTxBasicParams,
  useCustomSignAndExecuteTransaction,
  getProtocolStoreDataFromCache,
  getCachedPriceTickerData,
  usePositions,
  usePriceTickerStream,
  useInstStore,
  getVaultDataFromCache,
} from '@/common';
import type { Position } from '@/common';

import { useGlobalStore } from '@/stores/trade/global';
import { usePreferenceStore } from '@/stores/trade/preference';
import { useOrdersStore } from '../../store';

const Content = dynamic(() => import('./Content'), {
  ssr: false,
  loading: () => <Loading className="h-[86px]" />,
});

interface CloseAllDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// market close position
const buildMarketOrderTx = ({
  position,
  marketPx,
  receiveCoinPx,
  size,
  isLong,
  receiveCoinType,
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
  receiveCoinType: string;
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
      collateralCoinMarketPrice: receiveCoinPx,
      collateralCoinDecimals: receiveCoinDecimal,
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
      typeArguments: [receiveCoinType, receiveCoinType],
    }),
  );
  return tx;
};

const useCloseAll = () => {
  const { t } = useLingui();
  const currentAccount = useCurrentAccount();
  const [insts, coins] = useInstStore(
    useShallow((state) => [state.getInsts(), state.getCoins()]),
  );
  const slippage = usePreferenceStore((state) => state.slippage);
  const hzSdk = useHzSdk();
  const { mutate: signAndExecute, isPending } =
    useCustomSignAndExecuteTransaction({ mutationKey: ['closeAllPositions'] });
  const { refetch } = usePositions();
  const setTxBasicParams = useSetTxBasicParams();

  // query usdc price, becasue usdc is collateral coin in short position
  usePriceTickerStream('USDC/USD', { throttleWait: 60000 });

  const handleCloseAll = useCallback(
    (positions: Position[], options?: { onSuccess: () => void }) => {
      if (!currentAccount?.address) {
        return;
      }
      const protocolStore = getProtocolStoreDataFromCache(
        hzSdk.fullClient.network,
      );
      const vaultData = getVaultDataFromCache(hzSdk.fullClient.network);
      // send transaction to close all positions
      let tx = new Transaction();
      // basic settings
      tx = setTxBasicParams(tx, { gasBudget: 1e9 });

      for (let i = 0; i < positions.length; i++) {
        const position = positions[i] as Position;
        const collateralCoinObj = coins[position.collateralCoin];
        const baseCoinObj = coins[position.targetCoin];
        const inst = insts[baseCoinObj?.coinType || ''];
        const marketPx = getCachedPriceTickerData(inst?.id)?.[0]?.p;
        const usdcPx = getCachedPriceTickerData('USDC/USD')?.[0]?.p;
        const receiveCoinPx = position.isLong ? marketPx : usdcPx;

        if (
          marketPx &&
          receiveCoinPx &&
          baseCoinObj &&
          collateralCoinObj &&
          protocolStore
        ) {
          tx = buildMarketOrderTx({
            position,
            marketPx,
            receiveCoinPx,
            size: position.size,
            isLong: position.isLong,
            receiveCoinType: position.collateralCoin,
            baseCoinDecimal: baseCoinObj?.decimal,
            receiveCoinDecimal: collateralCoinObj?.decimal,
            slippage: slippage,
            hzSdk,
            tx,
            protocolStore,
            vaultData,
          });
        }
      }

      const isMulti = positions.length > 1;
      const _inst =
        insts[coins[positions[0]?.targetCoin || '']?.coinType || ''];

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            if (result.status === 'failed') {
              return;
            }
            refetch();
            if (options?.onSuccess) {
              options.onSuccess();
            }
          },
        },
        {
          ordType: 'market',
          title: isMulti ? t`Close Positions` : t`Close Position`,
          icon:
            !isMulti && _inst ? (
              <CoinIcon size={24} src={_inst.icon} alt={_inst.name} />
            ) : null,
          resultDescription: t`Closed`,
        },
      );
    },
    [
      currentAccount,
      setTxBasicParams,
      refetch,
      coins,
      insts,
      hzSdk,
      signAndExecute,
      t,
      slippage,
    ],
  );

  return {
    handleCloseAll,
    isPending,
  };
};

const CloseAllDialog: FC<CloseAllDialogProps> = ({ open, onOpenChange }) => {
  const { t } = useLingui();
  const { data: positions } = usePositions();
  const instId = useGlobalStore((state) => state.instId);
  const inst = useInstStore((state) => state.getInst(state, instId));
  const onlyShowCurrentInst = useOrdersStore(
    (state) => state.onlyShowCurrentInst,
  );
  const filteredPositions = onlyShowCurrentInst
    ? positions?.filter((position) => position.targetCoin === inst?.coinType)
    : positions;

  const { handleCloseAll, isPending } = useCloseAll();

  if (!filteredPositions?.length) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[440px]">
        <DialogHeader>
          <DialogTitle>{t`Close All Position?`}</DialogTitle>
        </DialogHeader>
        <Content
          isPending={isPending}
          handleConfirm={() =>
            handleCloseAll(filteredPositions, {
              onSuccess: () => {
                onOpenChange(false);
              },
            })
          }
        />
      </DialogContent>
    </Dialog>
  );
};

export default CloseAllDialog;
