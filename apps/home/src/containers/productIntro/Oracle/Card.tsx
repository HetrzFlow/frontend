import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { MEDIA_SIZES, useMediaQuery } from '@repo/ui';
import type { AnimationItem } from 'lottie-web/build/player/lottie_svg';

const Card = forwardRef<AnimationItem | null>((_, ref) => {
  const isSm = useMediaQuery() === MEDIA_SIZES.SM;
  const ele = useRef(null);
  const [anim, setAnim] = useState<AnimationItem | null>(null);

  useImperativeHandle<AnimationItem | null, AnimationItem | null>(ref, () => {
    return anim;
  }, [anim]);

  useEffect(() => {
    // async import, because sync import will cause Next/Image crash
    import('lottie-web/build/player/lottie_svg').then(({ default: lottie }) => {
      if (ele.current) {
        const _anim = lottie.loadAnimation({
          container: ele.current, // the dom element that will contain the animation
          renderer: 'svg',
          loop: false,
          path: '/home-static/lotties/spike.json', // the path to the animation json
        });
        setAnim(_anim);
        _anim?.goToAndStop(0, true);
      }
    });
  }, []);

  useEffect(() => {
    if (isSm) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            anim?.goToAndPlay(0, true);
          } else {
            anim?.goToAndStop(0, true);
          }
        },
        {
          threshold: 0.5,
        },
      );

      if (ele.current) {
        observer.observe(ele.current);
      }

      return () => {
        observer.disconnect();
      };
    } else {
      return () => {};
    }
  }, [isSm, anim]);

  return <div className="size-75 w-full" ref={ele}></div>;
});

Card.displayName = 'OracleCard';

export default Card;
