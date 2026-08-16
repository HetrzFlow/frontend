import { HertzFlowSDK } from '../sdk';

export interface PositionMetadata {
  user: string;
  positionId: string;
  size: string;
  collateral: string;
  averagePrice: string;
  entryFundingRate: string;
  reserveAmount: string;
  realisedPnl: string;
  lastIncreaseTime: string;
  collateralToken: string;
  indexToken: string;
  isLong: boolean;
}

export interface CompletePositionInfo {
  metadata: PositionMetadata;

  leverage: string;
}

export class PositionModule {
  protected _sdk: HertzFlowSDK;

  constructor(sdk: HertzFlowSDK) {
    this._sdk = sdk;
  }

  get sdk(): HertzFlowSDK {
    return this._sdk;
  }

  public async getUserCompletePositions(
    userAddress: string,
  ): Promise<CompletePositionInfo[]> {
    try {
      const positionManagerInfo = await this.getPositionManagerFromVault();

      const userPositions = await this.getUserPositionsFromIndex(
        userAddress,
        positionManagerInfo.userPositionsTableId,
        positionManagerInfo.positionsTableId,
      );

      const completePositions: CompletePositionInfo[] = [];
      for (const position of userPositions) {
        try {
          const size = parseFloat(position.metadata.size || '0');
          const collateral = parseFloat(position.metadata.collateral || '0');
          const leverage =
            collateral > 0 ? (size / collateral).toFixed(2) : '0';

          const completePosition: CompletePositionInfo = {
            metadata: position.metadata,
            leverage: leverage,
          };
          completePositions.push(completePosition);
        } catch (error) {
          console.warn(`⚠️  ${position.positionId} :`, error.message);
        }
      }

      return completePositions;
    } catch (error) {
      console.error('❌ :', error);
      throw error;
    }
  }

  public async getUserCompletePositionsLegacy(
    userAddress: string,
  ): Promise<CompletePositionInfo[]> {
    try {
      const positionManagerInfo = await this.getPositionManagerFromVault();

      const allPositions = await this.getAllPositionsFromManager(
        positionManagerInfo.positionsTableId,
      );

      const userPositions = allPositions.filter(
        (position) =>
          position.metadata.user.toLowerCase() === userAddress.toLowerCase(),
      );

      const completePositions: CompletePositionInfo[] = [];
      for (const position of userPositions) {
        try {
          const size = parseFloat(position.metadata.size || '0');
          const collateral = parseFloat(position.metadata.collateral || '0');
          const leverage =
            collateral > 0 ? (size / collateral).toFixed(2) : '0';

          const completePosition: CompletePositionInfo = {
            metadata: position.metadata,
            leverage: leverage,
          };
          completePositions.push(completePosition);
        } catch (error) {
          console.warn(`⚠️  ${position.positionId} :`, error.message);
        }
      }

      return completePositions;
    } catch (error) {
      console.error('❌ :', error);
      throw error;
    }
  }

  private parseI128RealisedPnl(realisedPnl: any): string {
    try {
      if (
        !realisedPnl ||
        !realisedPnl.fields ||
        typeof realisedPnl.fields.bits !== 'string'
      ) {
        return '0';
      }

      const bits = realisedPnl.fields.bits;
      const bitsNum = BigInt(bits);

      const SIGN_BIT = BigInt(1) << BigInt(127);
      const MAX_POSITIVE = SIGN_BIT - BigInt(1);

      if (bitsNum === BigInt(0)) {
        return '0';
      }

      const isNegative = (bitsNum & SIGN_BIT) !== BigInt(0);

      if (isNegative) {
        const absoluteValue = (~bitsNum + BigInt(1)) & MAX_POSITIVE;
        return `-${absoluteValue.toString(10)}`;
      } else {
        return bitsNum.toString(10);
      }
    } catch (error) {
      console.warn('⚠️  I128 realisedPnl :', error);
      return '0';
    }
  }

  public async getPositionByIdFromManager(
    positionId: string,
  ): Promise<PositionMetadata | null> {
    try {
      const positionManagerInfo = await this.getPositionManagerFromVault();

      const positionData = await this.sdk.RpcModule.getDynamicFieldObject({
        parentId: positionManagerInfo.positionsTableId,
        name: {
          type: '0x2::object::ID',
          value: positionId,
        },
      });

      if (
        !positionData.data?.content ||
        !('fields' in positionData.data.content)
      ) {
        return null;
      }

      const fields = positionData.data.content.fields as any;
      const value = fields.value?.fields;

      if (!value) {
        return null;
      }

      const metadata: PositionMetadata = {
        user: value.user || '',
        positionId: value.position_id || positionId,
        size: value.size || '0',
        collateral: value.collateral || '0',
        averagePrice: value.average_price || '0',
        entryFundingRate: value.entry_funding_rate || '0',
        reserveAmount: value.reserve_amount || '0',
        realisedPnl: this.parseI128RealisedPnl(value.realised_pnl),
        lastIncreaseTime: value.last_increase_time || '0',
        collateralToken: value.collateral_coin?.fields?.name || '',
        indexToken: value.index_coin?.fields?.name || '',
        isLong: value.is_long || false,
      };

      return metadata;
    } catch (error) {
      console.error('❌ :', error);
      return null;
    }
  }

