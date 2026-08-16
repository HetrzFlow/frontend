// 'use client';
// import { memo, useState } from 'react';
// import { addHexPrefix, calc, fromDecimalsAmount } from '@hertzflow/sdk';
// import { useLingui } from '@lingui/react/macro';
// import {
//   CoinIcon,
//   IMAGES_MAP,
//   buildPriceId,
//   useMaxDepositWithdraw,
//   PoolDetail,
//   PoolDetailResData,
//   usePriceTickerStream,
//   useGlobalStore,
//   useInstStore,
// } from '@/common';
// import type { Coin } from '@/common';
// import { percentFormat, truncateFormat, unitFormat } from '@repo/lib/format';
// import { Separator, Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui';

// interface AllocationProps {
//   data?: PoolDetailResData;
// }

// const AllocationCard = memo(
//   ({
//     poolDetail,
//     coins,
//   }: {
//     poolDetail: PoolDetail;
//     coins: Record<string, Coin>;
//   }) => {
//     const { t } = useLingui();
//     const usdAmountDisplayDecimal = useGlobalStore(
//       (state) => state.usdAmountDisplayDecimal,
//     );
//     const { calculateMaxDepositInput, calculateMaxWithdrawal } =
//       useMaxDepositWithdraw();

//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     const [aprPeriod, setAprPeriod] = useState<'24h' | '7d' | '1m'>('24h');
//     const {
//       coin_type,
//       coin_name,
//       coin_amount,
//       target_weight,
//       current_weight,
//       utilization,
//       apr,
//     } = poolDetail;
//     const coinObjFromInstStore = coins[addHexPrefix(coin_type)];
//     const mixedCoinObj = {
//       ...{
//         coin_type,
//         coin_name,
//         coin_amount,
//         target_weight,
//         current_weight,
//         utilization,
//         apr,
//       },
//       ...coinObjFromInstStore,
//     };
//     const instSymbol = buildPriceId(mixedCoinObj?.coin_name ?? '');
//     const px = usePriceTickerStream(instSymbol, { throttleWait: 5000 }).data[0]
//       ?.p;
//     const availableForBorrow = calc(coin_amount)
//       .div(Math.pow(10, mixedCoinObj?.decimal ?? 8))
//       .times(px || '')
//       .times(1 - utilization)
//       .toString(10);

//     const maxDepositResult = calculateMaxDepositInput({
//       currentWeight: current_weight,
//       targetWeight: target_weight,
//       tokenPrice: px,
//     });

//     const maxWithdrawalResult = calculateMaxWithdrawal({
//       currentWeight: current_weight,
//       targetWeight: target_weight,
//       tokenPrice: px,
//     });
//     return (
//       <div key={coin_type} className="space-y-4">
//         <div className="flex items-center gap-[6px] text-[15px] font-medium">
//           <CoinIcon
//             src={(IMAGES_MAP.coinIcons as Record<string, string>)[coin_name]}
//             alt={`${mixedCoinObj?.coin_name} icon`}
//             size={24}
//           />
//           {mixedCoinObj?.coin_name}
//         </div>
//         <div className="space-y-1">
//           <p className="text-t-270 text-xs">{t`price`}</p>
//           <p className="text-t-1100 font-plex text-2xl font-medium">
//             {truncateFormat(px, mixedCoinObj?.pxDispDecimal, {
//               style: 'currency',
//               currency: 'USD',
//             })}
//           </p>
//         </div>
//         <div className="flex items-center justify-between">
//           <div className="space-y-1">
//             <p className="text-t-270 text-xs">{t`Pool Size`}</p>
//             <Tooltip>
//               <TooltipTrigger className="decoration-t-430 text-t-1100 font-plex cursor-pointer text-sm underline decoration-dotted underline-offset-3">
//                 {truncateFormat(
//                   mixedCoinObj?.decimal
//                     ? calc(coin_amount)
//                         .div(Math.pow(10, mixedCoinObj?.decimal ?? 4))
//                         .times(px || '')
//                     : '',
//                   usdAmountDisplayDecimal,
//                   {
//                     style: 'currency',
//                     currency: 'USD',
//                     showMinDecimalValue: true,
//                   },
//                 )}
//               </TooltipTrigger>
//               <TooltipContent side="top">
//                 {unitFormat(
//                   mixedCoinObj?.decimal
//                     ? fromDecimalsAmount(
//                         coin_amount.toString(10),
//                         mixedCoinObj?.decimal,
//                       )
//                     : '',
//                   mixedCoinObj?.szDispDecimal,
//                   {
//                     stripTrailingZeros: true,
//                     showMinDecimalValue: true,
//                   },
//                 )}{' '}
//                 {mixedCoinObj?.coin_name}
//               </TooltipContent>
//             </Tooltip>
//           </div>
//           <div className="space-y-1">
//             <p className="text-t-270 text-xs">{t`Current / Target Weightage`}</p>
//             <p className="text-t-1100 font-plex text-right text-sm">
//               {`${percentFormat(current_weight, 2, {
//                 showMinDecimalValue: true,
//                 stripTrailingZeros: true,
//               })} / ${percentFormat(calc(target_weight), 2)}`}
//             </p>
//           </div>
//         </div>
//         <div className="flex items-center justify-between">
//           <div className="space-y-1">
//             <p className="text-t-270 text-xs">{t`Apr(24h)`}</p>
//             <p
//               className={`${
//                 calc(mixedCoinObj?.apr?.[aprPeriod ?? '24h'] ?? '').lt(0)
//                   ? 'text-down'
//                   : 'text-up'
//               }`}
//             >
//               {mixedCoinObj?.apr?.[aprPeriod ?? '24h']
//                 ? percentFormat(mixedCoinObj.apr[aprPeriod ?? '24h'], 2, {
//                     showMinDecimalValue: true,
//                     stripTrailingZeros: true,
//                   })
//                 : 'N/A'}
//             </p>
//           </div>
//           <div className="space-y-1">
//             <p className="text-t-270 text-xs">{t`Utilization`}</p>
//             <Tooltip>
//               <TooltipTrigger className="decoration-t-430 text-t-1100 font-plex cursor-pointer text-right text-sm underline decoration-dotted underline-offset-3">
//                 {percentFormat(utilization, 2, {
//                   showMinDecimalValue: true,
//                   stripTrailingZeros: true,
//                 })}
//               </TooltipTrigger>
//               <TooltipContent side="top">
//                 <div>
//                   Available for borrow:{' '}
//                   {unitFormat(availableForBorrow, usdAmountDisplayDecimal, {
//                     style: 'currency',
//                     currency: 'USD',
//                   })}
//                 </div>
//                 <div>
//                   Max Deposit:{' '}
//                   {maxDepositResult?.usdValue ? (
//                     `${unitFormat(
//                       Number(maxDepositResult.usdValue),
//                       usdAmountDisplayDecimal,
//                       {
//                         style: 'currency',
//                         currency: 'USD',
//                         showMinDecimalValue: true,
//                       },
//                     )}`
//                   ) : (
//                     <span className="text-xs text-gray-500">N/A</span>
//                   )}
//                 </div>
//                 <div>
//                   Max Withdrawal:{' '}
//                   {maxWithdrawalResult?.usdValue ? (
//                     `${unitFormat(
//                       Number(maxWithdrawalResult.usdValue),
//                       usdAmountDisplayDecimal,
//                       {
//                         style: 'currency',
//                         currency: 'USD',
//                         showMinDecimalValue: true,
//                       },
//                     )}`
//                   ) : (
//                     <span className="text-xs text-gray-500">N/A</span>
//                   )}
//                 </div>
//               </TooltipContent>
//             </Tooltip>
//           </div>
//         </div>
//         <Separator />
//       </div>
//     );
//   },
// );

