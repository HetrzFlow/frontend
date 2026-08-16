import { useMediaQuery } from 'react-responsive';

export enum MEDIA_SIZES {
  SM = 'sm',
  MD = 'md',
  LG = 'lg',
}

export default () => {
  const isSm = useMediaQuery({ maxWidth: 768 });
  const isMd = useMediaQuery({ minWidth: 768, maxWidth: 1120 });
  const isLg = useMediaQuery({ minWidth: 1120 });

  if (isLg) {
    return MEDIA_SIZES.LG;
  }

  if (isMd) {
    return MEDIA_SIZES.MD;
  }

  if (isSm) {
    return MEDIA_SIZES.SM;
  }

  return MEDIA_SIZES.MD;
};
