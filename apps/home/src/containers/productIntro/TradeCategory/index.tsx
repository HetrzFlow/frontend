import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Trans, useLingui } from '@lingui/react/macro';
import ProductIntroFeature from '../components/ProductIntroFeature';
// import Card from './Card';

const Card = dynamic(() => import('./Card'), { ssr: false });

const TradeCategory = () => {
  const { t } = useLingui();
  const [hovered, setHovered] = useState(false);

  return (
    <ProductIntroFeature
      title={
        <Trans>
          Trade Literally <span className="text-accent">Anything</span>
        </Trans>
      }
      description={t`Crypto, FX, commodities, stocks — or create a market in minutes and bootstrap liquidity for any oracle-supported asset.`}
      cardClassName="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Card hovered={hovered} />
    </ProductIntroFeature>
  );
};

export default TradeCategory;
