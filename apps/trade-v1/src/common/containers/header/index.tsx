'use client';

import { FC, memo, ReactNode, useEffect, useState } from 'react';

import Image from 'next/image';
import { MEDIA_SIZES, useMediaQuery } from '@repo/ui';
import { IMAGES_MAP } from '../../assets';
import ToasterCus from '../../components/Toaster';
import { subSystemStatus } from '../../services/ws/system';
import Content from './Content';
import Maintenance from './Maintenance';

interface HeaderProps {
  clientRoutes?: string[];
  rightNav?: ReactNode;
  children?: ReactNode;
}

const bgLighter = IMAGES_MAP.bgLighter;

const Header: FC<HeaderProps> = ({ clientRoutes = [], rightNav, children }) => {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const isMobile = useMediaQuery() === MEDIA_SIZES.SM;

  useEffect(() => {
    const unsub = subSystemStatus({
      callback({ data }) {
        if (data[0]?.event_type === 'system_maintenance') {
          setIsMaintenance(data[0].data);
        }
      },
    });

    return unsub;
  }, []);

  // handle android webview text size issue
  useEffect(() => {
    const htmlEle = document.querySelector('html');

    if (isMobile && htmlEle) {
      const fontSize = parseFloat(getComputedStyle(htmlEle).fontSize);
      htmlEle.style.fontSize = `${(16 * 16) / fontSize}px`;
    }

    return () => {
      // reset font size
      if (isMobile && htmlEle) {
        htmlEle.style.fontSize = '16px';
      }
    };
  }, [isMobile]);

  return isMaintenance ? (
    <Maintenance />
  ) : (
    <>
      <Image
        src={bgLighter.src}
        width={bgLighter.width}
        height={bgLighter.height}
        alt=""
        className="hiddenIn404 fixed -top-[300px] -right-[40px] -z-1 max-w-none opacity-15 max-md:hidden dark:opacity-100"
        priority
      />
      <Content clientRoutes={clientRoutes} rightNav={rightNav} />
      {children}
      <ToasterCus />
    </>
  );
};

export default memo(Header);
