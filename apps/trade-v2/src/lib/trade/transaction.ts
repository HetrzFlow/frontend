import { HertzFlowSDK } from '@hertzflow/sdk-v2';
import { abis } from '@hertzflow/sdk-v2/abis/index';
import { isMarketOrderType } from '@hertzflow/sdk-v2/utils/orders';
import { decodeErrorResult } from 'viem';
import { getMediaSize, MEDIA_SIZES } from '@repo/ui';

export const TIMEOUT = 30000;

export const getMarketOrderEventKey = ({
  marketAddress,
  isLong,
  orderType,
  isZFP = false,
}: {
  marketAddress: string;
  isLong: boolean;
  orderType: number;
  isZFP?: boolean;
}) => `${marketAddress}_${isLong}_${orderType}_${isZFP}`;

const humanizeReason = (reason: string) => {
  const normalized = reason
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
    .toLowerCase();

  if (!normalized) {
    return normalized;
  }

  return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`;
};

const getOrderCancelledReason = (eventData: {
  stringItems: { items: ReadonlyArray<{ key: string; value?: string }> };
  bytesItems: { items: ReadonlyArray<{ key: string; value?: string }> };
}) => {
  const stringItems = Object.fromEntries(
    eventData.stringItems.items.map((v) => [v.key, v.value]),
  ) as Record<string, string | undefined>;
  const bytesItems = Object.fromEntries(
    eventData.bytesItems.items.map((v) => [v.key, v.value]),
  ) as Record<string, string | undefined>;

  if (stringItems.reason) {
    return humanizeReason(stringItems.reason);
  }

  const reasonBytes = bytesItems.reasonBytes;
  if (!reasonBytes || reasonBytes === '0x') {
    return '';
  }

  try {
    const decoded = decodeErrorResult({
      abi: abis.CustomErrors,
      data: reasonBytes as `0x${string}`,
    });

    return humanizeReason(decoded.errorName);
  } catch {
    return '';
  }
};

// handle market order workflow
export const handleMarketOrderEvent = ({
  hzSdk,
  orderKey,
  onsubmit,
  onSuccess,
  onFailed,
}: {
  hzSdk?: HertzFlowSDK | null;
  orderKey: string;
  onsubmit: (txHash?: string | null) => void;
  onSuccess: (txHash?: string | null) => void;
  onFailed: (params: { txHash?: string | null; reason?: string }) => void;
}) => {
  const isMobile = getMediaSize() === MEDIA_SIZES.SM;
  let contractKey = '';
  let unsubOrderCreated: (() => void) | null | undefined;
  let unsubOrderExecuted: (() => void) | null | undefined;
  let unsubOrderCancelled: (() => void) | null | undefined;

  // unsub when timeout
  const timeout = setTimeout(() => {
    if (unsubOrderCreated) {
      unsubOrderCreated();
      unsubOrderCreated = null;
    }
    if (unsubOrderExecuted) {
      unsubOrderExecuted();
      unsubOrderExecuted = null;
    }
    if (unsubOrderCancelled) {
      unsubOrderCancelled();
      unsubOrderCancelled = null;
    }
  }, TIMEOUT);

  // handle create order event
  unsubOrderCreated = hzSdk?.events.subscribeOrderCreated(
    (logs) => {
      logs.forEach((log) => {
        const eventData = log.parsedData.args.eventData;

        const addressItems = Object.fromEntries(
          eventData.addressItems.items.map((v) => [v.key, v.value]),
        );
        // const addressArrayItems = Object.fromEntries(
        //   eventData.addressItems.arrayItems.map((v) => [v.key, v.value]),
        // );
        const uintItems = Object.fromEntries(
          eventData.uintItems.items.map((v) => [v.key, v.value]),
        );
        const boolItems = Object.fromEntries(
          eventData.boolItems.items.map((v) => [v.key, v.value]),
        );
        const bytes32Items = Object.fromEntries(
          eventData.bytes32Items.items.map((v) => [v.key, v.value]),
        );
        if (addressItems.account !== hzSdk?.account) {
          return;
        }
        const orderType = Number(uintItems.orderType);

        if (
          getMarketOrderEventKey({
            marketAddress: addressItems.market!,
            isLong: boolItems.isLong!,
            orderType,
            isZFP: boolItems.isZFP ?? false,
          }) === orderKey
        ) {
          if (!isMarketOrderType(orderType)) {
            onsubmit(log.transactionHash);
            if (unsubOrderCreated) {
              unsubOrderCreated();
              unsubOrderCreated = null;
            }
            if (unsubOrderExecuted) {
              unsubOrderExecuted();
              unsubOrderExecuted = null;
            }
            if (unsubOrderCancelled) {
              unsubOrderCancelled();
              unsubOrderCancelled = null;
            }
            return;
          } else {
            contractKey = bytes32Items.key!;
            onsubmit(log.transactionHash);
            if (unsubOrderCreated) {
              unsubOrderCreated();
              unsubOrderCreated = null;
            }
            return;
          }
        }
      });
    },
    // use http polling in mobile
    { usePolling: isMobile },
  );

  // handle order executed event
  unsubOrderExecuted = hzSdk?.events.subscribeOrderExecuted(
    (logs) => {
      logs.forEach((log) => {
        const eventData = log.parsedData.args.eventData;

        const bytes32Items = Object.fromEntries(
          eventData.bytes32Items.items.map((v) => [v.key, v.value]),
        );

        if (bytes32Items.key! === contractKey) {
          onSuccess(log.transactionHash);
          if (unsubOrderExecuted) {
            unsubOrderExecuted();
            unsubOrderExecuted = null;
          }
          if (unsubOrderCancelled) {
            unsubOrderCancelled();
            unsubOrderCancelled = null;
          }
          clearTimeout(timeout);
          return;
        }
      });
    },
    { usePolling: isMobile },
  );

  // handle order executed event
  unsubOrderCancelled = hzSdk?.events.subscribeOrderCancelled(
    (logs) => {
      logs.forEach((log) => {
        const eventData = log.parsedData.args.eventData;
        const bytes32Items = Object.fromEntries(
          eventData.bytes32Items.items.map((v) => [v.key, v.value]),
        );

        if (bytes32Items.key! === contractKey) {
          onFailed({
            txHash: log.transactionHash,
            reason: getOrderCancelledReason(eventData),
          });
          if (unsubOrderExecuted) {
            unsubOrderExecuted();
            unsubOrderExecuted = null;
          }
          if (unsubOrderCancelled) {
            unsubOrderCancelled();
            unsubOrderCancelled = null;
          }
          clearTimeout(timeout);
          return;
        }
      });
    },
    { usePolling: isMobile },
  );
};
