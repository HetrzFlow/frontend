import { useEffect, useRef } from 'react';
import { Log } from 'viem';
import { useHzSdk } from '@/common';
import type { HertzFlowSDK } from '@hertzflow/sdk-v2';

type ContractEventOptions = {
  enabled?: boolean;
  usePolling?: boolean;
};

const useContractEvent = (
  method:
    | 'subscribeOrderCreated'
    | 'subscribeOrderUpdated'
    | 'subscribeOrderExecuted'
    | 'subscribeOrderCancelled'
    | 'subscribeHlvDepositCreated'
    | 'subscribeDepositCreated'
    | 'subscribeHlvDepositExecuted'
    | 'subscribeDepositExecuted'
    | 'subscribeHlvDepositCancelled'
    | 'subscribeDepositCancelled'
    | 'subscribeHlvWithdrawalCreated'
    | 'subscribeWithdrawalCreated'
    | 'subscribeHlvWithdrawalExecuted'
    | 'subscribeWithdrawalExecuted'
    | 'subscribeHlvWithdrawalCancelled'
    | 'subscribeWithdrawalCancelled'
    | 'subscribeShiftCreated'
    | 'subscribeShiftExecuted'
    | 'subscribeShiftCancelled'
    | 'subscribePositionIncrease'
    | 'subscribePositionDecrease'
    | 'subscribeMultichainTransferOut'
    | 'subscribeMultichainTransferIn',
  callback:
    | Parameters<HertzFlowSDK['events']['subscribeEventLog1']>[0]
    | Parameters<HertzFlowSDK['events']['subscribeEventLog2']>[0],
  options?: ContractEventOptions,
) => {
  const hzSdk = useHzSdk();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  const enabled = options?.enabled ?? true;
  const usePolling = options?.usePolling;

  useEffect(() => {
    if (!enabled || !hzSdk) return;
    const unsub = hzSdk.events[method](
      callbackRef.current as (log: Log[]) => void,
      { usePolling },
    );
    return () => {
      unsub();
    };
  }, [enabled, hzSdk, method, usePolling]);
};

// order created event
export const useOrderCreatedEvent = (
  callback: Parameters<HertzFlowSDK['events']['subscribeOrderCreated']>[0],
) => {
  useContractEvent('subscribeOrderCreated', callback);
};

// order updated event
export const useOrderUpdatedEvent = (
  callback: Parameters<HertzFlowSDK['events']['subscribeOrderUpdated']>[0],
) => {
  useContractEvent('subscribeOrderUpdated', callback);
};

// order executed event
export const useOrderExecutedEvent = (
  callback: Parameters<HertzFlowSDK['events']['subscribeOrderExecuted']>[0],
) => {
  useContractEvent('subscribeOrderExecuted', callback);
};

// order cancelled event
export const useOrderCancelledEvent = (
  callback: Parameters<HertzFlowSDK['events']['subscribeOrderCancelled']>[0],
) => {
  useContractEvent('subscribeOrderCancelled', callback);
};

// hlv deposit created event
export const useHlvDepositCreatedEvent = (
  callback: Parameters<HertzFlowSDK['events']['subscribeHlvDepositCreated']>[0],
  options?: ContractEventOptions,
) => {
  useContractEvent('subscribeHlvDepositCreated', callback, options);
};

// deposit created event
export const useDepositCreatedEvent = (
  callback: Parameters<HertzFlowSDK['events']['subscribeDepositCreated']>[0],
  options?: ContractEventOptions,
) => {
  useContractEvent('subscribeDepositCreated', callback, options);
};

// hlv deposit executed event
export const useHlvDepositExecutedEvent = (
  callback: Parameters<
    HertzFlowSDK['events']['subscribeHlvDepositExecuted']
  >[0],
  options?: ContractEventOptions,
) => {
  useContractEvent('subscribeHlvDepositExecuted', callback, options);
};

// deposit executed event
export const useDepositExecutedEvent = (
  callback: Parameters<HertzFlowSDK['events']['subscribeDepositExecuted']>[0],
  options?: ContractEventOptions,
) => {
  useContractEvent('subscribeDepositExecuted', callback, options);
};

