import { z } from "zod";

export const StockTokenSchema = z.object({
  ticker: z.string(), issuer: z.string(), cusip: z.string(),
  wrapper: z.string(), chain: z.string(), chainId: z.number(),
  decimals: z.number(), transferRestricted: z.boolean().optional(),
});

export class StockTokenIndex {
  constructor(private opts: { chain: string }) {}
  async resolve(ticker: string) {
    return { ticker, issuer: "unknown", chain: this.opts.chain };
  }
}
