import {
  COMMON_CONSTS,
  CONTRACT_MODULE,
  CONTRACT_FUNCTION,
} from '../constants';
import { HertzFlowSDK } from '../sdk';
import { bcs } from '@mysten/bcs';
import { fromDecimalsAmount, HertzflowCalc, toDecimalsAmount } from '../utils';
import { BigNumber } from 'bignumber.js';
import { SuiParsedData } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { HertzflowError, FetchErrorCode } from '../errors/errors';
import {
  FEE_BPS_POWER,
  FUNDING_RATE_PRECISION,
  HZLP_DECIMALS,
  PRICE_MULTIPLIER_DECIMAL,
  PRICE_PRECISION_POWER,
  ZERO,
  ZERO_STR,
} from '../math';
import { SafeNumber } from '../types';
import { calc, isStableCoinSwap } from '../utils/common';

export interface QueryAddLiquidityParams {
  coinType: string;
  inCoinPrice: SafeNumber;

  amountIn: string;

  inCoinDecimals: number;
  outCoinDecimals: number;

  slippage: number;
}

export interface QueryRemoveLiquidityParams {
  coinType: string;
  amountIn: SafeNumber;
  slippage: number;
  outCoinPrice: SafeNumber;
  outCoinDecimals: number;
}

export interface LiquidityQueryResult {
  amountOutAfterFee: string;

  amountOutAfterFeeWithSlippage: string;

  totalFee: SafeNumber;
  formatted: {
    amountOutAfterFee: string;
    amountOutAfterFeeWithSlippage: string;
    totalFee: string;
  };
}

export interface SwapWithAmountInQueryParams {
  protocolStore: ProtocolStoreObjectInfo;
  typeArguments: [inCoin: string, outCoin: string];
  amountIn: string;
  inCoinDecimals: number;
  slippage: number;
  outCoinPrice: string;
  outCoinDecimals: number;
}

export interface SwapWithAmountOutQueryParams {
  typeArguments: [inCoin: string, outCoin: string];
  amountOut: SafeNumber;
  inCoinDecimals: number;
  outCoinDecimals: number;
  outCoinPrice: SafeNumber;
  slippage: number;
  protocolStore: ProtocolStoreObjectInfo;
}

export interface SwapAmountOutResult {
  amountOutAfterFee: SafeNumber;

  amountOutAfterFeeWithSlippage: SafeNumber;
  totalFee: SafeNumber;
  swapFee: SafeNumber;

  priceImpact: SafeNumber;

  feeRateBps: string;
  formatted: {
    amountOutAfterFee: SafeNumber;
    amountOutAfterFeeWithSlippage: SafeNumber;
    totalFee: SafeNumber;
    swapFee: SafeNumber;
    priceImpact: SafeNumber;
  };
}

export interface SwapAmountInResult {
  amountInRes: SafeNumber;
  amountOutRes: SafeNumber;
  amountOutWithSlippage: SafeNumber;
  totalFee: SafeNumber;

  feeRateBps: SafeNumber;

  swapFee: SafeNumber;

  priceImpact: SafeNumber;
  formatted: {
    amountInRes: SafeNumber;
    amountOutRes: SafeNumber;
    amountOutWithSlippage: SafeNumber;
    totalFee: SafeNumber;
    swapFee: SafeNumber;
    priceImpact: SafeNumber;
  };
}

export interface MaxSwapInParams {
  coinInType: string;

  coinOutType: string;
}

export interface CalculateOpenPositionSizeParams {
  inputCoinAmount: number;

  inputCoinPrice: number;

  leverage: number;
}

export interface CalculateOpenPositionSizeResult {
  sizeUsd: string;

  collateralAfterFee: string;
}

export interface CalculateFeeParams {
  amount: string;

  feeBps: string;
}

export interface CalculateFeeResult {
  afterFeeAmount: string;

  feeAmount: string;
}

export interface CalculateOriginalAmountParams {
  afterFeeAmount: string;

  feeBps: string;
}

export interface HzlpObjectInfo {
  type: string;
  decimals: number;
  description: string;
  id: { id: string };
  name: string;
  symbol: string;
}

export interface ACLConfig {
  type: string;
  fields: {
    permissions: {
      type: string;
      fields: {
        head: string;
        id: { id: string };
        size: string;
        tail: string;
      };
    };
  };
}

export interface FeatureConfig {
  type: string;
  fields: {
    disabled_flags: {
      type: string;
      fields: {
        id: { id: string };
        size: string;
      };
    };
  };
}

export interface FeeConfig {
  type: string;
  fields: {
    add_remove_fee_bps: string;
    decrease_position_bps: string;
    increase_position_bps: string;
    liquidation_fee_bps: string;
    protocol_fee_bps: string;
    stable_swap_fee_bps: string;
    stable_tax_bps: string;
    swap_fee_bps: string;
    tax_bps: string;
  };
}

export interface FundingFeeConfig {
  type: string;
  fields: {
    funding_interval: string;
    funding_rate_bps: string;
    stable_funding_rate_bps: string;
  };
}

export interface WhiteListEntry {
  type: string;
  fields: {
    key: {
      type: string;
      fields: {
        name: string;
      };
    };
    value: number;
  };
}

export interface WhiteListConfig {
  type: string;
  fields: {
    contents: WhiteListEntry[];
  };
}

export enum FeeKey {
  LiquidationFee = 0,

  TaxFee = 1,

  StableTaxFee = 2,

  SwapFee = 3,

  StableSwapFee = 4,

  AddRemoveFee = 5,

  IncreasePositionFee = 6,

  DecreasePositionFee = 7,

  ProtocolFee = 8,

  Reserved1 = 9,

  Reserved2 = 10,

  Reserved3 = 11,
}

export interface FeeCalculationResult {
  afterFeeAmount: string;

  feeAmount: string;
}

export interface PositionFeeCalculationResult {
  afterFeeUsd: string;

  feeUsd: string;
}

export interface ProtocolStoreObjectInfo {
  type: string;
  acl: ACLConfig;
  feature: FeatureConfig;
  fee: FeeConfig;
  funding_fee: FundingFeeConfig;
  id: { id: string };
  white_list: WhiteListConfig;
}

export interface QueryOrderParams {
  orderManagerId: string;

  orderId: string;

  isIncreaseOrder: boolean;
}

export interface IncreaseOrderInfo {
  user: string;

  position?: string;

  amount: string;

  collateralCoin: string;

  indexCoin: string;

  sizeDelta: string;

  isLong: boolean;

  triggerPrice: string;

  triggerAboveThreshold: boolean;
}

export interface DecreaseOrderInfo {
  user: string;

  position: string;

  sizeDelta: string;

  collateralDelta: string;

  triggerPrice: string;

  triggerAboveThreshold: boolean;
}

export type OrderInfoEnum =
  | { type: 'Increase'; data: IncreaseOrderInfo }
  | { type: 'Decrease'; data: DecreaseOrderInfo };

export type QueryAddFeeBpsParams = {
  vaultObject: VaultObjectInfo;
  coinType: string;
  coinDecimals: number;
  amount: string;
};

export type QueryRemoveFeeBpsParams = {
  vaultObject: VaultObjectInfo;
  hzlpAmount: string;
};

export type VaultObjectInfo = any;

export type CalculateDisplayPositionForOpenOptionFeeParams = {
  protocolStore: ProtocolStoreObjectInfo;
  typeArguments: [payCoin: string, collateralCoin: string];
  amountIn: string;
  leverage: number;
  collateralCoinPrice: SafeNumber;
  collateralCoinDecimals: number;
  payCoinDecimals: number;
  borrowFee?: string;
  slippage?: number;
};

export type CalculateDisplayPositionForCloseOptionFeeParams = {
  typeArguments: [collateralCoin: string, receiverCoin: string];
  sizeDelta: string;
  leverage: number;
  collateralCoinPrice: SafeNumber;
  receiverCoinPrice: SafeNumber;
  collateralCoinDecimals: number;
  receiverCoinDecimals: number;
  slippage?: number;
  realtimeConfig: RealtimeConfig;
  entryFundingRate: string;
};

export type RealtimeConfig = {
  protocolStore: ProtocolStoreObjectInfo;
  maxMaintainceLeverage: string;
  liquidationFeeRate: string;
  decreasePositionFeeRate: string;
  cumulativeFundingRate: string;
  lastFundingTime: string;
  stableFundingRateBps: string;
  fundingRateBps: string;

  poolAmount: string;
  reservedAmount: string;
  isStable: boolean;
  fundingInterval: string;
};

export type GetFeeRateParams = {
  feeKey: FeeKey;
  protocolStore: ProtocolStoreObjectInfo;
};

export class QueryModule {
  protected _sdk: HertzFlowSDK;

  constructor(sdk: HertzFlowSDK) {
    this._sdk = sdk;
  }

