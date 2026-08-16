export * from '@hertzflow/sdk-v2/types/fees';

export {
  getExecutionFee,
  // Market token
  estimateExecuteDepositGasLimit,
  estimateExecuteWithdrawalGasLimit,
  // HLV
  estimateExecuteHlvDepositGasLimit as estimateExecuteHzvDepositGasLimit,
  estimateExecuteHlvWithdrawalGasLimit as estimateExecuteHzvWithdrawalGasLimit,
} from '@hertzflow/sdk-v2/utils/fees/executionFee';

export {
  // Market token
  estimateDepositOraclePriceCount,
  estimateWithdrawalOraclePriceCount,
  // HLV
  estimateHlvDepositOraclePriceCount as estimateHzvDepositOraclePriceCount,
  estimateHlvWithdrawalOraclePriceCount as estimateHzvWithdrawalOraclePriceCount,
} from '@hertzflow/sdk-v2/utils/fees/estimateOraclePriceCount';
