import bgLighter from './bg-lighter.png';

import btcUsdIcon from './btc-usd.svg';
import deepIcon from './deep.png';
import ethIcon from './eth.svg';
import favicon from './favicon.svg';
import hzlpIcon from './hzlp.png';
import Step1Dark from './onboarding/step1-dark.png';
import Step1Light from './onboarding/step1-light.png';
import Step2Dark from './onboarding/step2-dark.png';
import Step2Light from './onboarding/step2-light.png';
import Step3Dark from './onboarding/step3-dark.png';
import Step3Light from './onboarding/step3-light.png';
import suiIcon from './sui.svg';
import usdcIcon from './usdc.svg';
import usdtIcon from './usdt.png';
import walIcon from './wal.svg';
import xbtcIcon from './xbtc.png';

export const IMAGES_MAP = {
  favicon: favicon,
  coinIcons: {
    SUI: suiIcon,
    xBTC: xbtcIcon.src,
    ETH: ethIcon,
    USDC: usdcIcon,
    HzLP: hzlpIcon.src,
    BTC: btcUsdIcon,
    USDT: usdtIcon.src,
    DEEP: deepIcon.src,
    WAL: walIcon,
  },
  instIcons: {
    'SUI/USD': suiIcon,
    'BTC/USD': btcUsdIcon,
    'ETH/USD': ethIcon,
  },
  bgLighter,
  steps: {
    1: {
      dark: Step1Dark,
      light: Step1Light,
    },
    2: {
      dark: Step2Dark,
      light: Step2Light,
    },
    3: {
      dark: Step3Dark,
      light: Step3Light,
    },
  },
};
