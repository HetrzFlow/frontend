import Image from 'next/image';

const PythIcon = ({
  size = 13,
  className,
}: {
  size?: number;
  className?: string;
}) => (
  <Image
    src="/trade-static/swap/pyth.svg"
    alt=""
    width={size}
    height={size}
    unoptimized
    className={className}
  />
);

export default PythIcon;
