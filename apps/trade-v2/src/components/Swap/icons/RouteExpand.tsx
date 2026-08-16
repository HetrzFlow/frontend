import Image from 'next/image';

const RouteExpandIcon = ({
  size = 14,
  className,
}: {
  size?: number;
  className?: string;
}) => (
  <Image
    src="/trade-static/swap/route-expand.svg"
    alt=""
    width={size}
    height={size}
    unoptimized
    className={className}
  />
);

export default RouteExpandIcon;
