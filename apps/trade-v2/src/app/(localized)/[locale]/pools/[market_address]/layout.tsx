import { FC, ReactNode } from 'react';
import Status from '@/common/containers/status';

interface Props {
  children: ReactNode;
  params: Promise<{
    market_address: string;
  }>;
}

const Layout: FC<Props> = async ({ children, params }) => {
  const { market_address } = await params;

  return (
    <div className="md:flex md:h-full md:min-h-0 md:flex-col">
      <Status
        marketAddress={market_address}
        className="mx-auto mt-[2px] mb-2 w-full max-w-[1080px] px-2 max-md:px-0"
      />
      <div className="md:min-h-0 md:flex-1">{children}</div>
    </div>
  );
};

export default Layout;
