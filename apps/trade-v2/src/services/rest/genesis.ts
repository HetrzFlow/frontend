const SUCCESS_CODE = 200;
const BSC_API_PATH = `${process.env.NEXT_PUBLIC_API_URL_BSC}/api/v1/bsc`;
const PREDEPOSIT_API_PATH = `${BSC_API_PATH}/predeposit`;

interface ApiEnvelope<T> {
  code?: number;
  msg?: string;
  message?: string;
  data?: T;
}

interface PredepositConfig {
  cash_rate: string;
  boost_multiplier: number;
  boost_threshold_days: number;
}

interface PredepositRank {
  rank: number | null;
  total_users: number;
  show_exact: boolean;
  percentile_label: string | null;
}

interface PredepositVaultOverview {
  market_address: string;
  token_symbol: string;
  total_deposits: string;
  matured_deposits: string;
  unmatured_deposits: string;
  matured_rewards: string;
  earned_rewards: string;
}

interface PredepositMeOverview {
  rank: PredepositRank | null;
  vaults: PredepositVaultOverview[];
}

interface PredepositOverview {
  early_birds: number;
  unmatured_deposits_usd: string;
  updated_at_ms: number;
}

// The backend is adding the personal pre-deposit endpoint. Keep this
// transport typed without imposing a stale response shape until that contract
// is finalized.
export type PredepositMe = Record<string, unknown>;

const unwrap = <T>(response: ApiEnvelope<T>, fallbackMessage: string): T => {
  const errorMessage =
    response.code !== undefined && response.code !== SUCCESS_CODE
      ? response.msg || response.message || fallbackMessage
      : undefined;

  if (errorMessage || response.data === undefined) {
    throw new Error(errorMessage || fallbackMessage);
  }

  return response.data;
};

const getPredeposit = async <T>(
  path: string,
  params?: Record<string, unknown>,
) => {
  // Keep the REST client out of the development Mock path. Besides avoiding
  // unnecessary client code, this lets the existing dependency-free Mock
  // flow tests continue to import this module directly with Node.
  const { get } = await import('@repo/lib/rest');
  return get<T>(`${PREDEPOSIT_API_PATH}${path}`, params);
};

const getBscApi = async <T>(path: string, params?: Record<string, unknown>) => {
  const { get } = await import('@repo/lib/rest');
  return get<T>(`${BSC_API_PATH}${path}`, params);
};

const postBscApi = async <T>(path: string, data: Record<string, unknown>) => {
  const { post } = await import('@repo/lib/rest');
  return post(`${BSC_API_PATH}${path}`, data) as Promise<T>;
};

const fetchPredepositConfig = async () =>
  unwrap(
    await getPredeposit<ApiEnvelope<PredepositConfig>>('/config'),
    'Failed to fetch pre-deposit config',
  );

const fetchPredepositMeOverview = async (walletAddress: string) =>
  unwrap(
    await getPredeposit<ApiEnvelope<PredepositMeOverview>>('/me-overview', {
      wallet_address: walletAddress,
    }),
    'Failed to fetch pre-deposit overview',
  );

export const fetchPredepositMe = async (walletAddress: string) =>
  unwrap(
    await getPredeposit<ApiEnvelope<PredepositMe>>('/me', {
      wallet_address: walletAddress,
    }),
    'Failed to fetch pre-deposit user data',
  );

const fetchPredepositOverview = async () =>
  unwrap(
    await getPredeposit<ApiEnvelope<PredepositOverview>>('/overview'),
    'Failed to fetch pre-deposit overview',
  );

// --- Types ---

export interface GenesisAsset {
  symbol: 'USD1' | 'USDT' | 'U';
  vaultAddress?: string;
  vaultName?: string;
  capToken: string;
  depositedToken: string;
  /** Vault TVL used as the frontend proxy for the Merits eligible-share pool. */
  meritsPoolUsd?: string;
}

