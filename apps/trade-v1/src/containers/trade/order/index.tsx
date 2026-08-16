import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLingui } from '@lingui/react/macro';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useShallow } from 'zustand/react/shallow';

import { calc } from '@repo/lib/calc';
import { thoFormat, truncateFormat } from '@repo/lib/format';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Switch,
  Label,
  Separator,
  tradeToast,
  cn,
} from '@repo/ui';
import {
  CoinIcon,
  useHzSdk,
  OrderToastContent,
  ws,
  useGlobalStore,
  useWalletStore,
  getOrdersByInstFromCache,
  useOpenOrders,
  useInstStore,
  usePositions,
} from '@/common';

import { ORDER_TAB_VALUE } from '@/constants/enum';

import { OrderResType, subOrder } from '@/services/ws/order';
import { useKlineStore } from '@/stores/trade/kline';
import HistoryRecords from './historyRecords';
import NoConnect from './NoConnect';
import OpenOrders from './openOrders';
import Positions from './positions';
import RefreshBtn from './RefreshBtn';
import { useOrdersStore } from './store';

const Order = ({ className }: { className?: string }) => {
  const { t } = useLingui();
  const currentAccount = useCurrentAccount();
  const isConnect = !!currentAccount;
  const hzSdk = useHzSdk();
  const insts = useInstStore((state) => state.getInsts());
  const coins = useInstStore((state) => state.getCoins());
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const explorerHost = useWalletStore((state) => state.getExplorerHost());
  const [showPositions, setShowPositions] = useKlineStore(
    useShallow((state) => [state.showPositions, state.setShowPositions]),
  );
  const [onlyShowCurrentInst, setOnlyShowCurrentInst] = useOrdersStore(
    useShallow((state) => [
      state.onlyShowCurrentInst,
      state.setOnlyShowCurrentInst,
    ]),
  );

  const { data: positions, refetch: refetchPositions } = usePositions();
  const { data: ordersData, refetch: refetchOrders } = useOpenOrders();
  const orderTab = useSearchParams().get('orderTab') || '';
  const [tabValue, setTabValue] = useState(() =>
    [
      ORDER_TAB_VALUE.POSITION,
      ORDER_TAB_VALUE.ORDER,
      ORDER_TAB_VALUE.HISTORY,
    ].includes(orderTab as ORDER_TAB_VALUE)
      ? (orderTab as ORDER_TAB_VALUE)
      : ORDER_TAB_VALUE.POSITION,
  );

  const [refetchMark, setRefetchMark] = useState(0);

  useEffect(() => {
    ws.login(currentAccount?.address);
  }, [currentAccount?.address]);

  const subCallbackRef = useRef<(data: OrderResType[]) => void>(null);
  subCallbackRef.current = useCallback(
    (data: OrderResType[]) => {
      let shouldRefetchPosition = false;
      let shouldRefetchOrder = false;
      data.forEach(({ t: orderType, a, x, o }) => {
        if (a === 'exec') {
          shouldRefetchPosition = true;
          if (orderType === 'limit') {
            const order = getOrdersByInstFromCache({
              address: currentAccount?.address,
              network: hzSdk.fullClient.network,
            })?.find((v) => v.orderId === o);
            if (order) {
              shouldRefetchOrder = true;
              tradeToast({
                ordType: 'limit',
                type: 'success',
                title: t`Limit Order`,
                description: order?.isOpen ? t`Opened` : t`Closed`,
                icon: (
                  <CoinIcon
                    size={24}
                    src={insts[order.targetCoin]?.icon}
                    alt={insts[order.targetCoin]?.name}
                  />
                ),
                content: (
                  <OrderToastContent
                    isLong={order.isLong}
                    size={truncateFormat(
                      order.isOpen ? order.size : calc(order.size).times(-1),
                      usdAmountDisplayDecimal,
                      {
                        style: 'currency',
                        currency: 'USD',
                        stripTrailingZeros: true,
                        signDisplay: 'always',
                      },
                    )}
                    px={truncateFormat(
                      order.triggerPrice,
                      coins[order.targetCoin]?.pxDispDecimal,
                      {
                        style: 'currency',
                        currency: 'USD',
                      },
                    )}
                  />
                ),
                showClose: true,
                href: `${explorerHost}/txblock/${x}`,
              });
            }
          }
        }
      });

      if (shouldRefetchPosition) {
        refetchPositions();
      }
      if (shouldRefetchOrder) {
        refetchOrders();
      }
    },
    [
      explorerHost,
      insts,
      coins,
      t,
      currentAccount?.address,
      hzSdk,
      refetchOrders,
      refetchPositions,
      usdAmountDisplayDecimal,
    ],
  );

  useEffect(() => {
    const unsubOrder = subOrder({
      callback: ({ data }) => {
        subCallbackRef.current?.(data);
      },
    });

    return unsubOrder;
  }, []);

  return (
    <Tabs
      value={tabValue}
      className={cn('w-full gap-0 md:h-full', className)}
      onValueChange={setTabValue as (value: string) => void}
    >
      <div className="flex h-4 items-center justify-between gap-2 max-md:h-[32px] max-md:px-4 max-md:pt-4">
        <TabsList className="flex h-full gap-4">
          <TabsTrigger
            className="text-t-270 flex grow-0 gap-1.5 p-0 text-base font-medium data-[state=active]:bg-transparent max-md:text-sm"
            value={ORDER_TAB_VALUE.POSITION}
          >
            {t`Positions`}{' '}
            {!!positions?.length && (
              <span className="bg-bg-3 font-plex min-w-5 rounded-sm p-0.5 align-middle text-sm max-md:text-xs">
                {thoFormat(positions.length)}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            className="text-t-270 flex grow-0 gap-1.5 p-0 text-base font-medium data-[state=active]:bg-transparent max-md:text-sm"
            value={ORDER_TAB_VALUE.ORDER}
          >
            {t`Orders`}
            {!!ordersData?.length && (
              <span className="bg-bg-3 font-plex min-w-5 rounded-sm p-0.5 align-middle text-sm max-md:text-xs">
                {thoFormat(ordersData?.length)}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            className="text-t-270 grow-0 p-0 text-base font-medium data-[state=active]:bg-transparent max-md:text-sm"
            value={ORDER_TAB_VALUE.HISTORY}
          >{t`History`}</TabsTrigger>
        </TabsList>
        <div className="scrollbar-none ml-auto flex gap-2 overflow-x-auto">
          <Label className="text-t-270 hover:text-t-1100 z-1 flex shrink-0 cursor-pointer items-center gap-2 font-normal hover:transition-[color] max-md:hidden">
            {t`Chart Positions`}
            <Switch
              aria-label={t`Chart Positions`}
              checked={showPositions}
              onCheckedChange={(checked) => setShowPositions(checked)}
            />
          </Label>
          <Label className="text-t-270 hover:text-t-1100 z-1 flex shrink-0 cursor-pointer items-center gap-2 font-normal hover:transition-[color] max-md:hidden">
            {t`Hide Others`}
            <Switch
              aria-label={t`Hide Others`}
              checked={onlyShowCurrentInst}
              onCheckedChange={(checked) => setOnlyShowCurrentInst(checked)}
            />
          </Label>
          <RefreshBtn
            onClick={() => {
              setRefetchMark(1 - refetchMark);
            }}
          />
        </div>
      </div>
      <Separator className="mt-3 mb-0 max-md:mt-[16px]" />
      <div className="z-1 md:h-[calc(100%-28px)]">
        {isConnect ? (
          <>
            <TabsContent className="h-full" value={ORDER_TAB_VALUE.POSITION}>
              {<Positions refetchMark={refetchMark} />}
            </TabsContent>
            <TabsContent className="h-full" value={ORDER_TAB_VALUE.ORDER}>
              {<OpenOrders refetchMark={refetchMark} />}
            </TabsContent>
            <TabsContent className="h-full" value={ORDER_TAB_VALUE.HISTORY}>
              {<HistoryRecords refetchMark={refetchMark} />}
            </TabsContent>
          </>
        ) : (
          <NoConnect />
        )}
      </div>
    </Tabs>
  );
};

export default Order;
