import {
  COMMON_CONSTS,
  CONTRACT_FUNCTION,
  CONTRACT_MODULE,
} from '../constants';
import { HertzFlowSDK } from '../sdk';
import { Transaction } from '@mysten/sui/transactions';

export class OracleStorageModule {
  protected _sdk: HertzFlowSDK;

  constructor(sdk: HertzFlowSDK) {
    this._sdk = sdk;
  }

  get sdk() {
    return this._sdk;
  }

  public createUpdatePricePayload(typeArguments: string[], tx?: Transaction) {
    const newTx = tx ?? new Transaction();
    newTx.moveCall({
      package: this._sdk.sdkOptions.packageId,
      module: CONTRACT_MODULE.ORACLE,
      function: CONTRACT_FUNCTION['oracle'].UPDATE_PRICE,
      arguments: [
        newTx.object(this._sdk.sdkOptions.oracleStore.package_id),
        newTx.object(this._sdk.sdkOptions.protocolStore.package_id),
        newTx.object(this._sdk.sdkOptions.version.package_id),
        newTx.object(this._sdk.sdkOptions.oracle.package_id),
        newTx.object(COMMON_CONSTS.CLOCK_ID),
      ],
      typeArguments,
    });
    return newTx;
  }
}