export interface GenesisVaultConfig {
  seasonName: string;
  phase: 'not_started' | 'phase1' | 'phase2' | 'full' | 'ended';
  capToken: string;
  depositedToken: string;
  /** Aggregate Vault TVL used only by the Merits projection. */
  meritsPoolUsd?: string;
  apr: number;
  boostMultiplier: number;
  maturityDays: number;
  startMs: number;
  endMs: number;
  /** @deprecated Merits timing now comes from /merits/seasons and /epoch. */
  epochTotalMerit?: string;
  /** @deprecated Merits timing now comes from /merits/seasons and /epoch. */
  epochStartMs?: number;
  /** @deprecated Merits timing now comes from /merits/seasons and /epoch. */
  epochEndMs?: number;
  countdownSec: number | null;
  earlyBirds: number;
  rewardsLocked: string;
  meritsLocked: string;
  hzvExchangeRate: string;
  assets: GenesisAsset[];
}

export interface GenesisOverview {
  earlyBirds: number;
  unmaturedDepositsUsdRaw: string;
  updatedAtMs: number;
}

export interface GenesisMeritsSeason {
  seasonId: number;
  seasonName: string;
  status: string;
  startMs: number;
  endMs: number;
  durationDays: number;
  tracks: Array<'trading' | 'lp' | 'referral' | 'spot' | 'swap'>;
  totalSettledMerits: string;
}

export interface GenesisMeritsEpoch {
  seasonId: number;
  startMs: number;
  endMs: number;
  durationDays: number;
  poolTotal: string;
}

export interface GenesisLpEstimate {
  rewardShare: string;
  boostRewardShare: string;
  estimatedMerits: string;
  estimatedBoostMerits: string;
  estimated10xMerits: string;
  lpPoolTotal: string;
  boostMultiplier: string;
  boostExtraMultiplier: string;
  epochStartSec: number;
  epochEndSec: number;
  asOfSec: number;
}

export interface GenesisMeritsUserSummary {
  seasonId?: number;
  seasonCumulative: {
    trading: string;
    lp: string;
    referral: string;
    spot: string;
    total: string;
  };
  settledLpMerits: string;
  settledTotalMerits: string;
  settledLpBoostMerits: string;
}

export interface GenesisUserAssetRow {
  symbol: GenesisAsset['symbol'];
  vaultAddress?: string;
  vaultName?: string;
  deposited: string;
  maturedDeposits: string;
  unmaturedDeposits: string;
  unmaturedShares: string;
  earnedRewards: string;
  maturedRewards: string;
  claimable: string;
  claimed: string;
  unrealisedPnl: string;
  hzvBalance: string;
  /** Formatted tranche shares corresponding to `deposited`. */
  totalDepositsShares?: string;
  rewardsLocked: string;
  totalDepositsSharesRaw?: string;
  maturedDepositsSharesRaw?: string;
  unmaturedDepositsSharesRaw?: string;
  maturedRewardsRaw?: string;
  earnedRewardsRaw?: string;
}

export type GenesisActivityType = 'deposit' | 'withdraw' | 'claim';

