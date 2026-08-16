import BigNumber from 'bignumber.js';
import { Transaction, coinWithBalance } from '@mysten/sui/transactions';
import { SuiClient, SuiClientOptions } from '@mysten/sui/client';

import { COMMON_CONSTS } from '../constants';
import {
  CustomErrorCode,
  HertzflowError,
  UtilsErrorCode,
} from '../errors/errors';
import { SafeNumber } from '../types';
import { HertzFlowSDK } from '../sdk';
import { fromDecimalsAmount, toDecimalsAmount } from '../utils';

export class RpcModule extends SuiClient {
  protected _sdk: HertzFlowSDK;
  constructor(
    clientOrOptions: SuiClient | SuiClientOptions,
    sdk: HertzFlowSDK,
  ) {
    if (clientOrOptions instanceof SuiClient) {
      super({ transport: clientOrOptions['transport'] });
    } else {
      super(clientOrOptions);
    }
    this._sdk = sdk;
  }

  get sdk() {
    return this._sdk;
  }

  public async getBalanceWithCoinType(options: {
    address: string;
    coinType: string;
  }) {
    const { address, coinType } = options;
    const _allCoinBalance = await this.getAllBalances({
      owner: address,
    });
    const _targetCoinBalance = _allCoinBalance.find(
      (_coin) => _coin.coinType === coinType,
    );
    return _targetCoinBalance?.totalBalance;
  }

  public async checkInvalidBalance(options: {
    coinType: string;
    coinDecimals: number;
    targetAmount: SafeNumber;
  }) {
    const { coinType, coinDecimals, targetAmount } = options;

    const _assetBalance = await this.getBalanceWithCoinType({
      address: this.sdk.senderAddress,
      coinType: coinType,
    });

    const _targetAmountWithDecimal = toDecimalsAmount(
      targetAmount,
      coinDecimals,
    );

    const _isInsufficientBalance = new BigNumber(_targetAmountWithDecimal).gt(
      _assetBalance,
    );
    if (_isInsufficientBalance) {
      const _availableAmount = fromDecimalsAmount(_assetBalance, coinDecimals);
      throw new HertzflowError(
        `Insufficient balance. Required: ${targetAmount}, Available: ${_availableAmount}`,
        UtilsErrorCode.InsufficientBalance,
      );
    }
  }

  public getFixedCoinAmount(options: {
    txb: Transaction;
    address: string;
    coinType: string;
    amount: SafeNumber;
    isSponsored?: boolean;
  }) {
    const { txb, address, coinType, amount, isSponsored = false } = options;

    txb.setSender(address);

    const _isSuiCoin =
      coinType === COMMON_CONSTS.SUI_TYPE_ARG ||
      coinType === COMMON_CONSTS.SUI_TYPE_ARG_LONG;

    const _amountBn = new BigNumber(amount);
    const _balance = parseInt(_amountBn.toString(10));

    try {
      return coinWithBalance({
        balance: _balance,
        type: _isSuiCoin ? undefined : coinType,

        useGasCoin: _isSuiCoin && !isSponsored,
      });
    } catch (error) {
      const _isInsufficientBalanceError =
        error.message?.includes('Insufficient balance') ||
        error.message?.includes('insufficient');

      const _isNoCoinFoundError =
        error.message?.includes('No coins found') ||
        error.message?.includes('not found');

      if (_isInsufficientBalanceError) {
        throw new HertzflowError(
          `Insufficient balance for ${coinType}. Required: ${_balance}`,
          CustomErrorCode.InsufficientBalance,
        );
      } else if (_isNoCoinFoundError) {
        throw new HertzflowError(
          `No coins found for type: ${coinType}`,
          CustomErrorCode.NoCoinFound,
        );
      } else {
        throw new HertzflowError(
          `Error getting coins for address: ${address}. ${error.message}`,
          CustomErrorCode.NoCoinFound,
        );
      }
    }
  }
}
