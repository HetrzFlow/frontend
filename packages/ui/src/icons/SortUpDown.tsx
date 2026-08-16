import { ComponentProps, FC } from 'react';
import { cn } from '../lib/utils';

const SortUpDownIcon: FC<
  ComponentProps<'div'> & {
    size?: number;
    upClassName?: string;
    downClassName?: string;
  }
> = ({ size = 6, upClassName, downClassName, className, ...props }) => {
  return (
    <div className={cn('flex flex-col gap-[1px]', className)} {...props}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        viewBox="0 0 4 3"
        fill="none"
        className={upClassName}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M0.0173037 2.68142C0.0494366 2.75357 0.121021 2.80005 0.200003 2.80005H3.8C3.87898 2.80005 3.95056 2.75357 3.9827 2.68142C4.01483 2.60927 4.00149 2.52496 3.94865 2.46626L2.14866 0.0662613C2.11073 0.0241187 2.0567 5.43594e-05 2 5.43594e-05C1.9433 5.43594e-05 1.88927 0.0241187 1.85134 0.0662613L0.0513448 2.46626C-0.00149141 2.52496 -0.0148293 2.60927 0.0173037 2.68142Z"
          fill="currentColor"
        />
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        viewBox="0 0 4 4"
        fill="none"
        strokeWidth={0}
        className={downClassName}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          strokeWidth={0}
          d="M0.0173037 0.918681C0.0494366 0.846531 0.121021 0.800049 0.200003 0.800049H3.8C3.87898 0.800049 3.95056 0.846531 3.9827 0.918681C4.01483 0.990831 4.00149 1.07513 3.94865 1.13384L2.14866 3.53384C2.11073 3.57598 2.0567 3.60004 2 3.60004C1.9433 3.60004 1.88927 3.57598 1.85134 3.53384L0.0513448 1.13384C-0.00149141 1.07513 -0.0148293 0.990831 0.0173037 0.918681Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
};

export default SortUpDownIcon;
