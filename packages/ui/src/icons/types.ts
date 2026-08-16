import { ComponentProps } from 'react';

export interface IconProps extends ComponentProps<'svg'> {
  size?: number;
}

export interface IconPropsWithFilled extends IconProps {
  filled?: boolean;
}
