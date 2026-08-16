import {
  AddLiquidityParams,
  CancelDecreaseOrderParams,
  CancelIncreaseOrderParams,
  CreateIncreaseOrderParams,
  CreateDecreaseOrderParams,
  IncreaseOrderParams,
  IncreasePositionRequestWithPositionParams,
  DecreasePositionRequestWithPositionParams,
  CreatePositionRequestParams,
  RemoveLiquidityParams,
  SwapParams,
  UpdateIncreaseOrderParams,
  UpdateDecreaseOrderParams,
  AddMarginParams,
  ReduceMarginParams,
} from '../types';
import { Transaction } from '@mysten/sui/transactions';
import { IModule } from '../interfaces/IModule';
import { HertzFlowSDK } from '../sdk';
import { HertzflowCalc, toDecimalsAmount, fromDecimalsAmount } from '../utils';
import {
  COMMON_CONSTS,
  CONTRACT_FUNCTION,
  CONTRACT_MODULE,
} from '../constants';
import BigNumber from 'bignumber.js';
import {
  HZLP_DECIMALS,
  PRICE_MULTIPLIER_DECIMAL,
  ZERO,
  ZERO_STR,
} from '../math';

export class VaultModule implements IModule {
  protected _sdk: HertzFlowSDK;

  constructor(sdk: HertzFlowSDK) {
    this._sdk = sdk;
  }

  get sdk() {
    return this._sdk;
  }

  public createAddLiquidityPayload(params: AddLiquidityParams) {
    return async (tx: Transaction) => {
      tx.add(this.sdk.OracleModule.updateWhiteListPrices());
      tx.setSender(this.sdk.senderAddress);

      const { amountIn, inCoinDecimals, slippage, typeArguments, inCoinPrice } =
        params;

      const _queryResult =
        await this.sdk.QueryModule.queryAddLiquidityAmountAndFee({
          coinType: typeArguments[0],
          amountIn,
          inCoinPrice,
          inCoinDecimals,
          outCoinDecimals: HZLP_DECIMALS,
          slippage,
        });

      const assetAmountWithDecimalIntegerValue =
        HertzflowCalc.calculateIntegerValueString(
          new BigNumber(toDecimalsAmount(amountIn, inCoinDecimals)),
        );
      const minTlpWithDecimalIntegerValue =
        HertzflowCalc.calculateIntegerValueString(
          new BigNumber(_queryResult.amountOutAfterFeeWithSlippage),
        );
      const depositCoinObject = this.sdk.RpcModule.getFixedCoinAmount({
        txb: tx,
        address: this.sdk.senderAddress,
        coinType: typeArguments[0],
        amount: toDecimalsAmount(amountIn, inCoinDecimals),
      });

      const result = tx.moveCall({
        package: this.sdk.sdkOptions.packageId,
        module: CONTRACT_MODULE.VAULT,
        function: CONTRACT_FUNCTION['vault'].ADD_LIQUIDITY,
        arguments: [
          tx.object(this.sdk.sdkOptions.vault.package_id),
          tx.object(this.sdk.sdkOptions.protocolStore.package_id),
          tx.object(this.sdk.sdkOptions.version.package_id),
          tx.object(this.sdk.sdkOptions.oracleStore.package_id),
          depositCoinObject,
          tx.pure.u64(assetAmountWithDecimalIntegerValue),
          tx.pure.u64(minTlpWithDecimalIntegerValue),
          tx.object(COMMON_CONSTS.CLOCK_ID),
        ],
        typeArguments,
      });
      tx.transferObjects([depositCoinObject], this.sdk.senderAddress);
      tx.transferObjects([result], this.sdk.senderAddress);
    };
  }

  public createRemoveLiquidityPayload(params: RemoveLiquidityParams) {
    return async (tx: Transaction) => {
      tx.add(this.sdk.OracleModule.updateWhiteListPrices());
      tx.setSender(this.sdk.senderAddress);

      const {
        amountIn,
        slippage,
        typeArguments,
        outCoinDecimals,
        outCoinPrice,
      } = params;

      const redeemHzlpAmountWithDecimalIntegerValue =
        HertzflowCalc.calculateIntegerValueString(
          new BigNumber(toDecimalsAmount(amountIn, HZLP_DECIMALS)),
        );

      const _queryResult =
        await this.sdk.QueryModule.queryRemoveLiquidityAmountAndFee({
          coinType: typeArguments[0],
          amountIn,
          slippage,
          outCoinDecimals,
          outCoinPrice,
        });

      const minOutWithDecimalIntegerValue =
        HertzflowCalc.calculateIntegerValueString(
          new BigNumber(_queryResult.amountOutAfterFeeWithSlippage),
        );

      const redeemHzlpCoinObject = this.sdk.RpcModule.getFixedCoinAmount({
        txb: tx,
        address: this.sdk.senderAddress,
        coinType: this.sdk.sdkOptions.HZLP_TYPE,
        amount: toDecimalsAmount(amountIn, HZLP_DECIMALS),
      });

      const result = tx.moveCall({
        package: this.sdk.sdkOptions.packageId,
        module: CONTRACT_MODULE.VAULT,
        function: CONTRACT_FUNCTION['vault'].REMOVE_LIQUIDITY,
        arguments: [
          tx.object(this.sdk.sdkOptions.vault.package_id),
          tx.object(this.sdk.sdkOptions.protocolStore.package_id),
          tx.object(this.sdk.sdkOptions.version.package_id),
          tx.object(this.sdk.sdkOptions.oracleStore.package_id),
          redeemHzlpCoinObject,
          tx.pure.u64(redeemHzlpAmountWithDecimalIntegerValue),
          tx.pure.u64(minOutWithDecimalIntegerValue),
          tx.object(COMMON_CONSTS.CLOCK_ID),
        ],
        typeArguments,
      });
      tx.transferObjects([redeemHzlpCoinObject], this.sdk.senderAddress);
      tx.transferObjects([result], this.sdk.senderAddress);
    };
  }