// AllocationCard.displayName = 'AllocationCard';

// const AllocationSm = ({ data }: AllocationProps) => {
//   const { t } = useLingui();
//   const coins = useInstStore((state) => state.getCoins());

//   return (
//     <>
//       <h3 className="text-t-1100 py-4 text-xl font-semibold">{t`Liquidity Allocation`}</h3>
//       <div className="space-y-4">
//         {data?.coin_details.map((poolDetail) => (
//           <AllocationCard
//             key={poolDetail.coin_type}
//             poolDetail={poolDetail}
//             coins={coins}
//           />
//         ))}
//       </div>
//     </>
//   );
// };

// export default memo(AllocationSm);

'use client';
import { memo, useMemo } from 'react';
import { addHexPrefix, calc } from '@hertzflow/sdk';
import { useLingui } from '@lingui/react/macro';
import { percentFormat, unitFormat } from '@repo/lib/format';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui';
import {
  buildPriceId,
  CoinDetailItem,
  useGlobalStore,
  useInstStore,
  usePriceTickerStream,
} from '@/common';
import { Props } from '../types';

const BodyItemSm = memo(
  ({
    coin_type,
    coin_name,
    coin_amount,
    utilization,
  }: Pick<
    CoinDetailItem,
    'coin_type' | 'coin_name' | 'coin_amount' | 'utilization'
  >) => {
    const usdAmountDisplayDecimal = useGlobalStore(
      (state) => state.usdAmountDisplayDecimal,
    );
    const coins = useInstStore((state) => state.getCoins());
    const coinObjFromInstStore = coins[addHexPrefix(coin_type)];
    const mixedCoinObj = {
      ...{
        coin_type,
        coin_name,
        coin_amount,
        utilization,
      },
      ...coinObjFromInstStore,
    };
    const instSymbol = buildPriceId(mixedCoinObj?.coin_name ?? '');
    const px = usePriceTickerStream(instSymbol, { throttleWait: 5000 }).data[0]
      ?.p;
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
    const utilizationFormatted = useMemo(
      () =>
        percentFormat(utilization, 2, {
          showMinDecimalValue: true,
          stripTrailingZeros: true,
        }),
      [utilization],
    );

    return (
      <TableRow key={coin_name}>
        <TableCell>{coin_name}</TableCell>
        <TableCell className="font-plex">{poolSizeFormatted}</TableCell>
        <TableCell className="font-plex">{utilizationFormatted}</TableCell>
      </TableRow>
    );
  },
);
BodyItemSm.displayName = 'BodyItemSm';

export const AllocationSm = ({ poolDetail }: Props) => {
  const { t } = useLingui();

  const coinDetail = useMemo(
    () => poolDetail?.coin_details ?? [],
    [poolDetail?.coin_details],
  );

  return (
    <div className="my-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-t-270 text-xs font-normal">{t`Market`}</TableHead>
            <TableHead className="text-t-270 text-xs font-normal">{t`Pool Size`}</TableHead>
            <TableHead className="text-t-270 text-xs font-normal">{t`Utilization`}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coinDetail &&
            coinDetail.map(
              ({ coin_type, coin_name, coin_amount, utilization }) => {
                return (
                  <BodyItemSm
                    key={coin_type}
                    coin_type={coin_type}
                    coin_name={coin_name}
                    coin_amount={coin_amount}
                    utilization={utilization}
                  />
                );
              },
            )}
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

export default memo(AllocationSm);
