import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import net from "node:net";
import { setTimeout as delay } from "node:timers/promises";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createPublicClient,
  createWalletClient,
  decodeFunctionData,
  erc20Abi,
  http,
  parseAbi,
  parseEther,
  zeroAddress,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bsc } from "viem/chains";

import { HertzFlowSDK } from "../..";

const BSC_RPC_URL = process.env.BSC_MAINNET_RPC_URL;
const ANVIL_PRIVATE_KEY = process.env.ANVIL_PRIVATE_KEY;
const USDT = process.env.BSC_FORK_USDT_ADDRESS as Address | undefined;
const CUSTOM_FEE_RECEIVER = process.env.BSC_FORK_FEE_RECEIVER as Address | undefined;
const LIVE_TEST_ENABLED =
  process.env.RUN_LIVE_BSC_FORK_TESTS === "1" &&
  Boolean(BSC_RPC_URL && ANVIL_PRIVATE_KEY && USDT && CUSTOM_FEE_RECEIVER);
const PEACH_SWAP_ETH_ABI = parseAbi([
  "function swapETH((address srcToken,address dstToken,uint256 amountIn,uint256 amountOutMin,(address adapter,address pool,address tokenIn,address tokenOut,uint256 amountIn,bytes extraData)[] steps,address[] intermediateTokens,uint256 deadline,bytes32 quoteId,uint256 expectAmountOut,address feeReceiver,uint16 feeBps) params) payable returns (uint256 amountOut)",
]);

let anvil: ChildProcessWithoutNullStreams | undefined;
let sdk: HertzFlowSDK | undefined;

const getFreePort = () =>
  new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, () => {
      const address = server.address();
      server.close(() => {
        if (!address || typeof address === "string") {
          reject(new Error("Failed to allocate anvil port"));
          return;
        }
        resolve(address.port);
      });
    });
  });

const startAnvilFork = async () => {
  const port = await getFreePort();
  const url = `http://localhost:${port}`;
  const child = spawn("anvil", [
    "--fork-url",
    BSC_RPC_URL!,
    "--chain-id",
    String(bsc.id),
    "--port",
    String(port),
    "--silent",
  ]);
  child.unref();

  const client = createPublicClient({
    chain: bsc,
    transport: http(url, { timeout: 60_000, retryCount: 0 }),
  });
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`anvil exited early with code ${child.exitCode}`);
    }
    try {
      await client.getBlockNumber();
      return { child, client, url };
    } catch {
      await delay(250);
    }
  }

  child.kill();
  throw new Error("Timed out waiting for BSC fork");
};

describe.skipIf(!LIVE_TEST_ENABLED)("ExternalSwap BSC fork", () => {
  beforeAll(async () => {
    const fork = await startAnvilFork();
    anvil = fork.child;
    const account = privateKeyToAccount(ANVIL_PRIVATE_KEY!);
    const walletClient = createWalletClient({
      account,
      chain: bsc,
      transport: http(fork.url, { timeout: 30_000, retryCount: 0 }),
    });

    sdk = new HertzFlowSDK({
      chainId: bsc.id,
      account: account.address,
      rpcUrl: fork.url,
      oracleUrl: "",
      publicClient: fork.client as any,
      walletClient: walletClient as any,
      settings: { debugMode: false },
    });
  }, 60_000);

  afterAll(() => {
    sdk?.destroy();
    anvil?.kill();
  });

  it("quotes, simulates, and executes a native BNB to USDT swap", async () => {
    const account = privateKeyToAccount(ANVIL_PRIVATE_KEY!);
    const [status, quote] = await Promise.all([
      sdk!.externalSwap.getStatus(),
      sdk!.externalSwap.getQuote({
        tokenIn: zeroAddress,
        tokenOut: USDT!,
        amountIn: parseEther("0.001"),
        // Peach quotes current mainnet while Anvil is pinned to its startup block.
        slippageBps: 1_000,
      }),
    ]);

    expect(status.routerTrusted).toBe(true);
    expect(quote.amountOut).toBeGreaterThan(0n);
    expect(quote.isNativeIn).toBe(true);
    expect(quote.routeStreams.length).toBeGreaterThan(0);
    expect(quote.routeStreams.reduce((sum, stream) => sum + stream.percentageBps, 0)).toBe(10_000);
    const decodedSwap = decodeFunctionData({
      abi: PEACH_SWAP_ETH_ABI,
      data: quote.transaction.data,
    });
    expect(decodedSwap.args[0].feeReceiver).toBe(CUSTOM_FEE_RECEIVER);
    expect(decodedSwap.args[0].feeBps).toBe(1);

    const plan = await sdk!.externalSwap.buildSwapPlan({
      quote,
      owner: account.address,
    });
    expect(plan.approval).toBeUndefined();
    await expect(
      sdk!.externalSwap.simulateSwap({
        quote,
        owner: account.address,
      })
    ).resolves.toBeDefined();

    const [balanceBefore, feeBalanceBefore] = await Promise.all([
      sdk!.publicClient.readContract({
        address: USDT!,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [account.address],
      }),
      sdk!.publicClient.readContract({
        address: USDT!,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [CUSTOM_FEE_RECEIVER!],
      }),
    ]);
    const hash = await sdk!.externalSwap.executeSwap({ quote });
    const receipt = await sdk!.publicClient.waitForTransactionReceipt({ hash });
    const balanceAfter = await sdk!.publicClient.readContract({
      address: USDT!,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [account.address],
    });
    const feeBalanceAfter = await sdk!.publicClient.readContract({
      address: USDT!,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [CUSTOM_FEE_RECEIVER!],
    });

    expect(receipt.status).toBe("success");
    expect(balanceAfter).toBeGreaterThan(balanceBefore);
    expect(feeBalanceAfter).toBeGreaterThan(feeBalanceBefore);
  }, 120_000);
});
