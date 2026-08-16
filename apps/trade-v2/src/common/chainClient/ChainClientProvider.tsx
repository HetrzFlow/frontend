import { PropsWithChildren } from 'react';
import PrivyContextProvider from './chains/PrivyContextProvider';

const ChainClientProvider = ({ children }: PropsWithChildren) => {
  return <PrivyContextProvider>{children}</PrivyContextProvider>;
};

export default ChainClientProvider;
