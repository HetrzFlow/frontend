export const SWAP_TRANSACTION_TOAST_ID = 'toast-swap';
export const SWAP_REQUEST_ERROR_TOAST_ID = 'toast-swap-request-error';

export type SwapTransactionToastStage =
  | 'submitting'
  | 'submitted'
  | 'confirmed'
  | 'error';

export type SwapTransactionToastToken = {
  symbol: string;
  logoURI: string;
};

type SwapTransactionToastBaseData = {
  payToken: SwapTransactionToastToken;
  receiveToken: SwapTransactionToastToken;
  payAmount: string;
  receiveAmount: string;
  explorerHost?: string;
  submittedHash?: string;
  confirmedHash?: string;
};

export type SwapTransactionToastData = SwapTransactionToastBaseData &
  (
    | {
        stage: Exclude<SwapTransactionToastStage, 'error'>;
        errorMessage?: never;
      }
    | {
        stage: 'error';
        errorMessage: string;
      }
  );

export const getSwapTransactionUrl = (explorerHost?: string, hash?: string) =>
  explorerHost && hash && /^0x[\da-f]{64}$/i.test(hash)
    ? `${explorerHost.replace(/\/+$/, '')}/tx/${hash}`
    : undefined;