  public createPositionRequestPayload(params: CreatePositionRequestParams) {
    return async (tx: Transaction) => {
      const {
        protocolStore,
        amountIn,
        isLong,
        leverage,
        slippage,
        payCoinDecimals,
        indexCoinMarketPrice,
        indexCoinDecimals,
        collateralCoinMarketPrice,
        collateralCoinDecimals,
        typeArguments,
      } = params;

      tx.add(this.sdk.OracleModule.updateWhiteListPrices());
      tx.setSender(this.sdk.senderAddress);
      const _unitCollateralCoinPriceWithPriceDecimals =
        HertzflowCalc.calculateUnitCoinPriceWithPriceDecimals({
          coinPrice: collateralCoinMarketPrice,
          coinDecimals: collateralCoinDecimals,
        });

      const _typeArgumentsForSwap = [typeArguments[0], typeArguments[1]] as [
        string,
        string,
      ];

      const _queryResult = await this.sdk.QueryModule.querySwapAmountOut({
        typeArguments: _typeArgumentsForSwap,
        amountIn: amountIn,
        inCoinDecimals: payCoinDecimals,
        slippage,
        protocolStore,
        outCoinPrice: collateralCoinMarketPrice,
        outCoinDecimals: collateralCoinDecimals,
      });

      const _baseCollateralUsdBn = new BigNumber(
        _queryResult.amountOutAfterFee,
      ).times(_unitCollateralCoinPriceWithPriceDecimals);

      const { openFee } = this.sdk.QueryModule.calculateOpenFeeInfo({
        protocolStore: protocolStore,
        collateralUsdValue: _baseCollateralUsdBn,
        leverage,
      });

      const { effectiveSizeUsdIntegerValue } =
        this.sdk.QueryModule.calculateEffectiveSizeAndCollateralUsdValue({
          baseCollateralUsdBn: _baseCollateralUsdBn,
          leverage,
          openFee,
        });

      const amountInWithDecimalIntegerValue =
        HertzflowCalc.calculateIntegerValueString(
          new BigNumber(toDecimalsAmount(amountIn, payCoinDecimals)),
        );

      const minoutWithDecimalIntegerValue =
        HertzflowCalc.calculateIntegerValueString(
          new BigNumber(_queryResult.amountOutAfterFeeWithSlippage),
        );

      const payCoinObject = this.sdk.RpcModule.getFixedCoinAmount({
        txb: tx,
        address: this.sdk.senderAddress,
        coinType: typeArguments[0],
        amount: toDecimalsAmount(amountIn, payCoinDecimals),
      });

      const acceptablePriceIntegerValue =
        HertzflowCalc.calculateAcceptablePrice({
          coinPrice: indexCoinMarketPrice,
          coinDecimals: indexCoinDecimals,
          isLong,
          slippage,
          operationType: 'increase',
        });

      tx.moveCall({
        package: this.sdk.sdkOptions.packageId,
        module: CONTRACT_MODULE.VAULT,
        function: CONTRACT_FUNCTION['vault'].CREATE_POSITION_REQUEST,
        arguments: [
          tx.object(this.sdk.sdkOptions.vault.package_id),
          tx.object(this.sdk.sdkOptions.protocolStore.package_id),
          tx.object(this.sdk.sdkOptions.oracleStore.package_id),
          tx.object(this.sdk.sdkOptions.version.package_id),
          payCoinObject,
          tx.pure.u64(amountInWithDecimalIntegerValue),
          tx.pure.u64(minoutWithDecimalIntegerValue),
          tx.pure.u128(effectiveSizeUsdIntegerValue),
          tx.pure.bool(isLong),
          tx.pure.u128(acceptablePriceIntegerValue),
          tx.object(COMMON_CONSTS.CLOCK_ID),
        ],
        typeArguments,
      });
      tx.transferObjects([payCoinObject], this.sdk.senderAddress);
    };
  }