  get sdk() {
    return this._sdk;
  }

  public async queryAddLiquidityAmountAndFee(
    params: QueryAddLiquidityParams,
  ): Promise<LiquidityQueryResult> {
    const {
      coinType,
      amountIn,
      inCoinDecimals,
      outCoinDecimals,
      slippage,
      inCoinPrice,
    } = params;

    const _amountInWithDecimal = toDecimalsAmount(amountIn, inCoinDecimals);
    const _amountInWithDecimalIntegerValue =
      HertzflowCalc.calculateIntegerValueString(calc(_amountInWithDecimal));

    const _unitInCoinPriceWithPriceDecimal =
      HertzflowCalc.calculateUnitCoinPriceWithPriceDecimals({
        coinPrice: inCoinPrice,
        coinDecimals: inCoinDecimals,
      });

    const _finalTx = new Transaction();
    _finalTx.add(this.sdk.OracleModule.updateWhiteListPrices());
    _finalTx.moveCall({
      package: this.sdk.sdkOptions.packageId,
      module: CONTRACT_MODULE.VAULT,
      function: CONTRACT_FUNCTION['vault'].GET_ADD_LIQUIDITY_AMOUNT_AND_FEE,
      arguments: [
        _finalTx.object(this.sdk.sdkOptions.vault.package_id),
        _finalTx.object(this.sdk.sdkOptions.protocolStore.package_id),
        _finalTx.object(this.sdk.sdkOptions.oracleStore.package_id),
        _finalTx.pure.u64(_amountInWithDecimalIntegerValue),
        _finalTx.object(COMMON_CONSTS.CLOCK_ID),
      ],
      typeArguments: [coinType],
    });

    const _devInspectResult =
      await this.sdk.RpcModule.devInspectTransactionBlock({
        transactionBlock: _finalTx,
        sender:
          this.sdk.senderAddress ||
          this.sdk.sdkOptions.simulationAccount.address,
      });

    const _returnValues =
      _devInspectResult.results?.[_devInspectResult.results.length - 1]
        ?.returnValues;

    if (!_returnValues || _returnValues.length < 2) {
      return {
        amountOutAfterFee: ZERO_STR,
        amountOutAfterFeeWithSlippage: ZERO_STR,
        totalFee: ZERO_STR,
        formatted: {
          amountOutAfterFee: ZERO_STR,
          amountOutAfterFeeWithSlippage: ZERO_STR,
          totalFee: ZERO_STR,
        },
      };
    }

    const amountOutAfterFee = bcs
      .u64()

      .parse(new Uint8Array(_returnValues[0][0]));

    const _fee = bcs.u64().parse(new Uint8Array(_returnValues[1][0]));

    const totalFee = calc(_fee)
      .times(_unitInCoinPriceWithPriceDecimal)
      .toString(10);

    const _slippageFactor = calc(1).minus(slippage);
    const amountOutAfterFeeWithSlippage = calc(amountOutAfterFee)
      .times(_slippageFactor)
      .toString(10);

    const formattedAmountOutAfterFee = fromDecimalsAmount(
      amountOutAfterFee,
      outCoinDecimals,
    );
    const formattedAmountOutAfterFeeWithSlippage = fromDecimalsAmount(
      amountOutAfterFeeWithSlippage,
      outCoinDecimals,
    );
    const formattedTotalFee = fromDecimalsAmount(
      totalFee,
      PRICE_MULTIPLIER_DECIMAL,
    );

    return {
      amountOutAfterFee,
      amountOutAfterFeeWithSlippage,
      totalFee,
      formatted: {
        amountOutAfterFee: formattedAmountOutAfterFee,
        amountOutAfterFeeWithSlippage: formattedAmountOutAfterFeeWithSlippage,
        totalFee: formattedTotalFee,
      },
    };
  }

  public async queryRemoveLiquidityAmountAndFee(
    params: QueryRemoveLiquidityParams,
  ): Promise<LiquidityQueryResult> {
    const { coinType, amountIn, slippage, outCoinDecimals, outCoinPrice } =
      params;

    const _hzlpAmountWithDecimal = toDecimalsAmount(amountIn, HZLP_DECIMALS);

    const _hzlpAmountWithDecimalIntegerValue =
      HertzflowCalc.calculateIntegerValueString(calc(_hzlpAmountWithDecimal));

    const _finalTx = new Transaction();
    _finalTx.add(this.sdk.OracleModule.updateWhiteListPrices());

    _finalTx.moveCall({
      package: this.sdk.sdkOptions.packageId,
      module: CONTRACT_MODULE.VAULT,
      function: CONTRACT_FUNCTION['vault'].GET_REMOVE_LIQUIDITY_AMOUNT_AND_FEE,
      arguments: [
        _finalTx.object(this.sdk.sdkOptions.vault.package_id),
        _finalTx.object(this.sdk.sdkOptions.protocolStore.package_id),
        _finalTx.object(this.sdk.sdkOptions.oracleStore.package_id),
        _finalTx.pure.u64(_hzlpAmountWithDecimalIntegerValue),
        _finalTx.object(COMMON_CONSTS.CLOCK_ID),
      ],
      typeArguments: [coinType],
    });

    const _devInspectResult =
      await this.sdk.RpcModule.devInspectTransactionBlock({
        transactionBlock: _finalTx,
        sender:
          this.sdk.senderAddress ||
          this.sdk.sdkOptions.simulationAccount.address,
      });

    const _returnValues =
      _devInspectResult.results?.[_devInspectResult.results.length - 1]
        ?.returnValues;

    if (!_returnValues || _returnValues.length < 2) {
      return {
        amountOutAfterFee: ZERO_STR,
        amountOutAfterFeeWithSlippage: ZERO_STR,
        totalFee: ZERO_STR,
        formatted: {
          amountOutAfterFee: ZERO_STR,
          amountOutAfterFeeWithSlippage: ZERO_STR,
          totalFee: ZERO_STR,
        },
      };
    }

    const amountOutAfterFee = bcs
      .u64()
      .parse(new Uint8Array(_returnValues[0][0]));

    const _fee = bcs.u64().parse(new Uint8Array(_returnValues[1][0]));

    const _unitOutCoinPriceWithPriceDecimals =
      HertzflowCalc.calculateUnitCoinPriceWithPriceDecimals({
        coinPrice: outCoinPrice,
        coinDecimals: outCoinDecimals,
      });

    const totalFee = calc(_fee)
      .times(_unitOutCoinPriceWithPriceDecimals)
      .toString(10);

    const _slippageFactor = calc(1).minus(slippage);
    const amountOutAfterFeeWithSlippage = calc(amountOutAfterFee)
      .times(_slippageFactor)
      .toString(10);

    const formattedTotalFee = fromDecimalsAmount(
      totalFee,
      PRICE_MULTIPLIER_DECIMAL,
    );

    const formattedAmountOutAfterFee = fromDecimalsAmount(
      calc(amountOutAfterFee).toString(10),
      outCoinDecimals,
    );
    const formattedAmountOutAfterFeeWithSlippage = fromDecimalsAmount(
      amountOutAfterFeeWithSlippage,
      outCoinDecimals,
    );

    return {
      amountOutAfterFee,
      amountOutAfterFeeWithSlippage,
      totalFee,
      formatted: {
        amountOutAfterFee: formattedAmountOutAfterFee,
        amountOutAfterFeeWithSlippage: formattedAmountOutAfterFeeWithSlippage,
        totalFee: formattedTotalFee,
      },
    };
  }

