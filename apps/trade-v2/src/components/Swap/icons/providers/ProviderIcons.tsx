import { ComponentProps, FC } from 'react';

export type ProviderIconProps = ComponentProps<'svg'> & { size?: number };

const ASSET_BASE = '/trade-static/swap/providers';

const ProviderAssetIcon: FC<ProviderIconProps & { src: string }> = ({
  src,
  size = 14,
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 14 14"
    fill="none"
    {...props}
  >
    <image href={src} width="14" height="14" preserveAspectRatio="xMidYMid slice" />
  </svg>
);

export const PancakeSwapIcon: FC<ProviderIconProps> = (props) => (
  <ProviderAssetIcon src={`${ASSET_BASE}/pancakeswap.svg`} {...props} />
);

export const ApeSwapIcon: FC<ProviderIconProps> = (props) => (
  <ProviderAssetIcon src={`${ASSET_BASE}/apeswap.svg`} {...props} />
);

export const UniswapIcon: FC<ProviderIconProps> = (props) => (
  <ProviderAssetIcon src={`${ASSET_BASE}/uniswap.svg`} {...props} />
);

export const DodoIcon: FC<ProviderIconProps> = (props) => (
  <ProviderAssetIcon src={`${ASSET_BASE}/dodo.svg`} {...props} />
);

export const ThenaIcon: FC<ProviderIconProps> = (props) => (
  <ProviderAssetIcon src={`${ASSET_BASE}/thena.svg`} {...props} />
);

export const SquadSwapIcon: FC<ProviderIconProps> = (props) => (
  <ProviderAssetIcon src={`${ASSET_BASE}/squadswap.svg`} {...props} />
);

export const ListaIcon: FC<ProviderIconProps> = (props) => (
  <ProviderAssetIcon src={`${ASSET_BASE}/lista.svg`} {...props} />
);

export const WombatIcon: FC<ProviderIconProps> = (props) => (
  <ProviderAssetIcon src={`${ASSET_BASE}/wombat.svg`} {...props} />
);

export const BakerySwapIcon: FC<ProviderIconProps> = (props) => (
  <ProviderAssetIcon src={`${ASSET_BASE}/bakeryswap.svg`} {...props} />
);

export const BabyDogeSwapIcon: FC<ProviderIconProps> = (props) => (
  <ProviderAssetIcon src={`${ASSET_BASE}/babydogeswap.svg`} {...props} />
);

export const NomiswapIcon: FC<ProviderIconProps> = (props) => (
  <ProviderAssetIcon src={`${ASSET_BASE}/nomiswap.svg`} {...props} />
);

export const SushiSwapIcon: FC<ProviderIconProps> = (props) => (
  <ProviderAssetIcon src={`${ASSET_BASE}/sushiswap.svg`} {...props} />
);

export const BiswapIcon: FC<ProviderIconProps> = (props) => (
  <ProviderAssetIcon src={`${ASSET_BASE}/biswap.svg`} {...props} />
);

export const BabySwapIcon: FC<ProviderIconProps> = (props) => (
  <ProviderAssetIcon src={`${ASSET_BASE}/babyswap.png`} {...props} />
);
