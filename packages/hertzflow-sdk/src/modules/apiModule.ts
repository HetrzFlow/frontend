import { FetchErrorCode, HertzflowError } from '../errors/errors';
import { SafeNumber, SuiAddress } from '../types';
import {
  DATA_STATISTICS_QUERY,
  ORACLE_AGGREGATOR,
} from '../utils/http-utils/const';

export interface ApiResponse<T> {
  code: number;
  data: T;
  is_success: boolean;
  msg: string;
}

export interface Page {
  page: number;
  size: number;
  total: number;
}

export interface PageParams {
  page: number;
  page_size: number;
}

export interface PriceDataItem {
  symbol: string;
  coin_type: string;
  timestamp: number;
  fixed_point_price: number;
  fixed_point_expo: number;
  signature: string;
}

export type SignedPriceData = {
  content: Array<PriceDataItem>;
};

export type DashboardDetailResponse = {
  long_position: SafeNumber;
  long_position_change: SafeNumber;
  open_interest: SafeNumber;
  open_interest_change: SafeNumber;
  short_position: SafeNumber;
  short_position_change: SafeNumber;
  total_fee: SafeNumber;
  total_fee_change: SafeNumber;
  total_liquidity_value: SafeNumber;
  total_liquidity_value_change: SafeNumber;
  total_users: number;
  total_users_change: number;
  total_volume: SafeNumber;
  total_volume_change: SafeNumber;
};

export type LatestHZLPDetailResponse = {
  hzlp_price: SafeNumber;
  total_supply: SafeNumber;
  market_cap: SafeNumber;
  hzlp_decimal: number;
  hzlp_price_display_precision: number;
  coin_type: string;
  symbol: string;
  coin_name: string;
  apy: SafeNumber;
};

export type PerpableTokensResponse = {
  items: Array<{
    coin_type: string;
    coin_name: string;
    coin_decimals: number;
    pool_amount: SafeNumber;
    reserved_amount: SafeNumber;
    usdc_decimals: number;
    usdc_pool_amount: SafeNumber;
    usdc_reserved_amount: SafeNumber;
    max_global_long_size: SafeNumber;
    max_global_short_size: SafeNumber;
    long_position_interest: SafeNumber;
    short_position_interest: SafeNumber;
  }>;
};

export type TokenWhitelistResponse = {
  items: Array<{
    coin_type: string;
    coin_decimals: number;
    coin_name: string;
    coin_full_name: string;
  }>;
  total: number;
};

export type PoolDetailResponse = {
  total_liquidity: string;
  limit: string;
  coin_details: [
    {
      coin_name: string;
      coin_type: string;
      coin_amount: number;
      target_weight: number;
      utilization: number;
      apr: {
        '1m': string;
        '24h': string;
        '7d': string;
      };
    },
  ];
};

export type UserHzLPActivityParams = {
  user_addr: SuiAddress;
} & PageParams;

export type UserHzLPActivityResponse = {
  items: Array<{
    id: string;
    order_creator: string;
    sender: SuiAddress;
    order_id: SuiAddress;
    tx_digest: string;
    order_status: number;
    create_timestamp_ms: number;
    execute_timestamp_ms: number;
    cancel_timestamp_ms: number;
    input_coin: string;
    input_amount: string;
    output_coin: string;
    min_out: string;
    trigger_price: string;
    trigger_price_above_allowed: boolean;
    execution_fee: string;
    is_buy_hzlp: true;
    volume_usd_value: string;
    create_at: string;
    update_at: string;
  }>;
} & Page;

export type HzLPLiquidityHistoryResponse = {
  items: Array<{
    timestamp: number;
    liquidity: SafeNumber;
  }>;
};

export enum PositionType {
  LIMIT = 'limit',
  MARKET = 'market',
}

export enum PositionEventType {
  OPEN_LONG = 'open_long',
  CLOSE_LONG = 'close_long',
  INCREASE_LONG = 'increase_long',
  DECREASE_LONG = 'decrease_long',
  OPEN_SHORT = 'open_short',
  CLOSE_SHORT = 'close_short',
  INCREASE_SHORT = 'increase_short',
  DECREASE_SHORT = 'decrease_short',
  LIQUIDATED = 'liquidated',
}

