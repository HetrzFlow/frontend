export type ERC20Address = string & { __brand: "ERC20Address" };
export type NativeTokenSupportedAddress = string & { __brand: "NativeTokenSupportedAddress" };

export type TokenAddressTypesMap = {
  wrapped: ERC20Address;
  native: NativeTokenSupportedAddress;
};

export type ContractPrice = bigint & { __brand: "contractPrice" };

export type TokenCategory = "meme" | "layer1" | "layer2" | "defi";

// Static token data
export type Token = {
  name: string;
  symbol: string;
  assetSymbol?: string;
  baseSymbol?: string;
  decimals: number;
  address: string;
  priceDecimals?: number;
  visualMultiplier?: number;
  visualPrefix?: string;
  wrappedAddress?: string;
  categories?: TokenCategory[];
  isPermitSupported?: boolean;
  isPermitDisabled?: boolean;
  contractVersion?: string;

  isNative?: boolean;
  isWrapped?: boolean;
  isShortable?: boolean;
  isStable?: boolean;
  isSynthetic?: boolean;
  isChartDisabled?: boolean;
  isStaking?: boolean;
  shouldResetAllowance?: boolean;
};

export type SignedTokenPermit = {
  // account address
  owner: string;
  // spender contract address
  spender: string;
  // amount
  value: bigint;
  // validity period of the permit
  deadline: bigint;
  // ECDSA signature components
  v: number;
  r: string;
  s: string;
  // token address
  token: string;
  onchainParams: {
    name: string;
    version: string;
    nonce: bigint;
  };
};

export type TokenPrices = {
  symbol?: string;
  minPrice: bigint;
  maxPrice: bigint;
};

export type TokenAsyncData = {
  // prices: TokenPrices;
  isHfAccount?: boolean;
  walletBalance?: bigint;
  hfAccountBalance?: bigint;
  // balance?: bigint;
  // totalSupply?: bigint;
  hasPriceFeedProvider?: boolean;
};

export type TokenData = Token & TokenAsyncData;

export type ProgressiveTokenData = Token & Partial<TokenAsyncData>;

export type TokensRatio = {
  ratio: bigint;
  largestToken: Token;
  smallestToken: Token;
};

export type TokensRatioAndSlippage = TokensRatio & {
  allowedSwapSlippageBps: bigint;
  acceptablePrice: bigint;
};

export type TokenBalancesData = {
  [tokenAddress: string]: bigint;
};

export type TokenPricesData = {
  [address: string]: TokenPrices;
};

export type TokensAllowanceData = {
  [tokenAddress: string]: bigint;
};

export type TokensData = {
  [address: string]: TokenData;
};

export type ProgressiveTokensData = {
  [address: string]: ProgressiveTokenData;
};

export type RawTokenRes = {
  decimals: number;
  is_index_token: boolean;
  is_long_token: boolean;
  is_short_token: boolean;
  name: string;
  symbol: string;
  token_address: string;
};