  public async querySwapAmountOut(
    params: SwapWithAmountInQueryParams,
  ): Promise<SwapAmountOutResult> {
    const {
      typeArguments,
      amountIn,
      inCoinDecimals,
      slippage,
      protocolStore,
      outCoinPrice,
      outCoinDecimals,
    } = params;

    const [_coinInType, _coinOutType] = typeArguments;

    const _unitOutCoinPriceWithPriceDecimals =
      HertzflowCalc.calculateUnitCoinPriceWithPriceDecimals({
        coinPrice: outCoinPrice,
        coinDecimals: outCoinDecimals,
      });
    const _amountInWithDecimal = toDecimalsAmount(amountIn, inCoinDecimals);

    const _amountInWithDecimalIntegerValue =
      HertzflowCalc.calculateIntegerValueString(calc(_amountInWithDecimal));

    const _slippageAdjustedPrice = new BigNumber(
      _unitOutCoinPriceWithPriceDecimals,
    ).times(new BigNumber(1).plus(new BigNumber(slippage)));

    let amountOutAfterFeeWithSlippage: string;
    if (_coinInType === _coinOutType) {
      amountOutAfterFeeWithSlippage = calc(_amountInWithDecimal)
        .times(_unitOutCoinPriceWithPriceDecimals)
        .div(_slippageAdjustedPrice)
        .toString(10);
      return {
        amountOutAfterFee: _amountInWithDecimal,
        amountOutAfterFeeWithSlippage,
        totalFee: ZERO_STR,
        swapFee: ZERO_STR,
        priceImpact: ZERO_STR,
        feeRateBps: ZERO_STR,
        formatted: {
          amountOutAfterFee: fromDecimalsAmount(
            _amountInWithDecimal,
            outCoinDecimals,
          ),
          amountOutAfterFeeWithSlippage: fromDecimalsAmount(
            amountOutAfterFeeWithSlippage,
            outCoinDecimals,
          ),
          totalFee: ZERO_STR,
          swapFee: ZERO_STR,
          priceImpact: ZERO_STR,
        },
      };
    }

    let swapFeeBps: string;
    if (isStableCoinSwap(_coinInType, _coinOutType)) {
      swapFeeBps = this.getFeeRate({
        feeKey: FeeKey.StableSwapFee,
        protocolStore,
      });
    } else {
      swapFeeBps = this.getFeeRate({
        feeKey: FeeKey.SwapFee,
        protocolStore,
      });
    }

    const _finalTx = new Transaction();
    _finalTx.add(this.sdk.OracleModule.updateWhiteListPrices());

    _finalTx.moveCall({
      package: this.sdk.sdkOptions.packageId,
      module: CONTRACT_MODULE.VAULT,
      function: CONTRACT_FUNCTION['vault'].GET_SWAP_AMOUNT_OUT,
      arguments: [
        _finalTx.object(this.sdk.sdkOptions.vault.package_id),
        _finalTx.object(this.sdk.sdkOptions.protocolStore.package_id),
        _finalTx.object(this.sdk.sdkOptions.oracleStore.package_id),
        _finalTx.pure.u64(_amountInWithDecimalIntegerValue),
        _finalTx.object(COMMON_CONSTS.CLOCK_ID),
      ],
      typeArguments: [_coinInType, _coinOutType],
    });

    const _devInspectResult =
      await this.sdk.RpcModule.devInspectTransactionBlock({
        transactionBlock: _finalTx,
        sender:
          this.sdk.senderAddress ||
          this.sdk.sdkOptions.simulationAccount.address,
      });

    const _returnValues =
      _devInspectResult.results?.[_devInspectResult.results.length - 1]
        ?.returnValues;

    if (!_returnValues || _returnValues.length < 3) {
      return {
        amountOutAfterFee: ZERO_STR,
        amountOutAfterFeeWithSlippage: ZERO_STR,
        totalFee: ZERO_STR,
        swapFee: ZERO_STR,
        priceImpact: ZERO_STR,
        feeRateBps: ZERO_STR,
        formatted: {
          amountOutAfterFee: ZERO_STR,
          amountOutAfterFeeWithSlippage: ZERO_STR,
          totalFee: ZERO_STR,
          swapFee: ZERO_STR,
          priceImpact: ZERO_STR,
        },
      };
    }

    const amountOutAfterFee = bcs
      .u64()
      .parse(new Uint8Array(_returnValues[0][0]));

    const _fee = bcs.u64().parse(new Uint8Array(_returnValues[1][0]));
    const feeRateBps = bcs.u64().parse(new Uint8Array(_returnValues[2][0]));

    const totalFee = calc(_fee)
      .times(_unitOutCoinPriceWithPriceDecimals)
      .toString(10);

    amountOutAfterFeeWithSlippage = calc(amountOutAfterFee)
      .times(_unitOutCoinPriceWithPriceDecimals)
      .div(_slippageAdjustedPrice)
      .toString(10);

    const _outCoinSize: BigNumber = calc(amountOutAfterFee)
      .plus(_fee)
      .times(_unitOutCoinPriceWithPriceDecimals);

    const swapFee = calc(swapFeeBps)
      .div(FEE_BPS_POWER)
      .times(_outCoinSize)
      .toString(10);

    const priceImpact = calc(totalFee).minus(swapFee).toString(10);

    const formattedTotalFee = fromDecimalsAmount(
      totalFee,
      PRICE_MULTIPLIER_DECIMAL,
    );

    const formattedSwapFee = fromDecimalsAmount(
      swapFee,
      PRICE_MULTIPLIER_DECIMAL,
    );

    const formattedPriceImpact = fromDecimalsAmount(
      priceImpact,
      PRICE_MULTIPLIER_DECIMAL,
    );
    const formattedAmountOutAfterFee = fromDecimalsAmount(
      amountOutAfterFee,
      outCoinDecimals,
    );
    const formattedAmountOutAfterFeeWithSlippage = fromDecimalsAmount(
      amountOutAfterFeeWithSlippage,
      outCoinDecimals,
    );

    return {
      amountOutAfterFee,
      amountOutAfterFeeWithSlippage,
      totalFee,
      swapFee,
      priceImpact,
      feeRateBps,
      formatted: {
        amountOutAfterFee: formattedAmountOutAfterFee,
        amountOutAfterFeeWithSlippage: formattedAmountOutAfterFeeWithSlippage,
        totalFee: formattedTotalFee,
        swapFee: formattedSwapFee,
        priceImpact: formattedPriceImpact,
      },
    };
  }

  public async querySwapAmountIn(
    params: SwapWithAmountOutQueryParams,
  ): Promise<SwapAmountInResult> {
    const {
      typeArguments,
      amountOut,
      inCoinDecimals,
      outCoinDecimals,
      outCoinPrice,
      slippage,
      protocolStore,
    } = params;

    const [_coinInType, _coinOutType] = typeArguments;
    const _unitOutCoinPriceWithPriceDecimals =
      HertzflowCalc.calculateUnitCoinPriceWithPriceDecimals({
        coinPrice: outCoinPrice,
        coinDecimals: outCoinDecimals,
      });

    const _amountOutWithDecimal = toDecimalsAmount(amountOut, outCoinDecimals);

    const _amountOutWithDecimalIntegerValue =
      HertzflowCalc.calculateIntegerValueString(calc(_amountOutWithDecimal));

    const _slippageAdjustedPrice = new BigNumber(
      _unitOutCoinPriceWithPriceDecimals,
    ).times(new BigNumber(1).minus(new BigNumber(slippage)));

    let amountOutWithSlippage: string;

    if (_coinInType === _coinOutType) {
      amountOutWithSlippage = calc(_amountOutWithDecimal)
        .times(_unitOutCoinPriceWithPriceDecimals)
        .div(_slippageAdjustedPrice)
        .toString(10);
      return {
        amountInRes: _amountOutWithDecimal,
        amountOutRes: _amountOutWithDecimal,
        amountOutWithSlippage,
        totalFee: ZERO_STR,
        swapFee: ZERO_STR,
        priceImpact: ZERO_STR,
        feeRateBps: ZERO_STR,
        formatted: {
          amountInRes: fromDecimalsAmount(
            _amountOutWithDecimal,
            inCoinDecimals,
          ),
          amountOutRes: fromDecimalsAmount(
            _amountOutWithDecimal,
            outCoinDecimals,
          ),
          amountOutWithSlippage: fromDecimalsAmount(
            amountOutWithSlippage,
            outCoinDecimals,
          ),
          totalFee: ZERO_STR,
          swapFee: ZERO_STR,
          priceImpact: ZERO_STR,
        },
      };
    }

    const _finalTx = new Transaction();
    _finalTx.add(this.sdk.OracleModule.updateWhiteListPrices());
    _finalTx.moveCall({
      package: this.sdk.sdkOptions.packageId,
      module: CONTRACT_MODULE.VAULT,
      function: CONTRACT_FUNCTION['vault'].GET_SWAP_AMOUNT_IN_V2,
      arguments: [
        _finalTx.object(this.sdk.sdkOptions.vault.package_id),
        _finalTx.object(this.sdk.sdkOptions.protocolStore.package_id),
        _finalTx.object(this.sdk.sdkOptions.oracleStore.package_id),
        _finalTx.pure.u64(_amountOutWithDecimalIntegerValue),
        _finalTx.object(COMMON_CONSTS.CLOCK_ID),
      ],
      typeArguments: [_coinInType, _coinOutType],
    });

    const _devInspectResult =
      await this.sdk.RpcModule.devInspectTransactionBlock({
        transactionBlock: _finalTx,
        sender:
          this.sdk.senderAddress ||
          this.sdk.sdkOptions.simulationAccount.address,
      });

    const _returnValues =
      _devInspectResult.results?.[_devInspectResult.results.length - 1]
        ?.returnValues;

    if (!_returnValues || _returnValues.length < 4) {
      return {
        amountInRes: ZERO_STR,
        amountOutRes: ZERO_STR,
        amountOutWithSlippage: ZERO_STR,
        totalFee: ZERO_STR,
        feeRateBps: ZERO_STR,
        swapFee: ZERO_STR,
        priceImpact: ZERO_STR,
        formatted: {
          amountInRes: ZERO_STR,
          amountOutRes: ZERO_STR,
          amountOutWithSlippage: ZERO_STR,
          totalFee: ZERO_STR,
          swapFee: ZERO_STR,
          priceImpact: ZERO_STR,
        },
      };
    }

    const amountInRes = bcs.u64().parse(new Uint8Array(_returnValues[0][0]));

    const amountOutRes = bcs.u64().parse(new Uint8Array(_returnValues[1][0]));

    const fee = bcs.u64().parse(new Uint8Array(_returnValues[2][0]));

    const feeRateBps = bcs.u64().parse(new Uint8Array(_returnValues[3][0]));

    const _outCoinSize = calc(fee)
      .plus(amountOutRes)
      .times(_unitOutCoinPriceWithPriceDecimals);

    const totalFee = calc(fee)
      .times(_unitOutCoinPriceWithPriceDecimals)
      .toString(10);

    let swapFeeBps: string;
    if (isStableCoinSwap(_coinInType, _coinOutType)) {
      swapFeeBps = this.getFeeRate({
        feeKey: FeeKey.StableSwapFee,
        protocolStore,
      });
    } else {
      swapFeeBps = this.getFeeRate({
        feeKey: FeeKey.SwapFee,
        protocolStore,
      });
    }
    const swapFee = calc(swapFeeBps)
      .div(FEE_BPS_POWER)
      .times(_outCoinSize)
      .toString(10);

    const priceImpact = calc(totalFee).minus(swapFee).toString(10);

    amountOutWithSlippage = calc(amountOutRes)
      .times(_unitOutCoinPriceWithPriceDecimals)
      .div(_slippageAdjustedPrice)
      .toString(10);

    const formattedAmountInRes = fromDecimalsAmount(
      calc(amountInRes).toString(10),
      inCoinDecimals,
    );
    const formattedAmountOutRes = fromDecimalsAmount(
      calc(amountOutRes).toString(10),
      outCoinDecimals,
    );
    const formattedAmountOutWithSlippage = fromDecimalsAmount(
      amountOutWithSlippage,
      outCoinDecimals,
    );

    const formattedTotalFee = fromDecimalsAmount(
      totalFee,
      PRICE_MULTIPLIER_DECIMAL,
    );

    const formattedSwapFee = fromDecimalsAmount(
      swapFee,
      PRICE_MULTIPLIER_DECIMAL,
    );

    const formattedPriceImpact = fromDecimalsAmount(
      priceImpact,
      PRICE_MULTIPLIER_DECIMAL,
    );

    return {
      amountInRes,
      amountOutRes,
      amountOutWithSlippage,
      totalFee,
      swapFee,
      priceImpact,
      feeRateBps,
      formatted: {
        amountInRes: formattedAmountInRes,
        amountOutRes: formattedAmountOutRes,
        amountOutWithSlippage: formattedAmountOutWithSlippage,
        totalFee: formattedTotalFee,
        swapFee: formattedSwapFee,
        priceImpact: formattedPriceImpact,
      },
    };
  }

