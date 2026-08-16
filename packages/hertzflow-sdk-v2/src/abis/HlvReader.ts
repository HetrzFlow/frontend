export default [
  {
    inputs: [],
    name: "EmptyMarketTokenSupply",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "hlv",
        type: "address",
      },
      {
        internalType: "address",
        name: "market",
        type: "address",
      },
    ],
    name: "HlvNegativeMarketPoolValue",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "contract DataStore",
        name: "dataStore",
        type: "address",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "start",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "end",
        type: "uint256",
      },
    ],
    name: "getAccountHlvDeposits",
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "address",
                name: "hlv",
                type: "address",
              },
              {
                internalType: "address",
                name: "account",
                type: "address",
              },
              {
                internalType: "address",
                name: "receiver",
                type: "address",
              },
              {
                internalType: "address",
                name: "callbackContract",
                type: "address",
              },
              {
                internalType: "address",
                name: "uiFeeReceiver",
                type: "address",
              },
              {
                internalType: "address",
                name: "market",
                type: "address",
              },
              {
                internalType: "address",
                name: "initialLongToken",
                type: "address",
              },
              {
                internalType: "address",
                name: "initialShortToken",
                type: "address",
              },
              {
                internalType: "address[]",
                name: "longTokenSwapPath",
                type: "address[]",
              },
              {
                internalType: "address[]",
                name: "shortTokenSwapPath",
                type: "address[]",
              },
            ],
            internalType: "struct HlvDeposit.Addresses",
            name: "addresses",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "marketTokenAmount",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "initialLongTokenAmount",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "initialShortTokenAmount",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "minHlvTokens",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "updatedAtTime",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "executionFee",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "callbackGasLimit",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "srcChainId",
                type: "uint256",
              },
            ],
            internalType: "struct HlvDeposit.Numbers",
            name: "numbers",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "bool",
                name: "shouldUnwrapNativeToken",
                type: "bool",
              },
              {
                internalType: "bool",
                name: "isMarketTokenDeposit",
                type: "bool",
              },
            ],
            internalType: "struct HlvDeposit.Flags",
            name: "flags",
            type: "tuple",
          },
          {
            internalType: "bytes32[]",
            name: "_dataList",
            type: "bytes32[]",
          },
        ],
        internalType: "struct HlvDeposit.Props[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract DataStore",
        name: "dataStore",
        type: "address",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "start",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "end",
        type: "uint256",
      },
    ],
    name: "getAccountHlvWithdrawals",
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "address",
                name: "hlv",
                type: "address",
              },
              {
                internalType: "address",
                name: "market",
                type: "address",
              },
              {
                internalType: "address",
                name: "account",
                type: "address",
              },
              {
                internalType: "address",
                name: "receiver",
                type: "address",
              },
              {
                internalType: "address",
                name: "callbackContract",
                type: "address",
              },
              {
                internalType: "address",
                name: "uiFeeReceiver",
                type: "address",
              },
              {
                internalType: "address[]",
                name: "longTokenSwapPath",
                type: "address[]",
              },
              {
                internalType: "address[]",
                name: "shortTokenSwapPath",
                type: "address[]",
              },
            ],
            internalType: "struct HlvWithdrawal.Addresses",
            name: "addresses",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "hlvTokenAmount",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "minLongTokenAmount",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "minShortTokenAmount",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "updatedAtTime",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "executionFee",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "callbackGasLimit",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "srcChainId",
                type: "uint256",
              },
            ],
            internalType: "struct HlvWithdrawal.Numbers",
            name: "numbers",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "bool",
                name: "shouldUnwrapNativeToken",
                type: "bool",
              },
            ],
            internalType: "struct HlvWithdrawal.Flags",
            name: "flags",
            type: "tuple",
          },
          {
            internalType: "bytes32[]",
            name: "_dataList",
            type: "bytes32[]",
          },
        ],
        internalType: "struct HlvWithdrawal.Props[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract DataStore",
        name: "dataStore",
        type: "address",
      },
      {
        internalType: "address",
        name: "hlv",
        type: "address",
      },
    ],
    name: "getHlv",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "hlvToken",
            type: "address",
          },
          {
            internalType: "address",
            name: "longToken",
            type: "address",
          },
          {
            internalType: "address",
            name: "shortToken",
            type: "address",
          },
        ],
        internalType: "struct Hlv.Props",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract DataStore",
        name: "dataStore",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "salt",
        type: "bytes32",
      },
    ],
    name: "getHlvBySalt",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "hlvToken",
            type: "address",
          },
          {
            internalType: "address",
            name: "longToken",
            type: "address",
          },
          {
            internalType: "address",
            name: "shortToken",
            type: "address",
          },
        ],
        internalType: "struct Hlv.Props",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract DataStore",
        name: "dataStore",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "key",
        type: "bytes32",
      },
    ],
    name: "getHlvDeposit",
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "address",
                name: "hlv",
                type: "address",
              },
              {
                internalType: "address",
                name: "account",
                type: "address",
              },
              {
                internalType: "address",
                name: "receiver",
                type: "address",
              },
              {
                internalType: "address",
                name: "callbackContract",
                type: "address",
              },
              {
                internalType: "address",
                name: "uiFeeReceiver",
                type: "address",
              },
              {
                internalType: "address",
                name: "market",
                type: "address",
              },
              {
                internalType: "address",
                name: "initialLongToken",
                type: "address",
              },
              {
                internalType: "address",
                name: "initialShortToken",
                type: "address",
              },
              {
                internalType: "address[]",
                name: "longTokenSwapPath",
                type: "address[]",
              },
              {
                internalType: "address[]",
                name: "shortTokenSwapPath",
                type: "address[]",
              },
            ],
            internalType: "struct HlvDeposit.Addresses",
            name: "addresses",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "marketTokenAmount",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "initialLongTokenAmount",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "initialShortTokenAmount",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "minHlvTokens",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "updatedAtTime",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "executionFee",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "callbackGasLimit",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "srcChainId",
                type: "uint256",
              },
            ],
            internalType: "struct HlvDeposit.Numbers",
            name: "numbers",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "bool",
                name: "shouldUnwrapNativeToken",
                type: "bool",
              },
              {
                internalType: "bool",
                name: "isMarketTokenDeposit",
                type: "bool",
              },
            ],
            internalType: "struct HlvDeposit.Flags",
            name: "flags",
            type: "tuple",
          },
          {
            internalType: "bytes32[]",
            name: "_dataList",
            type: "bytes32[]",
          },
        ],
        internalType: "struct HlvDeposit.Props",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract DataStore",
        name: "dataStore",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "start",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "end",
        type: "uint256",
      },
    ],
    name: "getHlvDeposits",
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "address",
                name: "hlv",
                type: "address",
              },
              {
                internalType: "address",
                name: "account",
                type: "address",
              },
              {
                internalType: "address",
                name: "receiver",
                type: "address",
              },
              {
                internalType: "address",
                name: "callbackContract",
                type: "address",
              },
              {
                internalType: "address",
                name: "uiFeeReceiver",
                type: "address",
              },
              {
                internalType: "address",
                name: "market",
                type: "address",
              },
              {
                internalType: "address",
                name: "initialLongToken",
                type: "address",
              },
              {
                internalType: "address",
                name: "initialShortToken",
                type: "address",
              },
              {
                internalType: "address[]",
                name: "longTokenSwapPath",
                type: "address[]",
              },
              {
                internalType: "address[]",
                name: "shortTokenSwapPath",
                type: "address[]",
              },
            ],
            internalType: "struct HlvDeposit.Addresses",
            name: "addresses",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "marketTokenAmount",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "initialLongTokenAmount",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "initialShortTokenAmount",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "minHlvTokens",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "updatedAtTime",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "executionFee",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "callbackGasLimit",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "srcChainId",
                type: "uint256",
              },
            ],
            internalType: "struct HlvDeposit.Numbers",
            name: "numbers",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "bool",
                name: "shouldUnwrapNativeToken",
                type: "bool",
              },
              {
                internalType: "bool",
                name: "isMarketTokenDeposit",
                type: "bool",
              },
            ],
            internalType: "struct HlvDeposit.Flags",
            name: "flags",
            type: "tuple",
          },
          {
            internalType: "bytes32[]",
            name: "_dataList",
            type: "bytes32[]",
          },
        ],
        internalType: "struct HlvDeposit.Props[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract DataStore",
        name: "dataStore",
        type: "address",
      },
      {
        internalType: "address",
        name: "hlv",
        type: "address",
      },
    ],
    name: "getHlvInfo",
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "address",
                name: "hlvToken",
                type: "address",
              },
              {
                internalType: "address",
                name: "longToken",
                type: "address",
              },
              {
                internalType: "address",
                name: "shortToken",
                type: "address",
              },
            ],
            internalType: "struct Hlv.Props",
            name: "hlv",
            type: "tuple",
          },
          {
            internalType: "address[]",
            name: "markets",
            type: "address[]",
          },
        ],
        internalType: "struct HlvReader.HlvInfo",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract DataStore",
        name: "dataStore",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "start",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "end",
        type: "uint256",
      },
    ],
    name: "getHlvInfoList",
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "address",
                name: "hlvToken",
                type: "address",
              },
              {
                internalType: "address",
                name: "longToken",
                type: "address",
              },
              {
                internalType: "address",
                name: "shortToken",
                type: "address",
              },
            ],
            internalType: "struct Hlv.Props",
            name: "hlv",
            type: "tuple",
          },
          {
            internalType: "address[]",
            name: "markets",
            type: "address[]",
          },
        ],
        internalType: "struct HlvReader.HlvInfo[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract DataStore",
        name: "dataStore",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "key",
        type: "bytes32",
      },
    ],
    name: "getHlvShift",
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "address",
                name: "hlv",
                type: "address",
              },
              {
                internalType: "address",
                name: "fromMarket",
                type: "address",
              },
              {
                internalType: "address",
                name: "toMarket",
                type: "address",
              },
            ],
            internalType: "struct HlvShift.Addresses",
            name: "addresses",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "marketTokenAmount",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "minMarketTokens",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "updatedAtTime",
                type: "uint256",
              },
            ],
            internalType: "struct HlvShift.Numbers",
            name: "numbers",
            type: "tuple",
          },
        ],
        internalType: "struct HlvShift.Props",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract DataStore",
        name: "dataStore",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "start",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "end",
        type: "uint256",
      },
    ],
    name: "getHlvShifts",
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "address",
                name: "hlv",
                type: "address",
              },
              {
                internalType: "address",
                name: "fromMarket",
                type: "address",
              },
              {
                internalType: "address",
                name: "toMarket",
                type: "address",
              },
            ],
            internalType: "struct HlvShift.Addresses",
            name: "addresses",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "marketTokenAmount",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "minMarketTokens",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "updatedAtTime",
                type: "uint256",
              },
            ],
            internalType: "struct HlvShift.Numbers",
            name: "numbers",
            type: "tuple",
          },
        ],
        internalType: "struct HlvShift.Props[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract DataStore",
        name: "dataStore",
        type: "address",
      },
      {
        internalType: "address[]",
        name: "marketAddresses",
        type: "address[]",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "min",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "max",
            type: "uint256",
          },
        ],
        internalType: "struct Price.Props[]",
        name: "indexTokenPrices",
        type: "tuple[]",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "min",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "max",
            type: "uint256",
          },
        ],
        internalType: "struct Price.Props",
        name: "longTokenPrice",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "min",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "max",
            type: "uint256",
          },
        ],
        internalType: "struct Price.Props",
        name: "shortTokenPrice",
        type: "tuple",
      },
      {
        internalType: "address",
        name: "hlv",
        type: "address",
      },
      {
        internalType: "bool",
        name: "maximize",
        type: "bool",
      },
    ],
    name: "getHlvTokenPrice",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract DataStore",
        name: "dataStore",
        type: "address",
      },
      {
        internalType: "address[]",
        name: "marketAddresses",
        type: "address[]",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "min",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "max",
            type: "uint256",
          },
        ],
        internalType: "struct Price.Props[]",
        name: "indexTokenPrices",
        type: "tuple[]",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "min",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "max",
            type: "uint256",
          },
        ],
        internalType: "struct Price.Props",
        name: "longTokenPrice",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "min",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "max",
            type: "uint256",
          },
        ],
        internalType: "struct Price.Props",
        name: "shortTokenPrice",
        type: "tuple",
      },
      {
        internalType: "address",
        name: "hlv",
        type: "address",
      },
      {
        internalType: "bool",
        name: "maximize",
        type: "bool",
      },
    ],
    name: "getHlvValue",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract DataStore",
        name: "dataStore",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "key",
        type: "bytes32",
      },
    ],
    name: "getHlvWithdrawal",
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "address",
                name: "hlv",
                type: "address",
              },
              {
                internalType: "address",
                name: "market",
                type: "address",
              },
              {
                internalType: "address",
                name: "account",
                type: "address",
              },
              {
                internalType: "address",
                name: "receiver",
                type: "address",
              },
              {
                internalType: "address",
                name: "callbackContract",
                type: "address",
              },
              {
                internalType: "address",
                name: "uiFeeReceiver",
                type: "address",
              },
              {
                internalType: "address[]",
                name: "longTokenSwapPath",
                type: "address[]",
              },
              {
                internalType: "address[]",
                name: "shortTokenSwapPath",
                type: "address[]",
              },
            ],
            internalType: "struct HlvWithdrawal.Addresses",
            name: "addresses",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "hlvTokenAmount",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "minLongTokenAmount",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "minShortTokenAmount",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "updatedAtTime",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "executionFee",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "callbackGasLimit",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "srcChainId",
                type: "uint256",
              },
            ],
            internalType: "struct HlvWithdrawal.Numbers",
            name: "numbers",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "bool",
                name: "shouldUnwrapNativeToken",
                type: "bool",
              },
            ],
            internalType: "struct HlvWithdrawal.Flags",
            name: "flags",
            type: "tuple",
          },
          {
            internalType: "bytes32[]",
            name: "_dataList",
            type: "bytes32[]",
          },
        ],
        internalType: "struct HlvWithdrawal.Props",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract DataStore",
        name: "dataStore",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "start",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "end",
        type: "uint256",
      },
    ],
    name: "getHlvWithdrawals",
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "address",
                name: "hlv",
                type: "address",
              },
              {
                internalType: "address",
                name: "market",
                type: "address",
              },
              {
                internalType: "address",
                name: "account",
                type: "address",
              },
              {
                internalType: "address",
                name: "receiver",
                type: "address",
              },
              {
                internalType: "address",
                name: "callbackContract",
                type: "address",
              },
              {
                internalType: "address",
                name: "uiFeeReceiver",
                type: "address",
              },
              {
                internalType: "address[]",
                name: "longTokenSwapPath",
                type: "address[]",
              },
              {
                internalType: "address[]",
                name: "shortTokenSwapPath",
                type: "address[]",
              },
            ],
            internalType: "struct HlvWithdrawal.Addresses",
            name: "addresses",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "hlvTokenAmount",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "minLongTokenAmount",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "minShortTokenAmount",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "updatedAtTime",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "executionFee",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "callbackGasLimit",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "srcChainId",
                type: "uint256",
              },
            ],
            internalType: "struct HlvWithdrawal.Numbers",
            name: "numbers",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "bool",
                name: "shouldUnwrapNativeToken",
                type: "bool",
              },
            ],
            internalType: "struct HlvWithdrawal.Flags",
            name: "flags",
            type: "tuple",
          },
          {
            internalType: "bytes32[]",
            name: "_dataList",
            type: "bytes32[]",
          },
        ],
        internalType: "struct HlvWithdrawal.Props[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract DataStore",
        name: "dataStore",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "start",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "end",
        type: "uint256",
      },
    ],
    name: "getHlvs",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "hlvToken",
            type: "address",
          },
          {
            internalType: "address",
            name: "longToken",
            type: "address",
          },
          {
            internalType: "address",
            name: "shortToken",
            type: "address",
          },
        ],
        internalType: "struct Hlv.Props[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
