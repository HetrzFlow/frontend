'use client';

import {
  createContext,
  type FC,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { calc } from '@repo/lib/calc';

const CLAIM_OPTIMISTIC_TIMEOUT = 60_000;

type ClaimOptimisticState = {
  claimedPriceImpactKeys: Set<string>;
  optimisticTotalClaimedUsd: string | null;
  optimisticStartedAt: number | null;
};

type ClaimOptimisticContextValue = ClaimOptimisticState & {
  setClaimOptimistic: (params: {
    priceImpactKeys: string[];
    claimedUsd: string;
    currentTotalClaimedUsd: string;
  }) => void;
  reconcileClaimOptimistic: (params: {
    rawTotalClaimedUsd?: string;
    rawPriceImpactKeys?: string[];
  }) => void;
};

const INITIAL_STATE: ClaimOptimisticState = {
  claimedPriceImpactKeys: new Set(),
  optimisticTotalClaimedUsd: null,
  optimisticStartedAt: null,
};

const ClaimOptimisticContext =
  createContext<ClaimOptimisticContextValue | null>(null);

export const ClaimOptimisticProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const [state, setState] = useState<ClaimOptimisticState>(INITIAL_STATE);

  const setClaimOptimistic = useCallback<
    ClaimOptimisticContextValue['setClaimOptimistic']
  >(({ priceImpactKeys, claimedUsd, currentTotalClaimedUsd }) => {
    setState((currentState) => {
      const currentTotal = calc(currentTotalClaimedUsd);
      const optimisticTotal = calc(
        currentState.optimisticTotalClaimedUsd ?? currentTotalClaimedUsd,
      );
      const baseTotal = optimisticTotal.gt(currentTotal)
        ? optimisticTotal
        : currentTotal;

      return {
        claimedPriceImpactKeys: new Set([
          ...currentState.claimedPriceImpactKeys,
          ...priceImpactKeys,
        ]),
        optimisticTotalClaimedUsd: baseTotal.plus(claimedUsd).toFixed(),
        optimisticStartedAt: Date.now(),
      };
    });
  }, []);

  const reconcileClaimOptimistic = useCallback<
    ClaimOptimisticContextValue['reconcileClaimOptimistic']
  >(({ rawTotalClaimedUsd, rawPriceImpactKeys }) => {
    setState((currentState) => {
      if (currentState.optimisticStartedAt === null) return currentState;

      const rawPriceImpactKeySet = rawPriceImpactKeys
        ? new Set(rawPriceImpactKeys)
        : undefined;
      const claimedPriceImpactKeys = rawPriceImpactKeySet
        ? new Set(
            [...currentState.claimedPriceImpactKeys].filter((key) =>
              rawPriceImpactKeySet.has(key),
            ),
          )
        : currentState.claimedPriceImpactKeys;
      const rawTotalCaughtUp =
        rawTotalClaimedUsd !== undefined &&
        currentState.optimisticTotalClaimedUsd !== null &&
        calc(rawTotalClaimedUsd).gte(
          currentState.optimisticTotalClaimedUsd,
        );
      const optimisticTotalClaimedUsd = rawTotalCaughtUp
        ? null
        : currentState.optimisticTotalClaimedUsd;
      const reconciliationComplete =
        optimisticTotalClaimedUsd === null &&
        claimedPriceImpactKeys.size === 0;

      return {
        claimedPriceImpactKeys,
        optimisticTotalClaimedUsd,
        optimisticStartedAt: reconciliationComplete
          ? null
          : currentState.optimisticStartedAt,
      };
    });
  }, []);

  useEffect(() => {
    if (state.optimisticStartedAt === null) return;

    const timeoutId = window.setTimeout(() => {
      setState(INITIAL_STATE);
    }, CLAIM_OPTIMISTIC_TIMEOUT);

    return () => window.clearTimeout(timeoutId);
  }, [state.optimisticStartedAt]);

  const value = useMemo<ClaimOptimisticContextValue>(
    () => ({
      ...state,
      setClaimOptimistic,
      reconcileClaimOptimistic,
    }),
    [reconcileClaimOptimistic, setClaimOptimistic, state],
  );

  return (
    <ClaimOptimisticContext.Provider value={value}>
      {children}
    </ClaimOptimisticContext.Provider>
  );
};

export const useClaimOptimistic = () => {
  const context = useContext(ClaimOptimisticContext);
  if (!context) {
    throw new Error(
      'useClaimOptimistic must be used within ClaimOptimisticProvider',
    );
  }
  return context;
};
