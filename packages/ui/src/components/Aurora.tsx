'use client';

import { useEffect, useRef, useState } from 'react';
import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';
import { cn } from '../lib/utils';

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ),
      0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {              \
  int index = 0;                                            \
  for (int i = 0; i < 2; i++) {                               \
     ColorStop currentColor = colors[i];                    \
     bool isInBetween = currentColor.position <= factor;    \
     index = int(mix(float(index), float(i), float(isInBetween))); \
  }                                                         \
  ColorStop currentColor = colors[index];                   \
  ColorStop nextColor = colors[index + 1];                  \
  float range = nextColor.position - currentColor.position; \
  float lerpFactor = (factor - currentColor.position) / range; \
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);

  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);

  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;

  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);

  vec3 auroraColor = intensity * rampColor;

  fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`;

interface AuroraProps {
  colorStops?: string[];
  amplitude?: number;
  blend?: number;
  time?: number;
  speed?: number;
  className?: string;
}

const DEFAULT_COLOR_STOPS = ['#5227FF', '#7cff67', '#5227FF'];
const canUseWebGL = () => {
  if (typeof document === 'undefined') return false;
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
  if (!gl) return false;
  const loseContext = gl.getExtension('WEBGL_lose_context');
  if (loseContext) loseContext.loseContext();
  return true;
};

export const Aurora = (props: AuroraProps) => {
  const {
    colorStops = DEFAULT_COLOR_STOPS,
    amplitude = 1.0,
    blend = 0.5,
    className,
  } = props;
  const propsRef = useRef<AuroraProps>(props);
  propsRef.current = props;

  const ctnDom = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  const normalizeHex = (value: unknown) => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (/^#([0-9a-fA-F]{6})$/.test(trimmed)) return trimmed;
    const short = /^#([0-9a-fA-F]{3})$/.exec(trimmed);
    if (short) {
      const expanded = short[1]!.split('').map((c) => `${c}${c}`).join('');
      return `#${expanded}`;
    }
    return null;
  };
  const normalizeStops = (stops: unknown) => {
    if (!Array.isArray(stops)) return DEFAULT_COLOR_STOPS;
    const sanitized = stops.map(normalizeHex).filter(Boolean) as string[];
    if (sanitized.length < 3) return DEFAULT_COLOR_STOPS;
    return sanitized.slice(0, 3);
  };

  useEffect(() => {
    const ctn = ctnDom.current;
    if (!ctn) return;
    setIsReady(false);
    if (!canUseWebGL()) return;

    let renderer: Renderer | null = null;
    try {
      renderer = new Renderer({
        alpha: true,
        premultipliedAlpha: true,
        antialias: true,
      });
    } catch {
      return;
    }
    if (!renderer) return;
    const rendererInstance = renderer;
    const gl = rendererInstance.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.canvas.style.backgroundColor = 'transparent';

    // eslint-disable-next-line prefer-const
    let program: Program | undefined;
    let hasRendered = false;

    function resize() {
      if (!ctn) return;
      const width = ctn.offsetWidth;
      const height = ctn.offsetHeight;
      rendererInstance.setSize(width, height);
      if (program) {
        program.uniforms.uResolution.value = [width, height];
      }
    }
    window.addEventListener('resize', resize);

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) {
      delete geometry.attributes.uv;
    }

    const colorStopsArray = normalizeStops(colorStops).map((hex) => {
      const c = new Color(hex);
      return [c.r, c.g, c.b];
    });

    program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: amplitude },
        uColorStops: { value: colorStopsArray },
        uResolution: { value: [ctn.offsetWidth, ctn.offsetHeight] },
        uBlend: { value: blend },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    ctn.appendChild(gl.canvas);

    let animateId = 0;
    const update = (t: number) => {
      animateId = requestAnimationFrame(update);
      const { time = t * 0.01, speed = 1.0 } = propsRef.current;
      if (program) {
        program.uniforms.uTime.value = time * speed * 0.1;
        program.uniforms.uAmplitude.value = propsRef.current.amplitude ?? 1.0;
        program.uniforms.uBlend.value = propsRef.current.blend ?? blend;
        const stops = normalizeStops(propsRef.current.colorStops ?? colorStops);
        program.uniforms.uColorStops.value = stops.map((hex: string) => {
          const c = new Color(hex);
          return [c.r, c.g, c.b];
        });
        rendererInstance.render({ scene: mesh });
        if (!hasRendered) {
          hasRendered = true;
          setIsReady(true);
        }
      }
    };
    animateId = requestAnimationFrame(update);

    resize();

    return () => {
      cancelAnimationFrame(animateId);
      window.removeEventListener('resize', resize);
      if (ctn && gl.canvas.parentNode === ctn) {
        // decision reason: hide canvas before removing to avoid any visual flash
        gl.canvas.style.display = 'none';
        ctn.removeChild(gl.canvas);
      }
      // decision reason: avoid explicit WEBGL_lose_context to reduce potential flicker on unmount
      // Browser will release the WebGL context when the canvas element is garbage-collected.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amplitude]);

  return (
    <div
      ref={ctnDom}
      className={cn(
        'h-full w-full opacity-0 transition-opacity duration-300',
        isReady && 'opacity-100',
        className,
      )}
    />
  );
};