  public async queryMaxSwapIn(params: MaxSwapInParams): Promise<string> {
    const { coinInType, coinOutType } = params;
    const _finalTx = new Transaction();
    _finalTx.add(this.sdk.OracleModule.updateWhiteListPrices());
    _finalTx.moveCall({
      package: this.sdk.sdkOptions.packageId,
      module: CONTRACT_MODULE.VAULT,
      function: CONTRACT_FUNCTION['vault'].GET_MAX_SWAP_IN,
      arguments: [
        _finalTx.object(this.sdk.sdkOptions.vault.package_id),
        _finalTx.object(this.sdk.sdkOptions.protocolStore.package_id),
        _finalTx.object(this.sdk.sdkOptions.oracleStore.package_id),
        _finalTx.object(COMMON_CONSTS.CLOCK_ID),
      ],
      typeArguments: [coinInType, coinOutType],
    });

    const _devInspectResult =
      await this.sdk.RpcModule.devInspectTransactionBlock({
        transactionBlock: _finalTx,
        sender:
          this.sdk.senderAddress ||
          this.sdk.sdkOptions.simulationAccount.address,
      });

    const returnValues =
      _devInspectResult.results?.[_devInspectResult.results.length - 1]
        ?.returnValues;

    if (!returnValues || returnValues.length < 1) {
      throw new Error(
        `Invalid return values from get_max_swap_in. Expected 1, got ${returnValues?.length || 0}. Error: ${_devInspectResult.error || 'none'}`,
      );
    }

    const maxAmountInRaw = bcs.u64().parse(new Uint8Array(returnValues[0][0]));
    return calc(maxAmountInRaw).toString(10);
  }

  public async queryAumAndLpPrice(): Promise<{
    aum: {
      aumWithDecimal: string;
      aumFormatted: string;
    };
    lpPrice: {
      lpPriceWithDecimal: string;
      lpPriceFormatted: string;
    };
  }> {
    const finalTx = new Transaction();
    finalTx.add(this.sdk.OracleModule.updateWhiteListPrices());

    finalTx.moveCall({
      package: this.sdk.sdkOptions.packageId,
      module: CONTRACT_MODULE.VAULT,
      function: CONTRACT_FUNCTION['vault'].GET_LP_PRICE,
      arguments: [
        finalTx.object(this.sdk.sdkOptions.vault.package_id),
        finalTx.object(this.sdk.sdkOptions.oracleStore.package_id),
        finalTx.object(COMMON_CONSTS.CLOCK_ID),
      ],
    });

    const _devInspectResult =
      await this.sdk.RpcModule.devInspectTransactionBlock({
        transactionBlock: finalTx,
        sender:
          this.sdk.senderAddress ||
          this.sdk.sdkOptions.simulationAccount.address,
      });

    const returnValues =
      _devInspectResult.results?.[_devInspectResult.results.length - 1]
        ?.returnValues;

    if (!returnValues || returnValues.length < 1) {
      throw new Error(
        `Invalid return values from get_lp_price. Expected 1, got ${returnValues?.length || 0}. Error: ${_devInspectResult.error || 'none'}`,
      );
    }

    const lpPriceRaw = bcs.u128().parse(new Uint8Array(returnValues[0][0]));

    const vaultInfo = await this.parseVaultObject();
    const hzlpTotalSupply =
      vaultInfo?.content?.fields?.hzlp?.fields?.treasury?.fields?.total_supply
        ?.fields?.value || '0';

    const aumWithDecimal = calc(lpPriceRaw)
      .multipliedBy(hzlpTotalSupply)
      .dividedBy(calc(10).pow(PRICE_PRECISION_POWER));

    return {
      aum: {
        aumWithDecimal: aumWithDecimal.toString(10),
        aumFormatted: fromDecimalsAmount(aumWithDecimal.toString(10), 0),
      },
      lpPrice: {
        lpPriceWithDecimal: calc(lpPriceRaw).toString(10),
        lpPriceFormatted: fromDecimalsAmount(lpPriceRaw, PRICE_PRECISION_POWER),
      },
    };
  }

  public async parseVaultObject(): Promise<VaultObjectInfo> {
    const vaultId = this.sdk.sdkOptions.vault.package_id;

    try {
      const objectResponse = await this.sdk.RpcModule.getObject({
        id: vaultId,
        options: {
          showContent: true,
          showDisplay: true,
          showOwner: true,
          showPreviousTransaction: true,
          showStorageRebate: true,
          showType: true,
        },
      });
      return objectResponse.data;
    } catch (error) {
      console.error('❌ Failed to parse Vault object:', error);
      throw new HertzflowError(
        `Failed to parse Vault object: ${error.message}`,
      );
    }
  }

  public async parseHzlpObject(hzlpId?: string): Promise<HzlpObjectInfo> {
    const objectId = hzlpId || this.sdk.sdkOptions.hzlp.package_id;

    try {
      const objectResponse = await this.sdk.RpcModule.getObject({
        id: objectId,
        options: {
          showContent: true,
          showDisplay: true,
          showOwner: true,
          showPreviousTransaction: true,
          showStorageRebate: true,
          showType: true,
        },
      });

      if (!objectResponse.data) {
        throw new HertzflowError(`Unable to find the object: ${objectId}`);
      }

      const objectData = objectResponse.data;

      const hzlpInfo = {
        objectId: objectData.objectId,
        version: objectData.version,
        digest: objectData.digest,
        type: objectData.type || '',
        owner: objectData.owner,
        content: objectData.content as SuiParsedData,
        display: objectData.display,
      };

      if (
        hzlpInfo.content &&
        typeof hzlpInfo.content === 'object' &&
        'dataType' in hzlpInfo.content &&
        hzlpInfo.content.dataType === 'moveObject' &&
        'fields' in hzlpInfo.content
      ) {
        return {
          type: hzlpInfo.type,
          decimals: (hzlpInfo.content as any).fields.decimals,
          description: (hzlpInfo.content as any).fields.description,
          id: (hzlpInfo.content as any).fields.id,
          name: (hzlpInfo.content as any).fields.name,
          symbol: (hzlpInfo.content as any).fields.symbol,
        };
      } else {
        throw new HertzflowError(
          `HZLP object content is not a MoveStruct or does not have fields property. Content type: ${hzlpInfo.content?.dataType || 'unknown'}`,
        );
      }
    } catch (error) {
      console.error('❌ Failed to parse HZLP object:', error);
      throw error;
    }
  }

