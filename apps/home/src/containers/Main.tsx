import { FC } from 'react';
import Banner from './banner';
import Developer from './developer';
import HomeBrandWordmark from './homeBrandWordmark';
import Modular from './modular';
import ProductIntro from './productIntro';
import TradePage from './tradePage';

const Main: FC = () => {
  return (
    <>
      <main className="mx-auto">
        <Banner />
        <section id="trade" aria-label="Product features">
          <ProductIntro />
          <TradePage />
        </section>
        <section id="earn" aria-label="Open liquidity and modular yield">
          <Modular />
        </section>
        <section id="developers" aria-label="Developer integration">
          <Developer />
        </section>
        <section aria-label="HertzFlow brand wordmark">
          <HomeBrandWordmark />
        </section>
      </main>
    </>
  );
};

export default Main;
