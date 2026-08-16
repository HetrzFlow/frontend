'use client';
import { memo, useMemo, useState } from 'react';
import { fromDecimalsAmount } from '@hertzflow/sdk';
import { useLingui } from '@lingui/react/macro';
import { calc } from '@repo/lib/calc';
import { percentFormat, truncateFormat, unitFormat } from '@repo/lib/format';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@repo/ui';
import {
  IMAGES_MAP,
  CoinIcon,
  CoinDetailItem,
  PoolDetailResData,
} from '@/common';
import { useCoinAllocationData } from '@/hooks/hzlp/useCoinAllocationData';

const BodyItemMd = memo(
  ({
    coinDetail,
    aprPeriod,
  }: {
    coinDetail: CoinDetailItem;
    aprPeriod: '24h' | '7d' | '1m';
  }) => {
    const { t } = useLingui();
    const {
      mixedCoinObj,
      px,
      availableForBorrow,
      maxDepositResult,
      maxWithdrawalResult,
      selectedApr,
      usdAmountDisplayDecimal,
    } = useCoinAllocationData(coinDetail, aprPeriod);

    const { coin_amount, coin_name } = coinDetail;

    const poolSizeFormatted = useMemo(
      () =>
        unitFormat(
          mixedCoinObj?.decimal
            ? calc(coin_amount)
                .div(Math.pow(10, mixedCoinObj?.decimal ?? 4))
                .times(px ?? '0')
            : '',
          usdAmountDisplayDecimal,
          {
            style: 'currency',
            currency: 'USD',
            showMinDecimalValue: true,
          },
        ),
      [coin_amount, mixedCoinObj?.decimal, px, usdAmountDisplayDecimal],
    );

    const { current_weight, target_weight, utilization, coin_type } =
      coinDetail;

    const utilizationFormatted = useMemo(
      () =>
        percentFormat(utilization, 2, {
          showMinDecimalValue: true,
          stripTrailingZeros: true,
        }),
      [utilization],
    );

    return (
      <TableRow key={coin_type}>
        <TableCell className="font-medium" id="Token">
          <div className="flex items-center gap-2">
            <CoinIcon
              src={(IMAGES_MAP.coinIcons as Record<string, string>)[coin_name]}
              alt={`${mixedCoinObj?.coin_name} icon`}
              size={24}
            />
            {mixedCoinObj?.coin_name}
          </div>
        </TableCell>
        <TableCell id="Price">
          {truncateFormat(px, mixedCoinObj?.pxDispDecimal, {
            style: 'currency',
            currency: 'USD',
          })}
        </TableCell>
        <TableCell id="Pool Size">
          <Tooltip>
            <TooltipTrigger className="decoration-t-430 font-plex cursor-pointer underline decoration-dotted underline-offset-3">
              {poolSizeFormatted}
            </TooltipTrigger>
            <TooltipContent side="top">
              {unitFormat(
                mixedCoinObj?.decimal
                  ? fromDecimalsAmount(
                      coin_amount.toString(10),
                      mixedCoinObj?.decimal,
                    )
                  : '',
                mixedCoinObj?.szDispDecimal,
                {
                  stripTrailingZeros: true,
                  showMinDecimalValue: true,
                },
              )}{' '}
              {mixedCoinObj?.coin_name}
            </TooltipContent>
          </Tooltip>
        </TableCell>
        <TableCell id="Current / Target Weightage" className="font-plex">
          {`${percentFormat(current_weight, 2, {
            showMinDecimalValue: true,
            stripTrailingZeros: true,
          })} / ${percentFormat(calc(target_weight), 2)}`}
        </TableCell>
        <TableCell id="APR" className="w-24">
          <span className="font-plex inline-block min-w-[90px] font-medium text-green-500">
            {selectedApr
              ? percentFormat(selectedApr, 2, {
                  showMinDecimalValue: true,
                  stripTrailingZeros: true,
                })
              : 'N/A'}
          </span>
        </TableCell>
        <TableCell className="text-right" id="Utilization">
          <Tooltip>
            <TooltipTrigger className="decoration-t-430 font-plex cursor-pointer underline decoration-dotted underline-offset-3">
              {utilizationFormatted}
            </TooltipTrigger>
            <TooltipContent side="top">
              <div>
                {t`Available for borrow:`}{' '}
                {unitFormat(availableForBorrow, usdAmountDisplayDecimal, {
                  style: 'currency',
                  currency: 'USD',
                })}
              </div>
              <div>
                {t`Max Deposit:`}{' '}
                {maxDepositResult?.usdValue ? (
                  `${unitFormat(
                    Number(maxDepositResult.usdValue),
                    usdAmountDisplayDecimal,
                    {
                      style: 'currency',
                      currency: 'USD',
                      showMinDecimalValue: true,
                    },
                  )}`
                ) : (
                  <span className="text-xs text-gray-500">N/A</span>
                )}
              </div>
              <div>
                {t`Max Withdrawal:`}{' '}
                {maxWithdrawalResult?.usdValue ? (
                  `${unitFormat(
                    Number(maxWithdrawalResult.usdValue),
                    usdAmountDisplayDecimal,
                    {
                      style: 'currency',
                      currency: 'USD',
                      showMinDecimalValue: true,
                    },
                  )}`
                ) : (
                  <span className="text-xs text-gray-500">N/A</span>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TableCell>
      </TableRow>
    );
  },
);
BodyItemMd.displayName = 'BodyItemMd';

const AllocationMd = ({
  poolDetail,
}: {
  poolDetail: PoolDetailResData | undefined;
}) => {
  const { t } = useLingui();
  const [aprPeriod, setAprPeriod] = useState<'24h' | '7d' | '1m'>('24h');
  const coinDetail = useMemo(
    () => poolDetail?.coin_details ?? [],
    [poolDetail?.coin_details],
  );

  return (
    <div>
      <h3 className="mb-6 text-xl font-medium">{t`Liquidity Allocation`}</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-t-270 text-sm font-normal">
              {t`Token`}
            </TableHead>
            <TableHead className="text-t-270 text-sm font-normal">
              {t`Price`}
            </TableHead>
            <TableHead className="text-t-270 text-sm font-normal">
              {t`Pool Size`}
            </TableHead>
            <TableHead className="text-t-270 text-sm font-normal">
              {t`Current / Target Weightage`}
            </TableHead>
            <TableHead className="text-t-270 w-24 text-sm font-normal">
              <div className="flex items-center gap-1">
                <span className="inline-block min-w-[60px]">
                  {t`APR`}({aprPeriod})
                </span>
                <Select
                  value={aprPeriod}
                  onValueChange={(value: '24h' | '7d' | '1m') =>
                    setAprPeriod(value)
                  }
                >
                  <SelectTrigger
                    className="h-4 w-4 border-none bg-transparent p-0"
                    hiddenIcon
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M1.16669 5.25004H12.8334V4.08337H1.16669V5.25004ZM11.0834 7.58337H2.91669V6.41671H11.0834V7.58337ZM9.33335 9.91671H4.66669V8.75004H9.33335V9.91671Z"
                        className="fill-black/30 dark:fill-white/30"
                      />
                    </svg>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">24h</SelectItem>
                    <SelectItem value="7d">7d</SelectItem>
                    <SelectItem value="1m">1m</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TableHead>
            <TableHead className="text-t-270 text-sm font-normal">
              {t`Utilization`}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coinDetail &&
            coinDetail.map((detail) => {
              return (
                <BodyItemMd
                  key={detail.coin_name}
                  coinDetail={detail}
                  aprPeriod={aprPeriod}
                />
              );
            })}
          {(!coinDetail || !coinDetail.length) && (
            <TableRow className="border-0">
              <TableCell
                colSpan={5}
                className="text-t-270 h-20 text-center last:text-center"
              >{t`No Data`}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default memo(AllocationMd);
