import { useLingui } from '@lingui/react/macro';
import { EMPTY_DISPLAY } from '@repo/lib/format';

export const useFormatDistanceToNow = (timestamp: number, now = Date.now()) => {
  const { t } = useLingui();

  if (!timestamp) {
    return EMPTY_DISPLAY;
  }

  const diffSeconds = (now - timestamp) / 1000;

  if (diffSeconds <= 5) {
    return t`just now`;
  }

  if (diffSeconds <= 3600) {
    const minutes = Math.max(1, Math.floor(diffSeconds / 60));
    return t`${minutes} m`;
  }

  const hours = Math.floor(diffSeconds / 60 / 60);
  return t`${hours} h`;
};
