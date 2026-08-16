'use client';

import { useLingui } from '@lingui/react/macro';
import SplitText from '@/components/SplitText';
import Leverage from './Leverage';
import Oracle from './Oracle';
import TradeCategory from './TradeCategory';
import TradingExperience from './TradingExperience';

const ProductIntro = () => {
  const { t } = useLingui();

  return (
    <div className="mx-auto mt-20 max-w-[1440px] px-20 max-md:mt-15 max-md:max-w-dvw max-md:px-4 lg:mt-45 lg:overflow-x-visible">
      <h2 className="lg:text-center">
        <SplitText
          text={t`Trade The World Your Way`}
          className="font-borna overflow-visible text-center text-[calc(var(--spacing)*8)]/[1.2] font-medium max-md:text-[calc(var(--spacing)*7)]/[1.2] lg:text-[52px]/[1]"
          delay={10}
          duration={2}
          ease="elastic.out(1, 0.3)"
          splitType="words, chars"
          threshold={0}
          textAlign="left"
        />
      </h2>
      <div className="mt-20 grid grid-cols-2 gap-0 max-md:mt-10 max-md:grid-cols-1">
        <div className="border-border-color relative border-r border-b pr-6 pb-10 max-md:border-0 max-md:p-0">
          <TradeCategory />
        </div>
        <div className="border-border-color relative border-b pb-10 pl-6 max-md:mt-5 max-md:border-0 max-md:p-0">
          <Oracle />
        </div>
        <div className="border-border-color relative border-r pt-10 pr-6 max-md:mt-5 max-md:border-0 max-md:p-0">
          <Leverage />
        </div>
        <div className="relative pt-10 pl-6 max-md:mt-5 max-md:border-0 max-md:p-0">
          <TradingExperience />
        </div>
      </div>
    </div>
  );
};

export default ProductIntro;
