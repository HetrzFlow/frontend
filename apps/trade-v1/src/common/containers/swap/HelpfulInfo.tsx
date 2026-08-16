import { useMemo, useState } from 'react';

import { useLingui } from '@lingui/react/macro';
import { useShallow } from 'zustand/react/shallow';

import { calc } from '@repo/lib/calc';
import { EMPTY_DISPLAY, truncateFormat } from '@repo/lib/format';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  cn,
  ArrowLeftRightIcon,
  ChevronDownIcon,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  LoaderCircleIcon,
  Skeleton,
  CountdownCircle,
} from '@repo/ui';
import { swapFeeDoc } from '../../constants/links';
import { ORDER_TYPE, TRADE_TYPE } from '../../services/enum';
import { useSwapFeeAmount } from '../../services/rest/swap';
import { usePriceTickerStream } from '../../services/ws/tickers';
import { useGlobalStore } from '../../stores/globalStore';
import { useInstStore } from '../../stores/instStore';
import { useAvailLiq } from './hooks/useAvailLiq';
import ListItem from './ListItem';
import { useSwapStore } from './store';

const HelpfulInfo = () => {
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  const [insts, coins] = useInstStore(
    useShallow((state) => [state.getInsts(), state.getCoins()]),
  );
  // const networkFee = 0.03;
  // const networkFeeCoinSymbol = coins[NETWORK_FEE_COIN]?.symbol ?? '';
  // const networkFeeCoinPx =
  //   useCoinPrice(networkFeeCoinSymbol ? `${networkFeeCoinSymbol}/USD` : '') ??
  //   '1';
  // const networkFeeUsdValue = calc(networkFee).times(networkFeeCoinPx);

  const { t, i18n } = useLingui();
  const [orderType, formData, formRef] = useSwapStore(
    useShallow((state) => [
      state.orderType,
      state.formData.swap,
      state.formRefs[TRADE_TYPE.swap],
    ]),
  );

  const {
    paySz: { value: payCoinSz = '', coin: payCoin = '' },
    receiveSz: { coin: receiveCoin = '', value: receiveCoinSz = '' },
    pxIsReversed,
  } = formData;
  const {
    symbol: payCoinSymbol = '',
    szDispDecimal: payCoinDispDecimal,
    coinType: payCoinType,
  } = coins[payCoin] || {};
  const {
    symbol: receiveCoinSymbol = '',
    szDispDecimal: receiveCoinDispDecimal,
    swapFeeRate = 0,
    coinType: receiveCoinType,
  } = coins[receiveCoin] || {};

  const payCoinPx = usePriceTickerStream(
    payCoinSymbol ? `${payCoinSymbol}/USD` : '',
    {
      throttleWait: 5000,
    },
  ).data[0]?.p;
  const receiveCoinPx = usePriceTickerStream(
    receiveCoinSymbol ? `${receiveCoinSymbol}/USD` : '',
    {
      throttleWait: 5000,
    },
  ).data[0]?.p;

  const { availLiqUsd, maxIn, maxInUsd, maxOut, maxOutUsd } = useAvailLiq({
    payCoinType: payCoinType,
    receiveCoinType,
  });

  const isMarket = orderType === ORDER_TYPE.market;
  const { data: marketSwapFeeAmountData, refetch } = useSwapFeeAmount(
    payCoinType,
    receiveCoinType,
  );
  const {
    swapFee: marketSwapFeeAmount = 0,
    priceImpact: marketPriceImpact = 0,
    payIsCalcing = false,
    receiveIsCalcing = false,
  } = marketSwapFeeAmountData || {};
  const isFetching = payIsCalcing || receiveIsCalcing;

  const [swapFee, priceImpact] = useMemo(() => {
    if (isMarket) {
      return [marketSwapFeeAmount, marketPriceImpact];
    } else {
      return [
        calc(payCoinSz)
          .times(payCoinPx || 1)
          .times(swapFeeRate),
        0,
      ];
    }
  }, [
    isMarket,
    marketPriceImpact,
    marketSwapFeeAmount,
    payCoinPx,
    payCoinSz,
    swapFeeRate,
  ]);

  const fees = calc(swapFee).plus(priceImpact); // networkFeeUsdValue

  const dispAvailValue = truncateFormat(availLiqUsd, usdAmountDisplayDecimal, {
    style: 'currency',
    currency: 'USD',
  });

  const dispFees = truncateFormat(
    calc(fees).times(-1),
    usdAmountDisplayDecimal,
    {
      style: 'currency',
      currency: 'USD',
      showNegativeZero: true,
    },
  );

  const [open, setOpen] = useState(false);

  if (orderType === ORDER_TYPE.limit) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 text-sm">
      <Collapsible className={''} open={open} onOpenChange={setOpen}>
        <div className="text-secondary-foreground flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {isFetching ||
            ((!payCoinSz || !+payCoinSz) &&
              (!receiveCoinSz || !+receiveCoinSymbol)) ? (
              <LoaderCircleIcon
                size={14}
                className={cn('text-accent', isFetching ? 'animate-spin' : '')}
              />
            ) : (
              <>
                <CountdownCircle
                  size={14}
                  // extra 0.5s for smooth animation
                  duration={5.5}
                  className={cn('text-accent cursor-pointer')}
                  onClick={() => {
                    refetch();
                  }}
                />
              </>
            )}
            <span>1 {pxIsReversed ? receiveCoinSymbol : payCoinSymbol}</span>
            <ArrowLeftRightIcon
              className="text-accent cursor-pointer"
              onClick={() => {
                formRef?.current?.form.setValue('pxIsReversed', !pxIsReversed);
              }}
              size={14}
            />
            <span className="flex items-center">
              {isFetching ? (
                <Skeleton className="mr-1 h-4 w-12 shrink-0 rounded-md" />
              ) : payCoinSz && receiveCoinSz ? (
                truncateFormat(
                  pxIsReversed
                    ? calc(payCoinSz).div(receiveCoinSz)
                    : calc(receiveCoinSz).div(payCoinSz),
                  pxIsReversed ? payCoinDispDecimal : receiveCoinDispDecimal,
                  {
                    showMinDecimalValue: true,
                    stripTrailingZeros: true,
                  },
                )
              ) : (
                EMPTY_DISPLAY
              )}{' '}
              {pxIsReversed ? payCoinSymbol : receiveCoinSymbol}
            </span>
          </div>
          <CollapsibleTrigger className="text-t-1100 ml-auto flex w-16 justify-end">
            <ChevronDownIcon
              size={16}
              className={cn(
                'transition-transform duration-300',
                open ? '-rotate-180' : '',
              )}
            />
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className={cn('flex flex-col gap-2 pb-[1px]')}>
          <ListItem
            className="mt-3"
            label={i18n._({
              id: 'trade.price',
              message: '{coinName} Price',
              values: { coinName: payCoinSymbol || EMPTY_DISPLAY },
            })}
            value={truncateFormat(
              payCoinPx,
              coins[insts[`${payCoinSymbol}/USD`]?.baseCoin || '']
                ?.pxDispDecimal,
              {
                style: 'currency',
                currency: 'USD',
              },
            )}
          />
          <ListItem
            label={i18n._({
              id: 'trade.price',
              message: '{coinName} Price',
              values: { coinName: receiveCoinSymbol || EMPTY_DISPLAY },
            })}
            value={truncateFormat(
              receiveCoinPx,
              coins[insts[`${receiveCoinSymbol}/USD`]?.baseCoin || '']
                ?.pxDispDecimal,
              {
                style: 'currency',
                currency: 'USD',
              },
            )}
          />
          <ListItem
            label={t`Available Liquidity`}
            value={
              <Tooltip>
                <TooltipTrigger
                  className={cn(
                    'decoration-t-430 decoration-dotted underline-offset-3',
                    dispAvailValue === EMPTY_DISPLAY
                      ? 'cursor-auto no-underline'
                      : 'underline',
                  )}
                >
                  {dispAvailValue}
                </TooltipTrigger>
                {dispAvailValue !== EMPTY_DISPLAY && (
                  <TooltipContent
                    inDialog
                    side="left"
                    className="flex w-[224px] flex-col gap-3"
                  >
                    <>
                      <ListItem
                        className="items-start"
                        label={`${t`Max ${payCoinSymbol} in`}:`}
                        value={
                          <>
                            {truncateFormat(maxIn, payCoinDispDecimal, {
                              stripTrailingZeros: true,
                            })}{' '}
                            {payCoinSymbol}
                            <br />
                            {truncateFormat(maxInUsd, usdAmountDisplayDecimal, {
                              style: 'currency',
                              currency: 'USD',
                            })}
                          </>
                        }
                      />
                      <ListItem
                        className="items-start"
                        label={`${t`Max ${receiveCoinSymbol} out`}:`}
                        value={
                          <>
                            {truncateFormat(maxOut, receiveCoinDispDecimal, {
                              stripTrailingZeros: true,
                            })}{' '}
                            {receiveCoinSymbol}
                            <br />
                            {truncateFormat(
                              maxOutUsd,
                              usdAmountDisplayDecimal,
                              {
                                style: 'currency',
                                currency: 'USD',
                              },
                            )}
                          </>
                        }
                      />
                    </>
                  </TooltipContent>
                )}
              </Tooltip>
            }
          />
          <ListItem
            label={t`Fees`}
            value={
              isFetching ? (
                <Skeleton className="h-4 w-12" />
              ) : (
                <Tooltip>
                  <TooltipTrigger
                    className={cn(
                      'decoration-t-430 decoration-dotted underline-offset-3',
                      dispFees === EMPTY_DISPLAY
                        ? 'cursor-auto no-underline'
                        : 'underline',
                    )}
                  >
                    {dispFees}
                  </TooltipTrigger>
                  {dispFees !== EMPTY_DISPLAY && (
                    <TooltipContent
                      inDialog
                      side="left"
                      className="flex w-[224px] flex-col gap-0.5"
                    >
                      <>
                        <ListItem
                          label={`${t`Swap Fee`}:`}
                          value={truncateFormat(
                            calc(swapFee).times(-1),
                            usdAmountDisplayDecimal,
                            {
                              style: 'currency',
                              currency: 'USD',
                              showNegativeZero: true,
                            },
                          )}
                        />
                        <ListItem
                          label={`${t`Price Impact`}:`}
                          value={truncateFormat(
                            calc(priceImpact).times(-1),
                            usdAmountDisplayDecimal,
                            {
                              style: 'currency',
                              currency: 'USD',
                              showNegativeZero: true,
                              signDisplay: 'exceptZero',
                            },
                          )}
                        />
                        {/* {!isMarket && (
                          <ListItem
                            label={`${t`Network Fee`}:`}
                            value={`${thoFormat(networkFee)} ${networkFeeCoinSymbol} (${truncateFormat(
                              networkFeeUsdValue,
                              usdAmountDisplayDecimal,
                              {
                                style: 'currency',
                                currency: 'USD',
                              },
                            )})`}
                          />
                        )} */}
                        <span>
                          <a
                            className="text-accent underline underline-offset-2"
                            href={swapFeeDoc || 'https://'}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t`Read more`}
                          </a>
                        </span>
                      </>
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            }
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default HelpfulInfo;
