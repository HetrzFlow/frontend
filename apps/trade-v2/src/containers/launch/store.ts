import { create } from 'zustand';

interface StoreState {
  currentStep: number;
  slippage: string;
  selectedInstId: string;
  selectedOracle: string;
  longCollateralCoin: string;
  shortCollateralCoin: string;
  feeTier: string;
  openCloseFee: string;
  swapFee: string;
  lpRate: string;
  riskTier: string;
  initialTvl: string;
  impactFactor: string;
  mmr: string;
  maxLeverage: string;
}

interface StoreAction {
  setState: (state: Partial<StoreState>) => void;
}

export const useLaunchStore = create<StoreState & StoreAction>((set) => ({
  currentStep: 1,
  slippage: '0.001',
  selectedInstId: '',
  selectedOracle: 'HertzFlow',
  longCollateralCoin: '',
  shortCollateralCoin: '',
  setState: (values) => set(values),
  feeTier: 'institutional',
  openCloseFee: '0.06',
  swapFee: '0.06',
  lpRate: '0.06',
  riskTier: 'low_risk',
  initialTvl: '',
  impactFactor: '',
  mmr: '',
  maxLeverage: '',
}));
