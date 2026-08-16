'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useLingui } from '@lingui/react/macro';

const TradePageImage = () => {
  const { i18n, t } = useLingui();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouseRotateX, setMouseRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const imageSrc =
    i18n.locale === 'zh-Hans'
      ? '/home-static/images/trade-page-zh-hans.webp'
      : i18n.locale === 'zh-Hant'
        ? '/home-static/images/trade-page-zh-hant.webp'
        : '/home-static/images/trade-page.webp';

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate rotation based on mouse position relative to center
    const newRotateY = ((x - centerX) / centerX) * 5; // Max 5deg rotation
    const newRotateX = ((y - centerY) / centerY) * -5; // Max 5deg rotation

    setMouseRotateX(newRotateX);
    setRotateY(newRotateY);
  };

  const handleMouseLeave = () => {
    setMouseRotateX(0);
    setRotateY(0);
  };

  useEffect(() => {
    let hasEntered = false;

    const handleScroll = () => {
      if (!hasEntered || !containerRef.current || !contentRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();

      const remainingScrollDistance =
        document.documentElement.scrollHeight -
        (containerRect.top + window.scrollY) -
        window.innerHeight;

      // scroll distance 0.5 screen height
      const scrollDistance = Math.min(
        Math.max(remainingScrollDistance, 0),
        window.innerHeight * 0.6,
      );

      // start position
      const currentOffset = -containerRect.top;
      const progress = Math.min(
        Math.max((currentOffset + window.innerHeight) / scrollDistance, 0),
        1,
      );

      setScrollProgress(progress);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasEntered) {
            hasEntered = true;
            handleScroll();
          }
        });
      },
      {
        threshold: 0.1,
      },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div
      className="mx-auto max-w-[1440px] px-20 pt-28 max-md:max-w-dvw max-md:px-4 max-md:pt-10 lg:overflow-x-visible"
      ref={containerRef}
    >
      <div
        ref={contentRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="flex items-center justify-center transition-transform duration-200 ease-out"
        style={{
          transform: `perspective(2000px) rotateX(${60 - scrollProgress * 60 + mouseRotateX}deg) rotateY(${rotateY}deg)`,
        }}
      >
        <Image
          src={imageSrc}
          alt={t`HertzFlow trading interface — leverage trading terminal with real-time charts and position management`}
          className="w-full rounded-2xl border"
          priority
          unoptimized
          width={1280}
          height={800}
          sizes="(max-width: 768px) 100vw, 1280px"
        />
      </div>
    </div>
  );
};

export default TradePageImage;
