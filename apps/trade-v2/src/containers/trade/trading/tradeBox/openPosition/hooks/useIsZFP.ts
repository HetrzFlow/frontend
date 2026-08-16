import { useInstStore } from '@/common/stores';
import { useHasZFP } from '@/hooks/trade/useHasZFP';
import { useTradeGlobalStore } from '@/stores/trade/global';
import { usePreferenceStore } from '@/stores/trade/preference';

/**
 * Returns true only when both conditions are met:
 * 1. The user has selected "hyper" leverage mode in preferences
 * 2. The currently selected market has isZFPEnabled=true in contract config
 */
export const useIsZFP = (): boolean => {
  const leverageMode = usePreferenceStore((state) => state.leverageMode);
  const instId = useTradeGlobalStore((state) => state.instId);
  const inst = useInstStore((state) => state.getInst(state, instId));
  const supportsHyper = useHasZFP(inst);
  return leverageMode === 'hyper' && supportsHyper;
};
