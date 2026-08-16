import {
  getViemChain,
  SOURCE_BSC_MAINNET,
} from '@hertzflow/sdk-v2/configs/chains';
import { dateFormat } from '@repo/lib/format';
import type { SwapHistoryRecord } from '@/services/rest/swap';

import { formatSwapTokenAmount } from '../Swap/format';

const BSC_MAINNET_EXPLORER_HOST =
  getViemChain(SOURCE_BSC_MAINNET).blockExplorers?.default.url ||
  'https://bscscan.com';

export const getSwapExplorerHref = (txHash: string) =>
  `${BSC_MAINNET_EXPLORER_HOST}/tx/${txHash}`;

export const formatSwapHistoryTimestamp = (timestampMs: number) =>
  dateFormat(timestampMs, 'yyyy/MM/dd HH:mm:ss');

export const getSwapHistoryPair = (record: SwapHistoryRecord) =>
  `${record.payToken.symbol} > ${record.receiveToken.symbol}`;

export const getSwapHistoryAmounts = (record: SwapHistoryRecord) =>
  `${formatSwapTokenAmount(record.amountIn)} ${record.payToken.symbol} → ${formatSwapTokenAmount(record.amountOut)} ${record.receiveToken.symbol}`;
