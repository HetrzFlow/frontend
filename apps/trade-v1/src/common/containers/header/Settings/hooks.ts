import { useMemo } from 'react';
import { useLingui } from '@lingui/react/macro';

export const useRPCTextMap = () => {
  const { t } = useLingui();

  const textMap: Record<string, string> = useMemo(() => {
    return {
      default: t`SUI Offical`,
      Custom: t`Custom RPC URL`,
    };
  }, [t]);

  return textMap;
};
