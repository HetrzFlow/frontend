import { useMemo } from 'react';
import {
  useHlvListQuery,
  useHzvMarketsInfoQuery,
} from '../queries/useHzvMarketsQuery';
import type { HlvInfoData } from '../types';
import type { Address } from 'viem';

export interface useHzvMarketsDataRequestParams {
  marketsInfoData?: Record<Address, unknown>;
  account?: Address;
  enabled?: boolean;
  refreshInterval?: number;
  vaultAddresses?: Address[];
}

export interface useHzvMarketsDataRequestResult {
  hlvData: HlvInfoData | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  dataUpdatedAt: number;
  refetch: () => void;
}

export function useHzvMarketsDataRequest({
  marketsInfoData,
  account,
  enabled = true,
  refreshInterval,
  vaultAddresses,
}: useHzvMarketsDataRequestParams): useHzvMarketsDataRequestResult {
  const {
    data: hlvListResult,
    isLoading: isListLoading,
    isFetching: isListFetching,
    isError: isListError,
  } = useHlvListQuery({ enabled });

  const {
    data: hlvInfoResult,
    isLoading: isInfoLoading,
    isFetching: isInfoFetching,
    isError: isInfoError,
    dataUpdatedAt,
    refetch,
  } = useHzvMarketsInfoQuery({
    hlvList: hlvListResult?.hlvList,
    marketsInfoData,
    account,
    enabled: enabled && !!hlvListResult?.hlvList,
    refreshInterval,
    vaultAddresses,
  });

  const hlvData = useMemo(() => {
    return hlvInfoResult?.hlvData;
  }, [hlvInfoResult]);

  return {
    hlvData,
    isLoading: isListLoading || isInfoLoading,
    isFetching: isListFetching || isInfoFetching,
    isError: isListError || isInfoError,
    dataUpdatedAt,
    refetch,
  };
}
