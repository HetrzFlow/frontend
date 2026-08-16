import { FC } from 'react';

import { useLingui } from '@lingui/react/macro';
import { type BN } from '@repo/lib/calc';
import { unitFormat } from '@repo/lib/format';
import CoinIcon from '../../../../components/CoinIcon';
import { Coin } from '../../../../services/rest/inst';
import { useGlobalStore } from '../../../../stores/globalStore';
import { useStore } from '../../store';

// asset item
const AssetItem: FC<{
  coin: Coin;
  size: string;
  usdValue: string | BN;
}> = ({ coin, size, usdValue }) => {
  const usdAmountDisplayDecimal = useGlobalStore(
    (state) => state.usdAmountDisplayDecimal,
  );
  return (
    <div className="hover:bg-bg-3 flex cursor-pointer items-center rounded-lg p-2 text-base font-medium transition-[background] duration-400">
      <CoinIcon src={coin.icon} alt={coin.symbol} />
      <div className="ml-3 flex h-10 flex-col">
        <span>{coin.symbol}</span>
        <span className="text-secondary-foreground mt-auto text-sm font-normal">
          {coin.name}
        </span>
      </div>
      <div className="font-plex ml-auto flex h-10 flex-col justify-center text-right">
        <span>
          {unitFormat(size, coin.szDispDecimal, {
            minNumber: 1000000,
            showMinDecimalValue: true,
            stripTrailingZeros: true,
          })}
        </span>
        <span className="text-secondary-foreground mt-auto text-sm font-normal">
          {unitFormat(usdValue, usdAmountDisplayDecimal, {
            style: 'currency',
            currency: 'USD',
            minNumber: 1000000,
            showMinDecimalValue: true,
            stripTrailingZeros: true,
          })}
        </span>
      </div>
    </div>
  );
};

const Assets: FC = () => {
  const { t } = useLingui();

  const assetList = useStore((state) => state.assetList);

  return (
    <>
      {assetList.map(({ coin, size, usdValue }) => (
        <AssetItem
          key={coin.coinType}
          coin={coin}
          size={size}
          usdValue={usdValue}
        />
      ))}
      {!assetList.length && (
        <p className="text-t-430 mt-2 text-center text-sm">{t`No results`}</p>
      )}
    </>
  );
};

export default Assets;
