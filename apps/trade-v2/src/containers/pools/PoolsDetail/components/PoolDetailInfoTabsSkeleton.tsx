import DetailInfoTabsSkeleton from './DetailInfoTabsSkeleton';

const PoolDetailInfoTabsSkeleton = ({
  constrained = false,
}: {
  constrained?: boolean;
}) => (
  <DetailInfoTabsSkeleton variant="pool" constrained={constrained} />
);

export default PoolDetailInfoTabsSkeleton;