export enum SortType {
  DESC = 'desc',
  ASC = 'asc',
}
export type PositionHistoryParams = {
  user_addr: SuiAddress;
  position_type?: PositionType;
  action?: PositionEventType;
  index_coin?: string;
  sort_by?: SafeNumber;
  sort?: SortType;
} & PageParams;

export type PositionHistoryResponse = {
  items: Array<{
    tx_digest: string;
    position_key: SuiAddress;
    position_owner: SuiAddress;
    event_type: PositionEventType;
    direction: string;
    position_type: PositionType;
    size_delta: SafeNumber;
    collateral_delta: SafeNumber;
    collateral_coin: string;
    index_coin: string;
    fee: SafeNumber;
    price: SafeNumber;
    pnl: SafeNumber;
    timestamp: number;
  }>;
} & Page;

export enum MetricType {
  ACTIVITY = 'dashboard_metric_activity',
  CUMULATIVE = 'dashboard_metric_cumulative',
  HZLP = 'dashboard_metric_hzlp',
}

export type DashboardMetricParams = {
  from: number;
  to: number;
};

export type DashboardMetricPublicResponse = DashboardMetricParams & {
  metric_type: MetricType;
};

export type DashboardMetricActivityValue = {
  timestamp: number;
  value: {
    trade_volume: SafeNumber;
    swap_volume: SafeNumber;
    mint_volume: SafeNumber;
    burn_volume: SafeNumber;
    total_volume: SafeNumber;
    trade_fee: SafeNumber;
    swap_fee: SafeNumber;
    mint_fee: SafeNumber;
    burn_fee: SafeNumber;
    borrow_fee: SafeNumber;
    total_fee: SafeNumber;
    liquidate_fee: SafeNumber;
    profit: SafeNumber;
    loss: SafeNumber;
    pnl: SafeNumber;
    trade_user: number;
    swap_user: number;
    mint_user: number;
    burn_user: number;
    total_user: number;
  };
};

export type DashboardMetricActivityResponse = DashboardMetricPublicResponse & {
  data: Array<DashboardMetricActivityValue>;
};

export type DashboardMetricCumulativeValue = {
  timestamp: number;
  value: {
    cumulative_total_volume: SafeNumber;
    cumulative_total_fee: SafeNumber;
    cumulative_user_profit: SafeNumber;
    cumulative_user_loss: SafeNumber;
    cumulative_user_pnl: SafeNumber;
    cumulative_total_user: number;
  };
};

export type DashboardMetricCumulativeResponse =
  DashboardMetricPublicResponse & {
    data: Array<DashboardMetricCumulativeValue>;
  };

export type DashboardMetricHzlpValue = {
  timestamp: number;
  value: {
    total_hzlp_liquidity: SafeNumber;
    total_hzlp_supply: SafeNumber;
    long_position_value: SafeNumber;
    short_position_value: SafeNumber;
    tokens: Array<{
      coin_type: SuiAddress;
      pool_amount: SafeNumber;
      reserved_amount: SafeNumber;
      price_usd: SafeNumber;
      pool_usd: SafeNumber;
      reserved_usd: SafeNumber;
      composition: SafeNumber;
    }>;
  };
};

export type DashboardMetricHzlpResponse = DashboardMetricPublicResponse & {
  data: Array<DashboardMetricHzlpValue>;
};

export type Price24hType = {
  coin_type: string;
  coin_name: string;
  symbol: string;
  high_price: string;
  low_price: string;
  open_price: string;
  volume: string;

  timestamp: number;
  data_points: number;
};

export type Prices24hResponse = {
  items: Price24hType[];
  total: number;
};

export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  baseUrl?: string;
}

interface GetOptions extends RequestOptions {
  params?: Record<string, any>;
}

interface PostOptions extends RequestOptions {
  params?: Record<string, any>;
}

export const PREFIX = '/api/v1';
export const DEFAULT_BASE_URL = 'https://api-testnet.htzfl.link';
export const ORACLE_BASE_URL = 'https://api-testnet.hertzflow.xyz';

export class ApiModule {
  private _baseUrl: string;

  constructor(options: { url?: string } = {}) {
    this._baseUrl = options.url || DEFAULT_BASE_URL;
  }

