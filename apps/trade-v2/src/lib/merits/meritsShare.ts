export const MERITS_SHARE_TYPE = 'merits';
export const MERITS_SHARE_IMAGE_SIZE = { width: 856, height: 596 } as const;
export const MERITS_SHARE_IMAGE_VERSION = '1';

export type MeritsShareValues = {
  inviteCode: string;
  merits: string;
  estimate: string | null;
  rank: string;
};

const normalizeShareValue = (
  value: string | string[] | null | undefined,
  fallback: string,
) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const normalizedValue = rawValue?.trim();

  return normalizedValue ? normalizedValue.slice(0, 48) : fallback;
};

export const getMeritsShareSearchParams = ({
  inviteCode,
  merits,
  estimate,
  rank,
}: MeritsShareValues) => ({
  type: MERITS_SHARE_TYPE,
  invite: inviteCode,
  merits,
  ...(estimate === null ? {} : { estimate }),
  rank,
});

export const buildMeritsShareUrl = (
  shareLink: string,
  values: MeritsShareValues,
) => {
  const url = new URL(shareLink);

  Object.entries(getMeritsShareSearchParams(values)).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url.toString();
};

export const resolveMeritsShareValues = (
  searchParams:
    | URLSearchParams
    | Record<string, string | string[] | null | undefined>,
) => {
  const getValue = (key: string) =>
    searchParams instanceof URLSearchParams
      ? searchParams.get(key)
      : searchParams[key];

  if (getValue('type') !== MERITS_SHARE_TYPE) return null;

  const estimate = normalizeShareValue(getValue('estimate'), '');

  return {
    inviteCode: normalizeShareValue(getValue('invite'), ''),
    merits: normalizeShareValue(getValue('merits'), '0'),
    estimate: estimate || null,
    rank: normalizeShareValue(getValue('rank'), 'Unranked'),
  } satisfies MeritsShareValues;
};