  public async parseProtocolStoreObject(
    protocolStoreId?: string,
  ): Promise<ProtocolStoreObjectInfo> {
    const objectId =
      protocolStoreId || this.sdk.sdkOptions.protocolStore.package_id;

    try {
      const objectResponse = await this.sdk.RpcModule.getObject({
        id: objectId,
        options: {
          showContent: true,
          showDisplay: true,
          showOwner: true,
          showPreviousTransaction: true,
          showStorageRebate: true,
          showType: true,
        },
      });

      if (!objectResponse.data) {
        throw new HertzflowError(
          `Unable to find the ProtocolStore object: ${objectId}`,
        );
      }

      const objectData = objectResponse.data;

      if (
        objectData.content &&
        typeof objectData.content === 'object' &&
        'dataType' in objectData.content &&
        objectData.content.dataType === 'moveObject' &&
        'fields' in objectData.content
      ) {
        const fields = (objectData.content as any).fields;

        const protocolStoreInfo: ProtocolStoreObjectInfo = {
          type: objectData.type || '',
          acl: fields.acl,
          feature: fields.feature,
          fee: fields.fee,
          funding_fee: fields.funding_fee,
          id: fields.id,
          white_list: fields.white_list,
        };

        return protocolStoreInfo;
      } else {
        throw new HertzflowError(
          `ProtocolStore object content is not a MoveStruct or does not have fields property. Content type: ${objectData.content?.dataType || 'unknown'}`,
        );
      }
    } catch (error) {
      console.error('❌ Failed to parse ProtocolStore object:', error);
      throw error;
    }
  }

  public getFeeRate({ feeKey, protocolStore }: GetFeeRateParams) {
    const feeConfig = protocolStore.fee.fields;
    let feeRate: string;
    switch (feeKey) {
      case FeeKey.LiquidationFee:
        feeRate = feeConfig.liquidation_fee_bps;
        break;
      case FeeKey.TaxFee:
        feeRate = feeConfig.tax_bps;
        break;
      case FeeKey.StableTaxFee:
        feeRate = feeConfig.stable_tax_bps;
        break;
      case FeeKey.SwapFee:
        feeRate = feeConfig.swap_fee_bps;
        break;
      case FeeKey.StableSwapFee:
        feeRate = feeConfig.stable_swap_fee_bps;
        break;
      case FeeKey.AddRemoveFee:
        feeRate = feeConfig.add_remove_fee_bps;
        break;
      case FeeKey.IncreasePositionFee:
        feeRate = feeConfig.increase_position_bps;
        break;
      case FeeKey.DecreasePositionFee:
        feeRate = feeConfig.decrease_position_bps;
        break;
      case FeeKey.ProtocolFee:
        feeRate = feeConfig.protocol_fee_bps;
        break;
      default:
        throw new HertzflowError(`Invalid fee key: ${feeKey}`);
    }

    return feeRate;
  }

  public getAllFeeRates(protocolStore: ProtocolStoreObjectInfo) {
    const feeRates: Record<string, string> = {};

    const validFeeKeys = [
      FeeKey.LiquidationFee,
      FeeKey.TaxFee,
      FeeKey.StableTaxFee,
      FeeKey.SwapFee,
      FeeKey.StableSwapFee,
      FeeKey.AddRemoveFee,
      FeeKey.IncreasePositionFee,
      FeeKey.DecreasePositionFee,
      FeeKey.ProtocolFee,
    ];

    for (const feeKey of validFeeKeys) {
      const rate = this.getFeeRate({ feeKey, protocolStore });
      feeRates[FeeKey[feeKey]] = rate;
    }

    return feeRates;
  }

  public async queryAddFeeBps({
    vaultObject,
    coinType,
    coinDecimals,
    amount,
  }: QueryAddFeeBpsParams): Promise<
    { name: string; type: string; feeBps: number }[]
  > {
    try {
      const numericAmount = parseFloat(amount);
      if (numericAmount < 0)
        throw new Error(`Invalid amount: ${amount}. Amount must be positive.`);

      const finalTx = new Transaction();
      finalTx.add(this.sdk.OracleModule.updateWhiteListPrices());
      const amountWithDecimal = toDecimalsAmount(amount, coinDecimals);
      const amountInWithDecimalIntegerValue =
        HertzflowCalc.calculateIntegerValueString(calc(amountWithDecimal));

      if (parseFloat(amountWithDecimal) < 0)
        throw new Error(
          `Invalid decimals amount: ${amountWithDecimal}. Must be positive.`,
        );

      finalTx.moveCall({
        package: this.sdk.sdkOptions.packageId,
        module: CONTRACT_MODULE.VAULT,
        function: CONTRACT_FUNCTION['vault'].GET_ADD_FEE_BPS,
        arguments: [
          finalTx.object(this.sdk.sdkOptions.vault.package_id),
          finalTx.object(this.sdk.sdkOptions.protocolStore.package_id),
          finalTx.object(this.sdk.sdkOptions.oracleStore.package_id),
          finalTx.object(COMMON_CONSTS.CLOCK_ID),
          finalTx.pure.u64(amountInWithDecimalIntegerValue),
        ],
        typeArguments: [coinType],
      });

      const devInspectResult =
        await this.sdk.RpcModule.devInspectTransactionBlock({
          transactionBlock: finalTx,
          sender:
            this.sdk.senderAddress ||
            this.sdk.sdkOptions.simulationAccount.address,
        });
      const returnValues =
        devInspectResult.results?.[devInspectResult.results.length - 1]
          ?.returnValues;

      if (!returnValues || returnValues.length === 0) {
        throw new HertzflowError(
          'No return values from get_add_fee_bps',
          FetchErrorCode.FailedToFetchData,
        );
      }
      const feeBpsArray = bcs
        .vector(bcs.u64())
        .parse(new Uint8Array(returnValues[0][0]));
      const result = feeBpsArray.map((bps) => Number(bps));

      const res = vaultObject?.content?.fields?.custodies?.fields?.coins?.map(
        (item: any, index: number) => {
          return {
            name: item?.fields?.name,
            type: item?.type,
            feeBps: result[index],
          };
        },
      );

      return res;
    } catch (error) {
      console.error('❌ Query failed to add liquidity fee rate.:', error);
      throw error;
    }
  }

  public async queryRemoveFeeBps({
    vaultObject,
    hzlpAmount,
  }: QueryRemoveFeeBpsParams): Promise<
    { name: string; type: string; feeBps: number }[]
  > {
    try {
      const numericAmount = parseFloat(hzlpAmount);
      if (numericAmount < 0)
        throw new Error(
          `Invalid amount: ${hzlpAmount}. Amount must be positive.`,
        );

      const finalTx = new Transaction();
      finalTx.add(this.sdk.OracleModule.updateWhiteListPrices());

      const hzlpAmountWithDecimal = toDecimalsAmount(hzlpAmount, HZLP_DECIMALS);
      const hzlpAmountWithDecimalIntegerValue =
        HertzflowCalc.calculateIntegerValueString(calc(hzlpAmountWithDecimal));

      if (parseFloat(hzlpAmountWithDecimal) < 0)
        throw new Error(
          `Invalid decimals amount: ${hzlpAmountWithDecimal}. Must be positive.`,
        );

      finalTx.moveCall({
        package: this.sdk.sdkOptions.packageId,
        module: CONTRACT_MODULE.VAULT,
        function: CONTRACT_FUNCTION['vault'].GET_REMOVE_FEE_BPS,
        arguments: [
          finalTx.object(this.sdk.sdkOptions.vault.package_id),
          finalTx.object(this.sdk.sdkOptions.protocolStore.package_id),
          finalTx.object(this.sdk.sdkOptions.oracleStore.package_id),
          finalTx.object(COMMON_CONSTS.CLOCK_ID),
          finalTx.pure.u64(hzlpAmountWithDecimalIntegerValue),
        ],
        typeArguments: [],
      });

      const devInspectResult =
        await this.sdk.RpcModule.devInspectTransactionBlock({
          transactionBlock: finalTx,
          sender:
            this.sdk.senderAddress ||
            this.sdk.sdkOptions.simulationAccount.address,
        });

      const returnValues =
        devInspectResult.results?.[devInspectResult.results.length - 1]
          ?.returnValues;

      if (!returnValues || returnValues.length === 0) {
        throw new HertzflowError(
          'No return values from get_remove_fee_bps',
          FetchErrorCode.FailedToFetchData,
        );
      }

      const feeBpsArray = bcs
        .vector(bcs.u64())
        .parse(new Uint8Array(returnValues[0][0]));
      const result = feeBpsArray.map((bps) => Number(bps));
      const res = vaultObject?.content?.fields?.custodies?.fields?.coins?.map(
        (item: any, index: number) => {
          return {
            name: item?.fields?.name,
            type: item?.type,
            feeBps: result[index],
          };
        },
      );

      return res;
    } catch (error) {
      console.error('❌ :', error);
      throw error;
    }
  }