  public createSwapPayload(params: SwapParams) {
    return async (tx: Transaction) => {
      const {
        protocolStore,
        amountIn,
        amountOut,
        slippage,
        inCoinDecimals,
        outCoinDecimals,
        outCoinPrice,
        typeArguments,
      } = params;

      if ((!amountIn && !amountOut) || (amountIn && amountOut)) {
        throw new Error(
          'Must provide either amountIn (for forward calculation) or amountOut (for reverse calculation), but not both',
        );
      }

      const _isReverseCalculation = !!amountOut;
      let finalAmountInWithDecimalIntegerValue: string;
      let finalMinOutWithDecimalIntegerValue: string;

      if (_isReverseCalculation) {
        const _reverseQueryResult =
          await this.sdk.QueryModule.querySwapAmountIn({
            typeArguments,
            amountOut: amountOut!,
            outCoinDecimals,
            slippage,
            protocolStore,
            outCoinPrice: outCoinPrice!,
            inCoinDecimals,
          });

        finalAmountInWithDecimalIntegerValue =
          HertzflowCalc.calculateIntegerValueString(
            new BigNumber(_reverseQueryResult.amountInRes),
          );

        finalMinOutWithDecimalIntegerValue =
          HertzflowCalc.calculateIntegerValueString(
            new BigNumber(_reverseQueryResult.amountOutWithSlippage),
          );
      } else {
        finalAmountInWithDecimalIntegerValue =
          HertzflowCalc.calculateIntegerValueString(
            new BigNumber(toDecimalsAmount(amountIn!, inCoinDecimals)),
          );

        const _forwardQueryResult =
          await this.sdk.QueryModule.querySwapAmountOut({
            typeArguments,
            amountIn: amountIn!,
            inCoinDecimals,
            slippage,
            protocolStore,
            outCoinPrice: outCoinPrice!,
            outCoinDecimals,
          });

        finalMinOutWithDecimalIntegerValue =
          HertzflowCalc.calculateIntegerValueString(
            new BigNumber(_forwardQueryResult.amountOutAfterFeeWithSlippage),
          );
      }

      tx.add(this.sdk.OracleModule.updateWhiteListPrices());

      const inCoinObject = this.sdk.RpcModule.getFixedCoinAmount({
        txb: tx,
        address: this.sdk.senderAddress,
        coinType: typeArguments[0],
        amount: toDecimalsAmount(amountIn!, inCoinDecimals),
      });
      const outCoinResult = tx.moveCall({
        package: this.sdk.sdkOptions.packageId,
        module: CONTRACT_MODULE.VAULT,
        function: CONTRACT_FUNCTION['vault'].SWAP,
        arguments: [
          tx.object(this.sdk.sdkOptions.vault.package_id),
          tx.object(this.sdk.sdkOptions.protocolStore.package_id),
          tx.object(this.sdk.sdkOptions.version.package_id),
          tx.object(this.sdk.sdkOptions.oracleStore.package_id),
          inCoinObject,
          tx.pure.u64(finalAmountInWithDecimalIntegerValue),
          tx.pure.u64(finalMinOutWithDecimalIntegerValue),
          tx.object(COMMON_CONSTS.CLOCK_ID),
        ],
        typeArguments,
      });
      tx.transferObjects([inCoinObject], this.sdk.senderAddress);
      tx.transferObjects([outCoinResult], this.sdk.senderAddress);
    };
  }

  public createCreateIncreaseOrderPayload(params: CreateIncreaseOrderParams) {
    return (tx: Transaction) => {
      const {
        protocolStore,
        amountIn,
        isLong,
        leverage,
        triggerPrice,
        triggerAboveThreshold,
        collateralCoinPrice,
        collateralCoinDecimals,
        indexCoinDecimals,
        typeArguments,
      } = params;

      tx.add(this.sdk.OracleModule.updateWhiteListPrices());
      tx.setSender(this.sdk.senderAddress);

      const amountInWithDecimalIntegerValue =
        HertzflowCalc.calculateIntegerValueString(
          new BigNumber(toDecimalsAmount(amountIn, collateralCoinDecimals)),
        );
      const triggerPriceWithAmplificationMultiplier =
        HertzflowCalc.calculateAmplificationPrice({
          originPrice: triggerPrice,
          coinDecimals: indexCoinDecimals,
        });
      let _baseCollateralUsdBn: BigNumber;
      if (isLong) {
        const _unitIndexCoinPriceWithPriceDecimals =
          HertzflowCalc.calculateUnitCoinPriceWithPriceDecimals({
            coinPrice: triggerPrice,
            coinDecimals: indexCoinDecimals,
          });
        _baseCollateralUsdBn = new BigNumber(
          toDecimalsAmount(amountIn, collateralCoinDecimals),
        ).times(_unitIndexCoinPriceWithPriceDecimals);
      } else {
        const _unitCollateralCoinPriceWithPriceDecimals =
          HertzflowCalc.calculateUnitCoinPriceWithPriceDecimals({
            coinPrice: collateralCoinPrice,
            coinDecimals: collateralCoinDecimals,
          });
        _baseCollateralUsdBn = new BigNumber(
          toDecimalsAmount(amountIn, collateralCoinDecimals),
        ).times(_unitCollateralCoinPriceWithPriceDecimals);
      }

      const { openFee } = this.sdk.QueryModule.calculateOpenFeeInfo({
        protocolStore: protocolStore,
        collateralUsdValue: _baseCollateralUsdBn,
        leverage,
      });
      const { effectiveSizeUsdIntegerValue } =
        this.sdk.QueryModule.calculateEffectiveSizeAndCollateralUsdValue({
          baseCollateralUsdBn: _baseCollateralUsdBn,
          leverage,
          openFee,
        });

      const collateralCoinObject = this.sdk.RpcModule.getFixedCoinAmount({
        txb: tx,
        address: this.sdk.senderAddress,
        coinType: typeArguments[0],
        amount: toDecimalsAmount(amountIn, collateralCoinDecimals),
      });

      tx.moveCall({
        package: this.sdk.sdkOptions.packageId,
        module: CONTRACT_MODULE.VAULT,
        function: CONTRACT_FUNCTION['vault'].CREATE_INCREASE_ORDER,
        arguments: [
          tx.object(this.sdk.sdkOptions.vault.package_id),
          tx.object(this.sdk.sdkOptions.protocolStore.package_id),
          tx.object(this.sdk.sdkOptions.oracleStore.package_id),
          tx.object(this.sdk.sdkOptions.version.package_id),
          collateralCoinObject,
          tx.pure.u64(amountInWithDecimalIntegerValue),
          tx.pure.u128(effectiveSizeUsdIntegerValue),
          tx.pure.bool(isLong),
          tx.pure.u128(triggerPriceWithAmplificationMultiplier),
          tx.pure.bool(triggerAboveThreshold),
          tx.object(COMMON_CONSTS.CLOCK_ID),
        ],
        typeArguments,
      });

      tx.transferObjects([collateralCoinObject], this.sdk.senderAddress);
    };
  }

