import { getContract } from "configs/contracts";
import { Module } from "../base";
import { abis } from "abis/index";
import { hashAddress } from "utils/hash";
import { decodeEventLog, DecodeEventLogReturnType, Log, type Address, type WatchContractEventReturnType } from "viem";

export type EventSubscriptionOptions = {
  usePolling?: boolean;
  accountAddress?: Address;
};

export class Events extends Module {
  disposers: Map<
    WatchContractEventReturnType,
    | [
        "EventLog1",
        (logs: (Log & { parsedData: DecodeEventLogReturnType<typeof abis.EventEmitter, "EventLog1"> })[]) => void,
        undefined | string[],
        EventSubscriptionOptions | undefined,
      ]
    | [
        "EventLog2",
        (logs: (Log & { parsedData: DecodeEventLogReturnType<typeof abis.EventEmitter, "EventLog2"> })[]) => void,
        undefined | string[],
        EventSubscriptionOptions | undefined,
      ]
  > = new Map();

  destroy() {
    for (const disposer of this.disposers.keys()) {
      try {
        disposer();
      } catch (e) {
        this.logger.error("Event dispose error:", e);
      }
    }
    this.disposers.clear();
  }

  switchAccount() {
    for (const [disposer, params] of new Map(this.disposers)) {
      try {
        disposer();
        this.disposers.delete(disposer);
        if (params[0] === "EventLog1") {
          this.subscribeEventLog1(params[1], params[2], params[3]);
        } else if (params[0] === "EventLog2") {
          this.subscribeEventLog2(params[1], params[2], params[3]);
        }
      } catch (e) {
        this.logger.error("Event dispose error:", e);
      }
    }
  }

  subscribeEventLog1(
    callback: (logs: (Log & { parsedData: DecodeEventLogReturnType<typeof abis.EventEmitter, "EventLog1"> })[]) => void,
    filterEventNames?: string[],
    options?: EventSubscriptionOptions
  ) {
    const accountAddress = this.sdk.account;
    let disposer = () => {};

    if (accountAddress && this.chainId) {
      const client = options?.usePolling ? this.sdk.publicClient : this.sdk.wsPublicClient;
      disposer = client.watchContractEvent({
        address: getContract(this.chainId, "EventEmitter"),
        abi: abis.EventEmitter,
        eventName: "EventLog1",
        args: {
          eventNameHash: ["PositionIncrease", "PositionDecrease", "MultichainTransferOut", "MultichainTransferIn"],
          topic1: hashAddress(accountAddress),
        },
        onLogs: (logs) => {
          const filterLogs = logs.filter((v) => {
            return !filterEventNames || filterEventNames.includes(v.args.eventName!);
          });

          if (filterLogs.length) {
            callback(
              filterLogs.map((v) => {
                return {
                  ...v,
                  parsedData: decodeEventLog({
                    abi: abis.EventEmitter,
                    eventName: "EventLog1",
                    data: v.data,
                    topics: v.topics,
                  }),
                };
              })
            );
          }
        },
      });
    }

    this.disposers.set(disposer, ["EventLog1", callback, filterEventNames, options]);

    return () => {
      disposer();
      this.disposers.delete(disposer);
    };
  }

  subscribeEventLog2(
    callback: (logs: (Log & { parsedData: DecodeEventLogReturnType<typeof abis.EventEmitter, "EventLog2"> })[]) => void,
    filterEventNames?: string[],
    options?: EventSubscriptionOptions
  ) {
    const accountAddress = options?.accountAddress ?? this.sdk.account;
    let disposer = () => {};
    if (accountAddress && this.chainId) {
      const client = options?.usePolling ? this.sdk.publicClient : this.sdk.wsPublicClient;
      disposer = client.watchContractEvent({
        address: getContract(this.chainId, "EventEmitter"),
        abi: abis.EventEmitter,
        eventName: "EventLog2",
        args: {
          eventNameHash: [
            "OrderCreated",
            "OrderUpdated",
            "OrderCancelled",
            "OrderExecuted",
            "DepositCreated",
            "DepositExecuted",
            "DepositCancelled",
            "WithdrawalCreated",
            "WithdrawalExecuted",
            "WithdrawalCancelled",
            "ShiftCreated",
            "ShiftExecuted",
            "ShiftCancelled",
            "HlvDepositCreated",
            "HlvDepositExecuted",
            "HlvDepositCancelled",
            "HlvWithdrawalCreated",
            "HlvWithdrawalExecuted",
            "HlvWithdrawalCancelled",
          ],
          topic1: null,
          topic2: hashAddress(accountAddress),
        },
        onLogs: (logs) => {
          const filterLogs = logs.filter((v) => {
            return !filterEventNames || filterEventNames.includes(v.args.eventName!);
          });

          if (filterLogs.length) {
            callback(
              filterLogs.map((v) => {
                return {
                  ...v,
                  parsedData: decodeEventLog({
                    abi: abis.EventEmitter,
                    eventName: "EventLog2",
                    data: v.data,
                    topics: v.topics,
                  }),
                };
              })
            );
          }
        },
      });
    }
    this.disposers.set(disposer, ["EventLog2", callback, filterEventNames, options]);

    return () => {
      disposer();
      this.disposers.delete(disposer);
    };
  }

