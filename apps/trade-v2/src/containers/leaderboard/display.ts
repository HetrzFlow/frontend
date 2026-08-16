import { LEADERBOARD_BACKEND_TODO_VALUE } from '@/services/rest/leaderboard';

export const LEADERBOARD_ASSET_BASE = '/trade-static/leaderboard';

export const EMPTY_VALUE = '--';

type LeaderboardRankBadge =
  | { kind: 'image'; rank: 1 | 2 | 3 }
  | { kind: 'text'; value: string };

export const resolveLeaderboardRankBadge = (
  rank?: number,
): LeaderboardRankBadge => {
  if (typeof rank !== 'number' || !Number.isInteger(rank) || rank < 1) {
    return { kind: 'text', value: EMPTY_VALUE };
  }

  if (rank <= 3) {
    return { kind: 'image', rank: rank as 1 | 2 | 3 };
  }

  return { kind: 'text', value: String(rank) };
};

export const withUsdPrefix = (value?: string, showPlus = false) => {
  const text = value?.trim();

  if (!text) {
    return EMPTY_VALUE;
  }

  if (text === EMPTY_VALUE || text === LEADERBOARD_BACKEND_TODO_VALUE) {
    return text;
  }

  if (text.includes('$')) {
    return showPlus && !text.startsWith('-') && !text.startsWith('+')
      ? `+${text}`
      : text;
  }

  const sign = text.startsWith('-') ? '-' : showPlus ? '+' : '';
  const unsignedText = text.replace(/^[+-]/, '');

  return `${sign}$${unsignedText}`;
};

export const formatLeaderboardRank = ({
  rank,
  rankPercent,
}: {
  rank?: number;
  rankPercent?: string;
}) => {
  if (!rank) {
    return EMPTY_VALUE;
  }

  if (rank <= 100) {
    return `#${rank}`;
  }

  if (rankPercent) {
    return `top ${formatLeaderboardRankPercent(rankPercent)}`;
  }

  return EMPTY_VALUE;
};

export const formatLeaderboardRankPercent = (rankPercent: string) => {
  const percentText = rankPercent.endsWith('%')
    ? rankPercent
    : `${rankPercent}%`;
  return percentText.startsWith('top ') ? percentText.slice(4) : percentText;
};

export const getPnlTextClassName = (value?: string) => {
  const text = value?.trim();

  if (
    !text ||
    text === EMPTY_VALUE ||
    text === LEADERBOARD_BACKEND_TODO_VALUE
  ) {
    return 'text-white';
  }

  return text.startsWith('-') ? 'text-down' : 'text-up';
};