  public createCancelIncreaseOrderPayload(params: CancelIncreaseOrderParams) {
    return (tx: Transaction) => {
      const { orderId, collateralCoin } = params;
      const typeArguments = [collateralCoin];
      tx.moveCall({
        package: this.sdk.sdkOptions.packageId,
        module: CONTRACT_MODULE.VAULT,
        function: CONTRACT_FUNCTION['vault'].CANCEL_INCREASE_ORDER,
        arguments: [
          tx.object(this.sdk.sdkOptions.vault.package_id),
          tx.object(this.sdk.sdkOptions.protocolStore.package_id),
          tx.object(this.sdk.sdkOptions.version.package_id),
          tx.pure.id(orderId),
          tx.object(COMMON_CONSTS.CLOCK_ID),
        ],
        typeArguments,
      });
    };
  }

  public createCancelDecreaseOrderPayload(params: CancelDecreaseOrderParams) {
    return (tx: Transaction) => {
      const { orderId } = params;
      tx.moveCall({
        package: this.sdk.sdkOptions.packageId,
        module: CONTRACT_MODULE.VAULT,
        function: CONTRACT_FUNCTION['vault'].CANCEL_DECREASE_ORDER,
        arguments: [
          tx.object(this.sdk.sdkOptions.vault.package_id),
          tx.object(this.sdk.sdkOptions.protocolStore.package_id),
          tx.object(this.sdk.sdkOptions.version.package_id),
          tx.pure.id(orderId),
          tx.object(COMMON_CONSTS.CLOCK_ID),
        ],
      });
    };
  }

  public createUpdateIncreaseOrderPayload(params: UpdateIncreaseOrderParams) {
    return (tx: Transaction) => {
      const {
        orderId,
        size,
        triggerAboveThreshold,
        triggerPrice,
        indexCoinDecimals,
      } = params;
      const sizeWithDecimalIntegerValue =
        HertzflowCalc.calculateIntegerValueString(
          new BigNumber(toDecimalsAmount(size, PRICE_MULTIPLIER_DECIMAL)),
        );
      const triggerPriceWithAmplificationMultiplier =
        HertzflowCalc.calculateAmplificationPrice({
          originPrice: triggerPrice,
          coinDecimals: indexCoinDecimals,
        });

      const triggerPriceIntegerValue =
        HertzflowCalc.calculateIntegerValueString(
          new BigNumber(triggerPriceWithAmplificationMultiplier),
        );

      tx.moveCall({
        package: this.sdk.sdkOptions.packageId,
        module: CONTRACT_MODULE.VAULT,
        function: CONTRACT_FUNCTION['vault'].UPDATE_INCREASE_ORDER,
        arguments: [
          tx.object(this.sdk.sdkOptions.vault.package_id),
          tx.object(this.sdk.sdkOptions.protocolStore.package_id),
          tx.object(this.sdk.sdkOptions.version.package_id),
          tx.pure.id(orderId),
          tx.pure.u128(sizeWithDecimalIntegerValue),
          tx.pure.u128(triggerPriceIntegerValue),
          tx.pure.bool(triggerAboveThreshold),
        ],
      });
    };
  }

  public createUpdateDecreaseOrderPayload(params: UpdateDecreaseOrderParams) {
    return (tx: Transaction) => {
      const {
        orderId,
        triggerPrice,
        triggerAboveThreshold,
        size,
        collateral,
        indexCoinDecimals,
      } = params;

      tx.setSender(this.sdk.senderAddress);
      const triggerPriceWithAmplificationMultiplier =
        HertzflowCalc.calculateAmplificationPrice({
          originPrice: triggerPrice,
          coinDecimals: indexCoinDecimals,
        });
      const triggerPriceIntegerValue =
        HertzflowCalc.calculateIntegerValueString(
          new BigNumber(triggerPriceWithAmplificationMultiplier),
        );
      const sizeWithDecimalIntegerValue =
        HertzflowCalc.calculateIntegerValueString(
          new BigNumber(toDecimalsAmount(size, PRICE_MULTIPLIER_DECIMAL)),
        );
      const collateralWithDecimalIntegerValue =
        HertzflowCalc.calculateIntegerValueString(
          new BigNumber(toDecimalsAmount(collateral, PRICE_MULTIPLIER_DECIMAL)),
        );

      tx.moveCall({
        package: this.sdk.sdkOptions.packageId,
        module: CONTRACT_MODULE.VAULT,
        function: CONTRACT_FUNCTION['vault'].UPDATE_DECREASE_ORDER,
        arguments: [
          tx.object(this.sdk.sdkOptions.vault.package_id),
          tx.object(this.sdk.sdkOptions.protocolStore.package_id),
          tx.object(this.sdk.sdkOptions.version.package_id),
          tx.pure.id(orderId),
          tx.pure.u128(triggerPriceIntegerValue),
          tx.pure.bool(triggerAboveThreshold),
          tx.pure.u128(sizeWithDecimalIntegerValue),
          tx.pure.u128(collateralWithDecimalIntegerValue),
        ],
      });
    };
  }

