import { Transaction } from '@mysten/sui/transactions';
import { HertzFlowSDK } from '../sdk';
import {
  COMMON_CONSTS,
  CONTRACT_FUNCTION,
  CONTRACT_MODULE,
  MOCK_BTC_TYPE,
  MOCK_ETH_TYPE,
  MOCK_USDC_TYPE,
} from '../constants';
import { CustomErrorCode, HertzflowError } from '../errors/errors';
import { PriceDataItem } from './apiModule';

export class OracleModule {
  protected _sdk: HertzFlowSDK;

  constructor(sdk: HertzFlowSDK) {
    this._sdk = sdk;
  }

  get sdk() {
    return this._sdk;
  }

  public updateWhiteListPrices(coinTypes?: string[]) {
    return async (tx: Transaction) => {
      const _targetCoinTypes = coinTypes || [
        COMMON_CONSTS.SUI_TYPE_ARG_LONG,
        MOCK_BTC_TYPE,
        MOCK_ETH_TYPE,
        MOCK_USDC_TYPE,
      ];

      const _signedPriceData = await this.sdk.ApiModule.fetchSignedPrice(
        _targetCoinTypes,
        false,
      );

      for (const _priceData of _signedPriceData) {
        this.createUpdatePricePayload(_priceData, [_priceData.coin_type], tx);
      }
    };
  }

  public createUpdatePricePayload(
    priceData: PriceDataItem,
    typeArguments: string[],
    tx?: Transaction,
  ) {
    const _newTx = tx ?? new Transaction();
    if (!priceData)
      throw new HertzflowError(
        'Price data array cannot be empty',
        CustomErrorCode.InvalidInput,
      );
    const _tx1 = this.addUpdatePriceCall(priceData, _newTx);
    const tx2 = this._sdk.OracleStorageModule.createUpdatePricePayload(
      typeArguments,
      _tx1,
    );
    return tx2;
  }

  private addUpdatePriceCall(data: PriceDataItem, tx?: Transaction) {
    const newTx = tx ?? new Transaction();
    const {
      symbol,
      timestamp,
      fixed_point_price,
      coin_type,
      fixed_point_expo,
      signature,
    } = data;

    const _symbolBytes = Array.from(new TextEncoder().encode(symbol));
    const typeArguments = [coin_type];

    newTx.moveCall({
      package: this._sdk.sdkOptions.oraclePackage.package_id,
      module: CONTRACT_MODULE.ORACLE,
      function: CONTRACT_FUNCTION['oracle'].UPDATE_PRICE,
      arguments: [
        newTx.object(this._sdk.sdkOptions.oracle.package_id),
        newTx.object(this._sdk.sdkOptions.oracleVersion.package_id),
        newTx.object(COMMON_CONSTS.CLOCK_ID),
        newTx.pure.u8(fixed_point_expo),
        newTx.pure.u64(fixed_point_price.toString(10)),
        newTx.pure.vector('u8', _symbolBytes),
        newTx.pure.u64(timestamp.toString(10)),
        newTx.pure.string(signature),
      ],
      typeArguments,
    });

    return newTx;
  }
}
