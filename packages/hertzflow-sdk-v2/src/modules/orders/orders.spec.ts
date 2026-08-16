import { describe, expect, it } from "vitest";

import { bscTestnetSdk, hasBscTestnetConfig } from "utils/testUtil";

describe.skipIf(!hasBscTestnetConfig)("Positions", () => {
  describe("read", () => {
    it("should be able to get orders", async () => {
      const orders = await bscTestnetSdk.orders.getOrders({});
      expect(orders).toBeDefined();
    });
  });
});
