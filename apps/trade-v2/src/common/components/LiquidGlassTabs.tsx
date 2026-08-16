import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react';

import { cn } from '@repo/ui';

export const LIQUID_GLASS_FILTER_ID = 'hertz-liquid-glass-filter';
const LIQUID_GLASS_DISPLACEMENT_MAP_SRC =
  '/trade-static/liquid-glass-displacement.webp';
const LIQUID_GLASS_FILTER_REGION = {
  x: '-0.16',
  y: '-0.38',
  width: '1.28',
  height: '1.76',
};
const LIQUID_GLASS_INDICATOR_FILTER_REGION = {
  x: '-0.12',
  y: '-0.24',
  width: '1.24',
  height: '1.48',
};

const liquidGlassBackdropFilter = `blur(8px) url(#${LIQUID_GLASS_FILTER_ID}) saturate(150%)`;
const liquidGlassIndicatorBackdropFilter = `blur(8px) url(#${LIQUID_GLASS_FILTER_ID}-indicator) saturate(150%)`;
const liquidGlassSafariBackdropFilter = 'blur(8px) saturate(150%)';

export const liquidGlassTabsStyle: CSSProperties = {
  color: '#e1e1e1',
  backgroundColor: 'rgba(187, 187, 188, 0.12)',
  backdropFilter: liquidGlassBackdropFilter,
  WebkitBackdropFilter: liquidGlassSafariBackdropFilter,
  boxShadow: [
    'inset 0 0 0 1px rgba(255, 255, 255, 0.03)',
    'inset 1.8px 3px 0 -2px rgba(255, 255, 255, 0.27)',
    'inset -2px -2px 0 -2px rgba(255, 255, 255, 0.24)',
    'inset -3px -8px 1px -6px rgba(255, 255, 255, 0.18)',
    'inset -0.3px -1px 4px rgba(0, 0, 0, 0.24)',
    'inset -1.5px 2.5px 0 -2px rgba(0, 0, 0, 0.4)',
    'inset 0 3px 4px -2px rgba(0, 0, 0, 0.4)',
    'inset 2px -6.5px 1px -4px rgba(0, 0, 0, 0.2)',
    '0 1px 5px rgba(0, 0, 0, 0.2)',
    '0 6px 16px rgba(0, 0, 0, 0.16)',
  ].join(', '),
};

export const liquidGlassTabIndicatorStyle: CSSProperties = {
  backgroundColor: 'rgba(187, 187, 188, 0.05)',
  backdropFilter: liquidGlassIndicatorBackdropFilter,
  WebkitBackdropFilter: liquidGlassSafariBackdropFilter,
  boxShadow: [
    'inset 0 0 0 1px rgba(255, 255, 255, 0.03)',
    'inset 2px 1px 0 -1px rgba(255, 255, 255, 0.27)',
    'inset -1.5px -1px 0 -1px rgba(255, 255, 255, 0.24)',
    'inset -2px -6px 1px -5px rgba(255, 255, 255, 0.18)',
    'inset -1px 2px 3px -1px rgba(0, 0, 0, 0.4)',
    'inset 0 -4px 1px -2px rgba(0, 0, 0, 0.2)',
    '0 3px 6px rgba(0, 0, 0, 0.16)',
  ].join(', '),
};

export function LiquidGlassFilterDefs() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none fixed h-0 w-0"
    >
      <filter
        id={LIQUID_GLASS_FILTER_ID}
        x={LIQUID_GLASS_FILTER_REGION.x}
        y={LIQUID_GLASS_FILTER_REGION.y}
        width={LIQUID_GLASS_FILTER_REGION.width}
        height={LIQUID_GLASS_FILTER_REGION.height}
        filterUnits="objectBoundingBox"
        primitiveUnits="objectBoundingBox"
        colorInterpolationFilters="sRGB"
      >
        <feImage
          result="map"
          width={LIQUID_GLASS_FILTER_REGION.width}
          height={LIQUID_GLASS_FILTER_REGION.height}
          x={LIQUID_GLASS_FILTER_REGION.x}
          y={LIQUID_GLASS_FILTER_REGION.y}
          preserveAspectRatio="none"
          href={LIQUID_GLASS_DISPLACEMENT_MAP_SRC}
        />
        <feGaussianBlur in="SourceGraphic" stdDeviation="0.04" result="blur" />
        <feDisplacementMap
          id="hertz-liquid-glass-displacement"
          in="blur"
          in2="map"
          scale="0.5"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}

export function LiquidGlassIndicatorFilterDefs() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none fixed h-0 w-0"
    >
      <filter
        id={`${LIQUID_GLASS_FILTER_ID}-indicator`}
        x={LIQUID_GLASS_INDICATOR_FILTER_REGION.x}
        y={LIQUID_GLASS_INDICATOR_FILTER_REGION.y}
        width={LIQUID_GLASS_INDICATOR_FILTER_REGION.width}
        height={LIQUID_GLASS_INDICATOR_FILTER_REGION.height}
        filterUnits="objectBoundingBox"
        primitiveUnits="objectBoundingBox"
        colorInterpolationFilters="sRGB"
      >
        <feImage
          result="map"
          width={LIQUID_GLASS_INDICATOR_FILTER_REGION.width}
          height={LIQUID_GLASS_INDICATOR_FILTER_REGION.height}
          x={LIQUID_GLASS_INDICATOR_FILTER_REGION.x}
          y={LIQUID_GLASS_INDICATOR_FILTER_REGION.y}
          preserveAspectRatio="none"
          href={LIQUID_GLASS_DISPLACEMENT_MAP_SRC}
        />
        <feGaussianBlur in="SourceGraphic" stdDeviation="0.01" result="blur" />
        <feDisplacementMap
          id="hertz-liquid-glass-indicator-displacement"
          in="blur"
          in2="map"
          scale="0.5"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}

const LiquidGlassTabs = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ children, className, style, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative isolate flex items-center overflow-hidden rounded-full border-0 transition-[background-color,box-shadow]',
      className,
    )}
    style={{ ...liquidGlassTabsStyle, ...style }}
    {...props}
  >
    {children}
  </div>
));

LiquidGlassTabs.displayName = 'LiquidGlassTabs';

export default LiquidGlassTabs;