  subscribeOrderCreated(
    callback: (logs: (Log & { parsedData: DecodeEventLogReturnType<typeof abis.EventEmitter, "EventLog2"> })[]) => void,
    options?: EventSubscriptionOptions
  ) {
    return this.subscribeEventLog2(callback, ["OrderCreated"], options);
  }

  subscribeOrderUpdated(
    callback: (logs: (Log & { parsedData: DecodeEventLogReturnType<typeof abis.EventEmitter, "EventLog2"> })[]) => void,
    options?: EventSubscriptionOptions
  ) {
    return this.subscribeEventLog2(callback, ["OrderUpdated"], options);
  }

  subscribeOrderExecuted(
    callback: (logs: (Log & { parsedData: DecodeEventLogReturnType<typeof abis.EventEmitter, "EventLog2"> })[]) => void,
    options?: EventSubscriptionOptions
  ) {
    return this.subscribeEventLog2(callback, ["OrderExecuted"], options);
  }

  subscribeOrderCancelled(
    callback: (logs: (Log & { parsedData: DecodeEventLogReturnType<typeof abis.EventEmitter, "EventLog2"> })[]) => void,
    options?: EventSubscriptionOptions
  ) {
    return this.subscribeEventLog2(callback, ["OrderCancelled"], options);
  }

  subscribeHlvDepositCreated(
    callback: (logs: (Log & { parsedData: DecodeEventLogReturnType<typeof abis.EventEmitter, "EventLog2"> })[]) => void,
    options?: EventSubscriptionOptions
  ) {
    return this.subscribeEventLog2(callback, ["HlvDepositCreated"], options);
  }

  subscribeDepositCreated(
    callback: (logs: (Log & { parsedData: DecodeEventLogReturnType<typeof abis.EventEmitter, "EventLog2"> })[]) => void,
    options?: EventSubscriptionOptions
  ) {
    return this.subscribeEventLog2(callback, ["DepositCreated"], options);
  }

  subscribeHlvDepositExecuted(
    callback: (logs: (Log & { parsedData: DecodeEventLogReturnType<typeof abis.EventEmitter, "EventLog2"> })[]) => void,
    options?: EventSubscriptionOptions
  ) {
    return this.subscribeEventLog2(callback, ["HlvDepositExecuted"], options);
  }

  subscribeDepositExecuted(
    callback: (logs: (Log & { parsedData: DecodeEventLogReturnType<typeof abis.EventEmitter, "EventLog2"> })[]) => void,
    options?: EventSubscriptionOptions
  ) {
    return this.subscribeEventLog2(callback, ["DepositExecuted"], options);
  }

  subscribeHlvDepositCancelled(
    callback: (logs: (Log & { parsedData: DecodeEventLogReturnType<typeof abis.EventEmitter, "EventLog2"> })[]) => void,
    options?: EventSubscriptionOptions
  ) {
    return this.subscribeEventLog2(callback, ["HlvDepositCancelled"], options);
  }

  subscribeDepositCancelled(
    callback: (logs: (Log & { parsedData: DecodeEventLogReturnType<typeof abis.EventEmitter, "EventLog2"> })[]) => void,
    options?: EventSubscriptionOptions
  ) {
    return this.subscribeEventLog2(callback, ["DepositCancelled"], options);
  }

