export type ClaimableData = {
  amount: string;
  market_address: string;
  symbol: string;
  token_address: string;
  time_key: number;
  factor: string;
  factor_by_time: string;
  reduction_factor: string;
};

export type AllClaimableCollaterals = {
  claimable_price_impact: ClaimableData[];
  total_claimed_usd: string;
};

export type ClaimDetailType = {
  amount: string;
  amount_usd: string;
  claim_type: 'funding_fees' | 'collateral';
  is_long: boolean;
  log_index: number;
  market: string;
  market_symbol: string;
  token: string;
};

export type UserClaimHistoryFlat = {
  amount: string;
  amount_usd: string;
  claim_time_ms: number;
  claim_type: 'funding_fees' | 'collateral';
  market_address: string;
  market_symbol: string;
  token_address: string;
  tx_hash: string;
};

export type UserClaimHistory =
  | {
      claim_time_ms: number;
      tx_hash: string;
      details: ClaimDetailType[];
      market_symbols: string[];
      total_amount_usd: string;
      total_claim_count: number;
    }
  | UserClaimHistoryFlat;

export type TradeType =
  | 'market'
  | 'limit'
  | 'take_profit'
  | 'stop_loss'
  | 'liquidated';

export type ActivityActionType =
  | 'market_open'
  | 'market_increase'
  | 'market_close'
  | 'market_decrease'
  | 'deposit'
  | 'withdrawal'
  | 'failed_market_open'
  | 'failed_market_increase'
  | 'failed_market_close'
  | 'failed_market_decrease'
  | 'failed_deposit'
  | 'failed_withdrawal'
  | 'limit_open'
  | 'limit_increase'
  | 'created_limit'
  | 'updated_limit'
  | 'failed_limit'
  | 'cancelled_limit'
  | 'tp_close'
  | 'tp_decrease'
  | 'created_tp'
  | 'updated_tp'
  | 'failed_tp'
  | 'cancelled_tp'
  | 'sl_close'
  | 'sl_decrease'
  | 'created_sl'
  | 'updated_sl'
  | 'failed_sl'
  | 'cancelled_sl'
  | 'liquidated';

export type PnlDetailInfo = {
  initial_collateral_amount: string;
  gross_pnl: string;
  loss_rebate: string;
  fees: string;
  price_impact: string;
  liquidation_fee?: string;
  loss_rebate_factor?: string;
  profit_sharing?: string;
};

export type LossRebateInfo = {
  is_weak_side: boolean;
  loss_rebate_factor: string;
  pending_lr_usd: string;
  actual_rebate_usd: string;
};

export type UserTradeActivityItem = {
  market: string;
  market_symbol: string;
  is_long: boolean;
  direction: 'long' | 'short';
  is_zfp: boolean;
  leverage?: string;
  trade_type: TradeType;
  action_type: ActivityActionType;
  display_action: string;
  size_delta_usd: string;
  size_delta_tokens?: string;
  size_in_usd?: string;
  size_in_tokens?: string;
  collateral_token: string;
  collateral_delta_amount: string;
  collateral_token_price_min?: string;
  collateral_token_price_max?: string;
  entry_price: string | null;
  exit_price: string | null;
  execution_price?: string | null;
  index_token_price_min?: string;
  index_token_price_max?: string;
  pnl_detail?: PnlDetailInfo;
  loss_rebate_info?: LossRebateInfo;
  order_status?: string;
  cancel_reason?: string;
  trigger_price?: string;
  action_time_ms: number;
  tx_hash: string;
  log_index: number;
  block_number: number;
  order_key: string;
  position_key?: string;
  user_address?: string;
  is_credit_market?: boolean;
};

export type PlatformTradeItem = {
  action_type: string;
  action: string;
  market: string;
  market_symbol: string;
  is_long: boolean;
  direction: string;
  position_mode?: string;
  is_zfp?: boolean;
  leverage?: string;
  trade_type: string;
  display_action: string;
  size_delta_usd: string;
  size_delta_tokens?: string;
  size_in_usd?: string;
  size_in_tokens?: string;
  collateral_token: string;
  collateral_delta_amount: string;
  collateral_token_price_min?: string;
  collateral_token_price_max?: string;
  index_token_price_min?: string;
  index_token_price_max?: string;
  entry_price?: string;
  exit_price?: string;
  execution_price?: string;
  pnl_detail?: PnlDetailInfo;
  loss_rebate_info?: LossRebateInfo;
  timestamp: number;
  tx_hash: string;
  log_index: number;
  block_number: number;
  order_key: string;
  position_key?: string;
  user_address?: string;
  is_credit_market?: boolean;
};
