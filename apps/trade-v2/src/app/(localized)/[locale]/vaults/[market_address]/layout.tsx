import { FC, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const Layout: FC<Props> = ({ children }) => {
  return (
    <div className="md:flex md:h-full md:min-h-0 md:flex-col">
      <div className="md:min-h-0 md:flex-1">{children}</div>
    </div>
  );
};

export default Layout;
