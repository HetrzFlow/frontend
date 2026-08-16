import { HertzFlowSDK } from '../sdk';
import { Transaction } from '@mysten/sui/transactions';
import { CancelIncreaseOrderParams, CancelDecreaseOrderParams } from '../types';

export interface OrderDetail {
  orderId: string;
  timestamp: string;
  symbol: string;
  orderType: 'IncreaseOrder' | 'DecreaseOrder';
  direction: 'long' | 'short' | 'unknown';
  triggerPrice: string;
  size: string;
  collateralValue: string;
  triggerCondition: 'above' | 'below';

  indexCoin?: string;
  collateralCoin?: string;

  user: string;
  position?: string;
  rawOrderData?: any;
}

export class OrderModule {
  constructor(private sdk: HertzFlowSDK) {}

  private parseSymbolFromIndexCoin(indexCoin: string | undefined): string {
    if (!indexCoin) return 'UNKNOWN';

    const parts = indexCoin.split('::');
    if (parts.length >= 3) {
      return parts[parts.length - 1];
    }

    return indexCoin;
  }

  public async getUserOrdersFromUserTable(
    userAddress: string,
  ): Promise<OrderDetail[]> {
    const startTime = Date.now();

    try {
      const orderManagerInfo = await this.getOrderManagerFromVault();

      const userOrderTable = await this.sdk.RpcModule.getDynamicFieldObject({
        parentId: orderManagerInfo.userOrdersTableId,
        name: {
          type: 'address',
          value: userAddress,
        },
      });

      if (
        !userOrderTable.data?.content ||
        !('fields' in userOrderTable.data.content)
      ) {
        return [];
      }

      const userTableId = (userOrderTable.data.content.fields as any).value
        ?.fields?.id?.id;
      if (!userTableId) {
        return [];
      }

      const allOrderIds: string[] = [];
      let cursor: string | null = null;
      let hasNextPage = true;

      while (hasNextPage) {
        const dynamicFields = await this.sdk.RpcModule.getDynamicFields({
          parentId: userTableId,
          cursor: cursor,
          limit: 50,
        });

        if (dynamicFields.data && dynamicFields.data.length > 0) {
          const orderIds = dynamicFields.data.map(
            (field: any) => field.name.value,
          );
          allOrderIds.push(...orderIds);
        }

        hasNextPage = dynamicFields.hasNextPage || false;
        cursor = dynamicFields.nextCursor || null;
      }

      if (allOrderIds.length === 0) {
        return [];
      }

      const orderObjects = await this.sdk.RpcModule.multiGetObjects({
        ids: allOrderIds,
        options: {
          showContent: true,
          showType: true,
        },
      });

      const positionIds: string[] = [];
      const orderData: Array<{
        orderObj: any;
        orderId: string;
        orderValue: any;
        isIncreaseOrder: boolean;
        positionId?: string;
      }> = [];

      orderObjects.forEach((orderObj: any, index: number) => {
        if (!orderObj.data?.content || !('fields' in orderObj.data.content)) {
          return;
        }

        const orderValue = orderObj.data.content.fields;
        const orderId = allOrderIds[index];

        const objectType = orderObj.data.type;
        const isIncreaseOrder = objectType.includes('::IncreaseOrder');

        let positionId: string | undefined;
        if (!isIncreaseOrder) {
          positionId =
            typeof orderValue.position === 'string'
              ? orderValue.position
              : orderValue.position?.fields?.vec?.[0];
          if (positionId && !positionIds.includes(positionId)) {
            positionIds.push(positionId);
          }
        }

        orderData.push({
          orderObj,
          orderId,
          orderValue,
          isIncreaseOrder,
          positionId,
        });
      });

      const orderBasicMap = new Map<string, any>();
      const decreaseOrderIds = orderData
        .filter((item) => !item.isIncreaseOrder)
        .map((item) => item.orderId);

      if (decreaseOrderIds.length > 0) {
        try {
          const orderBasicTable = await this.sdk.RpcModule.getDynamicFields({
            parentId: orderManagerInfo.orderBasicTableId,
          });

          if (orderBasicTable.data && orderBasicTable.data.length > 0) {
            const orderBasicObjects = await this.sdk.RpcModule.multiGetObjects({
              ids: orderBasicTable.data.map((field) => field.objectId),
              options: { showContent: true },
            });

            orderBasicObjects.forEach((basicObj: any) => {
              if (basicObj.data?.content && 'fields' in basicObj.data.content) {
                const dynamicFieldData = basicObj.data.content.fields;

                const basicFields = dynamicFieldData.value?.fields;

                if (basicFields) {
                  const orderId = basicFields.order_id;

                  if (decreaseOrderIds.includes(orderId)) {
                    orderBasicMap.set(orderId, basicFields);
                  }
                }
              }
            });
          }
        } catch (error) {
          console.warn('⚠️  OrderBasic :', error.message);
        }
      }

      const positionMap = new Map<string, any>();
      if (positionIds.length > 0) {
        try {
          const positionObjects = await this.sdk.RpcModule.multiGetObjects({
            ids: positionIds,
            options: { showContent: true },
          });

          positionObjects.forEach((positionObj: any, index: number) => {
            if (
              positionObj.data?.content &&
              'fields' in positionObj.data.content
            ) {
              positionMap.set(
                positionIds[index],
                positionObj.data.content.fields,
              );
            }
          });
        } catch (error) {
          console.warn('⚠️ :', error.message);
        }
      }

      const orders: OrderDetail[] = [];

      orderData.forEach(
        (
          { orderObj, orderId, orderValue, isIncreaseOrder, positionId },
          index,
        ) => {
          try {
            let indexCoin: string | undefined;
            let collateralCoin: string | undefined;
            let isLong: boolean | undefined;
            let amount: string;

            if (isIncreaseOrder) {
              indexCoin =
                orderValue.index_coin?.fields?.name || orderValue.index_coin;
              collateralCoin =
                orderValue.collateral_coin?.fields?.name ||
                orderValue.collateral_coin;
              isLong = orderValue.is_long;
              amount = orderValue.amount?.toString(10) || '0';
            } else {
              if (orderBasicMap.has(orderId)) {
                const basicFields = orderBasicMap.get(orderId);
                indexCoin =
                  basicFields.index_coin?.fields?.name ||
                  basicFields.index_coin;
                isLong = basicFields.is_long;

                collateralCoin = undefined;
              } else if (positionId && positionMap.has(positionId)) {
                const positionFields = positionMap.get(positionId);
                indexCoin =
                  positionFields.index_coin?.fields?.name ||
                  positionFields.index_coin;
                collateralCoin =
                  positionFields.collateral_coin?.fields?.name ||
                  positionFields.collateral_coin;
                isLong = positionFields.is_long;
              } else {
                indexCoin = undefined;
                collateralCoin = undefined;
                isLong = undefined;
              }
              amount = orderValue.collateral_delta?.toString(10) || '0';
            }

            const parsedSymbol = this.parseSymbolFromIndexCoin(indexCoin);
            const direction: 'long' | 'short' | 'unknown' =
              isLong !== undefined ? (isLong ? 'long' : 'short') : 'unknown';

            const order: OrderDetail = {
              orderId: orderId,
              timestamp: orderValue.time?.toString(10) || '0',
              symbol: parsedSymbol,
              orderType: isIncreaseOrder ? 'IncreaseOrder' : 'DecreaseOrder',
              direction: direction,
              triggerPrice: orderValue.trigger_price?.toString(10) || '0',
              size: orderValue.size_delta?.toString(10) || '0',
              collateralValue: amount,
              triggerCondition: orderValue.trigger_above_threshold
                ? 'above'
                : 'below',

              indexCoin: indexCoin,
              collateralCoin: collateralCoin,

              user: orderValue.user,
              position:
                typeof orderValue.position === 'string'
                  ? orderValue.position
                  : orderValue.position?.fields?.vec?.[0] || undefined,
              rawOrderData: orderObj,
            };

            orders.push(order);
          } catch (error) {
            console.warn(`⚠️  ${index + 1} :`, error.message);
          }
        },
      );

      const endTime = Date.now();

      const decreaseOrders = orders.filter(
        (order) => order.orderType === 'DecreaseOrder' && order.position,
      );
      if (decreaseOrders.length > 0) {
        try {
          const positionManagerInfo = await this.getPositionManagerFromVault();

          const positionIds = decreaseOrders
            .filter((order) => order.position)
            .map((order) => order.position!);

          if (positionIds.length > 0) {
            const positionMetadataObjects =
              await this.sdk.RpcModule.multiGetObjects({
                ids: positionIds,
                options: { showContent: true, showType: true },
              });

            const positionMetadataMap = new Map();
            positionMetadataObjects.forEach((obj, index) => {
              try {
                if (obj.data?.content && 'fields' in obj.data.content) {
                  const fields = obj.data.content.fields as any;
                  const positionData = fields.value?.fields;
                  if (positionData) {
                    positionMetadataMap.set(positionIds[index], positionData);
                  }
                }
              } catch (error) {
                console.warn(`⚠️  ${positionIds[index]} :`, error);
              }
            });

            let updatedCount = 0;
            decreaseOrders.forEach((order) => {
              if (order.position) {
                const positionData = positionMetadataMap.get(order.position);
                if (positionData && positionData.collateral_coin) {
                  const collateralCoinName =
                    positionData.collateral_coin?.fields?.name ||
                    positionData.collateral_coin;
                  order.collateralCoin = collateralCoinName;
                  updatedCount++;
                }
              }
            });
          }
        } catch (error) {
          console.warn(`⚠️ :`, error.message);
        }
      }

      orders.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
      return orders;
    } catch (error) {
      console.error('❌ :', error);
      throw error;
    }
  }