// hlv deposit cancelled event
export const useHlvDepositCancelledEvent = (
  callback: Parameters<
    HertzFlowSDK['events']['subscribeHlvDepositCancelled']
  >[0],
  options?: ContractEventOptions,
) => {
  useContractEvent('subscribeHlvDepositCancelled', callback, options);
};

// deposit cancelled event
export const useDepositCancelledEvent = (
  callback: Parameters<HertzFlowSDK['events']['subscribeDepositCancelled']>[0],
  options?: ContractEventOptions,
) => {
  useContractEvent('subscribeDepositCancelled', callback, options);
};

// hlv withdrawal created event
export const useHlvWithdrawalCreatedEvent = (
  callback: Parameters<
    HertzFlowSDK['events']['subscribeHlvWithdrawalCreated']
  >[0],
  options?: ContractEventOptions,
) => {
  useContractEvent('subscribeHlvWithdrawalCreated', callback, options);
};

// withdrawal created event
export const useWithdrawalCreatedEvent = (
  callback: Parameters<HertzFlowSDK['events']['subscribeWithdrawalCreated']>[0],
  options?: ContractEventOptions,
) => {
  useContractEvent('subscribeWithdrawalCreated', callback, options);
};

// hlv withdrawal executed event
export const useHlvWithdrawalExecutedEvent = (
  callback: Parameters<
    HertzFlowSDK['events']['subscribeHlvWithdrawalExecuted']
  >[0],
  options?: ContractEventOptions,
) => {
  useContractEvent('subscribeHlvWithdrawalExecuted', callback, options);
};

// withdrawal executed event
export const useWithdrawalExecutedEvent = (
  callback: Parameters<
    HertzFlowSDK['events']['subscribeWithdrawalExecuted']
  >[0],
  options?: ContractEventOptions,
) => {
  useContractEvent('subscribeWithdrawalExecuted', callback, options);
};

// // hlv withdrawal cancelled event
export const useHlvWithdrawalCancelledEvent = (
  callback: Parameters<
    HertzFlowSDK['events']['subscribeHlvWithdrawalCancelled']
  >[0],
  options?: ContractEventOptions,
) => {
  useContractEvent('subscribeHlvWithdrawalCancelled', callback, options);
};

// withdrawal cancelled event
export const useWithdrawalCancelledEvent = (
  callback: Parameters<
    HertzFlowSDK['events']['subscribeWithdrawalCancelled']
  >[0],
  options?: ContractEventOptions,
) => {
  useContractEvent('subscribeWithdrawalCancelled', callback, options);
};

// shift created event
export const useShiftCreatedEvent = (
  callback: Parameters<HertzFlowSDK['events']['subscribeShiftCreated']>[0],
) => {
  useContractEvent('subscribeShiftCreated', callback);
};

// shift executed event
export const useShiftExecutedEvent = (
  callback: Parameters<HertzFlowSDK['events']['subscribeShiftExecuted']>[0],
) => {
  useContractEvent('subscribeShiftExecuted', callback);
};

// shift cancelled event
export const useShiftCancelledEvent = (
  callback: Parameters<HertzFlowSDK['events']['subscribeShiftCancelled']>[0],
) => {
  useContractEvent('subscribeShiftCancelled', callback);
};

// position increase event
export const usePositionIncreaseEvent = (
  callback: Parameters<HertzFlowSDK['events']['subscribePositionIncrease']>[0],
) => {
  useContractEvent('subscribePositionIncrease', callback);
};

// position decrease event
export const usePositionDecreaseEvent = (
  callback: Parameters<HertzFlowSDK['events']['subscribePositionDecrease']>[0],
) => {
  useContractEvent('subscribePositionDecrease', callback);
};

// multichain transfer out event
export const useMultichainTransferOutEvent = (
  callback: Parameters<
    HertzFlowSDK['events']['subscribeMultichainTransferOut']
  >[0],
) => {
  useContractEvent('subscribeMultichainTransferOut', callback);
};

// multichain transfer in event
export const useMultichainTransferInEvent = (
  callback: Parameters<
    HertzFlowSDK['events']['subscribeMultichainTransferIn']
  >[0],
) => {
  useContractEvent('subscribeMultichainTransferIn', callback);
};