  public createCreateDecreaseOrderPayload(params: CreateDecreaseOrderParams) {
    return (tx: Transaction) => {
      const {
        positionId,
        sizeDelta,
        currentSize,
        currentCollateral,
        triggerPrice,
        triggerAboveThreshold,
        indexCoinDecimals,
      } = params;
      tx.setSender(this.sdk.senderAddress);

      const _sizeDeltaWithDecimal = new BigNumber(
        toDecimalsAmount(sizeDelta, PRICE_MULTIPLIER_DECIMAL),
      );
      const _currentSizeWithDecimal = new BigNumber(
        toDecimalsAmount(currentSize, PRICE_MULTIPLIER_DECIMAL),
      );
      const _currentCollateralWithDecimal = new BigNumber(
        toDecimalsAmount(currentCollateral, PRICE_MULTIPLIER_DECIMAL),
      );

      const sizeDeltaWithDecimalIntegerValue =
        HertzflowCalc.calculateIntegerValueString(_sizeDeltaWithDecimal);

      const { collateralDeltaIntegerValue } =
        HertzflowCalc.calculateCollateralDelta({
          sizeDelta: _sizeDeltaWithDecimal,
          currentSize: _currentSizeWithDecimal,
          currentCollateral: _currentCollateralWithDecimal,
        });

      const triggerPriceWithAmplificationMultiplier =
        HertzflowCalc.calculateAmplificationPrice({
          originPrice: triggerPrice,
          coinDecimals: indexCoinDecimals,
        });

      tx.moveCall({
        package: this.sdk.sdkOptions.packageId,
        module: CONTRACT_MODULE.VAULT,
        function: CONTRACT_FUNCTION['vault'].CREATE_DECREASE_ORDER,
        arguments: [
          tx.object(this.sdk.sdkOptions.vault.package_id),
          tx.object(this.sdk.sdkOptions.protocolStore.package_id),
          tx.object(this.sdk.sdkOptions.version.package_id),
          tx.object(positionId),
          tx.pure.u128(sizeDeltaWithDecimalIntegerValue),
          tx.pure.u128(collateralDeltaIntegerValue),
          tx.pure.u128(triggerPriceWithAmplificationMultiplier),
          tx.pure.bool(triggerAboveThreshold),
          tx.object(COMMON_CONSTS.CLOCK_ID),
        ],
      });
    };
  }

  public createIncreaseOrderWithPositionPayload(params: IncreaseOrderParams) {
    return (tx: Transaction) => {
      const {
        protocolStore,
        positionId,
        amountIn,
        leverage,
        borrowFee,
        isLong,
        triggerPrice,
        triggerAboveThreshold,
        collateralCoinPrice,
        collateralCoinDecimals,
        indexCoinDecimals,
        typeArguments,
      } = params;

      tx.add(this.sdk.OracleModule.updateWhiteListPrices());
      tx.setSender(this.sdk.senderAddress);
      const amountInWithDecimalIntegerValue =
        HertzflowCalc.calculateIntegerValueString(
          new BigNumber(toDecimalsAmount(amountIn, collateralCoinDecimals)),
        );

      const collateralCoinObject = this.sdk.RpcModule.getFixedCoinAmount({
        txb: tx,
        address: this.sdk.senderAddress,
        coinType: typeArguments[0],
        amount: toDecimalsAmount(amountIn, collateralCoinDecimals),
      });

      const triggerPriceWithAmplificationMultiplier =
        HertzflowCalc.calculateAmplificationPrice({
          originPrice: triggerPrice,
          coinDecimals: indexCoinDecimals,
        });
      let _baseCollateralUsdBn: BigNumber;
      if (isLong) {
        const _unitIndexCoinPriceWithPriceDecimals =
          HertzflowCalc.calculateUnitCoinPriceWithPriceDecimals({
            coinPrice: triggerPrice,
            coinDecimals: indexCoinDecimals,
          });
        _baseCollateralUsdBn = new BigNumber(
          toDecimalsAmount(amountIn, collateralCoinDecimals),
        ).times(_unitIndexCoinPriceWithPriceDecimals);
      } else {
        const _unitCollateralCoinPriceWithPriceDecimals =
          HertzflowCalc.calculateUnitCoinPriceWithPriceDecimals({
            coinPrice: collateralCoinPrice,
            coinDecimals: collateralCoinDecimals,
          });

        _baseCollateralUsdBn = new BigNumber(
          toDecimalsAmount(amountIn, collateralCoinDecimals),
        ).times(_unitCollateralCoinPriceWithPriceDecimals);
      }

      const { openFee } = this.sdk.QueryModule.calculateOpenFeeInfo({
        protocolStore: protocolStore,
        collateralUsdValue: _baseCollateralUsdBn,
        leverage,
      });
      const { effectiveSizeUsdIntegerValue } =
        this.sdk.QueryModule.calculateEffectiveSizeAndCollateralUsdValue({
          baseCollateralUsdBn: _baseCollateralUsdBn,
          leverage,
          borrowFee,
          openFee,
        });

      tx.moveCall({
        package: this.sdk.sdkOptions.packageId,
        module: CONTRACT_MODULE.VAULT,
        function: CONTRACT_FUNCTION['vault'].INCREASE_ORDER,
        arguments: [
          tx.object(this.sdk.sdkOptions.vault.package_id),
          tx.object(this.sdk.sdkOptions.protocolStore.package_id),
          tx.object(this.sdk.sdkOptions.oracleStore.package_id),
          tx.object(this.sdk.sdkOptions.version.package_id),
          tx.object(positionId),
          collateralCoinObject,
          tx.pure.u64(amountInWithDecimalIntegerValue),
          tx.pure.u128(effectiveSizeUsdIntegerValue),
          tx.pure.bool(isLong),
          tx.pure.u128(triggerPriceWithAmplificationMultiplier),
          tx.pure.bool(triggerAboveThreshold),
          tx.object(COMMON_CONSTS.CLOCK_ID),
        ],
        typeArguments,
      });

      tx.transferObjects([collateralCoinObject], this.sdk.senderAddress);
    };
  }

