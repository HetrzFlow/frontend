import { normalizeStructTag, SUI_TYPE_ARG } from '@mysten/sui/utils';

// market price
export const MARKET_PX = '-1';

// network fee coin
export const NETWORK_FEE_COIN = normalizeStructTag('0x2::sui::SUI');
export const NORMALIZED_SUI_TYPE_ARG = normalizeStructTag(SUI_TYPE_ARG);

// color_up, color_down
export const COLOR_UP_DOWN = ['#00c7d2', '#FC495C']; // '#2ebd85', f6465d
export const DARK_COLOR_UP_DOWN = ['#00dfeb', '#FC495C']; // #32d695, ff4c61

// swap price decimal
// TODO: need to modify for limit swap
export const SWAP_PX_DECIMAL = 6;

// min residual collateral usd
export const MIN_RESIDUAL_COLLATERAL = 10;

// max order count for single market
export const MAX_ORDER_COUNT_SINGLE_MARKET = 20;
