export default [
  {
    type: "error",
    name: "ActionAlreadySignalled",
    inputs: [],
  },
  {
    type: "error",
    name: "ActionNotSignalled",
    inputs: [],
  },
  {
    type: "error",
    name: "AdlNotEnabled",
    inputs: [],
  },
  {
    type: "error",
    name: "AdlNotRequired",
    inputs: [
      {
        name: "pnlToPoolFactor",
        type: "int256",
        internalType: "int256",
      },
      {
        name: "maxPnlFactorForAdl",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "ArrayOutOfBoundsBytes",
    inputs: [
      {
        name: "values",
        type: "bytes[]",
        internalType: "bytes[]",
      },
      {
        name: "index",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
    ],
  },
  {
    type: "error",
    name: "ArrayOutOfBoundsUint256",
    inputs: [
      {
        name: "values",
        type: "uint256[]",
        internalType: "uint256[]",
      },
      {
        name: "index",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
    ],
  },
  {
    type: "error",
    name: "AttemptedBridgeAmountTooHigh",
    inputs: [
      {
        name: "minRequiredFeeAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "feeAmountCurrentChain",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "amountToBridgeOut",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "BlockNumbersNotSorted",
    inputs: [
      {
        name: "minOracleBlockNumber",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "prevMinOracleBlockNumber",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "BridgeOutNotSupportedDuringShift",
    inputs: [],
  },
  {
    type: "error",
    name: "BridgedAmountNotSufficient",
    inputs: [
      {
        name: "minRequiredFeeAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "currentChainFeeAmount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "BridgingBalanceArrayMismatch",
    inputs: [
      {
        name: "balancesLength",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "targetBalancesLength",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "BridgingTransactionFailed",
    inputs: [
      {
        name: "result",
        type: "bytes",
        internalType: "bytes",
      },
    ],
  },
  {
    type: "error",
    name: "ChainlinkPriceFeedNotUpdated",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
      {
        name: "timestamp",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "heartbeatDuration",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "CollateralAlreadyClaimed",
    inputs: [
      {
        name: "adjustedClaimableAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "claimedAmount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "CompactedArrayOutOfBounds",
    inputs: [
      {
        name: "compactedValues",
        type: "uint256[]",
        internalType: "uint256[]",
      },
      {
        name: "index",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "slotIndex",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
    ],
  },
  {
    type: "error",
    name: "ConfigValueExceedsAllowedRange",
    inputs: [
      {
        name: "baseKey",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "value",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "CreReceiverCallFailed",
    inputs: [
      {
        name: "data",
        type: "bytes",
        internalType: "bytes",
      },
    ],
  },
  {
    type: "error",
    name: "CreditClaimAmountPrecisionLoss",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
      {
        name: "creditAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "tokenAmount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "CreditClaimAmountTooSmall",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
      {
        name: "creditAmount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "CreditClaimReserveInsufficient",
    inputs: [
      {
        name: "availableCreditAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "requiredCreditAmount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "CreditClaimTokenBankMismatch",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
      {
        name: "bank",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "CreditClaimTokenHasOutstandingClaimable",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
      {
        name: "outstandingAmount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "CreditClaimTokenNotSet",
    inputs: [],
  },
  {
    type: "error",
    name: "CreditClaimTokenNotSupported",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "CreditClaimTokenRateNotSet",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "CreditClaimTokenReserveInsufficient",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
      {
        name: "availableAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "requiredAmount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "CreditClaimableExceeded",
    inputs: [
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "claimable",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "CreditDistributorDisabled",
    inputs: [],
  },
  {
    type: "error",
    name: "CreditDistributorNothingToClaim",
    inputs: [],
  },
  {
    type: "error",
    name: "CreditFeeClaimVaultNotSet",
    inputs: [],
  },
  {
    type: "error",
    name: "CreditHFBankFactoryNotSet",
    inputs: [],
  },
  {
    type: "error",
    name: "CreditPayoutTokenNotSet",
    inputs: [],
  },
  {
    type: "error",
    name: "CreditProfitClaimVaultNotSet",
    inputs: [],
  },
  {
    type: "error",
    name: "DataListLengthExceeded",
    inputs: [],
  },
  {
    type: "error",
    name: "DataStreamIdAlreadyExistsForToken",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "DeadlinePassed",
    inputs: [
      {
        name: "currentTimestamp",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "deadline",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "DepositNotFound",
    inputs: [
      {
        name: "key",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
  },
  {
    type: "error",
    name: "DisabledFeature",
    inputs: [
      {
        name: "key",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
  },
  {
    type: "error",
    name: "DisabledMarket",
    inputs: [
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "DisproportionalZFPCollateralWithdraw",
    inputs: [
      {
        name: "collateralDeltaAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "sizeDeltaUsd",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "collateralAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "sizeInUsd",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "DuplicateClaimTerms",
    inputs: [
      {
        name: "existingDistributionId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "DuplicatedIndex",
    inputs: [
      {
        name: "index",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
    ],
  },
  {
    type: "error",
    name: "DuplicatedMarketInSwapPath",
    inputs: [
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "EdgeDataStreamIdAlreadyExistsForToken",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "EmptyAccount",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyAddressInMarketTokenBalanceValidation",
    inputs: [
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "EmptyAmount",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyChainlinkPriceFeed",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "EmptyChainlinkPriceFeedMultiplier",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "EmptyClaimFeesMarket",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyClaimableAmount",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "EmptyCreditProfitAmount",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyCreditSwapAmount",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyDataStreamFeedId",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "EmptyDataStreamMultiplier",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "EmptyDeposit",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyDepositAmounts",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyDepositAmountsAfterSwap",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyFundingAccount",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyHlv",
    inputs: [
      {
        name: "hlv",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "EmptyHlvDeposit",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyHlvDepositAmounts",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyHlvMarketAmount",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyHlvTokenSupply",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyHlvWithdrawal",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyHlvWithdrawalAmount",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyHoldingAddress",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyMarket",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyMarketPrice",
    inputs: [
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "EmptyMarketTokenSupply",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyMultichainTransferInAmount",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address",
      },
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "EmptyMultichainTransferOutAmount",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address",
      },
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "EmptyOrder",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyPeer",
    inputs: [
      {
        name: "eid",
        type: "uint32",
        internalType: "uint32",
      },
    ],
  },
  {
    type: "error",
    name: "EmptyPosition",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyPositionImpactWithdrawalAmount",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyPrimaryPrice",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "EmptyReceiver",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyReduceLentAmount",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyRelayFeeAddress",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyShift",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyShiftAmount",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptySizeDeltaInTokens",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyTarget",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyToken",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyTokenTranferGasLimit",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "EmptyValidatedPrices",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyWithdrawal",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyWithdrawalAmount",
    inputs: [],
  },
  {
    type: "error",
    name: "EndOfOracleSimulation",
    inputs: [],
  },
  {
    type: "error",
    name: "EventItemNotFound",
    inputs: [
      {
        name: "key",
        type: "string",
        internalType: "string",
      },
    ],
  },
  {
    type: "error",
    name: "ExternalCallFailed",
    inputs: [
      {
        name: "data",
        type: "bytes",
        internalType: "bytes",
      },
    ],
  },
  {
    type: "error",
    name: "FeeDistributionAlreadyCompleted",
    inputs: [
      {
        name: "lastDistributionTime",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "startOfCurrentWeek",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "HlvAlreadyExists",
    inputs: [
      {
        name: "salt",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "hlv",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "HlvDepositNotFound",
    inputs: [
      {
        name: "key",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
  },
  {
    type: "error",
    name: "HlvDisabledMarket",
    inputs: [
      {
        name: "hlv",
        type: "address",
        internalType: "address",
      },
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "HlvEnabledMarket",
    inputs: [
      {
        name: "hlv",
        type: "address",
        internalType: "address",
      },
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "HlvInsufficientMarketTokenBalance",
    inputs: [
      {
        name: "hlv",
        type: "address",
        internalType: "address",
      },
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
      {
        name: "marketTokenBalance",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "marketTokenAmount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "HlvInvalidLongToken",
    inputs: [
      {
        name: "hlv",
        type: "address",
        internalType: "address",
      },
      {
        name: "provided",
        type: "address",
        internalType: "address",
      },
      {
        name: "expected",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "HlvInvalidShortToken",
    inputs: [
      {
        name: "hlv",
        type: "address",
        internalType: "address",
      },
      {
        name: "provided",
        type: "address",
        internalType: "address",
      },
      {
        name: "expected",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "HlvMarketAlreadyExists",
    inputs: [
      {
        name: "hlv",
        type: "address",
        internalType: "address",
      },
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "HlvMaxMarketCountExceeded",
    inputs: [
      {
        name: "hlv",
        type: "address",
        internalType: "address",
      },
      {
        name: "hlvMaxMarketCount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "HlvMaxMarketTokenBalanceAmountExceeded",
    inputs: [
      {
        name: "hlv",
        type: "address",
        internalType: "address",
      },
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
      {
        name: "maxMarketTokenBalanceAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "marketTokenBalanceAmount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "HlvMaxMarketTokenBalanceUsdExceeded",
    inputs: [
      {
        name: "hlv",
        type: "address",
        internalType: "address",
      },
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
      {
        name: "maxMarketTokenBalanceUsd",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "marketTokenBalanceUsd",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "HlvNameTooLong",
    inputs: [],
  },
  {
    type: "error",
    name: "HlvNegativeMarketPoolValue",
    inputs: [
      {
        name: "hlv",
        type: "address",
        internalType: "address",
      },
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "HlvNonZeroMarketBalance",
    inputs: [
      {
        name: "hlv",
        type: "address",
        internalType: "address",
      },
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "HlvNotFound",
    inputs: [
      {
        name: "key",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "HlvShiftIntervalNotYetPassed",
    inputs: [
      {
        name: "currentTimestamp",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "lastHlvShiftExecutedAt",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "hlvShiftMinInterval",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "HlvShiftMaxPriceImpactExceeded",
    inputs: [
      {
        name: "effectivePriceImpactFactor",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "hlvMaxShiftPriceImpactFactor",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "HlvShiftNotFound",
    inputs: [
      {
        name: "key",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
  },
  {
    type: "error",
    name: "HlvSymbolTooLong",
    inputs: [],
  },
  {
    type: "error",
    name: "HlvUnsupportedMarket",
    inputs: [
      {
        name: "hlv",
        type: "address",
        internalType: "address",
      },
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "HlvWithdrawalNotFound",
    inputs: [
      {
        name: "key",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
  },
  {
    type: "error",
    name: "InsufficientCollateralAmount",
    inputs: [
      {
        name: "collateralAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "collateralDeltaAmount",
        type: "int256",
        internalType: "int256",
      },
    ],
  },
  {
    type: "error",
    name: "InsufficientCollateralUsd",
    inputs: [
      {
        name: "remainingCollateralUsd",
        type: "int256",
        internalType: "int256",
      },
    ],
  },
  {
    type: "error",
    name: "InsufficientExecutionFee",
    inputs: [
      {
        name: "minExecutionFee",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "executionFee",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InsufficientExecutionGas",
    inputs: [
      {
        name: "startingGas",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "estimatedGasLimit",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "minAdditionalGasForExecution",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InsufficientExecutionGasForErrorHandling",
    inputs: [
      {
        name: "startingGas",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "minHandleErrorGas",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InsufficientFee",
    inputs: [
      {
        name: "feeProvided",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "feeRequired",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InsufficientFunds",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InsufficientFundsToPayForCosts",
    inputs: [
      {
        name: "remainingCostUsd",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "step",
        type: "string",
        internalType: "string",
      },
    ],
  },
  {
    type: "error",
    name: "InsufficientGasForAutoCancellation",
    inputs: [
      {
        name: "gas",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "minHandleExecutionErrorGas",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InsufficientGasForCancellation",
    inputs: [
      {
        name: "gas",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "minHandleExecutionErrorGas",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InsufficientGasLeft",
    inputs: [
      {
        name: "gas",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "estimatedGasLimit",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InsufficientGasLeftForCallback",
    inputs: [
      {
        name: "gasToBeForwarded",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "callbackGasLimit",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InsufficientHandleExecutionErrorGas",
    inputs: [
      {
        name: "gas",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "minHandleExecutionErrorGas",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InsufficientImpactPoolValueForWithdrawal",
    inputs: [
      {
        name: "withdrawalAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "poolValue",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "totalPendingImpactAmount",
        type: "int256",
        internalType: "int256",
      },
    ],
  },
  {
    type: "error",
    name: "InsufficientMarketTokens",
    inputs: [
      {
        name: "balance",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "expected",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InsufficientMultichainBalance",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address",
      },
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
      {
        name: "balance",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InsufficientMultichainNativeFee",
    inputs: [
      {
        name: "msgValue",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InsufficientOutputAmount",
    inputs: [
      {
        name: "outputAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "minOutputAmount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InsufficientPoolAmount",
    inputs: [
      {
        name: "poolAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InsufficientRelayFee",
    inputs: [
      {
        name: "requiredRelayFee",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "availableFeeAmount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InsufficientReserve",
    inputs: [
      {
        name: "reservedUsd",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "maxReservedUsd",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InsufficientReserveForOpenInterest",
    inputs: [
      {
        name: "reservedUsd",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "maxReservedUsd",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InsufficientSwapOutputAmount",
    inputs: [
      {
        name: "outputAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "minOutputAmount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InsufficientWntAmountForExecutionFee",
    inputs: [
      {
        name: "wntAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "executionFee",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidAdl",
    inputs: [
      {
        name: "nextPnlToPoolFactor",
        type: "int256",
        internalType: "int256",
      },
      {
        name: "pnlToPoolFactor",
        type: "int256",
        internalType: "int256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidBaseKey",
    inputs: [
      {
        name: "baseKey",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidBlockRangeSet",
    inputs: [
      {
        name: "largestMinBlockNumber",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "smallestMaxBlockNumber",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidBridgeOutToken",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidCancellationReceiverForSubaccountOrder",
    inputs: [
      {
        name: "cancellationReceiver",
        type: "address",
        internalType: "address",
      },
      {
        name: "expectedCancellationReceiver",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidClaimAffiliateRewardsInput",
    inputs: [
      {
        name: "marketsLength",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "tokensLength",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidClaimCollateralInput",
    inputs: [
      {
        name: "marketsLength",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "tokensLength",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "timeKeysLength",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidClaimFundingFeesInput",
    inputs: [
      {
        name: "marketsLength",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "tokensLength",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidClaimTermsSignature",
    inputs: [
      {
        name: "recoveredSigner",
        type: "address",
        internalType: "address",
      },
      {
        name: "expectedSigner",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidClaimTermsSignatureForContract",
    inputs: [
      {
        name: "expectedSigner",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidClaimUiFeesInput",
    inputs: [
      {
        name: "marketsLength",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "tokensLength",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidClaimableFactor",
    inputs: [
      {
        name: "value",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidClaimableReductionFactor",
    inputs: [
      {
        name: "value",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidCollateralTokenForMarket",
    inputs: [
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidContributorToken",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidCreReceiverTarget",
    inputs: [
      {
        name: "target",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidCreditDistributorArrayLength",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidDataStreamBidAsk",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
      {
        name: "bid",
        type: "int192",
        internalType: "int192",
      },
      {
        name: "ask",
        type: "int192",
        internalType: "int192",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidDataStreamFeedId",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
      {
        name: "feedId",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "expectedFeedId",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidDataStreamPrices",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
      {
        name: "bid",
        type: "int192",
        internalType: "int192",
      },
      {
        name: "ask",
        type: "int192",
        internalType: "int192",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidDataStreamSpreadReductionFactor",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
      {
        name: "spreadReductionFactor",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidDecreaseOrderSize",
    inputs: [
      {
        name: "sizeDeltaUsd",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "positionSizeInUsd",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidDecreasePositionSwapType",
    inputs: [
      {
        name: "decreasePositionSwapType",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidDestinationChainId",
    inputs: [
      {
        name: "desChainId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidDistributionState",
    inputs: [
      {
        name: "distributionStateUint",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidEdgeDataStreamBidAsk",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
      {
        name: "bid",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "ask",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidEdgeDataStreamExpo",
    inputs: [
      {
        name: "expo",
        type: "int256",
        internalType: "int256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidEdgeDataStreamPrices",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
      {
        name: "bid",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "ask",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidEdgeSignature",
    inputs: [
      {
        name: "recoverError",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidEdgeSigner",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidEid",
    inputs: [
      {
        name: "eid",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidExecutionFee",
    inputs: [
      {
        name: "executionFee",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "minExecutionFee",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "maxExecutionFee",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidExecutionFeeForMigration",
    inputs: [
      {
        name: "totalExecutionFee",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "msgValue",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidExternalCallInput",
    inputs: [
      {
        name: "targetsLength",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "dataListLength",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidExternalCallTarget",
    inputs: [
      {
        name: "target",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidExternalCalls",
    inputs: [
      {
        name: "sendTokensLength",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "sendAmountsLength",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidExternalReceiversInput",
    inputs: [
      {
        name: "refundTokensLength",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "refundReceiversLength",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidFeeReceiver",
    inputs: [
      {
        name: "receiver",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidFeedPrice",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
      {
        name: "price",
        type: "int256",
        internalType: "int256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidGlpAmount",
    inputs: [
      {
        name: "totalGlpAmountToRedeem",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "totalGlpAmount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidGmMedianMinMaxPrice",
    inputs: [
      {
        name: "minPrice",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "maxPrice",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidGmOraclePrice",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidGmSignature",
    inputs: [
      {
        name: "recoveredSigner",
        type: "address",
        internalType: "address",
      },
      {
        name: "expectedSigner",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidGmSignerMinMaxPrice",
    inputs: [
      {
        name: "minPrice",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "maxPrice",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidHlvDepositInitialLongToken",
    inputs: [
      {
        name: "initialLongToken",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidHlvDepositInitialShortToken",
    inputs: [
      {
        name: "initialShortToken",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidHlvDepositSwapPath",
    inputs: [
      {
        name: "longTokenSwapPathLength",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "shortTokenSwapPathLength",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidHoldingAddress",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidInitializer",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidKeeperForFrozenOrder",
    inputs: [
      {
        name: "keeper",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidMarketTokenBalance",
    inputs: [
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
      {
        name: "balance",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "expectedMinBalance",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidMarketTokenBalanceForClaimableFunding",
    inputs: [
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
      {
        name: "balance",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "claimableFundingFeeAmount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidMarketTokenBalanceForCollateralAmount",
    inputs: [
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
      {
        name: "balance",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "collateralAmount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidMinHlvTokensForFirstHlvDeposit",
    inputs: [
      {
        name: "minHlvTokens",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "expectedMinHlvTokens",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidMinMarketTokensForFirstDeposit",
    inputs: [
      {
        name: "minMarketTokens",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "expectedMinMarketTokens",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidMinMaxForPrice",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
      {
        name: "min",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "max",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidMultichainEndpoint",
    inputs: [
      {
        name: "endpoint",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidMultichainProvider",
    inputs: [
      {
        name: "provider",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidNativeTokenSender",
    inputs: [
      {
        name: "msgSender",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidOracleProvider",
    inputs: [
      {
        name: "provider",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidOracleProviderForToken",
    inputs: [
      {
        name: "provider",
        type: "address",
        internalType: "address",
      },
      {
        name: "expectedProvider",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidOracleSetPricesDataParam",
    inputs: [
      {
        name: "tokensLength",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "dataLength",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidOracleSetPricesProvidersParam",
    inputs: [
      {
        name: "tokensLength",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "providersLength",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidOracleSigner",
    inputs: [
      {
        name: "signer",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidOrderPrices",
    inputs: [
      {
        name: "primaryPriceMin",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "primaryPriceMax",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "triggerPrice",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "orderType",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidOutputToken",
    inputs: [
      {
        name: "tokenOut",
        type: "address",
        internalType: "address",
      },
      {
        name: "expectedTokenOut",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidParams",
    inputs: [
      {
        name: "reason",
        type: "string",
        internalType: "string",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidPermitSpender",
    inputs: [
      {
        name: "spender",
        type: "address",
        internalType: "address",
      },
      {
        name: "expectedSpender",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidPoolValueForDeposit",
    inputs: [
      {
        name: "poolValue",
        type: "int256",
        internalType: "int256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidPoolValueForWithdrawal",
    inputs: [
      {
        name: "poolValue",
        type: "int256",
        internalType: "int256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidPositionImpactPoolDistributionRate",
    inputs: [
      {
        name: "distributionAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "positionImpactPoolAmount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidPositionMarket",
    inputs: [
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidPositionSizeValues",
    inputs: [
      {
        name: "sizeInUsd",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "sizeInTokens",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidPrimaryPricesForSimulation",
    inputs: [
      {
        name: "primaryTokensLength",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "primaryPricesLength",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidReceiver",
    inputs: [
      {
        name: "receiver",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidReceiverForFirstDeposit",
    inputs: [
      {
        name: "receiver",
        type: "address",
        internalType: "address",
      },
      {
        name: "expectedReceiver",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidReceiverForFirstHlvDeposit",
    inputs: [
      {
        name: "receiver",
        type: "address",
        internalType: "address",
      },
      {
        name: "expectedReceiver",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidReceiverForSubaccountOrder",
    inputs: [
      {
        name: "receiver",
        type: "address",
        internalType: "address",
      },
      {
        name: "expectedReceiver",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidRecoveredSigner",
    inputs: [
      {
        name: "signatureType",
        type: "string",
        internalType: "string",
      },
      {
        name: "recovered",
        type: "address",
        internalType: "address",
      },
      {
        name: "recoveredFromMinified",
        type: "address",
        internalType: "address",
      },
      {
        name: "expectedSigner",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidReferralRewardToken",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidSetContributorPaymentInput",
    inputs: [
      {
        name: "tokensLength",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "amountsLength",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidSetMaxTotalContributorTokenAmountInput",
    inputs: [
      {
        name: "tokensLength",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "amountsLength",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidSignature",
    inputs: [
      {
        name: "signatureType",
        type: "string",
        internalType: "string",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidSizeDeltaForAdl",
    inputs: [
      {
        name: "sizeDeltaUsd",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "positionSizeInUsd",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidSrcChainId",
    inputs: [
      {
        name: "srcChainId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidSubaccountApprovalDesChainId",
    inputs: [
      {
        name: "desChainId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidSubaccountApprovalNonce",
    inputs: [
      {
        name: "storedNonce",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "nonce",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidSubaccountApprovalSubaccount",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidSwapMarket",
    inputs: [
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidSwapOutputToken",
    inputs: [
      {
        name: "outputToken",
        type: "address",
        internalType: "address",
      },
      {
        name: "expectedOutputToken",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidTimelockDelay",
    inputs: [
      {
        name: "timelockDelay",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidToken",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidTokenIn",
    inputs: [
      {
        name: "tokenIn",
        type: "address",
        internalType: "address",
      },
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidTransferRequestsLength",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidTrustedSignerAddress",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidUiFeeFactor",
    inputs: [
      {
        name: "uiFeeFactor",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "maxUiFeeFactor",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidUserDigest",
    inputs: [
      {
        name: "digest",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
  },
  {
    type: "error",
    name: "KeeperAmountMismatch",
    inputs: [
      {
        name: "wntForKeepers",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "wntToKeepers",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "KeeperArrayLengthMismatch",
    inputs: [
      {
        name: "keepersLength",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "keeperTargetBalancesLength",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "keeperVersionsLength",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "LiquidatablePosition",
    inputs: [
      {
        name: "reason",
        type: "string",
        internalType: "string",
      },
      {
        name: "remainingCollateralUsd",
        type: "int256",
        internalType: "int256",
      },
      {
        name: "minCollateralUsd",
        type: "int256",
        internalType: "int256",
      },
      {
        name: "minCollateralUsdForLeverage",
        type: "int256",
        internalType: "int256",
      },
    ],
  },
  {
    type: "error",
    name: "LongTokensAreNotEqual",
    inputs: [
      {
        name: "fromMarketLongToken",
        type: "address",
        internalType: "address",
      },
      {
        name: "toMarketLongToken",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "MarketAlreadyExists",
    inputs: [
      {
        name: "salt",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "existingMarketAddress",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "MarketNotFound",
    inputs: [
      {
        name: "key",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "MarketZFPNotEnabled",
    inputs: [
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "MaskIndexOutOfBounds",
    inputs: [
      {
        name: "index",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
    ],
  },
  {
    type: "error",
    name: "MaxAutoCancelOrdersExceeded",
    inputs: [
      {
        name: "count",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "maxAutoCancelOrders",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "MaxCallbackGasLimitExceeded",
    inputs: [
      {
        name: "callbackGasLimit",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "maxCallbackGasLimit",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "MaxDataListLengthExceeded",
    inputs: [
      {
        name: "dataLength",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "maxDataLength",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "MaxEsHfReferralRewardsAmountExceeded",
    inputs: [
      {
        name: "tokensForReferralRewards",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "maxEsHfReferralRewards",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "MaxFundingFactorPerSecondLimitExceeded",
    inputs: [
      {
        name: "maxFundingFactorPerSecond",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "limit",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "MaxLendableFactorForWithdrawalsExceeded",
    inputs: [
      {
        name: "poolUsd",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "maxLendableUsd",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "lentUsd",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "MaxOpenInterestExceeded",
    inputs: [
      {
        name: "openInterest",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "maxOpenInterest",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "MaxOracleTimestampRangeExceeded",
    inputs: [
      {
        name: "range",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "maxRange",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "MaxPoolAmountExceeded",
    inputs: [
      {
        name: "poolAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "maxPoolAmount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "MaxPoolUsdForDepositExceeded",
    inputs: [
      {
        name: "poolUsd",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "maxPoolUsdForDeposit",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "MaxPriceAgeExceeded",
    inputs: [
      {
        name: "oracleTimestamp",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "currentTimestamp",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "MaxRefPriceDeviationExceeded",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
      {
        name: "price",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "refPrice",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "maxRefPriceDeviationFactor",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "MaxReferralRewardsExceeded",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
      {
        name: "cumulativeTransferAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "tokensForReferralRewards",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "MaxRelayFeeSwapForSubaccountExceeded",
    inputs: [
      {
        name: "feeUsd",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "maxFeeUsd",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "MaxSubaccountActionCountExceeded",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address",
      },
      {
        name: "subaccount",
        type: "address",
        internalType: "address",
      },
      {
        name: "count",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "maxCount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "MaxSwapPathLengthExceeded",
    inputs: [
      {
        name: "swapPathLengh",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "maxSwapPathLength",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "MaxTimelockDelayExceeded",
    inputs: [
      {
        name: "timelockDelay",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "MaxTotalCallbackGasLimitForAutoCancelOrdersExceeded",
    inputs: [
      {
        name: "totalCallbackGasLimit",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "maxTotalCallbackGasLimit",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "MaxTotalContributorTokenAmountExceeded",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
      {
        name: "totalAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "maxTotalAmount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "MaxWntFromTreasuryExceeded",
    inputs: [
      {
        name: "maxWntFromTreasury",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "additionalWntFromTreasury",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "MaxWntReferralRewardsInUsdAmountExceeded",
    inputs: [
      {
        name: "wntReferralRewardsInUsd",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "maxWntReferralRewardsInUsdAmount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "MaxWntReferralRewardsInUsdExceeded",
    inputs: [
      {
        name: "wntReferralRewardsInUsd",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "maxWntReferralRewardsInUsd",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "MinContributorPaymentIntervalBelowAllowedRange",
    inputs: [
      {
        name: "interval",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "MinContributorPaymentIntervalNotYetPassed",
    inputs: [
      {
        name: "minPaymentInterval",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "MinHlvTokens",
    inputs: [
      {
        name: "received",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "expected",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "MinLongTokens",
    inputs: [
      {
        name: "received",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "expected",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "MinMarketTokens",
    inputs: [
      {
        name: "received",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "expected",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "MinPositionSize",
    inputs: [
      {
        name: "positionSizeInUsd",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "minPositionSizeUsd",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "MinShortTokens",
    inputs: [
      {
        name: "received",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "expected",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "NegativeExecutionPrice",
    inputs: [
      {
        name: "executionPrice",
        type: "int256",
        internalType: "int256",
      },
      {
        name: "price",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "positionSizeInUsd",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "priceImpactUsd",
        type: "int256",
        internalType: "int256",
      },
      {
        name: "sizeDeltaUsd",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "NewVirtualMarketIdAlreadySetForMarket",
    inputs: [
      {
        name: "newVirtualMarketId",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "NewVirtualMarketIdLongTokenMismatch",
    inputs: [
      {
        name: "newVirtualMarketId",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "NewVirtualMarketIdShortTokenMismatch",
    inputs: [
      {
        name: "newVirtualMarketId",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "NonAtomicOracleProvider",
    inputs: [
      {
        name: "provider",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "NonEmptyExternalCallsForSubaccountOrder",
    inputs: [],
  },
  {
    type: "error",
    name: "NonEmptyTokensWithPrices",
    inputs: [
      {
        name: "tokensWithPricesLength",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "OldVirtualMarketIdStillInUse",
    inputs: [
      {
        name: "oldVirtualMarketId",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "remainingMarkets",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "OpenInterestCannotBeUpdatedForSwapOnlyMarket",
    inputs: [
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "OraclePriceOutdated",
    inputs: [],
  },
  {
    type: "error",
    name: "OracleProviderAlreadyExistsForToken",
    inputs: [
      {
        name: "oracle",
        type: "address",
        internalType: "address",
      },
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "OracleProviderMinChangeDelayNotYetPassed",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
      {
        name: "provider",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "OracleTimestampsAreLargerThanRequestExpirationTime",
    inputs: [
      {
        name: "maxOracleTimestamp",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "requestTimestamp",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "requestExpirationTime",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "OracleTimestampsAreSmallerThanRequired",
    inputs: [
      {
        name: "minOracleTimestamp",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "expectedTimestamp",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "OrderAlreadyFrozen",
    inputs: [],
  },
  {
    type: "error",
    name: "OrderNotFound",
    inputs: [
      {
        name: "key",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
  },
  {
    type: "error",
    name: "OrderNotFulfillableAtAcceptablePrice",
    inputs: [
      {
        name: "price",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "acceptablePrice",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "OrderNotUpdatable",
    inputs: [
      {
        name: "orderType",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "OrderTypeCannotBeCreated",
    inputs: [
      {
        name: "orderType",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "OrderValidFromTimeNotReached",
    inputs: [
      {
        name: "validFromTime",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "currentTimestamp",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "OutdatedReadResponse",
    inputs: [
      {
        name: "timestamp",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "PnlFactorExceededForLongs",
    inputs: [
      {
        name: "pnlToPoolFactor",
        type: "int256",
        internalType: "int256",
      },
      {
        name: "maxPnlFactor",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "PnlFactorExceededForShorts",
    inputs: [
      {
        name: "pnlToPoolFactor",
        type: "int256",
        internalType: "int256",
      },
      {
        name: "maxPnlFactor",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "PnlOvercorrected",
    inputs: [
      {
        name: "nextPnlToPoolFactor",
        type: "int256",
        internalType: "int256",
      },
      {
        name: "minPnlFactorForAdl",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "PositionNotFound",
    inputs: [
      {
        name: "key",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
  },
  {
    type: "error",
    name: "PositionShouldNotBeEarlyForceLiquidated",
    inputs: [
      {
        name: "positionPnlUsd",
        type: "int256",
        internalType: "int256",
      },
      {
        name: "maxProfitUsd",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "PositionShouldNotBeLiquidated",
    inputs: [
      {
        name: "reason",
        type: "string",
        internalType: "string",
      },
      {
        name: "remainingCollateralUsd",
        type: "int256",
        internalType: "int256",
      },
      {
        name: "minCollateralUsd",
        type: "int256",
        internalType: "int256",
      },
      {
        name: "minCollateralUsdForLeverage",
        type: "int256",
        internalType: "int256",
      },
    ],
  },
  {
    type: "error",
    name: "PriceAlreadySet",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
      {
        name: "minPrice",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "maxPrice",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "PriceFeedAddressNotValidForToken",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "PriceFeedAlreadyExistsForToken",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "PriceFeedDescriptionMismatchForToken",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "PriceImpactLargerThanOrderSize",
    inputs: [
      {
        name: "priceImpactUsd",
        type: "int256",
        internalType: "int256",
      },
      {
        name: "sizeDeltaUsd",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "ReductionExceedsLentAmount",
    inputs: [
      {
        name: "lentAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "totalReductionAmount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "RelayCalldataTooLong",
    inputs: [
      {
        name: "calldataLength",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "RelayEmptyBatch",
    inputs: [],
  },
  {
    type: "error",
    name: "RequestNotYetCancellable",
    inputs: [
      {
        name: "requestAge",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "requestExpirationAge",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "requestType",
        type: "string",
        internalType: "string",
      },
    ],
  },
  {
    type: "error",
    name: "SelfTransferNotSupported",
    inputs: [
      {
        name: "receiver",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "SendEthToKeeperFailed",
    inputs: [
      {
        name: "keeper",
        type: "address",
        internalType: "address",
      },
      {
        name: "sendAmount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "result",
        type: "bytes",
        internalType: "bytes",
      },
    ],
  },
  {
    type: "error",
    name: "SequencerDown",
    inputs: [],
  },
  {
    type: "error",
    name: "SequencerGraceDurationNotYetPassed",
    inputs: [
      {
        name: "timeSinceUp",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "sequencerGraceDuration",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "ShiftFromAndToMarketAreEqual",
    inputs: [
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "ShiftNotFound",
    inputs: [
      {
        name: "key",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
  },
  {
    type: "error",
    name: "ShortTokensAreNotEqual",
    inputs: [
      {
        name: "fromMarketLongToken",
        type: "address",
        internalType: "address",
      },
      {
        name: "toMarketLongToken",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "SignalTimeNotYetPassed",
    inputs: [
      {
        name: "signalTime",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "SubaccountApprovalDeadlinePassed",
    inputs: [
      {
        name: "currentTimestamp",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "deadline",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "SubaccountApprovalExpired",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address",
      },
      {
        name: "subaccount",
        type: "address",
        internalType: "address",
      },
      {
        name: "deadline",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "currentTimestamp",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "SubaccountIntegrationIdDisabled",
    inputs: [
      {
        name: "integrationId",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
  },
  {
    type: "error",
    name: "SubaccountNotAuthorized",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address",
      },
      {
        name: "subaccount",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "SwapPriceImpactExceedsAmountIn",
    inputs: [
      {
        name: "amountAfterFees",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "negativeImpactAmount",
        type: "int256",
        internalType: "int256",
      },
    ],
  },
  {
    type: "error",
    name: "SwapsNotAllowedForAtomicWithdrawal",
    inputs: [
      {
        name: "longTokenSwapPathLength",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "shortTokenSwapPathLength",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "SyncConfigInvalidInputLengths",
    inputs: [
      {
        name: "marketsLength",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "parametersLength",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "SyncConfigInvalidMarketFromData",
    inputs: [
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
      {
        name: "marketFromData",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "SyncConfigUpdatesDisabledForMarket",
    inputs: [
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "SyncConfigUpdatesDisabledForMarketParameter",
    inputs: [
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
      {
        name: "parameter",
        type: "string",
        internalType: "string",
      },
    ],
  },
  {
    type: "error",
    name: "SyncConfigUpdatesDisabledForParameter",
    inputs: [
      {
        name: "parameter",
        type: "string",
        internalType: "string",
      },
    ],
  },
  {
    type: "error",
    name: "ThereMustBeAtLeastOneRoleAdmin",
    inputs: [],
  },
  {
    type: "error",
    name: "ThereMustBeAtLeastOneTimelockMultiSig",
    inputs: [],
  },
  {
    type: "error",
    name: "TokenPermitsNotAllowedForMultichain",
    inputs: [],
  },
  {
    type: "error",
    name: "TokenTransferError",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
      {
        name: "receiver",
        type: "address",
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "TooMuchCollateralUsdForZFP",
    inputs: [
      {
        name: "remainingCollateralUsd",
        type: "int256",
        internalType: "int256",
      },
    ],
  },
  {
    type: "error",
    name: "Uint256AsBytesLengthExceeds32Bytes",
    inputs: [
      {
        name: "length",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "UnableToGetBorrowingFactorEmptyPoolUsd",
    inputs: [],
  },
  {
    type: "error",
    name: "UnableToGetCachedTokenPrice",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "UnableToGetFundingFactorEmptyOpenInterest",
    inputs: [],
  },
  {
    type: "error",
    name: "UnableToGetOppositeToken",
    inputs: [
      {
        name: "inputToken",
        type: "address",
        internalType: "address",
      },
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "UnableToPayOrderFee",
    inputs: [],
  },
  {
    type: "error",
    name: "UnableToPayOrderFeeFromCollateral",
    inputs: [],
  },
  {
    type: "error",
    name: "UnableToWithdrawCollateral",
    inputs: [
      {
        name: "estimatedRemainingCollateralUsd",
        type: "int256",
        internalType: "int256",
      },
    ],
  },
  {
    type: "error",
    name: "Unauthorized",
    inputs: [
      {
        name: "msgSender",
        type: "address",
        internalType: "address",
      },
      {
        name: "role",
        type: "string",
        internalType: "string",
      },
    ],
  },
  {
    type: "error",
    name: "UnauthorizedCreditMarketDeposit",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "UnauthorizedWorkflow",
    inputs: [
      {
        name: "workflowId",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "workflowName",
        type: "bytes10",
        internalType: "bytes10",
      },
      {
        name: "workflowOwner",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "UnauthorizedWorkflowOwner",
    inputs: [
      {
        name: "workflowOwner",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "UnexpectedBorrowingFactor",
    inputs: [
      {
        name: "positionBorrowingFactor",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "cumulativeBorrowingFactor",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "UnexpectedMarket",
    inputs: [],
  },
  {
    type: "error",
    name: "UnexpectedPoolValue",
    inputs: [
      {
        name: "poolValue",
        type: "int256",
        internalType: "int256",
      },
    ],
  },
  {
    type: "error",
    name: "UnexpectedPositionState",
    inputs: [],
  },
  {
    type: "error",
    name: "UnexpectedRelayFeeToken",
    inputs: [
      {
        name: "feeToken",
        type: "address",
        internalType: "address",
      },
      {
        name: "expectedFeeToken",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "UnexpectedRelayFeeTokenAfterSwap",
    inputs: [
      {
        name: "feeToken",
        type: "address",
        internalType: "address",
      },
      {
        name: "expectedFeeToken",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "UnexpectedSecondaryOutputInCreditMarket",
    inputs: [],
  },
  {
    type: "error",
    name: "UnexpectedTokenForVirtualInventory",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
      {
        name: "market",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "UnexpectedValidFromTime",
    inputs: [
      {
        name: "orderType",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "UnsupportedOrderType",
    inputs: [
      {
        name: "orderType",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "UnsupportedOrderTypeForAutoCancellation",
    inputs: [
      {
        name: "orderType",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "UnsupportedRelayFeeToken",
    inputs: [
      {
        name: "feeToken",
        type: "address",
        internalType: "address",
      },
      {
        name: "expectedFeeToken",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "UsdDeltaExceedsLongOpenInterest",
    inputs: [
      {
        name: "usdDelta",
        type: "int256",
        internalType: "int256",
      },
      {
        name: "longOpenInterest",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "UsdDeltaExceedsPoolValue",
    inputs: [
      {
        name: "usdDelta",
        type: "int256",
        internalType: "int256",
      },
      {
        name: "poolUsd",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "UsdDeltaExceedsShortOpenInterest",
    inputs: [
      {
        name: "usdDelta",
        type: "int256",
        internalType: "int256",
      },
      {
        name: "shortOpenInterest",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "WithdrawalNotFound",
    inputs: [
      {
        name: "key",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
  },
  {
    type: "error",
    name: "ZFPNotAllowedInCreditMarket",
    inputs: [],
  },
  {
    type: "error",
    name: "ZeroTreasuryAddress",
    inputs: [],
  },
] as const;