  public calculateEffectiveSizeAndCollateralUsdValue({
    baseCollateralUsdBn,
    leverage,
    borrowFee,
    openFee,
    closeFee,
  }: {
    baseCollateralUsdBn: BigNumber;
    leverage: number;
    openFee?: BigNumber;
    closeFee?: BigNumber;
    borrowFee?: string;
  }) {
    const safeOpenFee = openFee && !openFee.isNaN() ? openFee : ZERO;
    const safeCloseFee = closeFee && !closeFee.isNaN() ? closeFee : ZERO;

    let safeBorrowFee = ZERO;
    if (
      borrowFee &&
      borrowFee !== 'null' &&
      borrowFee !== 'undefined' &&
      borrowFee.trim() !== ''
    ) {
      try {
        const borrowFeeDecimal = toDecimalsAmount(
          borrowFee,
          PRICE_MULTIPLIER_DECIMAL,
        );
        const borrowFeeBN = calc(borrowFeeDecimal);
        if (!borrowFeeBN.isNaN() && borrowFeeBN.isFinite()) {
          safeBorrowFee = borrowFeeBN;
        }
      } catch (error) {
        console.warn('Invalid borrowFee value:', borrowFee, error);
        safeBorrowFee = ZERO;
      }
    }

    let totalFee = safeOpenFee.plus(safeBorrowFee).plus(safeCloseFee);

    if (totalFee.isNaN() || !totalFee.isFinite()) {
      console.error(
        'totalFee calculation resulted in invalid value, using ZERO. Values:',
        {
          openFee: openFee?.toString(),
          closeFee: closeFee?.toString(),
          borrowFee,
          safeOpenFee: safeOpenFee.toString(),
          safeCloseFee: safeCloseFee.toString(),
          safeBorrowFee: safeBorrowFee.toString(),
        },
      );
      totalFee = ZERO;
    }

    const effectiveCollateralUsdValue = baseCollateralUsdBn.minus(totalFee);

    if (
      effectiveCollateralUsdValue.isNaN() ||
      !effectiveCollateralUsdValue.isFinite()
    ) {
      console.error(
        'effectiveCollateralUsdValue calculation resulted in invalid value:',
        {
          baseCollateralUsdBn: baseCollateralUsdBn.toString(),
          totalFee: totalFee.toString(),
        },
      );
      throw new Error(
        'Invalid collateral calculation: result is NaN or infinite',
      );
    }

    const effectiveCollateralUsdIntegerValue =
      HertzflowCalc.calculateIntegerValueString(effectiveCollateralUsdValue);
    const {
      sizeDeltaIntegerValue: effectiveSizeUsdIntegerValue,
      originSizeDelta: effectiveSizeUsdValue,
    } = HertzflowCalc.calculateSizeDelta({
      collateralUsdValue: effectiveCollateralUsdValue.toString(10),
      leverage,
    });
    return {
      effectiveCollateralUsdValue,
      effectiveCollateralUsdIntegerValue,
      effectiveSizeUsdValue,
      effectiveSizeUsdIntegerValue,
      totalFee: totalFee.toString(10),
    };
  }

  public async calculateDisplayPositionDataForOpenOperation({
    protocolStore,
    typeArguments,
    amountIn,
    leverage,
    collateralCoinPrice,
    collateralCoinDecimals,
    payCoinDecimals,
    slippage,
    borrowFee,
  }: CalculateDisplayPositionForOpenOptionFeeParams) {
    let adjustedSizeDeltaWithDecimal: BigNumber;
    let adjustedCollateralUsdWithDecimal: BigNumber;
    const [payCoin, collateralCoin] = typeArguments;
    const _openFeeRate = this.getFeeRate({
      feeKey: FeeKey.IncreasePositionFee,
      protocolStore,
    });
    const _openFeeRateFormatted = calc(_openFeeRate).div(FEE_BPS_POWER);
    const _unitCollateralCoinPriceWithPriceDecimals = calc(
      toDecimalsAmount(
        fromDecimalsAmount(collateralCoinPrice, collateralCoinDecimals),
        PRICE_MULTIPLIER_DECIMAL,
      ),
    );
    let displaySwapFee: string = ZERO_STR;
    let displayPriceImpact: string = ZERO_STR;
    let _baseCollateralUsdBn: BigNumber;
    if (payCoin !== collateralCoin) {
      const { amountOutAfterFee, formatted } =
        await this.sdk.QueryModule.querySwapAmountOut({
          protocolStore,
          typeArguments,
          amountIn,
          inCoinDecimals: payCoinDecimals,
          slippage,
          outCoinPrice: collateralCoinPrice,
          outCoinDecimals: collateralCoinDecimals,
        });

      displaySwapFee = formatted.swapFee;

      displayPriceImpact = formatted.priceImpact;

      _baseCollateralUsdBn = calc(amountOutAfterFee).times(
        _unitCollateralCoinPriceWithPriceDecimals,
      );
    } else {
      const _amountInWithDecimal = toDecimalsAmount(amountIn, payCoinDecimals);
      _baseCollateralUsdBn = calc(_amountInWithDecimal).times(
        _unitCollateralCoinPriceWithPriceDecimals,
      );
    }
    const { openFee } = this.sdk.QueryModule.calculateOpenFeeInfo({
      protocolStore: protocolStore,
      collateralUsdValue: _baseCollateralUsdBn,
      leverage,
    });
    const { effectiveCollateralUsdValue, effectiveSizeUsdValue } =
      this.calculateEffectiveSizeAndCollateralUsdValue({
        baseCollateralUsdBn: _baseCollateralUsdBn,
        leverage,
        borrowFee,
        openFee,
      });
    adjustedCollateralUsdWithDecimal = effectiveCollateralUsdValue;
    adjustedSizeDeltaWithDecimal = effectiveSizeUsdValue;

    const displayOpenFee = fromDecimalsAmount(
      adjustedSizeDeltaWithDecimal.times(_openFeeRateFormatted).toString(10),
      PRICE_MULTIPLIER_DECIMAL,
    );
    const displaySizeDelta = fromDecimalsAmount(
      adjustedSizeDeltaWithDecimal.toString(10),
      PRICE_MULTIPLIER_DECIMAL,
    );

    const displayAdjustedCollateralUsd = fromDecimalsAmount(
      adjustedCollateralUsdWithDecimal.toString(10),
      PRICE_MULTIPLIER_DECIMAL,
    );

    return {
      displayOpenFee,
      displaySwapFee,
      displayPriceImpact,
      displaySizeDelta,
      displayAdjustedCollateralUsd,
      adjustedSizeDeltaWithDecimal,
    };
  }

