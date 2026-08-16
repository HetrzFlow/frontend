export const REFERRAL_SHARE_TITLE = 'Save up to 5% on every trade on HertzFlow';
export const REFERRAL_SHARE_DESCRIPTION =
  'Trade & Earn on any asset with leverage - 100% self-custodial.';
export const REFERRAL_SHARE_HEADLINE = "Let's trade on HertzFlow together";
export const SOCIAL_SHARE_IMAGE_SIZE = { width: 1200, height: 630 } as const;
export const SOCIAL_SHARE_IMAGE_VERSION = '2';
const REFERRAL_SHARE_COPY =
  'Enjoy up to 5% lifetime trading fee discounts on HertzFlow.';
const REFERRAL_SHARE_CODE_COPY = 'Trade & Earn on any asset with my code';
const CREDIT_AIRDROP_SHARE_TYPE = 'credit-airdrop';
const LEADERBOARD_SHARE_TYPE = 'leaderboard';

const REFERRAL_CODE_PATTERN = /^[A-Za-z0-9_-]{1,16}$/;
const SHARE_CRAWLER_PATTERN =
  /Twitterbot|facebookexternalhit|TelegramBot|Discordbot|LinkedInBot|Slackbot/i;

export type CreditAirdropShareValues = {
  creditAmount: string;
  hzflAmount: string;
  pointsAmount: string;
  seasonName: string;
  referredUsers: string;
  referredVolume: string;
  isWindowOpen: boolean;
};

export type LeaderboardShareValues = {
  totalVolume: string;
  netPnl: string;
  winRate: string;
  rank: string;
  degens: string;
};

export const isValidReferralCode = (code: string) =>
  REFERRAL_CODE_PATTERN.test(code);

export const isShareCrawler = (userAgent: string | null) =>
  SHARE_CRAWLER_PATTERN.test(userAgent ?? '');

export const buildShortShareUrl = (
  origin: string,
  code: string,
  searchParams?: Record<string, string | number | undefined>,
  pathname = '/referral',
) => {
  const url = new URL(pathname, origin);
  url.searchParams.set('ref', code);

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value === undefined || value === '') return;
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
};

export const buildReferralShareText = (code: string) =>
  `${REFERRAL_SHARE_COPY}\n\n${REFERRAL_SHARE_CODE_COPY}: ${code}`;

export const buildDiscordShareMessage = (
  origin: string,
  code: string,
  pathname = '/referral',
) =>
  `${buildReferralShareText(code)}\n\n${buildShortShareUrl(origin, code, undefined, pathname)}`;

const normalizeShareSearchValue = (
  value: string | string[] | null | undefined,
  fallback: string,
) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const normalizedValue = rawValue?.trim();

  return normalizedValue ? normalizedValue.slice(0, 48) : fallback;
};

export const getCreditAirdropShareSearchParams = ({
  creditAmount,
  hzflAmount,
  pointsAmount,
  seasonName,
  referredUsers,
  referredVolume,
  isWindowOpen,
}: CreditAirdropShareValues) => ({
  type: CREDIT_AIRDROP_SHARE_TYPE,
  credit: creditAmount,
  hzfl: hzflAmount,
  points: pointsAmount,
  season: seasonName,
  referred_users: referredUsers,
  referred_volume: referredVolume,
  window_open: isWindowOpen ? '1' : '0',
});

export const buildCreditAirdropShareUrl = (
  origin: string,
  code: string,
  values: CreditAirdropShareValues,
) =>
  buildShortShareUrl(origin, code, getCreditAirdropShareSearchParams(values));

export const getLeaderboardShareSearchParams = ({
  totalVolume,
  netPnl,
  winRate,
  rank,
  degens,
}: LeaderboardShareValues) => ({
  type: LEADERBOARD_SHARE_TYPE,
  volume: totalVolume,
  pnl: netPnl,
  winRate,
  rank,
  degens,
});

export const buildLeaderboardShareUrl = (
  origin: string,
  code: string,
  values: LeaderboardShareValues,
) => buildShortShareUrl(origin, code, getLeaderboardShareSearchParams(values));