export interface GenesisActivity {
  id: string;
  type: GenesisActivityType;
  symbol: GenesisAsset['symbol'];
  amount: string;
  createdAt: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface GenesisUserPosition {
  hasAcceptedAgreement: boolean;
  hasDeposited: boolean;
  totalDeposits: string;
  maturedDeposits: string;
  claimableCash: string;
  unrealisedPnl: string;
  rank: GenesisRank | null;
  perAsset: GenesisUserAssetRow[];
  activities: GenesisActivity[];
}

export type GenesisRank =
  | { type: 'exact'; rank: number }
  | { type: 'percentile'; percentile: number };

export interface GenesisSocialBinding {
  platform: 'x' | 'discord';
  bound: boolean;
  handle: string | null;
  avatarUrl: string | null;
}

export interface GenesisSocialState {
  boundSocials: GenesisSocialBinding[];
}

export interface GenesisClaimMutationInput {
  address: string;
  symbol: GenesisAsset['symbol'];
}

export interface GenesisSocialMutationInput {
  address: string;
  platform: GenesisSocialBinding['platform'];
}

export type GenesisSocialAction = 'bind' | 'unbind';

export interface GenesisSocialChallenge {
  message: string;
  nonce: string;
  exp: number;
}

export interface GenesisSocialChallengeInput
  extends GenesisSocialMutationInput {
  action: GenesisSocialAction;
}

export interface GenesisSocialSignedInput extends GenesisSocialMutationInput {
  nonce: string;
  signature: `0x${string}`;
}

export interface GenesisSocialBindInput extends GenesisSocialSignedInput {
  consent: true;
  consentTs?: number;
}

export interface GenesisSocialBindInitiation {
  authorizeUrl: string;
  state: string;
  exp: number;
}

interface SocialBindingsResponseItem {
  platform: 'discord' | 'twitter';
  bound: boolean;
  handle: string | null;
  avatar_url: string | null;
  bound_ts: number | null;
}

interface SocialBindingsResponse {
  wallet: string;
  items: SocialBindingsResponseItem[];
}

interface SocialChallengeResponse {
  message: string;
  nonce: string;
  exp: number;
}

interface SocialBindInitiateResponse {
  authorize_url: string;
  state: string;
  exp: number;
}

interface SocialUnbindResponse {
  platform: 'discord' | 'twitter';
  unbound: boolean;
}

export interface GenesisMutationResult {
  ok: true;
}

const EMPTY_SOCIAL_BINDINGS: GenesisSocialBinding[] = [
  { platform: 'x', bound: false, handle: null, avatarUrl: null },
  { platform: 'discord', bound: false, handle: null, avatarUrl: null },
];

const toSocialApiPlatform = (
  platform: GenesisSocialBinding['platform'],
): SocialBindingsResponseItem['platform'] =>
  platform === 'x' ? 'twitter' : 'discord';

const fromSocialApiPlatform = (
  platform: SocialBindingsResponseItem['platform'],
): GenesisSocialBinding['platform'] =>
  platform === 'twitter' ? 'x' : 'discord';

// Reward claiming is still a development Mock. Keep its state isolated from
// the live config, position, and vault-action data paths.
interface GenesisClaimMockState {
  position: Pick<GenesisUserPosition, 'perAsset' | 'activities'>;
}

const createClaimMockState = (): GenesisClaimMockState => ({
  position: {
    perAsset: [
      {
        symbol: 'USD1',
        deposited: '0',
        maturedDeposits: '0',
        unmaturedDeposits: '0',
        unmaturedShares: '0',
        earnedRewards: '0',
        maturedRewards: '40.00',
        claimable: '40.00',
        claimed: '0',
        unrealisedPnl: '0',
        hzvBalance: '0',
        rewardsLocked: '0',
      },
      {
        symbol: 'USDT',
        deposited: '0',
        maturedDeposits: '0',
        unmaturedDeposits: '0',
        unmaturedShares: '0',
        earnedRewards: '0',
        maturedRewards: '28.82',
        claimable: '28.82',
        claimed: '0',
        unrealisedPnl: '0',
        hzvBalance: '0',
        rewardsLocked: '0',
      },
    ],
    activities: [],
  },
});

const claimMockStateCache = new Map<string, GenesisClaimMockState>();

const readClaimMockState = (address: string) => {
  const walletKey = address.toLowerCase();
  const cached = claimMockStateCache.get(walletKey);
  if (cached) return cached;

  const state = createClaimMockState();
  claimMockStateCache.set(walletKey, state);
  return state;
};

const writeClaimMockState = (address: string, state: GenesisClaimMockState) => {
  claimMockStateCache.set(address.toLowerCase(), state);
};

const createClaimMockActivity = (
  symbol: GenesisAsset['symbol'],
  amount: number,
): GenesisActivity => ({
  id: globalThis.crypto.randomUUID(),
  type: 'claim',
  symbol,
  amount: String(amount),
  createdAt: new Date().toISOString(),
  status: 'completed',
});

const isGenesisAssetSymbol = (
  symbol: string,
): symbol is GenesisAsset['symbol'] =>
  symbol === 'USD1' || symbol === 'USDT' || symbol === 'U';

export const getGenesisRank = (
  rank: Awaited<ReturnType<typeof fetchPredepositMeOverview>>['rank'],
): GenesisRank | null => {
  if (!rank || rank.rank === null) return null;
  if (rank.show_exact) return { type: 'exact', rank: rank.rank };
  if (rank.total_users <= 0) return null;

  const percentile = Math.min(
    100,
    Math.max(5, Math.ceil((rank.rank / rank.total_users) * 20) * 5),
  );
  return { type: 'percentile', percentile };
};

// --- Service functions ---
// Deployed read and social-binding endpoints use the backend. Reward claiming
// remains on the development Mock until the contract integration is available.

export const fetchGenesisOverview = async (): Promise<GenesisOverview> => {
  const overview = await fetchPredepositOverview();
  return {
    earlyBirds: overview.early_birds,
    unmaturedDepositsUsdRaw: overview.unmatured_deposits_usd,
    updatedAtMs: overview.updated_at_ms,
  };
};

export const fetchGenesisVaultConfig =
  async (): Promise<GenesisVaultConfig> => {
    const apiConfig = await fetchPredepositConfig();
    return {
      seasonName: '',
      // The season endpoint determines lifecycle state. Keep the transport
      // config closed until that request resolves to an active season.
      phase: 'not_started',
      capToken: '0',
      depositedToken: '0',
      meritsPoolUsd: '0',
      apr: Number(apiConfig.cash_rate) * 100,
      boostMultiplier: apiConfig.boost_multiplier,
      maturityDays: apiConfig.boost_threshold_days,
      startMs: 0,
      endMs: 0,
      countdownSec: null,
      earlyBirds: 0,
      rewardsLocked: '0',
      meritsLocked: '0',
      hzvExchangeRate: '0',
      assets: [],
    };
  };

export const fetchGenesisMeritsSeasons = async (): Promise<
  GenesisMeritsSeason[]
> => {
  const response = await getBscApi<
    ApiEnvelope<{
      seasons: Array<{
        season_id: number;
        season_name: string;
        status: string;
        start_ms: number;
        end_ms: number;
        duration_days: number;
        tracks: Array<'trading' | 'lp' | 'referral' | 'spot' | 'swap'>;
        total_settled_merits: string;
      }>;
    }>
  >('/merits/seasons');
  return unwrap(response, 'Failed to fetch merits seasons').seasons.map(
    (season) => ({
      seasonId: season.season_id,
      seasonName: season.season_name,
      status: season.status,
      startMs: season.start_ms,
      endMs: season.end_ms,
      durationDays: season.duration_days,
      tracks: season.tracks,
      totalSettledMerits: season.total_settled_merits,
    }),
  );
};

export const fetchGenesisMeritsEpoch = async (
  seasonId: number,
): Promise<GenesisMeritsEpoch | null> => {
  const response = await getBscApi<
    ApiEnvelope<{
      season_id: number;
      epoch: {
        start_ms: number;
        end_ms: number;
        duration_days: number;
        pool_total: string;
      } | null;
    }>
  >(`/merits/seasons/${seasonId}/epoch`);
  const epoch = unwrap(response, 'Failed to fetch current merits epoch').epoch;
  return epoch
    ? {
        seasonId,
        startMs: epoch.start_ms,
        endMs: epoch.end_ms,
        durationDays: epoch.duration_days,
        poolTotal: epoch.pool_total,
      }
    : null;
};

export const fetchGenesisLpEstimate = async (
  walletAddress: string,
): Promise<GenesisLpEstimate> => {
  const response = await getBscApi<
    ApiEnvelope<{
      reward_share: string;
      boost_reward_share: string;
      estimated_merits: string;
      estimated_boost_merits: string;
      estimated_10x_merits: string;
      lp_pool_total: string;
      boost_multiplier: string;
      boost_extra_multiplier: string;
      epoch_start_sec: number;
      epoch_end_sec: number;
      as_of_sec: number;
    }>
  >('/merits/lp-estimate', {
    wallet_address: walletAddress.toLowerCase(),
  });
  const estimate = unwrap(response, 'Failed to fetch LP merits estimate');

  return {
    rewardShare: estimate.reward_share,
    boostRewardShare: estimate.boost_reward_share,
    estimatedMerits: estimate.estimated_merits,
    estimatedBoostMerits: estimate.estimated_boost_merits,
    estimated10xMerits: estimate.estimated_10x_merits,
    lpPoolTotal: estimate.lp_pool_total,
    boostMultiplier: estimate.boost_multiplier,
    boostExtraMultiplier: estimate.boost_extra_multiplier,
    epochStartSec: estimate.epoch_start_sec,
    epochEndSec: estimate.epoch_end_sec,
    asOfSec: estimate.as_of_sec,
  };
};

export const fetchGenesisMeritsUserSummary = async (
  walletAddress: string,
  seasonId?: number,
): Promise<GenesisMeritsUserSummary> => {
  const response = await getBscApi<
    ApiEnvelope<{
      season_id?: number;
      season_cumulative: {
        trading: string;
        lp: string;
        referral: string;
        spot: string;
        total: string;
      };
      lp_boost_merits: string;
    }>
  >('/merits/user-summary', {
    address: walletAddress.toLowerCase(),
    ...(seasonId === undefined ? {} : { season_id: seasonId }),
  });
  const summary = unwrap(response, 'Failed to fetch merits user summary');

  return {
    seasonId: summary.season_id,
    seasonCumulative: summary.season_cumulative,
    settledLpMerits: summary.season_cumulative.lp,
    settledTotalMerits: summary.season_cumulative.total,
    settledLpBoostMerits: summary.lp_boost_merits,
  };
};

export const fetchGenesisUserPosition = async (
  address: string,
): Promise<GenesisUserPosition> => {
  const overview = await fetchPredepositMeOverview(address);
  const perAsset = overview.vaults.map((vault) => ({
    // The live endpoint currently returns HFUSD here. The vault address is the
    // identity; useGenesisVaultData replaces this carrier value with the
    // mapped underlying symbol (USD1 or USDT).
    symbol: isGenesisAssetSymbol(vault.token_symbol)
      ? vault.token_symbol
      : ('USDT' as const),
    vaultAddress: vault.market_address,
    deposited: '0',
    maturedDeposits: '0',
    unmaturedDeposits: '0',
    unmaturedShares: '0',
    earnedRewards: '0',
    maturedRewards: '0',
    claimable: '0',
    claimed: '0',
    unrealisedPnl: '0',
    hzvBalance: '0',
    rewardsLocked: '0',
    totalDepositsSharesRaw: vault.total_deposits,
    maturedDepositsSharesRaw: vault.matured_deposits,
    unmaturedDepositsSharesRaw: vault.unmatured_deposits,
    maturedRewardsRaw: vault.matured_rewards,
    earnedRewardsRaw: vault.earned_rewards,
  }));

  return {
    // The page combines this API snapshot with its persisted access store.
    hasAcceptedAgreement: false,
    hasDeposited: overview.vaults.some(
      (vault) => BigInt(vault.total_deposits) > 0n,
    ),
    totalDeposits: '0',
    maturedDeposits: '0',
    claimableCash: '0',
    unrealisedPnl: '0',
    rank: getGenesisRank(overview.rank),
    perAsset,
    activities: [],
  };
};

export const fetchGenesisSocialState = async (
  address: string,
): Promise<GenesisSocialState> => {
  const boundSocials = await fetchGenesisSocialBindings(address);
  return {
    boundSocials,
  };
};

export const fetchGenesisSocialBindings = async (
  address: string,
): Promise<GenesisSocialBinding[]> => {
  const response = unwrap(
    await getBscApi<ApiEnvelope<SocialBindingsResponse>>('/social/bindings', {
      wallet: address.toLowerCase(),
    }),
    'Failed to fetch social bindings',
  );
  const itemsByPlatform = new Map(
    response.items.map((item) => [fromSocialApiPlatform(item.platform), item]),
  );

  return EMPTY_SOCIAL_BINDINGS.map((fallback) => {
    const item = itemsByPlatform.get(fallback.platform);
    return item
      ? {
          platform: fallback.platform,
          bound: item.bound,
          handle: item.handle,
          avatarUrl: item.avatar_url || null,
        }
      : { ...fallback };
  });
};

export const claimGenesisRewards = async ({
  address,
  symbol,
}: GenesisClaimMutationInput): Promise<GenesisMutationResult> => {
  const state = readClaimMockState(address);
  const row = state.position.perAsset.find((asset) => asset.symbol === symbol);
  if (!row) throw new Error('Vault asset is unavailable.');

  const claimable = Number(row.maturedRewards);
  if (claimable <= 0) throw new Error('No matured rewards to claim.');

  row.maturedRewards = '0';
  row.claimable = '0';
  row.claimed = String(Number(row.claimed) + claimable);
  row.earnedRewards = String(Number(row.earnedRewards) + claimable);
  state.position.activities.unshift(createClaimMockActivity(symbol, claimable));
  writeClaimMockState(address, state);
  return { ok: true };
};

export const createGenesisSocialChallenge = async ({
  address,
  platform,
  action,
}: GenesisSocialChallengeInput): Promise<GenesisSocialChallenge> => {
  const wallet = address.trim().toLowerCase();
  const apiPlatform = toSocialApiPlatform(platform);

  return unwrap(
    await postBscApi<ApiEnvelope<SocialChallengeResponse>>(
      '/social/challenge',
      {
        wallet,
        platform: apiPlatform,
        action,
      },
    ),
    'Failed to create social authorization challenge',
  );
};

export const initiateGenesisSocialBinding = async ({
  address,
  platform,
  nonce,
  signature,
  consent,
  consentTs,
}: GenesisSocialBindInput): Promise<GenesisSocialBindInitiation> => {
  const wallet = address.trim().toLowerCase();
  const apiPlatform = toSocialApiPlatform(platform);

  const response = unwrap(
    await postBscApi<ApiEnvelope<SocialBindInitiateResponse>>(
      '/social/bind/initiate',
      {
        wallet,
        platform: apiPlatform,
        nonce,
        signature,
        consent,
        consent_ts: consentTs,
      },
    ),
    'Failed to initiate social authorization',
  );

  return {
    authorizeUrl: response.authorize_url,
    state: response.state,
    exp: response.exp,
  };
};

export const unbindGenesisSocial = async ({
  address,
  platform,
  nonce,
  signature,
}: GenesisSocialSignedInput): Promise<{ unbound: true }> => {
  const wallet = address.trim().toLowerCase();
  const apiPlatform = toSocialApiPlatform(platform);

  const response = unwrap(
    await postBscApi<ApiEnvelope<SocialUnbindResponse>>('/social/unbind', {
      wallet,
      platform: apiPlatform,
      nonce,
      signature,
    }),
    'Failed to disconnect social account',
  );
  if (!response.unbound) {
    throw new Error('The social account was not disconnected.');
  }
  return { unbound: true };
};
