export type ExclusiveTierCode = 'alpha' | 'og' | 'sigma';

export type ExclusiveTierRow = {
  id: ExclusiveTierCode;
  tierId: number;
  label: string;
  l1RebateBps: number;
  l2RebateBps: number;
  discountBps: number;
};

export const EXCLUSIVE_TIER_ROWS: readonly ExclusiveTierRow[] = [
  {
    id: 'alpha',
    tierId: 1001,
    label: 'Alpha',
    l1RebateBps: 3000,
    l2RebateBps: 1500,
    discountBps: 500,
  },
  {
    id: 'og',
    tierId: 1002,
    label: 'OG',
    l1RebateBps: 3000,
    l2RebateBps: 1500,
    discountBps: 500,
  },
  {
    id: 'sigma',
    tierId: 1003,
    label: 'Sigma',
    l1RebateBps: 3500,
    l2RebateBps: 2000,
    discountBps: 500,
  },
];

const EXCLUSIVE_TIER_CODES = new Set<ExclusiveTierCode>([
  'alpha',
  'og',
  'sigma',
]);

export const getExclusiveTierCode = (
  currentTierId?: number,
  hiddenTierCode?: string,
): ExclusiveTierCode | undefined => {
  const tierById = EXCLUSIVE_TIER_ROWS.find(
    (row) => row.tierId === currentTierId,
  );
  if (tierById) return tierById.id;

  const normalizedCode = hiddenTierCode?.trim().toLowerCase();
  return normalizedCode &&
    EXCLUSIVE_TIER_CODES.has(normalizedCode as ExclusiveTierCode)
    ? (normalizedCode as ExclusiveTierCode)
    : undefined;
};

export const getVisibleExclusiveTierRows = (
  exclusiveTierCode?: ExclusiveTierCode,
): readonly ExclusiveTierRow[] => {
  if (exclusiveTierCode === 'og') {
    return EXCLUSIVE_TIER_ROWS.filter((row) => row.id === 'og');
  }
  if (exclusiveTierCode === 'alpha' || exclusiveTierCode === 'sigma') {
    return EXCLUSIVE_TIER_ROWS.filter((row) => row.id !== 'og');
  }
  return [];
};
