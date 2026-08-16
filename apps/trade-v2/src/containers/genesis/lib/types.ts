export type GenesisViewState =
  | 'disconnected'
  | 'needs_agreement'
  | 'no_deposit'
  | 'deposited';

export type DepositTabValue = 'deposit' | 'withdraw' | 'swap';
