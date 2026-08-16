import { CoinBalance } from '@mysten/sui/client';
import { SuiAddress, CoinAsset, Package } from './types';
import {
  VaultModule,
  RpcModule,
  OracleModule,
  OracleStorageModule,
  QueryModule,
  OrderModule,
  PositionModule,
} from './modules';
import { CachedContent, cacheTime24h, getFutureTime } from './utils';
import { ApiModule } from './modules';
import { SuiClient } from '@mysten/sui/client';
import { FaucetModule } from './modules/faucetModule';

export type HertzFlowSdkOptions = {
  packageId: string;
  fullRpcUrl: string;
  apiUrl: string;
  faucetURL?: string;

  simulationAccount: {
    address: string;
  };
  vault: Package;
  protocolStore: Package;
  version: Package;
  oracleStore: Package;
  oraclePackage: Package;
  oracleVersion: Package;
  oracle: Package;
  hzlp: Package;
  faucet: Package;
  HZLP_TYPE: string;
  TOKENS_FAUCETS_ID: string;
  FAUCET_ADMIN_CAP_ID: string;

  suiClient?: SuiClient;
};

export class HertzFlowSDK {
  protected _sdkOptions: HertzFlowSdkOptions;

  private readonly _cache: Record<string, CachedContent> = {};

  protected readonly _queryModule: QueryModule;

  protected readonly _rpcModule: RpcModule;

  protected readonly _vaultModule: VaultModule;

  protected readonly _apiModule: ApiModule;

  protected readonly _oracleModule: OracleModule;

  protected readonly _oracleStorageModule: OracleStorageModule;

  protected readonly _orderModule: OrderModule;

  protected readonly _positionModule: PositionModule;

  protected readonly _faucetModule: FaucetModule;

  protected _senderAddress: string = '';

  constructor(options: HertzFlowSdkOptions) {
    this._sdkOptions = options;

    this._rpcModule = options.suiClient
      ? new RpcModule(options.suiClient, this)
      : new RpcModule({ url: options.fullRpcUrl }, this);
    this._vaultModule = new VaultModule(this);
    this._apiModule = new ApiModule({
      url: options.apiUrl,
    });

    this._oracleModule = new OracleModule(this);
    this._oracleStorageModule = new OracleStorageModule(this);
    this._queryModule = new QueryModule(this);
    this._orderModule = new OrderModule(this);
    this._positionModule = new PositionModule(this);
    this._faucetModule = new FaucetModule(this);
  }

  get sdkOptions(): HertzFlowSdkOptions {
    return this._sdkOptions;
  }

  get VaultModule(): VaultModule {
    return this._vaultModule;
  }

  get ApiModule(): ApiModule {
    return this._apiModule;
  }

  get QueryModule(): QueryModule {
    return this._queryModule;
  }

  get OracleModule(): OracleModule {
    return this._oracleModule;
  }

  get OracleStorageModule(): OracleStorageModule {
    return this._oracleStorageModule;
  }

  get OrderModule(): OrderModule {
    return this._orderModule;
  }

  get PositionModule(): PositionModule {
    return this._positionModule;
  }

  get RpcModule(): RpcModule {
    return this._rpcModule;
  }

  get FaucetModule(): FaucetModule {
    return this._faucetModule;
  }

  get fullClient(): RpcModule {
    return this._rpcModule;
  }

  get senderAddress(): string {
    return this._senderAddress;
  }

  set senderAddress(value: SuiAddress) {
    this._senderAddress = value;
  }

  get isWalletConnected(): boolean {
    return this._senderAddress !== '';
  }

  disconnectWallet(): void {
    this._senderAddress = '';
  }

  updateCache(key: string, data: any, time = cacheTime24h): void {
    let cacheData = this._cache[key];
    if (cacheData) {
      cacheData.overdueTime = getFutureTime(time);
      cacheData.value = data;
    } else {
      cacheData = new CachedContent(data, getFutureTime(time));
    }
    this._cache[key] = cacheData;
  }

  getCache<T>(key: string, forceRefresh = false): T | undefined {
    const cacheData = this._cache[key];
    const isValid = cacheData?.isValid();
    if (!forceRefresh && isValid) {
      return cacheData.value as T;
    }
    if (!isValid) {
      delete this._cache[key];
    }
    return undefined;
  }

  async getOwnerCoinBalances(
    suiAddress?: string,
    coinType?: string,
  ): Promise<CoinBalance[]> {
    const _address = suiAddress || this._senderAddress;

    if (!_address) {
      throw new Error(
        'No address provided and no wallet connected. Please provide an address or connect a wallet.',
      );
    }

    let _allCoinBalance: CoinBalance[] = [];

    if (coinType) {
      const _res = await this.fullClient.getBalance({
        owner: _address,
        coinType,
      });
      _allCoinBalance = [_res];
    } else {
      const _res = await this.fullClient.getAllBalances({
        owner: _address,
      });
      _allCoinBalance = [..._res];
    }
    return _allCoinBalance;
  }

  async getCurrentWalletBalances(coinType?: string): Promise<CoinBalance[]> {
    if (!this.isWalletConnected) {
      throw new Error('No wallet connected. Please connect a wallet first.');
    }
    return this.getOwnerCoinBalances(this._senderAddress, coinType);
  }

  async getCoinMetadata(coinType: string) {
    return await this.fullClient.getCoinMetadata({ coinType });
  }

  async getOwnerCoinAssets(
    suiAddress?: string,
    coinType?: string | null,
    forceRefresh = false,
  ): Promise<CoinAsset[]> {
    const _address = suiAddress || this._senderAddress;

    if (!_address) {
      throw new Error(
        'No address provided and no wallet connected. Please provide an address or connect a wallet.',
      );
    }

    const _allCoinAsset: CoinAsset[] = [];
    let _nextCursor: string | null | undefined = null;

    const _cacheKey = `${this._sdkOptions.fullRpcUrl}_${_address}_${coinType}_getOwnerCoinAssets`;

    const _cacheData = this.getCache<CoinAsset[]>(_cacheKey, forceRefresh);
    if (_cacheData) {
      return _cacheData;
    }

    while (true) {
      const _allCoinObject: any = await (coinType
        ? this._rpcModule.getCoins({
            owner: _address,
            coinType,
            cursor: _nextCursor,
          })
        : this._rpcModule.getAllCoins({
            owner: _address,
            cursor: _nextCursor,
          }));

      _allCoinObject.data.forEach((_coin: any) => {
        if (BigInt(_coin.balance) > 0) {
          const _parts = _coin.coinType.split('::');
          const _coinAddress = _parts[0] || _coin.coinType;

          _allCoinAsset.push({
            coinAddress: _coinAddress,
            coinObjectId: _coin.coinObjectId,
            balance: BigInt(_coin.balance),
          });
        }
      });

      _nextCursor = _allCoinObject.nextCursor;

      if (!_allCoinObject.hasNextPage) {
        break;
      }
    }

    this.updateCache(_cacheKey, _allCoinAsset, 30 * 1000);
    return _allCoinAsset;
  }
}
