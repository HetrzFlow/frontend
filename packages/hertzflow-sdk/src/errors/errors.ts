export enum CustomErrorCode {
  AmountTooSmall = 'AmountTooSmall',
  NoCoinFound = 'NoCoinFound',
  InsufficientBalance = 'InsufficientBalance',
  InvalidInput = 'InvalidInput',
  CollateralBelowMinimum = 'CollateralBelowMinimum',
}

export enum TypesErrorCode {
  InvalidType = `InvalidType`,
}

export enum UtilsErrorCode {
  InvalidSendAddress = `InvalidSendAddress`,
  InvalidRecipientAddress = `InvalidRecipientAddress`,
  InvalidRecipientAndAmountLength = `InvalidRecipientAndAmountLength`,
  InsufficientBalance = `InsufficientBalance`,
  InvalidTarget = `InvalidTarget`,
  InvalidTransactionBuilder = `InvalidTransactionBuilder`,
  InvalidPrivateKeyForTest = `InvalidPrivateKeyForTest`,
}

export enum MathErrorCode {
  IntegerDowncastOverflow = `IntegerDowncastOverflow`,
  MulOverflow = `MultiplicationOverflow`,
  MulDivOverflow = `MulDivOverflow`,
  MulShiftRightOverflow = `MulShiftRightOverflow`,
  MulShiftLeftOverflow = `MulShiftLeftOverflow`,
  DivideByZero = `DivideByZero`,
  UnsignedIntegerOverflow = `UnsignedIntegerOverflow`,
  InvalidCoinAmount = `InvalidCoinAmount`,
  InvalidLiquidityAmount = `InvalidLiquidityAmount`,
  InvalidReserveAmount = `InvalidReserveAmount`,
  InvalidSqrtPrice = `InvalidSqrtPrice`,
  NotSupportedThisCoin = `NotSupportedThisCoin`,
  InvalidTwoTickIndex = `InvalidTwoTickIndex`,
}

export enum FetchErrorCode {
  FailedToFetchData = `FailedToFetchData`,
}

export type HertzflowErrorCode =
  | CustomErrorCode
  | TypesErrorCode
  | UtilsErrorCode
  | MathErrorCode
  | FetchErrorCode;

export class HertzflowError extends Error {
  override message: string;

  errorCode?: HertzflowErrorCode;

  constructor(message: string, errorCode?: HertzflowErrorCode) {
    super(message);
    this.message = message;
    this.errorCode = errorCode;
  }

  static isHertzflowErrorCode(e: any, code: HertzflowErrorCode): boolean {
    return e instanceof HertzflowError && e.errorCode === code;
  }
}