  private async get<T>(endpoint: string, options: GetOptions = {}): Promise<T> {
    const { params, ...requestOptions } = options;
    const response = await this.request<T>(
      endpoint,
      'GET',
      undefined,
      requestOptions,
      params,
    );
    return response;
  }

  private async post<T>(
    endpoint: string,
    body?: any,
    options: PostOptions = {},
  ): Promise<T> {
    const { params, ...requestOptions } = options;
    const response = await this.request<T>(
      endpoint,
      'POST',
      body,
      requestOptions,
      params,
    );
    return response;
  }

  private async put<T>(
    endpoint: string,
    body?: any,
    options: PostOptions = {},
  ): Promise<T> {
    const { params, ...requestOptions } = options;
    const response = await this.request<T>(
      endpoint,
      'PUT',
      body,
      requestOptions,
      params,
    );
    return response;
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: any,
    options: RequestOptions = {},
    params?: Record<string, any>,
  ): Promise<T> {
    const { headers = {}, timeout = 30000, retries = 3, baseUrl } = options;

    const _finalHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    let queryString = '';
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      queryString = searchParams.toString();
    }

    for (let _attempt = 1; _attempt <= retries; _attempt++) {
      try {
        const _controller = new AbortController();
        const _timeoutId = setTimeout(() => _controller.abort(), timeout);

        const _baseUrl = baseUrl || this._baseUrl;
        const _requestUrl = `${_baseUrl}${endpoint}${queryString ? `?${queryString}` : ''}`;
        const _requestConfig = {
          method,
          headers: _finalHeaders,
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: _controller.signal,
        };

        const _response = await fetch(_requestUrl, _requestConfig);
        clearTimeout(_timeoutId);

        let responseData: ApiResponse<T>;
        const contentType = _response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
          responseData = await _response.json();
        } else {
          const text = await _response.text();

          try {
            responseData = JSON.parse(text);
          } catch {
            if (!_response.ok) {
              throw new HertzflowError(
                `HTTP ${_response.status}: ${_response.statusText} - URL: ${_requestUrl}`,
                FetchErrorCode.FailedToFetchData,
              );
            }
            throw new HertzflowError(
              `Invalid response format from ${_requestUrl}`,
              FetchErrorCode.FailedToFetchData,
            );
          }
        }

        if (
          responseData &&
          typeof responseData === 'object' &&
          'code' in responseData
        ) {
          if (responseData.code === 200 && responseData.is_success !== false) {
            return responseData.data;
          } else {
            throw new HertzflowError(
              `API Error ${responseData.code}: ${responseData.msg || 'Unknown error'}`,
              FetchErrorCode.FailedToFetchData,
            );
          }
        }
        return responseData.data;
      } catch (error) {
        const _isLastAttempt = _attempt === retries;
        if (_isLastAttempt) {
          if (error instanceof HertzflowError) throw error;

          throw new HertzflowError(
            `Failed to ${method.toLowerCase()} ${endpoint} after ${retries} attempts`,
            FetchErrorCode.FailedToFetchData,
          );
        }

        const _retryDelay = 1000 * _attempt;
        await new Promise((_resolve) => setTimeout(_resolve, _retryDelay));
      }
    }
  }

  /**
   * TODO:
   * @deprecated  API
   */
  public async fetchSignedPrice(
    coinTypes?: string[],
    getAll: boolean = false,
  ): Promise<Array<PriceDataItem>> {
    const _params = new URLSearchParams();

    const _shouldGetAll = getAll;
    const _hasCoinTypes = coinTypes && coinTypes.length > 0;

    if (_shouldGetAll) {
      _params.append('get_all', 'true');
    } else if (_hasCoinTypes) {
      coinTypes.forEach((_coinType) => {
        _params.append('coin_types[]', _coinType);
      });
      _params.append('get_all', 'false');
    } else {
      throw new HertzflowError(
        'Either coinTypes must be provided or getAll must be true',
        FetchErrorCode.FailedToFetchData,
      );
    }

    const _queryString = _params.toString();

    const response = await this.get<SignedPriceData>(
      `${ORACLE_AGGREGATOR}${PREFIX}/signedPrices?${_queryString}`,
      { baseUrl: ORACLE_BASE_URL },
    );
    return response.content;
  }

  public async fetchSignedPriceV2(
    coinTypes?: string[],
    getAll: boolean = false,
  ): Promise<SignedPriceData> {
    const _params = new URLSearchParams();

    const _shouldGetAll = getAll;
    const _hasCoinTypes = coinTypes && coinTypes.length > 0;

    if (_shouldGetAll) {
      _params.append('get_all', 'true');
    } else if (_hasCoinTypes) {
      coinTypes.forEach((_coinType) => {
        _params.append('coin_types[]', _coinType);
      });
      _params.append('get_all', 'false');
    } else {
      throw new HertzflowError(
        'Either coinTypes must be provided or getAll must be true',
        FetchErrorCode.FailedToFetchData,
      );
    }

    const _queryString = _params.toString();

    const response = await this.get<SignedPriceData>(
      `${ORACLE_AGGREGATOR}${PREFIX}/signedPrices?${_queryString}`,
      { baseUrl: ORACLE_BASE_URL },
    );

    return response;
  }

  public async fetchDashboardDetail(
    params: DashboardMetricParams,
  ): Promise<DashboardDetailResponse> {
    return await this.get(
      `${DATA_STATISTICS_QUERY}${PREFIX}/dashboard/detail`,
      { params },
    );
  }

  public async fetchLatestHZLPDetail(): Promise<LatestHZLPDetailResponse> {
    return await this.get(`${DATA_STATISTICS_QUERY}${PREFIX}/latestHZLPDetail`);
  }

  public async fetchPerpableTokens(): Promise<PerpableTokensResponse> {
    return await this.get(`${DATA_STATISTICS_QUERY}${PREFIX}/tokens/perpable`);
  }

  public async fetchTokenWhitelist(): Promise<TokenWhitelistResponse> {
    return await this.get(`${DATA_STATISTICS_QUERY}${PREFIX}/tokens/whitelist`);
  }

  public async fetchPoolDetail(): Promise<PoolDetailResponse> {
    return await this.get(`${DATA_STATISTICS_QUERY}${PREFIX}/poolDetail`);
  }

  public async fetchUserHzLPActivity(
    params: UserHzLPActivityParams,
  ): Promise<UserHzLPActivityResponse> {
    return await this.get(
      `${DATA_STATISTICS_QUERY}${PREFIX}/address/hzlp/history`,
      {
        params,
      },
    );
  }

  public async fetchHzLPLiquidityHistory(): Promise<HzLPLiquidityHistoryResponse> {
    return await this.get(
      `${DATA_STATISTICS_QUERY}${PREFIX}/hzlp/liquidity/history`,
    );
  }

  public async fetchPositionHistory(
    params: PositionHistoryParams,
  ): Promise<PositionHistoryResponse> {
    return await this.get(
      `${DATA_STATISTICS_QUERY}${PREFIX}/address/position/history`,
      { params },
    );
  }

  public async fetchDashboardMetricActivity(
    params: DashboardMetricParams,
  ): Promise<DashboardMetricActivityResponse> {
    const mixedParams = { ...params, metric_type: MetricType.ACTIVITY };
    return await this.get(
      `${DATA_STATISTICS_QUERY}${PREFIX}/dashboard/metrics`,
      { params: mixedParams },
    );
  }
  public async fetchDashboardMetricCumulative(
    params: DashboardMetricParams,
  ): Promise<DashboardMetricCumulativeResponse> {
    const mixedParams = { ...params, metric_type: MetricType.CUMULATIVE };
    return await this.get(
      `${DATA_STATISTICS_QUERY}${PREFIX}/dashboard/metrics`,
      { params: mixedParams },
    );
  }
  public async fetchDashboardMetricHzlp(
    params: DashboardMetricParams,
  ): Promise<DashboardMetricHzlpResponse> {
    const mixedParams = { ...params, metric_type: MetricType.HZLP };
    return await this.get(
      `${DATA_STATISTICS_QUERY}${PREFIX}/dashboard/metrics`,
      { params: mixedParams },
    );
  }

  public async fetch24hPrices(): Promise<Prices24hResponse> {
    return await this.get(
      `${DATA_STATISTICS_QUERY}${PREFIX}/tokens/price/extremum`,
    );
  }
}