  public createIncreasePositionRequestWithPositionPayload(
    params: IncreasePositionRequestWithPositionParams,
  ) {
    return async (tx: Transaction) => {
      const {
        protocolStore,
        positionId,
        amountIn,
        isLong,
        leverage,
        borrowFee,
        slippage,
        typeArguments,
        indexCoinMarketPrice,
        indexCoinDecimals,
        collateralCoinMarketPrice,
        collateralCoinDecimals,
        payCoinDecimals,
      } = params;

      const _typeArgumentsForSwap = [typeArguments[0], typeArguments[1]] as [
        string,
        string,
      ];

      tx.add(this.sdk.OracleModule.updateWhiteListPrices());
      tx.setSender(this.sdk.senderAddress);

      const amountInWithDecimalIntegerValue =
        HertzflowCalc.calculateIntegerValueString(
          new BigNumber(toDecimalsAmount(amountIn, payCoinDecimals)),
        );

      const _queryResult = await this.sdk.QueryModule.querySwapAmountOut({
        typeArguments: _typeArgumentsForSwap,
        amountIn,
        inCoinDecimals: payCoinDecimals,
        slippage,
        protocolStore,
        outCoinPrice: collateralCoinMarketPrice,
        outCoinDecimals: collateralCoinDecimals,
      });

      const payCoinObject = this.sdk.RpcModule.getFixedCoinAmount({
        txb: tx,
        address: this.sdk.senderAddress,
        coinType: typeArguments[0],
        amount: toDecimalsAmount(amountIn, payCoinDecimals),
      });

      const acceptablePriceIntegerValue =
        HertzflowCalc.calculateAcceptablePrice({
          coinPrice: indexCoinMarketPrice,
          coinDecimals: indexCoinDecimals,
          isLong,
          slippage,
          operationType: 'increase',
        });

      const _unitCollateralCoinPriceWithPriceDecimals =
        HertzflowCalc.calculateUnitCoinPriceWithPriceDecimals({
          coinPrice: collateralCoinMarketPrice,
          coinDecimals: collateralCoinDecimals,
        });

      const _baseCollateralUsdBn = new BigNumber(
        _queryResult.amountOutAfterFee,
      ).times(_unitCollateralCoinPriceWithPriceDecimals);

      const { openFee } = this.sdk.QueryModule.calculateOpenFeeInfo({
        protocolStore: protocolStore,
        collateralUsdValue: _baseCollateralUsdBn,
        leverage,
      });

      const { effectiveSizeUsdIntegerValue } =
        this.sdk.QueryModule.calculateEffectiveSizeAndCollateralUsdValue({
          baseCollateralUsdBn: _baseCollateralUsdBn,
          leverage,
          borrowFee,
          openFee,
        });

      const minoutWithDecimalIntegerValue =
        HertzflowCalc.calculateIntegerValueString(
          new BigNumber(_queryResult.amountOutAfterFeeWithSlippage),
        );

      tx.moveCall({
        package: this.sdk.sdkOptions.packageId,
        module: CONTRACT_MODULE.VAULT,
        function: CONTRACT_FUNCTION['vault'].INCREASE_POSITION_REQUEST,
        arguments: [
          tx.object(this.sdk.sdkOptions.vault.package_id),
          tx.object(this.sdk.sdkOptions.protocolStore.package_id),
          tx.object(this.sdk.sdkOptions.oracleStore.package_id),
          tx.object(this.sdk.sdkOptions.version.package_id),
          tx.object(positionId),
          payCoinObject,
          tx.pure.u64(amountInWithDecimalIntegerValue),
          tx.pure.u64(minoutWithDecimalIntegerValue),
          tx.pure.u128(effectiveSizeUsdIntegerValue),
          tx.pure.bool(isLong),
          tx.pure.u128(acceptablePriceIntegerValue),
          tx.object(COMMON_CONSTS.CLOCK_ID),
        ],
        typeArguments,
      });

      tx.transferObjects([payCoinObject], this.sdk.senderAddress);
    };
  }

