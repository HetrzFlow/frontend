import { FC } from 'react';

import { NotFound as CommonNotFound } from '@repo/common/containers';

const NotFound: FC = () => {
  return <CommonNotFound showHeader showFooter theme={'dark'} />;
};

export default NotFound;
