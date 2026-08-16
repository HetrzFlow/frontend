/**
 * copy codes
 * https://codepen.io/davidkpiano/pen/XbpEKe
 */

import { cn } from '@repo/ui';
import styles from './AnimateCube.module.css';

const AnimateCube = () => {
  return (
    <div
      className={cn(
        'relative h-[466px] translate-y-[90px] scale-90 max-md:mb-10 max-md:h-[200px] lg:translate-y-[100px] lg:scale-100',
        styles.wrapper,
      )}
    >
      <div className={styles['cube']}>
        <div className={styles['faces-top']}>
          <div className={styles['face']}></div>
          <div className={styles['face']}></div>
          <div className={styles['face']}></div>
          <div className={styles['face']}></div>
          <div className={styles['face']}></div>
          <div className={styles['face']}></div>
          <div className={styles['face']}></div>
          <div className={styles['face']}></div>
          <div className={styles['face']}></div>
          <div className={styles['face']}></div>
        </div>
        <div className={styles['faces-left']}>
          <div className={styles['face']}></div>
          <div className={styles['face']}></div>
          <div className={styles['face']}></div>
          <div className={styles['face']}></div>
          <div className={styles['face']}></div>
          <div className={styles['face']}></div>
          <div className={styles['face']}></div>
          <div className={styles['face']}></div>
          <div className={styles['face']}></div>
          <div className={styles['face']}></div>
        </div>
        <div className={styles['faces-right']}>
          <div className={styles['face']}></div>
          <div className={styles['face']}></div>
          <div className={styles['face']}></div>
          <div className={styles['face']}></div>
          <div className={styles['face']}></div>
          <div className={styles['face']}></div>
          <div className={styles['face']}></div>
          <div className={styles['face']}></div>
          <div className={styles['face']}></div>
          <div className={styles['face']}></div>
        </div>
      </div>
    </div>
  );
};

export default AnimateCube;