  public async calculateDisplayPositionDataForCloseOperation({
    typeArguments,
    sizeDelta,
    leverage,
    collateralCoinPrice,
    receiverCoinPrice,
    collateralCoinDecimals,
    receiverCoinDecimals,
    slippage,
    realtimeConfig,
    entryFundingRate,
  }: CalculateDisplayPositionForCloseOptionFeeParams) {
    const [collateralCoin, receiverCoin] = typeArguments;

    const _closeFeeRate = this.getFeeRate({
      feeKey: FeeKey.DecreasePositionFee,
      protocolStore: realtimeConfig.protocolStore,
    });
    const _closeFeeRateFormatted = calc(_closeFeeRate).div(FEE_BPS_POWER);

    const sizeDeltaWithDecimal = calc(
      toDecimalsAmount(sizeDelta, PRICE_MULTIPLIER_DECIMAL),
    );
    const displayCloseFee = fromDecimalsAmount(
      sizeDeltaWithDecimal.times(_closeFeeRateFormatted).toString(10),
      PRICE_MULTIPLIER_DECIMAL,
    );

    const _leverageBn = calc(leverage);
    const baseCollateralUsdWithDecimal = sizeDeltaWithDecimal.div(_leverageBn);

    const _unitCollateralCoinPriceWithPriceDecimals = calc(
      toDecimalsAmount(
        fromDecimalsAmount(collateralCoinPrice, collateralCoinDecimals),
        PRICE_MULTIPLIER_DECIMAL,
      ),
    );

    const _collateralCoinAmountWithDecimal = baseCollateralUsdWithDecimal.div(
      _unitCollateralCoinPriceWithPriceDecimals,
    );

    const _collateralCoinAmount = fromDecimalsAmount(
      _collateralCoinAmountWithDecimal.toString(10),
      collateralCoinDecimals,
    );

    let displaySwapFee = ZERO_STR;
    let displayPriceImpact = ZERO_STR;
    let receiverCoinAmount = _collateralCoinAmount;
    if (receiverCoin !== collateralCoin) {
      const { amountOutAfterFee, swapFee, priceImpact } =
        await this.sdk.QueryModule.querySwapAmountOut({
          typeArguments,
          amountIn: _collateralCoinAmount,
          inCoinDecimals: collateralCoinDecimals,
          slippage,
          protocolStore: realtimeConfig.protocolStore,
          outCoinPrice: receiverCoinPrice,
          outCoinDecimals: receiverCoinDecimals,
        });

      receiverCoinAmount = fromDecimalsAmount(
        amountOutAfterFee,
        receiverCoinDecimals,
      );

      displaySwapFee = fromDecimalsAmount(swapFee, PRICE_MULTIPLIER_DECIMAL);
      displayPriceImpact = fromDecimalsAmount(
        priceImpact,
        PRICE_MULTIPLIER_DECIMAL,
      );
    }

    const { positionFundingFeeFormatted } = this.calculatePositionFundingFee({
      realtimeConfig,
      positionSize: sizeDelta,
      entryFundingFeeRate: entryFundingRate,
    });

    return {
      displayCloseFee,
      displaySwapFee,
      displayPriceImpact,
      displaySizeDelta: sizeDelta,
      displayFundingFee: positionFundingFeeFormatted,
      displayReceiverCoinAmount: receiverCoinAmount,
    };
  }

  public calculateUPnL({
    realtimeConfig,
    entryPrice,
    markPrice,
    entryFundingRate,
    positionSize,
  }: {
    realtimeConfig: RealtimeConfig;
    entryPrice: SafeNumber;
    markPrice: SafeNumber;
    entryFundingRate: SafeNumber;
    positionSize: SafeNumber;
  }) {
    const _entryPrice = calc(entryPrice);
    const _markPrice = calc(markPrice);
    const _positionSize = calc(
      toDecimalsAmount(positionSize, PRICE_MULTIPLIER_DECIMAL),
    );
    const _closeFeeRate = this.getFeeRate({
      feeKey: FeeKey.DecreasePositionFee,
      protocolStore: realtimeConfig.protocolStore,
    });
    const _closeFee = _positionSize
      .times(calc(_closeFeeRate))
      .div(FEE_BPS_POWER);
    const { positionFundingFeeFormatted } = this.calculatePositionFundingFee({
      realtimeConfig,
      positionSize,
      entryFundingFeeRate: entryFundingRate,
    });

    const uPnLFormatted = _markPrice
      .minus(_entryPrice)
      .div(_entryPrice)
      .times(positionSize)
      .minus(_closeFee)
      .minus(positionFundingFeeFormatted);

    const uPnL = fromDecimalsAmount(
      uPnLFormatted.toString(10),
      PRICE_MULTIPLIER_DECIMAL,
    );
    return {
      uPnL,
      uPnLFormatted,
    };
  }

  private isMatchingTokenType(
    custodyTokenType: string,
    collateralToken: string,
  ): boolean {
    if (!custodyTokenType || !collateralToken) {
      return false;
    }

    const normalizeCustodyType = this.normalizeTokenType(custodyTokenType);
    const normalizeCollateralType = this.normalizeTokenType(collateralToken);

    return normalizeCustodyType === normalizeCollateralType;
  }

  private normalizeTokenType(tokenType: string): string {
    if (!tokenType) return '';

    let normalized = tokenType.startsWith('0x') ? tokenType : `0x${tokenType}`;

    normalized = normalized.replace(/^0x0+/, '0x').replace(/::0+/g, '::');

    const parts = normalized.split('::');
    if (parts.length >= 1) {
      parts[0] = parts[0].toLowerCase();
    }

    return parts.join('::');
  }

  public getRealtimeConfig({
    collateralToken,
    protocolStore,
    vaultObject,
  }: {
    collateralToken: string;
    protocolStore: ProtocolStoreObjectInfo;
    vaultObject: VaultObjectInfo;
  }): RealtimeConfig {
    try {
      const vaultFields = vaultObject.content.fields as any;
      const config = vaultFields.config?.fields;

      const maxMaintainceLeverage = config?.max_maintaince_leverage;

      const feeConfig = protocolStore.fee.fields;
      const liquidationFeeRate = feeConfig.liquidation_fee_bps;
      const decreasePositionFeeRate = feeConfig.decrease_position_bps;
      const fundingFeeConfig = protocolStore.funding_fee.fields;
      const fundingRateBps = fundingFeeConfig.funding_rate_bps;
      const stableFundingRateBps = fundingFeeConfig.stable_funding_rate_bps;
      const fundingInterval = fundingFeeConfig.funding_interval;
      let cumulativeFundingRate: string;
      let lastFundingTime: string;
      let poolAmount: string;
      let reservedAmount: string;
      let isStable: boolean;
      const custodies = vaultFields.custodies;
      if (!custodies) throw new Error('custodies not found');
      const custodiesVecMap = custodies.fields?.custodies;
      const custodiesContents = custodiesVecMap?.fields?.contents;
      for (const entry of custodiesContents) {
        try {
          const entryFields = entry.fields;
          if (!entryFields) continue;
          const tokenType = entryFields.key?.fields?.name;

          if (this.isMatchingTokenType(tokenType, collateralToken)) {
            const custodyFields = entryFields.value?.fields;
            cumulativeFundingRate = custodyFields?.cumulative_funding_rate;
            lastFundingTime = custodyFields?.last_funding_time;
            poolAmount = custodyFields?.pool_amount;
            reservedAmount = custodyFields?.reserved_amount;
            isStable = custodyFields?.is_stable;
          }
        } catch (entryError) {
          console.warn('⚠️  custody :', entryError);
          continue;
        }
      }
      return {
        protocolStore,
        maxMaintainceLeverage,
        liquidationFeeRate,
        decreasePositionFeeRate,
        cumulativeFundingRate,
        fundingRateBps,
        stableFundingRateBps,
        lastFundingTime,
        poolAmount,
        reservedAmount,
        isStable,
        fundingInterval,
      };
    } catch (error) {
      console.warn('⚠️ ，:', error);
      throw error;
    }
  }

  public calculateNextFundingRate({
    realtimeConfig,
  }: {
    realtimeConfig: RealtimeConfig;
  }) {
    const {
      cumulativeFundingRate: currentCumulativeFundingRate,
      lastFundingTime,
      fundingRateBps,
      stableFundingRateBps,
      fundingInterval,
      poolAmount,
      reservedAmount,
      isStable,
    } = realtimeConfig;

    const _fundingInterval = calc(fundingInterval).toNumber();

    const _currentTimeStampSeconds = Math.floor(Date.now() / 1000);
    const _lastFundingTime = calc(lastFundingTime).toNumber();

    if (_lastFundingTime + _fundingInterval > _currentTimeStampSeconds) {
      return {
        currentCumulativeFundingRate,
        nextFundingRate: currentCumulativeFundingRate,
        currentCumulativeFundingRateFormatted: calc(
          currentCumulativeFundingRate,
        )
          .div(FUNDING_RATE_PRECISION)
          .toString(10),
        nextFundingRateFormatted: calc(currentCumulativeFundingRate)
          .div(FUNDING_RATE_PRECISION)
          .toString(10),
      };
    }

    const _poolAmount = calc(poolAmount);
    if (_poolAmount.eq(0)) {
      return {
        currentCumulativeFundingRate,
        nextFundingRate: currentCumulativeFundingRate,
        currentCumulativeFundingRateFormatted: calc(
          currentCumulativeFundingRate,
        )
          .div(FUNDING_RATE_PRECISION)
          .toString(10),
        nextFundingRateFormatted: calc(currentCumulativeFundingRate)
          .div(FUNDING_RATE_PRECISION)
          .toString(10),
      };
    }

    const _secondsPassed = _currentTimeStampSeconds - _lastFundingTime;
    const _intervals = Math.floor(_secondsPassed / _fundingInterval);

    const _fundingRateFactor = isStable
      ? calc(stableFundingRateBps)
      : calc(fundingRateBps);

    const _reservedAmount = calc(reservedAmount);
    const _intervalsTimesFactor = calc(_intervals).times(_fundingRateFactor);

    const _deltaRate = _intervalsTimesFactor
      .times(_reservedAmount)
      .div(_poolAmount)
      .integerValue(BigNumber.ROUND_DOWN);

    const nextFundingRate = calc(currentCumulativeFundingRate).plus(_deltaRate);

    return {
      currentCumulativeFundingRate,

      nextFundingRate: nextFundingRate.toString(10),
      currentCumulativeFundingRateFormatted: calc(currentCumulativeFundingRate)
        .div(FUNDING_RATE_PRECISION)
        .toString(10),

      nextFundingRateFormatted: nextFundingRate
        .div(FUNDING_RATE_PRECISION)
        .toString(10),
    };
  }

