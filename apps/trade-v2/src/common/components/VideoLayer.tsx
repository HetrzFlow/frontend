'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';

interface VideoLayerProps {
  className: string;
  visibleClassName: string;
  src: string;
  fallbackText?: string;
}

const VideoLayer = ({
  className,
  visibleClassName,
  src,
  fallbackText = 'Your browser does not support the video tag.',
}: VideoLayerProps) => {
  const [ready, setReady] = useState(false);
  const [animate, setAnimate] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const revealedRef = useRef(false);
  const seekingRef = useRef(false);

  const reveal = useCallback((shouldAnimate: boolean) => {
    if (revealedRef.current) return;
    revealedRef.current = true;
    if (shouldAnimate) setAnimate(true);
    setReady(true);
  }, []);

  const scheduleReveal = useCallback(
    (shouldAnimate: boolean) => {
      const video = videoRef.current;
      if (!video) return;
      if (revealedRef.current) return;
      const show = () => reveal(shouldAnimate);
      if ('requestVideoFrameCallback' in video) {
        (
          video as HTMLVideoElement & {
            requestVideoFrameCallback: (cb: () => void) => number;
          }
        ).requestVideoFrameCallback(() => {
          requestAnimationFrame(show);
        });
        return;
      }
      requestAnimationFrame(show);
    },
    [reveal],
  );

  const seekToStableFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (seekingRef.current || revealedRef.current) return;
    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) return;
    const target = Math.min(duration * 0.25, Math.max(duration - 0.05, 0));
    if (target <= 0) {
      scheduleReveal(false);
      return;
    }
    if (Math.abs(video.currentTime - target) < 0.02) {
      scheduleReveal(false);
      return;
    }
    seekingRef.current = true;
    try {
      video.currentTime = target;
    } catch {
      seekingRef.current = false;
      scheduleReveal(false);
    }
  }, [scheduleReveal]);

  const handleCanPlay = () => {
    if (seekingRef.current) return;
    scheduleReveal(true);
  };

  const handleSeeked = () => {
    if (!seekingRef.current) return;
    seekingRef.current = false;
    scheduleReveal(true);
  };

  useLayoutEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.readyState >= 1) {
      seekToStableFrame();
    }
  }, [seekToStableFrame]);

  return (
    <video
      ref={videoRef}
      width="100%"
      loop
      autoPlay
      preload="auto"
      muted
      playsInline
      onLoadedMetadata={seekToStableFrame}
      onSeeked={handleSeeked}
      onCanPlay={handleCanPlay}
      className={`${className} ${animate ? 'transition-opacity duration-300' : ''} ${ready ? visibleClassName : 'opacity-0'}`}
    >
      <source src={src} type="video/mp4" />
      {fallbackText}
    </video>
  );
};

export default VideoLayer;