  public createDecreasePositionRequestWithPositionPayload(
    params: DecreasePositionRequestWithPositionParams,
  ) {
    return async (tx: Transaction) => {
      const {
        protocolStore,
        positionId,
        sizeDelta,
        currentSize,
        currentCollateral,
        isLong,
        slippage,
        collateralCoinMarketPrice,
        collateralCoinDecimals,
        receiverCoinMarketPrice,
        receiverCoinDecimals,
        indexCoinMarketPrice,
        indexCoinDecimals,
        typeArguments,
        borrowFee,
      } = params;

      const [collateralCoin, receiverCoin] = typeArguments;

      tx.setSender(this.sdk.senderAddress);

      const acceptablePriceIntegerValue =
        HertzflowCalc.calculateAcceptablePrice({
          coinPrice: indexCoinMarketPrice,
          coinDecimals: indexCoinDecimals,
          isLong,
          slippage,
          operationType: 'decrease',
        });

      const _sizeDeltaWithDecimal = new BigNumber(
        toDecimalsAmount(sizeDelta, PRICE_MULTIPLIER_DECIMAL),
      );
      const _currentSizeWithDecimal = new BigNumber(
        toDecimalsAmount(currentSize, PRICE_MULTIPLIER_DECIMAL),
      );
      const _currentCollateralWithDecimal = new BigNumber(
        toDecimalsAmount(currentCollateral, PRICE_MULTIPLIER_DECIMAL),
      );

      const sizeDeltaWithDecimalIntegerValue =
        HertzflowCalc.calculateIntegerValueString(_sizeDeltaWithDecimal);

      const { originCollateralDelta, collateralDeltaIntegerValue } =
        HertzflowCalc.calculateCollateralDelta({
          sizeDelta: _sizeDeltaWithDecimal,
          currentSize: _currentSizeWithDecimal,
          currentCollateral: _currentCollateralWithDecimal,
        });

      const { closeFee } = this.sdk.QueryModule.calculateCloseFeeInfo({
        protocolStore: protocolStore,
        size: _sizeDeltaWithDecimal,
      });

      const needSwap = collateralCoin !== receiverCoin;

      let minOutWithDecimalIntegerValue: string;

      if (needSwap) {
        const netCollateralUsd = originCollateralDelta
          .minus(closeFee)
          .minus(borrowFee);

        const _unitCollateralCoinPriceWithPriceDecimals =
          HertzflowCalc.calculateUnitCoinPriceWithPriceDecimals({
            coinPrice: collateralCoinMarketPrice,
            coinDecimals: collateralCoinDecimals,
          });

        const collateralCoinAmount = netCollateralUsd.div(
          new BigNumber(_unitCollateralCoinPriceWithPriceDecimals),
        );

        const swapResult = await this.sdk.QueryModule.querySwapAmountOut({
          typeArguments: [collateralCoin, receiverCoin] as [string, string],
          amountIn: fromDecimalsAmount(
            collateralCoinAmount.toString(),
            collateralCoinDecimals,
          ),
          inCoinDecimals: collateralCoinDecimals,
          slippage,
          protocolStore,
          outCoinPrice: receiverCoinMarketPrice,
          outCoinDecimals: receiverCoinDecimals,
        });

        minOutWithDecimalIntegerValue =
          HertzflowCalc.calculateIntegerValueString(
            new BigNumber(swapResult.amountOutAfterFeeWithSlippage),
          );
      } else {
        minOutWithDecimalIntegerValue = ZERO_STR;
      }

      tx.moveCall({
        package: this.sdk.sdkOptions.packageId,
        module: CONTRACT_MODULE.VAULT,
        function: CONTRACT_FUNCTION['vault'].DECREASE_POSITION_REQUEST,
        arguments: [
          tx.object(this.sdk.sdkOptions.vault.package_id),
          tx.object(this.sdk.sdkOptions.protocolStore.package_id),
          tx.object(this.sdk.sdkOptions.version.package_id),
          tx.object(positionId),
          tx.pure.u64(minOutWithDecimalIntegerValue),
          tx.pure.u128(collateralDeltaIntegerValue),
          tx.pure.u128(sizeDeltaWithDecimalIntegerValue),
          tx.pure.u128(acceptablePriceIntegerValue),
          tx.object(COMMON_CONSTS.CLOCK_ID),
        ],
        typeArguments: [receiverCoin],
      });
    };
  }