  subscribeHlvWithdrawalCreated(
    callback: (logs: (Log & { parsedData: DecodeEventLogReturnType<typeof abis.EventEmitter, "EventLog2"> })[]) => void,
    options?: EventSubscriptionOptions
  ) {
    return this.subscribeEventLog2(callback, ["HlvWithdrawalCreated"], options);
  }

  subscribeWithdrawalCreated(
    callback: (logs: (Log & { parsedData: DecodeEventLogReturnType<typeof abis.EventEmitter, "EventLog2"> })[]) => void,
    options?: EventSubscriptionOptions
  ) {
    return this.subscribeEventLog2(callback, ["WithdrawalCreated"], options);
  }

  subscribeHlvWithdrawalExecuted(
    callback: (logs: (Log & { parsedData: DecodeEventLogReturnType<typeof abis.EventEmitter, "EventLog2"> })[]) => void,
    options?: EventSubscriptionOptions
  ) {
    return this.subscribeEventLog2(callback, ["HlvWithdrawalExecuted"], options);
  }

  subscribeWithdrawalExecuted(
    callback: (logs: (Log & { parsedData: DecodeEventLogReturnType<typeof abis.EventEmitter, "EventLog2"> })[]) => void,
    options?: EventSubscriptionOptions
  ) {
    return this.subscribeEventLog2(callback, ["WithdrawalExecuted"], options);
  }

  subscribeHlvWithdrawalCancelled(
    callback: (logs: (Log & { parsedData: DecodeEventLogReturnType<typeof abis.EventEmitter, "EventLog2"> })[]) => void,
    options?: EventSubscriptionOptions
  ) {
    return this.subscribeEventLog2(callback, ["HlvWithdrawalCancelled"], options);
  }

  subscribeWithdrawalCancelled(
    callback: (logs: (Log & { parsedData: DecodeEventLogReturnType<typeof abis.EventEmitter, "EventLog2"> })[]) => void,
    options?: EventSubscriptionOptions
  ) {
    return this.subscribeEventLog2(callback, ["WithdrawalCancelled"], options);
  }

  subscribeShiftCreated(
    callback: (logs: (Log & { parsedData: DecodeEventLogReturnType<typeof abis.EventEmitter, "EventLog2"> })[]) => void,
    options?: EventSubscriptionOptions
  ) {
    return this.subscribeEventLog2(callback, ["ShiftCreated"], options);
  }

  subscribeShiftExecuted(
    callback: (logs: (Log & { parsedData: DecodeEventLogReturnType<typeof abis.EventEmitter, "EventLog2"> })[]) => void,
    options?: EventSubscriptionOptions
  ) {
    return this.subscribeEventLog2(callback, ["ShiftExecuted"], options);
  }

  subscribeShiftCancelled(
    callback: (logs: (Log & { parsedData: DecodeEventLogReturnType<typeof abis.EventEmitter, "EventLog2"> })[]) => void,
    options?: EventSubscriptionOptions
  ) {
    return this.subscribeEventLog2(callback, ["ShiftCancelled"], options);
  }

  subscribePositionIncrease(
    callback: (logs: (Log & { parsedData: DecodeEventLogReturnType<typeof abis.EventEmitter, "EventLog1"> })[]) => void,
    options?: { usePolling?: boolean }
  ) {
    return this.subscribeEventLog1(callback, ["PositionIncrease"], options);
  }

  subscribePositionDecrease(
    callback: (logs: (Log & { parsedData: DecodeEventLogReturnType<typeof abis.EventEmitter, "EventLog1"> })[]) => void,
    options?: { usePolling?: boolean }
  ) {
    return this.subscribeEventLog1(callback, ["PositionDecrease"], options);
  }

  subscribeMultichainTransferOut(
    callback: (logs: (Log & { parsedData: DecodeEventLogReturnType<typeof abis.EventEmitter, "EventLog1"> })[]) => void,
    options?: { usePolling?: boolean }
  ) {
    return this.subscribeEventLog1(callback, ["MultichainTransferOut"], options);
  }

  subscribeMultichainTransferIn(
    callback: (logs: (Log & { parsedData: DecodeEventLogReturnType<typeof abis.EventEmitter, "EventLog1"> })[]) => void,
    options?: { usePolling?: boolean }
  ) {
    return this.subscribeEventLog1(callback, ["MultichainTransferIn"], options);
  }
}
