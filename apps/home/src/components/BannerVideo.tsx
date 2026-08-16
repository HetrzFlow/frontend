import { FC } from 'react';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { cn } from '@repo/ui';

interface BannerVideoProps {
  className?: string;
}

const BannerVideo: FC<BannerVideoProps> = ({ className }) => {
  return (
    <div
      className={cn(
        'flex items-start justify-center lg:-translate-y-[78px]',
        className,
      )}
    >
      <link
        rel="preload"
        as="image"
        href="/home-static/banner-home-poster.webp"
        fetchPriority="high"
      />
      <div className="relative w-[1830px] shrink-0 max-md:w-[1000px]">
        <video
          width="1440px"
          height="864px"
          loop
          autoPlay
          preload="metadata"
          poster="/home-static/banner-home-poster.webp"
          muted
          playsInline
          controls={false}
          className={cn(
            'relative w-auto rounded-3xl bg-black object-bottom lg:w-full',
          )}
        >
          <source src="/home-static/banner-home.mp4" type="video/mp4" />
          {i18n._(msg`Your browser does not support the video tag.`)}
        </video>
        <div className="absolute top-[50%] right-0 bottom-0 left-0 bg-gradient-to-t from-black to-transparent"></div>
      </div>
    </div>
  );
};

export default BannerVideo;
