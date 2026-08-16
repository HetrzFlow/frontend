export enum ActivityTabType {
  POOL = 'pool',
  VAULT = 'vault',
}

export enum ModeType {
  MY = 'my',
  ALL = 'all',
}

export enum ActionFilter {
  ALL = 'all',
  DEPOSITS = 'deposits',
  WITHDRAWALS = 'withdrawals',
  CANCELLED_DEPOSITS = 'cancelled-deposits',
  CANCELLED_WITHDRAWALS = 'cancelled-withdrawals',
}

export const getActionFilterOptions = (includeCancelled: boolean) =>
  includeCancelled
    ? Object.values(ActionFilter)
    : [ActionFilter.ALL, ActionFilter.DEPOSITS, ActionFilter.WITHDRAWALS];