export const buildLeaderboardReferralShareUrl = (
  origin: string,
  values: LeaderboardShareValues,
) => {
  const url = new URL('/referral', origin);

  Object.entries(getLeaderboardShareSearchParams(values)).forEach(
    ([key, value]) => {
      if (value === undefined || value === '') return;
      url.searchParams.set(key, String(value));
    },
  );

  return url.toString();
};

export const buildLeaderboardShareText = (
  code: string,
  values: LeaderboardShareValues,
) => {
  const rank = /^\d+$/.test(values.rank) ? `#${values.rank}` : values.rank;
  const lines = [
    `Ranked ${rank} among ${values.degens} degens on @HertzFlow`,
    `${values.totalVolume} aped · PnL ${values.netPnl}`,
    'Talk is cheap. Show your PnL.',
  ];

  if (code) {
    lines.push('', `${REFERRAL_SHARE_CODE_COPY}: ${code}`);
  }

  return lines.join('\n');
};

export const buildLeaderboardShareMessage = (
  origin: string,
  code: string,
  values: LeaderboardShareValues,
) =>
  `${buildLeaderboardShareText(code, values)}\n\n${
    code
      ? buildLeaderboardShareUrl(origin, code, values)
      : buildLeaderboardReferralShareUrl(origin, values)
  }`;

export const buildCreditAirdropShareText = (
  code: string,
  values: CreditAirdropShareValues,
) =>
  `Just claimed my airdrop on HertzFlow. ${values.creditAmount} Credit + ${values.hzflAmount} Token earned. Trade any asset with leverage and start earning yours.\nUse my code ${code}:`;

export const buildCreditAirdropShareMessage = (
  origin: string,
  code: string,
  values: CreditAirdropShareValues,
) =>
  `${buildCreditAirdropShareText(code, values)} ${buildCreditAirdropShareUrl(
    origin,
    code,
    values,
  )}`;

export const resolveCreditAirdropShareValues = (
  searchParams:
    | URLSearchParams
    | Record<string, string | string[] | null | undefined>,
) => {
  const getValue = (key: string) => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key);
    }

    return searchParams[key];
  };

  if (getValue('type') !== CREDIT_AIRDROP_SHARE_TYPE) {
    return null;
  }

  return {
    creditAmount: normalizeShareSearchValue(getValue('credit'), '0'),
    hzflAmount: normalizeShareSearchValue(getValue('hzfl'), '0'),
    pointsAmount: normalizeShareSearchValue(getValue('points'), '0'),
    seasonName: normalizeShareSearchValue(getValue('season'), 'All Seasons'),
    referredUsers: normalizeShareSearchValue(getValue('referred_users'), '0'),
    referredVolume: normalizeShareSearchValue(getValue('referred_volume'), '0'),
    isWindowOpen: getValue('window_open') === '1',
  } satisfies CreditAirdropShareValues;
};

export const resolveLeaderboardShareValues = (
  searchParams:
    | URLSearchParams
    | Record<string, string | string[] | null | undefined>,
) => {
  const getValue = (key: string) => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key);
    }

    return searchParams[key];
  };

  if (getValue('type') !== LEADERBOARD_SHARE_TYPE) {
    return null;
  }

  return {
    totalVolume: normalizeShareSearchValue(getValue('volume'), '--'),
    netPnl: normalizeShareSearchValue(getValue('pnl'), '--'),
    winRate: normalizeShareSearchValue(getValue('winRate'), 'TBD'),
    rank: normalizeShareSearchValue(getValue('rank'), '--'),
    degens: normalizeShareSearchValue(getValue('degens'), '--'),
  } satisfies LeaderboardShareValues;
};

export const resolveRequestOrigin = (headers: Pick<Headers, 'get'>) => {
  const host =
    headers.get('x-forwarded-host') ?? headers.get('host') ?? 'localhost:3002';
  const protocol =
    headers.get('x-forwarded-proto') ??
    (host.startsWith('localhost') || host.startsWith('127.0.0.1')
      ? 'http'
      : 'https');

  return `${protocol}://${host}`;
};
