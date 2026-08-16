import { FC, useEffect, useRef } from 'react';
import type { AnimationItem } from 'lottie-web/build/player/lottie_svg';

interface ZeroFeeProps {
  animation: boolean;
}

const ZeroFee: FC<ZeroFeeProps> = ({ animation }) => {
  const ele = useRef(null);
  const anim = useRef<AnimationItem | null>(null);

  useEffect(() => {
    // async import, because sync import will cause Next/Image crash
    import('lottie-web/build/player/lottie_svg').then(({ default: lottie }) => {
      if (ele.current) {
        anim.current = lottie.loadAnimation({
          container: ele.current,
          renderer: 'svg',
          loop: false,
          path: '/home-static/lotties/zerofee.json',
        });
        anim.current.setSpeed(0.6);
        anim.current.goToAndStop(0, true);
      }
    });

    return () => anim.current?.destroy();
  }, []);

  useEffect(() => {
    if (animation) {
      anim.current?.goToAndPlay(0, true);
    } else {
      anim.current?.goToAndStop(0, true);
    }
  }, [animation]);

  return <div ref={ele} className="ml-auto w-10"></div>;
};

export default ZeroFee;
