import { FC } from 'react';
import { t } from '@lingui/core/macro';
import { BN, calc } from '@repo/lib/calc';
import { percentFormat } from '@repo/lib/format';
import {
  cn,
  GraphDownArrowIcon,
  GraphUpArrowIcon,
  MEDIA_SIZES,
  useMediaQuery,
} from '@repo/ui';
import { usePriceTickerStream, useTickers } from '@/common/services';
import { useInstStore } from '@/common/stores';
import { CATEGORY } from '@/services/rest/pools';


interface ChartProps {
  bnbChg: [BN, number];
  sorted: {
    label: string;
    chg: [BN, number];
  }[];
  maxChg: [BN | null, string];
  minChg: [BN | null, string];
}

const ChartSm: FC<ChartProps> = ({ sorted, bnbChg, maxChg, minChg }) => {
  return (
    <div className="flex flex-col gap-2 text-center font-medium">
      {/* row-1 */}
      <div className="flex gap-2">
        <div
          className={cn(
            'flex h-64 w-2/3 shrink grow flex-col items-center justify-center gap-1 rounded-xl',
            bnbChg[0].gte(0) ? 'bg-up/10' : 'bg-down/10',
          )}
        >
          <span className="text-[40px]/tight">BNB</span>
          <span
            className={cn(
              'font-plex text-2xl',
              bnbChg[0].gte(0) ? 'text-up' : 'text-down',
            )}
          >
            {percentFormat(bnbChg[0], 2, {
              signDisplay: 'always',
            })}
          </span>
        </div>

        <div className="flex w-1/3 shrink grow flex-col gap-2">
          <div
            className={cn(
              'flex h-[158px] flex-col items-center justify-center gap-1 rounded-xl',
              sorted[0]?.chg[0].gte(0) ? 'bg-up/10' : 'bg-down/10',
            )}
          >
            <span className="text-base">{sorted[0]?.label}</span>
            <span
              className={cn(
                'font-plex text-sm',
                sorted[0]?.chg[0].gte(0) ? 'text-up' : 'text-down',
              )}
            >
              {percentFormat(
                sorted[0]?.chg[1]
                  ? sorted[0]?.chg[0].div(sorted[0]?.chg[1])
                  : '',
                2,
                {
                  signDisplay: 'always',
                },
              )}
            </span>
          </div>
          <div
            className={cn(
              'flex h-[90px] flex-col items-center justify-center gap-1 rounded-xl',
              sorted[2]?.chg[0].gte(0) ? 'bg-up/10' : 'bg-down/10',
            )}
          >
            <span className="text-base">{sorted[2]?.label}</span>
            <span
              className={cn(
                'font-plex text-sm',
                sorted[2]?.chg[0].gte(0) ? 'text-up' : 'text-down',
              )}
            >
              {percentFormat(
                sorted[2]?.chg[1]
                  ? sorted[2]?.chg[0].div(sorted[2]?.chg[1])
                  : '',
                2,
                {
                  signDisplay: 'always',
                },
              )}
            </span>
          </div>
        </div>
      </div>
      {/* row-2 */}
      <div className="flex gap-2">
        <div className="flex w-1/2 shrink grow flex-col gap-2 text-xs">
          <div className="grid grid-cols-2 grid-rows-2 gap-2">
            <div
              className={cn(
                'flex h-20 w-full flex-col items-center justify-center gap-1 rounded-xl',
                sorted[3]?.chg[0].gte(0) ? 'bg-up/10' : 'bg-down/10',
              )}
            >
              <span className="">{sorted[3]?.label}</span>
              <span
                className={cn(
                  'font-plex',
                  sorted[3]?.chg[0].gte(0) ? 'text-up' : 'text-down',
                )}
              >
                {percentFormat(
                  sorted[3]?.chg[1]
                    ? sorted[3]?.chg[0].div(sorted[3]?.chg[1])
                    : '',
                  2,
                  {
                    signDisplay: 'always',
                  },
                )}
              </span>
            </div>
            <div
              className={cn(
                'flex h-20 w-full flex-col items-center justify-center gap-1 rounded-xl',
                sorted[4]?.chg[0].gte(0) ? 'bg-up/10' : 'bg-down/10',
              )}
            >
              <span className="">{sorted[4]?.label}</span>
              <span
                className={cn(
                  'font-plex',
                  sorted[4]?.chg[0].gte(0) ? 'text-up' : 'text-down',
                )}
              >
                {percentFormat(
                  sorted[4]?.chg[1]
                    ? sorted[4]?.chg[0].div(sorted[4]?.chg[1])
                    : '',
                  2,
                  {
                    signDisplay: 'always',
                  },
                )}
              </span>
            </div>
            <div
              className={cn(
                'flex h-20 w-full flex-col items-center justify-center gap-1 rounded-xl',
                sorted[5]?.chg[0].gte(0) ? 'bg-up/10' : 'bg-down/10',
              )}
            >
              <span className="">{sorted[5]?.label}</span>
              <span
                className={cn(
                  'font-plex',
                  sorted[5]?.chg[0].gte(0) ? 'text-up' : 'text-down',
                )}
              >
                {percentFormat(
                  sorted[5]?.chg[1]
                    ? sorted[5]?.chg[0].div(sorted[5]?.chg[1])
                    : '',
                  2,
                  {
                    signDisplay: 'always',
                  },
                )}
              </span>
            </div>
            <div
              className={cn(
                'flex h-20 w-full flex-col items-center justify-center gap-1 rounded-xl',
                sorted[6]?.chg[0].gte(0) ? 'bg-up/10' : 'bg-down/10',
              )}
            >
              <span className="">{sorted[6]?.label}</span>
              <span
                className={cn(
                  'font-plex',
                  sorted[6]?.chg[0].gte(0) ? 'text-up' : 'text-down',
                )}
              >
                {percentFormat(
                  sorted[6]?.chg[1]
                    ? sorted[6]?.chg[0].div(sorted[6]?.chg[1])
                    : '',
                  2,
                  {
                    signDisplay: 'always',
                  },
                )}
              </span>
            </div>
          </div>
          <div
            className={cn(
              'flex h-20 flex-col items-center justify-center gap-1 rounded-xl',
              sorted[1]?.chg[0].gte(0) ? 'bg-up/10' : 'bg-down/10',
            )}
          >
            <span className="">{sorted[1]?.label}</span>
            <span
              className={cn(
                'font-plex',
                sorted[1]?.chg[0].gte(0) ? 'text-up' : 'text-down',
              )}
            >
              {percentFormat(
                sorted[1]?.chg[1]
                  ? sorted[1]?.chg[0].div(sorted[1]?.chg[1])
                  : '',
                2,
                {
                  signDisplay: 'always',
                },
              )}
            </span>
          </div>
        </div>
        <div
          className={cn(
            'flex w-1/4 shrink grow flex-col items-center justify-center gap-1 rounded-xl text-xs',
            !maxChg[0] || maxChg[0].gte(0) ? 'bg-up/10' : 'bg-down/10',
          )}
        >
          <GraphUpArrowIcon />
          <span>{t`Top Gainer`}</span>
          <span
            className={!maxChg[0] || maxChg[0].gte(0) ? 'text-up' : 'text-down'}
          >
            {maxChg[1].split('/')[0]}
          </span>
          <span
            className={cn(
              'font-plex',
              !maxChg[0] || maxChg[0].gte(0) ? 'text-up' : 'text-down',
            )}
          >
            {percentFormat(maxChg[0] || '', 2, {
              signDisplay: 'always',
            })}
          </span>
        </div>
        <div
          className={cn(
            'flex w-1/4 shrink grow flex-col items-center justify-center gap-1 rounded-xl text-xs',
            minChg[0] && minChg[0].gte(0) ? 'bg-up/10' : 'bg-down/10',
          )}
        >
          <GraphDownArrowIcon />
          <span>{t`Top Loser`}</span>
          <span
            className={minChg[0] && minChg[0].gte(0) ? 'text-up' : 'text-down'}
          >
            {minChg[1].split('/')[0]}
          </span>
          <span
            className={cn(
              'font-plex',
              minChg[0] && minChg[0].gte(0) ? 'text-up' : 'text-down',
            )}
          >
            {percentFormat(minChg[0] || '', 2, {
              signDisplay: 'always',
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

const ChartLg: FC<ChartProps> = ({ bnbChg, sorted, maxChg, minChg }) => {
  return (
    <div className="flex gap-2 font-medium">
      {/* col-1 */}
      <div
        className={cn(
          'flex size-64 flex-col items-center justify-center gap-1 rounded-xl',
          bnbChg[0].gte(0) ? 'bg-up/10' : 'bg-down/10',
        )}
      >
        <span className="text-[40px]/tight">BNB</span>
        <span
          className={cn(
            'font-plex text-2xl',
            bnbChg[0].gte(0) ? 'text-up' : 'text-down',
          )}
        >
          {percentFormat(bnbChg[0], 2, {
            signDisplay: 'always',
          })}
        </span>
      </div>
      {/* col-2 */}
      <div className="flex w-30 flex-col gap-2">
        <div
          className={cn(
            'flex h-[158px] flex-col items-center justify-center gap-1 rounded-xl',
            sorted[0]?.chg[0].gte(0) ? 'bg-up/10' : 'bg-down/10',
          )}
        >
          <span className="text-base">{sorted[0]?.label}</span>
          <span
            className={cn(
              'font-plex text-sm',
              sorted[0]?.chg[0].gte(0) ? 'text-up' : 'text-down',
            )}
          >
            {percentFormat(
              sorted[0]?.chg[1] ? sorted[0]?.chg[0].div(sorted[0]?.chg[1]) : '',
              2,
              {
                signDisplay: 'always',
              },
            )}
          </span>
        </div>
        <div
          className={cn(
            'flex h-[90px] flex-col items-center justify-center gap-1 rounded-xl',
            sorted[2]?.chg[0].gte(0) ? 'bg-up/10' : 'bg-down/10',
          )}
        >
          <span className="text-base">{sorted[2]?.label}</span>
          <span
            className={cn(
              'font-plex text-sm',
              sorted[2]?.chg[0].gte(0) ? 'text-up' : 'text-down',
            )}
          >
            {percentFormat(
              sorted[2]?.chg[1] ? sorted[2]?.chg[0].div(sorted[2]?.chg[1]) : '',
              2,
              {
                signDisplay: 'always',
              },
            )}
          </span>
        </div>
      </div>
      {/* col-3 */}
      <div className="flex w-42 flex-col gap-2 text-xs">
        <div className="grid grid-cols-2 grid-rows-2 gap-2">
          <div
            className={cn(
              'flex size-20 flex-col items-center justify-center gap-1 rounded-xl',
              sorted[3]?.chg[0].gte(0) ? 'bg-up/10' : 'bg-down/10',
            )}
          >
            <span className="">{sorted[3]?.label}</span>
            <span
              className={cn(
                'font-plex',
                sorted[3]?.chg[0].gte(0) ? 'text-up' : 'text-down',
              )}
            >
              {percentFormat(
                sorted[3]?.chg[1]
                  ? sorted[3]?.chg[0].div(sorted[3]?.chg[1])
                  : '',
                2,
                {
                  signDisplay: 'always',
                },
              )}
            </span>
          </div>
          <div
            className={cn(
              'flex size-20 flex-col items-center justify-center gap-1 rounded-xl',
              sorted[4]?.chg[0].gte(0) ? 'bg-up/10' : 'bg-down/10',
            )}
          >
            <span className="">{sorted[4]?.label}</span>
            <span
              className={cn(
                'font-plex',
                sorted[4]?.chg[0].gte(0) ? 'text-up' : 'text-down',
              )}
            >
              {percentFormat(
                sorted[4]?.chg[1]
                  ? sorted[4]?.chg[0].div(sorted[4]?.chg[1])
                  : '',
                2,
                {
                  signDisplay: 'always',
                },
              )}
            </span>
          </div>
          <div
            className={cn(
              'flex size-20 flex-col items-center justify-center gap-1 rounded-xl',
              sorted[5]?.chg[0].gte(0) ? 'bg-up/10' : 'bg-down/10',
            )}
          >
            <span className="">{sorted[5]?.label}</span>
            <span
              className={cn(
                'font-plex',
                sorted[5]?.chg[0].gte(0) ? 'text-up' : 'text-down',
              )}
            >
              {percentFormat(
                sorted[5]?.chg[1]
                  ? sorted[5]?.chg[0].div(sorted[5]?.chg[1])
                  : '',
                2,
                {
                  signDisplay: 'always',
                },
              )}
            </span>
          </div>
          <div
            className={cn(
              'flex size-20 flex-col items-center justify-center gap-1 rounded-xl',
              sorted[6]?.chg[0].gte(0) ? 'bg-up/10' : 'bg-down/10',
            )}
          >
            <span className="">{sorted[6]?.label}</span>
            <span
              className={cn(
                'font-plex',
                sorted[6]?.chg[0].gte(0) ? 'text-up' : 'text-down',
              )}
            >
              {percentFormat(
                sorted[6]?.chg[1]
                  ? sorted[6]?.chg[0].div(sorted[6]?.chg[1])
                  : '',
                2,
                {
                  signDisplay: 'always',
                },
              )}
            </span>
          </div>
        </div>
        <div
          className={cn(
            'flex h-20 flex-col items-center justify-center gap-1 rounded-xl',
            sorted[1]?.chg[0].gte(0) ? 'bg-up/10' : 'bg-down/10',
          )}
        >
          <span className="">{sorted[1]?.label}</span>
          <span
            className={cn(
              'font-plex',
              sorted[1]?.chg[0].gte(0) ? 'text-up' : 'text-down',
            )}
          >
            {percentFormat(
              sorted[1]?.chg[1] ? sorted[1]?.chg[0].div(sorted[1]?.chg[1]) : '',
              2,
              {
                signDisplay: 'always',
              },
            )}
          </span>
        </div>
      </div>
      {/* col-4 */}
      <div
        className={cn(
          'flex w-20 flex-col items-center justify-center gap-1 rounded-xl text-xs',
          !maxChg[0] || maxChg[0].gte(0) ? 'bg-up/10' : 'bg-down/10',
        )}
      >
        <GraphUpArrowIcon />
        <span>{t`Top Gainer`}</span>
        <span
          className={!maxChg[0] || maxChg[0].gte(0) ? 'text-up' : 'text-down'}
        >
          {maxChg[1].split('/')[0]}
        </span>
        <span
          className={cn(
            'font-plex',
            !maxChg[0] || maxChg[0].gte(0) ? 'text-up' : 'text-down',
          )}
        >
          {percentFormat(maxChg[0] || '', 2, {
            signDisplay: 'always',
          })}
        </span>
      </div>
      {/* col-5 */}
      <div
        className={cn(
          'flex w-20 flex-col items-center justify-center gap-1 rounded-xl text-xs',
          minChg[0] && minChg[0].gte(0) ? 'bg-up/10' : 'bg-down/10',
        )}
      >
        <GraphDownArrowIcon />
        <span>{t`Top Loser`}</span>
        <span
          className={minChg[0] && minChg[0].gte(0) ? 'text-up' : 'text-down'}
        >
          {minChg[1].split('/')[0]}
        </span>
        <span
          className={cn(
            'font-plex',
            minChg[0] && minChg[0].gte(0) ? 'text-up' : 'text-down',
          )}
        >
          {percentFormat(minChg[0] || '', 2, {
            signDisplay: 'always',
          })}
        </span>
      </div>
    </div>
  );
};

const Chart = () => {
  const instsMap = useInstStore((state) => state.getInsts());
  const insts = useInstStore((state) => state.getInstsArr());
  const instsBySymbol = new Map(insts.map((inst) => [inst.symbol, inst]));
  const { data: prices } = usePriceTickerStream(insts.map((v) => v.symbol));
  const pricesMap = Object.fromEntries(
    prices.map((v, i) => [insts[i]!.symbol, v]),
  );
  const { data: tickers } = useTickers();
  let bnbChg: [BN, number] = [calc(0), 0];
  let forexChg: [BN, number] = [calc(0), 0];
  let equitiesChg: [BN, number] = [calc(0), 0];
  let indicesChg: [BN, number] = [calc(0), 0];
  let cryptoChg: [BN, number] = [calc(0), 0];
  let commoditiesChg: [BN, number] = [calc(0), 0];
  let memesChg: [BN, number] = [calc(0), 0];
  let newListChg: [BN, number] = [calc(0), 0];
  const maxChg: [BN | null, string] = [null, ''];
  const minChg: [BN | null, string] = [null, ''];

  tickers?.forEach((v) => {
    const chg = calc(pricesMap[v.symbol]?.[0]?.p || '')
      .minus(v.open_24h)
      .div(v.open_24h);
    if (!maxChg[0] || maxChg[0].lt(chg)) {
      maxChg[0] = chg;
      maxChg[1] = v.symbol;
    }
    if (!minChg[0] || minChg[0].gt(chg)) {
      minChg[0] = chg;
      minChg[1] = v.symbol;
    }
    const inst =
      (v.market_address ? instsMap[v.market_address] : undefined) ??
      instsBySymbol.get(v.symbol);
    if (v.symbol === 'BNB/USD') {
      bnbChg = [chg, 1];
    }
    if (inst?.category === CATEGORY.forex) {
      forexChg = [forexChg[0].plus(chg), forexChg[1] + 1];
    }
    if (inst?.category === CATEGORY.equities) {
      equitiesChg = [equitiesChg[0].plus(chg), equitiesChg[1] + 1];
    }
    if (inst?.category === CATEGORY.indices) {
      indicesChg = [indicesChg[0].plus(chg), indicesChg[1] + 1];
    }
    if (inst?.category === CATEGORY.crypto) {
      cryptoChg = [cryptoChg[0].plus(chg), cryptoChg[1] + 1];
    }
    if (inst?.category === CATEGORY.commodities) {
      commoditiesChg = [commoditiesChg[0].plus(chg), commoditiesChg[1] + 1];
    }
    if (inst?.category === CATEGORY.memes) {
      memesChg = [memesChg[0].plus(chg), memesChg[1] + 1];
    }
    if (inst?.category === CATEGORY.newest) {
      newListChg = [newListChg[0].plus(chg), newListChg[1] + 1];
    }
  });

  const sorted = [
    {
      label: t`Forex`,
      chg: forexChg,
    },
    {
      label: t`Equities`,
      chg: equitiesChg,
    },
    {
      label: t`Indices`,
      chg: indicesChg,
    },
    {
      label: t`Crypto`,
      chg: cryptoChg,
    },
    {
      label: t`Commodities`,
      chg: commoditiesChg,
    },
    {
      label: t`Meme`,
      chg: memesChg,
    },
    {
      label: t`Newly Listed`,
      chg: newListChg,
    },
  ].sort((a, b) => {
    return a.chg[0]
      .div(a.chg[1] || 1)
      .abs()
      .gt(b.chg[0].div(b.chg[1] || 1).abs())
      ? -1
      : 1;
  });

  const isMobile = useMediaQuery() === MEDIA_SIZES.SM;

  return isMobile ? (
    <ChartSm sorted={sorted} bnbChg={bnbChg} maxChg={maxChg} minChg={minChg} />
  ) : (
    <ChartLg sorted={sorted} bnbChg={bnbChg} maxChg={maxChg} minChg={minChg} />
  );
};

export default Chart;
