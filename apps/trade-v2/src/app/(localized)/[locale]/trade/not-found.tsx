'use client';

import { FC } from 'react';

import { NotFound as CommonNotFound } from '@repo/common/containers';

const NotFound: FC = () => {
  document.cookie = `INST_ID=;path=/`;
  return <CommonNotFound />;
};

export default NotFound;
