export type HomeRoutingDecision =
  | {
      type: 'redirect';
      destinationHost: string;
      statusCode: 307;
    }
  | {
      type: 'next';
    };

function normalizeHost(host: string | null | undefined) {
  if (!host) return '';

  const trimmedHost = host.trim();

  if (!trimmedHost) return '';

  if (trimmedHost.includes('://')) {
    try {
      return new URL(trimmedHost).host.split(':')[0]?.toLowerCase() ?? '';
    } catch {
      return '';
    }
  }

  return trimmedHost.split(':')[0]?.toLowerCase() ?? '';
}

type GetHomeRoutingDecisionParams = {
  hostHeader: string | null;
  pathname: string;
  testnetHost?: string;
  mainnetHost?: string;
};

export function getHomeRoutingDecision({
  hostHeader,
  pathname,
  testnetHost,
  mainnetHost,
}: GetHomeRoutingDecisionParams): HomeRoutingDecision {
  const normalizedHost = normalizeHost(hostHeader);
  const normalizedTestnetHost = normalizeHost(testnetHost);
  const normalizedMainnetHost = normalizeHost(mainnetHost);

  if (
    normalizedHost &&
    normalizedTestnetHost &&
    normalizedMainnetHost &&
    normalizedHost === normalizedTestnetHost &&
    pathname === '/'
  ) {
    return {
      type: 'redirect',
      destinationHost: normalizedMainnetHost,
      statusCode: 307,
    };
  }

  return { type: 'next' };
}

export { normalizeHost };