  private async getUserPositionsFromIndex(
    userAddress: string,
    userPositionsTableId: string,
    positionsTableId: string,
  ): Promise<Array<{ positionId: string; metadata: PositionMetadata }>> {
    try {
      const userTableResponse = await this.sdk.RpcModule.getDynamicFieldObject({
        parentId: userPositionsTableId,
        name: { type: 'address', value: userAddress },
      });

      if (!userTableResponse.data?.content) {
        return [];
      }

      const userTableId = (userTableResponse.data.content as any).fields.value
        .fields.id.id;

      let cursor: string | null = null;
      let hasNextPage = true;
      const allPositionMappings: Array<{
        positionKey: string;
        mappingId: string;
      }> = [];

      while (hasNextPage) {
        const dynamicFields = await this.sdk.RpcModule.getDynamicFields({
          parentId: userTableId,
          cursor: cursor,
          limit: 50,
        });

        if (dynamicFields.data && dynamicFields.data.length > 0) {
          const mappings = dynamicFields.data.map((field) => ({
            positionKey: field.name.value as string,
            mappingId: field.objectId,
          }));
          allPositionMappings.push(...mappings);
        }

        hasNextPage = dynamicFields.hasNextPage || false;
        cursor = dynamicFields.nextCursor || null;
      }

      if (allPositionMappings.length === 0) {
        return [];
      }

      const BATCH_SIZE = 50;
      const allPositions: Array<{
        positionId: string;
        metadata: PositionMetadata;
      }> = [];

      for (let i = 0; i < allPositionMappings.length; i += BATCH_SIZE) {
        const batchMappings = allPositionMappings.slice(i, i + BATCH_SIZE);

        const mappingObjects = await this.sdk.RpcModule.multiGetObjects({
          ids: batchMappings.map((m) => m.mappingId),
          options: { showContent: true },
        });

        const realPositionIds: string[] = [];
        mappingObjects.forEach((obj, index) => {
          if (obj.data?.content && 'fields' in obj.data.content) {
            const positionId = (obj.data.content.fields as any).value as string;
            realPositionIds.push(positionId);
          } else {
            console.warn(`⚠️  ${batchMappings[index].mappingId} `);
          }
        });

        const metadataQueries = realPositionIds.map(async (positionId) => {
          try {
            const metadataObject =
              await this.sdk.RpcModule.getDynamicFieldObject({
                parentId: positionsTableId,
                name: { type: '0x2::object::ID', value: positionId },
              });
            return { positionId, metadataObject, success: true };
          } catch (error) {
            console.warn(`⚠️  ${positionId} :`, error.message);
            return { positionId, metadataObject: null, success: false };
          }
        });

        const metadataResults = await Promise.all(metadataQueries);

        metadataResults.forEach(({ positionId, metadataObject, success }) => {
          if (!success || !metadataObject?.data?.content) {
            return;
          }

          if ('fields' in metadataObject.data.content) {
            try {
              const fields = metadataObject.data.content.fields as any;
              const value = fields.value?.fields;
              if (value) {
                const metadata = this.parsePositionMetadata(value);
                if (metadata) {
                  metadata.positionId = metadata.positionId || positionId;
                  allPositions.push({
                    positionId,
                    metadata,
                  });
                } else {
                  console.warn(
                    `⚠️ parsePositionMetadata  null for ${positionId}`,
                  );
                }
              } else {
                console.warn(`⚠️  value.fields for ${positionId}`);
              }
            } catch (error) {
              console.warn(`⚠️  ${positionId} :`, error.message);
            }
          } else {
            console.warn(`⚠️  ${positionId} `);
          }
        });
      }

      return allPositions;
    } catch (error) {
      console.error(`❌ :`, error);
      throw error;
    }
  }

  private async getPositionManagerFromVault(): Promise<{
    positionsTableId: string;
    userPositionsTableId: string;
    increaseRequestsTableId: string;
    decreaseRequestsTableId: string;
  }> {
    const vaultId = this.sdk.sdkOptions.vault?.package_id;
    if (!vaultId) {
      throw new Error(' Vault ID');
    }

    const vaultObject = await this.sdk.RpcModule.getObject({
      id: vaultId,
      options: {
        showType: true,
        showContent: true,
      },
    });

    if (!vaultObject.data?.content || !('fields' in vaultObject.data.content)) {
      throw new Error(` Vault  ${vaultId} `);
    }

    const vaultFields = vaultObject.data.content.fields as any;
    const positionManagerFields = vaultFields.position_manager?.fields;

    if (!positionManagerFields) {
      throw new Error(' PositionManager ');
    }

    return {
      positionsTableId: positionManagerFields.positions?.fields?.id?.id,
      userPositionsTableId:
        positionManagerFields.user_positions?.fields?.id?.id,
      increaseRequestsTableId:
        positionManagerFields.increase_position_requests?.fields?.id?.id,
      decreaseRequestsTableId:
        positionManagerFields.decrease_position_requests?.fields?.id?.id,
    };
  }

