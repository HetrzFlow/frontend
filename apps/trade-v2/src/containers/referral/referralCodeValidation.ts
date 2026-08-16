export const REFERRAL_CODE_LENGTH = 6;

export function normalizeReferralCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, REFERRAL_CODE_LENGTH);
}

export function isValidReferralCode(code: string): boolean {
  return code.length === REFERRAL_CODE_LENGTH && !/^[0-9]+$/.test(code);
}
