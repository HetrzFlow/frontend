import { FC } from 'react';

export const dynamicParams = false;

const RootLayout: FC<
  Readonly<{
    params: Promise<{ locale: string }>;
    children: React.ReactNode;
  }>
> = async ({ children }) => {
  return children;
};

export default RootLayout;