  private parsePositionMetadata(value: any): PositionMetadata | null {
    try {
      return {
        user: value.user || '',
        positionId: value.position_id || '',
        size: value.size || '0',
        collateral: value.collateral || '0',
        averagePrice: value.average_price || '0',
        entryFundingRate: value.entry_funding_rate || '0',
        reserveAmount: value.reserve_amount || '0',
        realisedPnl: this.parseI128RealisedPnl(value.realised_pnl),
        lastIncreaseTime: value.last_increase_time || '0',
        collateralToken: value.collateral_coin?.fields?.name || '',
        indexToken: value.index_coin?.fields?.name || '',
        isLong: value.is_long || false,
      };
    } catch (error) {
      console.warn('⚠️ :', error);
      return null;
    }
  }

  private async getAllPositionsFromManager(
    positionsTableId: string,
  ): Promise<Array<{ positionId: string; metadata: PositionMetadata }>> {
    try {
      const dynamicFields = await this.sdk.RpcModule.getDynamicFields({
        parentId: positionsTableId,
      });

      if (!dynamicFields.data || dynamicFields.data.length === 0) {
        return [];
      }

      const objectIds = dynamicFields.data.map((field) => field.objectId);

      const positionObjects = await this.sdk.RpcModule.multiGetObjects({
        ids: objectIds,
        options: {
          showContent: true,
          showType: true,
        },
      });

      const positions: Array<{
        positionId: string;
        metadata: PositionMetadata;
      }> = [];

      for (let i = 0; i < dynamicFields.data.length; i++) {
        const field = dynamicFields.data[i];
        const positionObject = positionObjects[i];

        try {
          const positionId = field.name?.value as string;
          if (!positionId || !positionObject.data?.content) continue;

          if ('fields' in positionObject.data.content) {
            const fields = positionObject.data.content.fields as any;
            const value = fields.value?.fields;
            if (value) {
              const metadata = this.parsePositionMetadata(value);
              if (metadata) {
                metadata.positionId = metadata.positionId || positionId;
                positions.push({ positionId, metadata });
              }
            }
          }
        } catch (error) {
          console.warn(`⚠️  ${field.name?.value} :`, error);
        }
      }

      return positions;
    } catch (error) {
      console.error('❌ :', error);
      throw error;
    }
  }

  public async getUserPositionRequests(
    userAddress: string,
    requestType: 'increase' | 'decrease' = 'increase',
  ): Promise<Array<{ requestId: string; requestData: any }>> {
    try {
      const positionManagerInfo = await this.getPositionManagerFromVault();

      const tableId =
        requestType === 'increase'
          ? positionManagerInfo.increaseRequestsTableId
          : positionManagerInfo.decreaseRequestsTableId;

      if (!tableId) {
        return [];
      }

      const dynamicFields = await this.sdk.RpcModule.getDynamicFields({
        parentId: tableId,
      });

      if (!dynamicFields.data || dynamicFields.data.length === 0) {
        return [];
      }

      const objectIds = dynamicFields.data.map((field) => field.objectId);

      const requestObjects = await this.sdk.RpcModule.multiGetObjects({
        ids: objectIds,
        options: {
          showContent: true,
          showType: true,
        },
      });

      const requests: Array<{ requestId: string; requestData: any }> = [];

      for (let i = 0; i < dynamicFields.data.length; i++) {
        const field = dynamicFields.data[i];
        const requestObject = requestObjects[i];

        try {
          const requestId = field.name?.value as string;
          if (!requestId || !requestObject.data?.content) continue;

          if ('fields' in requestObject.data.content) {
            const fields = requestObject.data.content.fields as any;
            const value = fields.value?.fields;

            if (value && value.user === userAddress) {
              requests.push({
                requestId,
                requestData: value,
              });
            }
          }
        } catch (error) {
          console.warn(`⚠️  ${field.name?.value} :`, error);
        }
      }

      return requests;
    } catch (error) {
      console.error(`❌  ${requestType} :`, error);
      return [];
    }
  }

  public async getPositionRequestById(
    requestId: string,
    requestType: 'increase' | 'decrease' = 'increase',
  ): Promise<any | null> {
    try {
      const positionManagerInfo = await this.getPositionManagerFromVault();

      const tableId =
        requestType === 'increase'
          ? positionManagerInfo.increaseRequestsTableId
          : positionManagerInfo.decreaseRequestsTableId;

      if (!tableId) {
        return null;
      }

      const requestData = await this.sdk.RpcModule.getDynamicFieldObject({
        parentId: tableId,
        name: {
          type: 'u256',
          value: requestId,
        },
      });

      if (
        !requestData.data?.content ||
        !('fields' in requestData.data.content)
      ) {
        return null;
      }

      const fields = requestData.data.content.fields as any;
      const value = fields.value?.fields;

      if (!value) {
        return null;
      }

      return value;
    } catch (error) {
      console.error(`❌ :`, error);
      return null;
    }
  }
}
