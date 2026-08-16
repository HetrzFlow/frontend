export type ContractsChainConfig = {
  chainId: number;
  name: string;
  slug: string;
  nativeTokenSymbol: string;
  wrappedTokenSymbol: string;
  highExecutionFee: number;
  shouldUseMaxPriorityFeePerGas: boolean;
  defaultExecutionFeeBufferBps: number | undefined;
  /**
   * added to maxPriorityFeePerGas
   * applied to EIP-1559 transactions only
   * is not applied to execution fee calculation
   */
  maxFeePerGas: bigint | undefined;
  /**
   * that was a constant value in ethers v5, after ethers v6 migration we use it as a minimum for maxPriorityFeePerGas
   */
  maxPriorityFeePerGas: bigint;
  /**
   * added to maxPriorityFeePerGas
   * applied to EIP-1559 transactions only
   * is also applied to the execution fee calculation
   */
  gasPricePremium: bigint | undefined;
  /**
   * added to gasPrice
   * applied to *non* EIP-1559 transactions only
   *
   * it is *not* applied to the execution fee calculation, and in theory it could cause issues
   * if gas price used in the execution fee calculation is lower
   * than the gas price used in the transaction (e.g. create order transaction)
   * then the transaction will fail with InsufficientExecutionFee error.
   * it doesn't make much sense to set this buffer higher than the execution fee buffer
   * because if the paid gas price is higher than the gas price used in the execution fee calculation
   * and the transaction will still fail with InsufficientExecutionFee
   *
   * this buffer could also cause issues on a blockchain that uses passed gas price
   * especially if execution fee buffer and lower than gas price buffer defined bellow
   * */
  gasPriceBuffer: bigint | undefined;
  excessiveExecutionFee: number;
  minExecutionFee: bigint | undefined;
  isDisabled?: boolean;
  explorerUrl: string;
};
