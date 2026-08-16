export default [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "totalClaimableCredit",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "maxClaimableCredit",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "uint256", name: "creditAmount", type: "uint256" },
    ],
    name: "previewClaim",
    outputs: [
      { internalType: "address[]", name: "previewClaimTokens", type: "address[]" },
      { internalType: "uint256[]", name: "previewTokenAmounts", type: "uint256[]" },
      { internalType: "uint256[]", name: "previewCreditAmounts", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "creditAmount", type: "uint256" }],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "claimToken", type: "address" },
      { internalType: "uint256", name: "tokenAmount", type: "uint256" },
    ],
    name: "tokenToCreditAmount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "claimToken", type: "address" },
      { internalType: "uint256", name: "creditAmount", type: "uint256" },
    ],
    name: "creditToTokenAmount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
