import { IMAGES_MAP } from '@/common/assets';

export function getFallbackMarketIcon(symbol: string | undefined) {
  if (!symbol) return undefined;

  const instIcons = IMAGES_MAP.instIcons as Record<string, string | undefined>;
  return instIcons[symbol];
}