  public calculatePositionFundingFee({
    realtimeConfig,
    positionSize,
    entryFundingFeeRate,
  }: {
    realtimeConfig: RealtimeConfig;
    positionSize: SafeNumber;
    entryFundingFeeRate: string;
  }) {
    const { nextFundingRate } = this.calculateNextFundingRate({
      realtimeConfig,
    });

    const _fundingFeeRateDelta =
      calc(nextFundingRate).minus(entryFundingFeeRate);

    const _positionSizeWithDecimal = calc(
      toDecimalsAmount(positionSize, PRICE_MULTIPLIER_DECIMAL),
    );

    const positionFundingFee = _positionSizeWithDecimal
      .times(_fundingFeeRateDelta)
      .div(FUNDING_RATE_PRECISION);

    return {
      nextFundingRate,
      entryFundingFeeRate,
      positionFundingFee: positionFundingFee.toString(10),
      nextFundingRateFormatted: calc(nextFundingRate)
        .div(FUNDING_RATE_PRECISION)
        .toString(10),
      entryFundingFeeRateFormatted: calc(entryFundingFeeRate)
        .div(FUNDING_RATE_PRECISION)
        .toString(10),
      positionFundingFeeFormatted: fromDecimalsAmount(
        positionFundingFee.toString(10),
        PRICE_MULTIPLIER_DECIMAL,
      ),
    };
  }

  public calculateLiquidationPrice({
    realtimeConfig,
    entryPrice,
    collateral,
    size,
    isLong,
    entryFundingRate,
    hasPosition = true,
  }: {
    realtimeConfig: RealtimeConfig;

    entryPrice: SafeNumber;

    collateral: SafeNumber;

    size: SafeNumber;

    isLong: boolean;

    entryFundingRate?: SafeNumber;

    hasPosition?: boolean;
  }): {
    liquidationPrice: string;
    liquidationPriceFormatted: string;
    calculationDetails: {
      liquidateFee: string;
      exitFee: string;
      fundingFee: string;
      minCollateralRequirement: string;
      totalLoss: string;
      diff: string;
      adjustmentFactor: string;
    };
  } {
    try {
      const _entryPrice = calc(entryPrice);
      const _collateral = calc(
        toDecimalsAmount(collateral, PRICE_MULTIPLIER_DECIMAL),
      );
      const _size = calc(toDecimalsAmount(size, PRICE_MULTIPLIER_DECIMAL));

      const liquidationFeeRate = calc(realtimeConfig.liquidationFeeRate).div(
        FEE_BPS_POWER,
      );
      const liquidateFee = _size.times(liquidationFeeRate);

      const decreasePositionFeeRate = calc(
        realtimeConfig.decreasePositionFeeRate,
      ).div(FEE_BPS_POWER);
      const decreasePositionFee = _size.times(decreasePositionFeeRate);

      let fundingFee = ZERO;
      if (hasPosition && entryFundingRate !== undefined) {
        const fundingResult = this.calculatePositionFundingFee({
          realtimeConfig,
          positionSize: size,
          entryFundingFeeRate: entryFundingRate,
        });
        fundingFee = calc(fundingResult.positionFundingFee);
      }

      const maxMaintainceLeverage = calc(
        realtimeConfig.maxMaintainceLeverage,
      ).div(FEE_BPS_POWER);
      const minCollateralRequirement = _size.div(maxMaintainceLeverage);

      const exitFee = decreasePositionFee.plus(fundingFee);
      const totalLoss = liquidateFee
        .plus(exitFee)
        .plus(minCollateralRequirement);

      const diff = _collateral.minus(totalLoss).abs();

      const adjustmentFactor = diff.times(_entryPrice).div(_size);

      let liquidationPrice: BigNumber;

      if (isLong) {
        if (totalLoss.gte(_collateral)) {
          liquidationPrice = _entryPrice.plus(adjustmentFactor);
        } else if (_entryPrice.gt(adjustmentFactor)) {
          liquidationPrice = _entryPrice.minus(adjustmentFactor);
        } else {
          liquidationPrice = ZERO;
        }
      } else {
        if (totalLoss.gte(_collateral) && _entryPrice.gt(adjustmentFactor)) {
          liquidationPrice = _entryPrice.minus(adjustmentFactor);
        } else if (
          totalLoss.gte(_collateral) &&
          _entryPrice.lte(adjustmentFactor)
        ) {
          liquidationPrice = ZERO;
        } else {
          liquidationPrice = _entryPrice.plus(adjustmentFactor);
        }
      }

      const liquidationPriceFormatted = liquidationPrice.toFixed(6);

      const result = {
        liquidationPrice: liquidationPrice.toString(10),
        liquidationPriceFormatted,
        calculationDetails: {
          liquidateFee: fromDecimalsAmount(
            liquidateFee.toString(10),
            PRICE_MULTIPLIER_DECIMAL,
          ),
          exitFee: fromDecimalsAmount(
            exitFee.toString(10),
            PRICE_MULTIPLIER_DECIMAL,
          ),
          fundingFee: fromDecimalsAmount(
            fundingFee.toString(10),
            PRICE_MULTIPLIER_DECIMAL,
          ),
          minCollateralRequirement: fromDecimalsAmount(
            minCollateralRequirement.toString(10),
            PRICE_MULTIPLIER_DECIMAL,
          ),
          totalLoss: fromDecimalsAmount(
            totalLoss.toString(10),
            PRICE_MULTIPLIER_DECIMAL,
          ),
          diff: fromDecimalsAmount(diff.toString(10), PRICE_MULTIPLIER_DECIMAL),
          adjustmentFactor: adjustmentFactor.toFixed(6),
        },
      };

      return result;
    } catch (error) {
      console.error('❌ :', error);
      throw new HertzflowError(
        error instanceof Error ? error.message : '',
        FetchErrorCode.FailedToFetchData,
      );
    }
  }

  public calculateOpenFeeInfo({
    protocolStore,
    collateralUsdValue,
    leverage,
  }: {
    protocolStore: ProtocolStoreObjectInfo;
    collateralUsdValue: BigNumber;
    leverage: number;
  }) {
    const _leverage = calc(leverage);
    const openFeeRate = this.getFeeRate({
      feeKey: FeeKey.IncreasePositionFee,
      protocolStore,
    });
    const openFee = collateralUsdValue
      .times(_leverage)
      .times(calc(openFeeRate))
      .div(FEE_BPS_POWER);
    return {
      openFeeRate,
      openFee,
    };
  }

  public calculateCloseFeeInfo({
    protocolStore,
    collateralUsdValue,
    leverage,
    size,
  }: {
    protocolStore: ProtocolStoreObjectInfo;
    size?: BigNumber;
    collateralUsdValue?: BigNumber;
    leverage?: number;
  }) {
    const closeFeeRate = this.getFeeRate({
      feeKey: FeeKey.DecreasePositionFee,
      protocolStore,
    });

    let closeFee: BigNumber;
    if (size) {
      closeFee = size.times(calc(closeFeeRate)).div(FEE_BPS_POWER);
    } else if (collateralUsdValue && leverage) {
      const _leverage = calc(leverage);
      closeFee = collateralUsdValue
        .times(_leverage)
        .times(calc(closeFeeRate))
        .div(FEE_BPS_POWER);
    } else {
      closeFee = ZERO;
    }

    return {
      closeFeeRate,
      closeFee,
    };
  }

  public calculateLiquidationFeeInfo({
    protocolStore,
    size,
    collateralUsdValue,
    leverage,
  }: {
    protocolStore: ProtocolStoreObjectInfo;
    size?: BigNumber;
    collateralUsdValue?: BigNumber;
    leverage?: number;
  }) {
    const liquidationFeeRate = this.getFeeRate({
      feeKey: FeeKey.LiquidationFee,
      protocolStore,
    });

    let liquidationFee: BigNumber;
    if (size) {
      liquidationFee = size.times(calc(liquidationFeeRate)).div(FEE_BPS_POWER);
    } else if (collateralUsdValue && leverage) {
      const _leverage = calc(leverage);
      liquidationFee = collateralUsdValue
        .times(_leverage)
        .times(calc(liquidationFeeRate))
        .div(FEE_BPS_POWER);
    } else {
      liquidationFee = ZERO;
    }
    return {
      liquidationFeeRate,
      liquidationFee,
    };
  }
}