  private async getPositionManagerFromVault(): Promise<{
    positionsTableId: string;
  }> {
    const vaultId = this.sdk.sdkOptions.vault.package_id;

    const vaultObject = await this.sdk.RpcModule.getObject({
      id: vaultId,
      options: {
        showContent: true,
        showType: true,
      },
    });

    if (!vaultObject.data?.content || !('fields' in vaultObject.data.content)) {
      throw new Error('Vault');
    }

    const vaultFields = vaultObject.data.content.fields as any;
    const positionManagerFields = vaultFields.position_manager?.fields;

    if (!positionManagerFields) {
      throw new Error('VaultPosition_manager');
    }

    return {
      positionsTableId: positionManagerFields.positions?.fields?.id?.id,
    };
  }

  private async getOrderManagerFromVault(): Promise<any> {
    const vaultId = this.sdk.sdkOptions.vault.package_id;

    const vaultObject = await this.sdk.RpcModule.getObject({
      id: vaultId,
      options: { showContent: true },
    });

    if (!vaultObject.data?.content || !('fields' in vaultObject.data.content)) {
      throw new Error('Vault');
    }

    const vaultFields = vaultObject.data.content.fields as any;

    const orderManagerFields = vaultFields.order_manager?.fields;

    if (!orderManagerFields) {
      console.error('❌  order_manager ');
      throw new Error('OrderManager');
    }

    return {
      userOrdersTableId: orderManagerFields.user_orders?.fields?.id?.id,
      orderBasicTableId: orderManagerFields.order_basic?.fields?.id?.id,
      increaseOrdersStores:
        orderManagerFields.increase_orders?.fields?.contents || [],
      decreaseOrdersStores:
        orderManagerFields.decrease_orders?.fields?.contents || [],
    };
  }

  public createCancelAllIncreaseOrdersPayload(
    cancelParams: CancelIncreaseOrderParams[],
  ) {
    return (tx: Transaction) => {
      for (let i = 0; i < cancelParams.length; i++) {
        const params = cancelParams[i];
        tx.add(this.sdk.VaultModule.createCancelIncreaseOrderPayload(params));
      }
    };
  }

  public createCancelAllDecreaseOrdersPayload(
    cancelParams: CancelDecreaseOrderParams[],
  ) {
    return (tx: Transaction) => {
      for (let i = 0; i < cancelParams.length; i++) {
        const params = cancelParams[i];
        tx.add(this.sdk.VaultModule.createCancelDecreaseOrderPayload(params));
      }
    };
  }

  public createCancelAllOrdersPayload(
    increaseParams: CancelIncreaseOrderParams[],
    decreaseParams: CancelDecreaseOrderParams[],
  ) {
    return (tx: Transaction) => {
      if (increaseParams.length > 0) {
        tx.add(this.createCancelAllIncreaseOrdersPayload(increaseParams));
      }

      if (decreaseParams.length > 0) {
        tx.add(this.createCancelAllDecreaseOrdersPayload(decreaseParams));
      }
    };
  }
}
