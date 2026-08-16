import { normalizeStructTag, SUI_TYPE_ARG } from '@mysten/sui/utils';

// market price
export const MARKET_PX = '-1';

// network fee coin
export const NETWORK_FEE_COIN = normalizeStructTag('0x2::sui::SUI');
export const NORMALIZED_SUI_TYPE_ARG = normalizeStructTag(SUI_TYPE_ARG);

// swap price decimal
// TODO: hard code
export const SWAP_PX_DECIMAL = 6;

// min residual collateral
export const MIN_RESIDUAL_COLLATERAL = 10;