  public createAddMarginPayload(params: AddMarginParams) {
    return async (tx: Transaction) => {
      const {
        protocolStore,
        positionId,
        amountIn,
        isLong,
        slippage,
        collateralCoinMarketPrice,
        collateralCoinDecimals,
        indexCoinMarketPrice,
        indexCoinDecimals,
        payCoinDecimals,
        typeArguments,
      } = params;

      const _typeArgumentsForSwap = [typeArguments[0], typeArguments[1]] as [
        string,
        string,
      ];
      const _queryResult = await this.sdk.QueryModule.querySwapAmountOut({
        typeArguments: _typeArgumentsForSwap,
        amountIn,
        inCoinDecimals: payCoinDecimals,
        slippage,
        protocolStore,
        outCoinPrice: collateralCoinMarketPrice,
        outCoinDecimals: collateralCoinDecimals,
      });

      const newTx = tx || new Transaction();
      newTx.add(this.sdk.OracleModule.updateWhiteListPrices());
      newTx.setSender(this.sdk.senderAddress);

      const amountInWithDecimalIntegerValue =
        HertzflowCalc.calculateIntegerValueString(
          new BigNumber(toDecimalsAmount(amountIn, payCoinDecimals)),
        );

      const minoutWithDecimalIntegerValue =
        HertzflowCalc.calculateIntegerValueString(
          new BigNumber(_queryResult.amountOutAfterFeeWithSlippage),
        );

      const payCoinObject = this.sdk.RpcModule.getFixedCoinAmount({
        txb: tx,
        address: this.sdk.senderAddress,
        coinType: typeArguments[0],
        amount: toDecimalsAmount(amountIn, payCoinDecimals),
      });

      const acceptablePriceIntegerValue =
        HertzflowCalc.calculateAcceptablePrice({
          coinPrice: indexCoinMarketPrice,
          coinDecimals: indexCoinDecimals,
          isLong,
          slippage,
          operationType: 'increase',
        });

      const ZERO_SIZE_DELTA = ZERO.toString(10);
      tx.moveCall({
        package: this.sdk.sdkOptions.packageId,
        module: CONTRACT_MODULE.VAULT,
        function: CONTRACT_FUNCTION['vault'].INCREASE_POSITION_REQUEST,
        arguments: [
          tx.object(this.sdk.sdkOptions.vault.package_id),
          tx.object(this.sdk.sdkOptions.protocolStore.package_id),
          tx.object(this.sdk.sdkOptions.oracleStore.package_id),
          tx.object(this.sdk.sdkOptions.version.package_id),
          tx.object(positionId),
          payCoinObject,
          tx.pure.u64(amountInWithDecimalIntegerValue),
          tx.pure.u64(minoutWithDecimalIntegerValue),
          tx.pure.u128(ZERO_SIZE_DELTA),
          tx.pure.bool(isLong),
          tx.pure.u128(acceptablePriceIntegerValue),
          tx.object(COMMON_CONSTS.CLOCK_ID),
        ],
        typeArguments,
      });

      tx.transferObjects([payCoinObject], this.sdk.senderAddress);
    };
  }

  public createReduceMarginPayload(params: ReduceMarginParams) {
    return (tx: Transaction) => {
      const {
        positionId,
        isLong,
        slippage,
        collateralDelta,
        receiverCoinMarketPrice,
        receiverCoinDecimals,
        indexCoinMarketPrice,
        indexCoinDecimals,
        typeArguments,
      } = params;

      tx.add(this.sdk.OracleModule.updateWhiteListPrices());
      tx.setSender(this.sdk.senderAddress);

      const acceptablePriceIntegerValue =
        HertzflowCalc.calculateAcceptablePrice({
          coinPrice: indexCoinMarketPrice,
          coinDecimals: indexCoinDecimals,
          isLong,
          slippage,
          operationType: 'decrease',
        });
      const _unitReceiverCoinPriceWithPriceDecimals =
        HertzflowCalc.calculateUnitCoinPriceWithPriceDecimals({
          coinPrice: receiverCoinMarketPrice,
          coinDecimals: receiverCoinDecimals,
        });

      const ZERO_SIZE_DELTA = ZERO.toString(10);
      const _collateralDeltaWithDecimal = new BigNumber(
        toDecimalsAmount(collateralDelta, PRICE_MULTIPLIER_DECIMAL),
      );
      const collateralDeltaWithDecimalIntegerValue =
        HertzflowCalc.calculateIntegerValueString(_collateralDeltaWithDecimal);

      const slippageAdjustedPrice = new BigNumber(
        _unitReceiverCoinPriceWithPriceDecimals,
      ).times(new BigNumber(1).plus(new BigNumber(slippage)));

      const minOutWithDecimalIntegerValue =
        HertzflowCalc.calculateIntegerValueString(
          new BigNumber(_collateralDeltaWithDecimal).div(slippageAdjustedPrice),
        );

      tx.moveCall({
        package: this.sdk.sdkOptions.packageId,
        module: CONTRACT_MODULE.VAULT,
        function: CONTRACT_FUNCTION['vault'].DECREASE_POSITION_REQUEST,
        arguments: [
          tx.object(this.sdk.sdkOptions.vault.package_id),
          tx.object(this.sdk.sdkOptions.protocolStore.package_id),
          tx.object(this.sdk.sdkOptions.version.package_id),
          tx.object(positionId),
          tx.pure.u64(minOutWithDecimalIntegerValue),
          tx.pure.u128(collateralDeltaWithDecimalIntegerValue),
          tx.pure.u128(ZERO_SIZE_DELTA),
          tx.pure.u128(acceptablePriceIntegerValue),
          tx.object(COMMON_CONSTS.CLOCK_ID),
        ],
        typeArguments,
      });
    };
  }
}
