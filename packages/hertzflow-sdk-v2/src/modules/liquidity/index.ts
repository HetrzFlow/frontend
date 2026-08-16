import { Module } from "../base";

import {
  createHlvDepositTxn,
  createHlvWithdrawalTxn,
  createDepositTxn,
  createWithdrawalTxn,
  type CreateHlvDepositTxnParams,
  type CreateHlvWithdrawalTxnParams,
  type CreateDepositTxnParams,
  type CreateWithdrawalTxnParams,
} from "./transactions";
import { cancelLiquidityOrder, cancelLiquidityOrders, getLiquidityOrders } from "./orders";

export type { CreateDepositParams, CreateWithdrawalParams } from "./types";
export type { HlvDepositAllocation, HlvWithdrawalAllocation } from "types/liquidity";
export type { GetLiquidityOrdersParams, LiquidityOrder, LiquidityOrderKind, LiquidityOrderScope } from "./orders";

export class Liquidity extends Module {
  async getOrders(params: Parameters<typeof getLiquidityOrders>[1] = {}) {
    return getLiquidityOrders(this.sdk, params);
  }

  async cancelOrder(order: Parameters<typeof cancelLiquidityOrder>[1]) {
    return cancelLiquidityOrder(this.sdk, order);
  }

  async cancelOrders(orders: Parameters<typeof cancelLiquidityOrders>[1]) {
    return cancelLiquidityOrders(this.sdk, orders);
  }

  async createDeposit(params: Omit<CreateDepositTxnParams, "sdk">) {
    return createDepositTxn({
      sdk: this.sdk,
      ...params,
    });
  }

  async createWithdrawal(params: Omit<CreateWithdrawalTxnParams, "sdk">) {
    return createWithdrawalTxn({
      sdk: this.sdk,
      ...params,
    });
  }

  async createHlvDeposit(params: Omit<CreateHlvDepositTxnParams, "sdk">) {
    return createHlvDepositTxn({
      sdk: this.sdk,
      ...params,
    });
  }

  async createHlvWithdrawal(params: Omit<CreateHlvWithdrawalTxnParams, "sdk">) {
    return createHlvWithdrawalTxn({
      sdk: this.sdk,
      ...params,
    });
  }
}
