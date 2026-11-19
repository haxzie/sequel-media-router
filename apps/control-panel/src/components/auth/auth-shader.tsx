'use client';

import { useEffect, useRef } from 'react';

/**
 * The moving backdrop on the right half of the sign-in screen.
 *
 * A single full-bleed quad with a fragment shader, drawing a contour map: a
 * noise height field sliced at even elevations, every fifth line struck
 * heavier as an index contour, in the card pastels. The terrain itself drifts
 * and swells, so the lines migrate the way contours do when the ground
 * underneath them moves rather than sliding across the panel as a pattern.
 *
 * It is written by hand against raw WebGL rather than pulled from a shader
 * library because this is one quad and one uniform — a dependency would be
 * larger than the effect.
 *
 * Three things keep it from being a liability on a page whose only job is to
 * let someone in:
 *
 *   - It never blocks. The panel carries a static CSS gradient of its own, so
 *     a machine with no WebGL, or a context that fails to allocate, shows a
 *     still version of the same picture instead of a black rectangle.
 *   - It stops when nobody is looking — off-screen, on a hidden tab, and for
 *     anyone who asked for reduced motion, who gets one frame and no loop.
 *   - It is decorative, so it is `aria-hidden` and lives outside the form's
 *     reading order entirely.
 */

const VERTEX = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

/*
 * Colours are the design tokens, converted once here. Reading them back out
 * of the cascade at runtime would mean a getComputedStyle per mount for
 * values that are compiled into the stylesheet anyway.
 */
const FRAGMENT = `
#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif

precision highp float;

uniform vec2 uResolution;
uniform float uTime;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// Three octaves, each rotated so the layers never line up into a grid. The
// field is only here to bend the arcs, so it does not need the detail a
// visible noise would.
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 turn = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 3; i++) {
    value += amplitude * noise(p);
    p = turn * p;
    amplitude *= 0.5;
  }
  return value;
}

/*
 * One pixel's worth of the band coordinate, for antialiasing. Derivatives are
 * an extension in WebGL 1 — present on anything that can run this, but when
 * they are missing a fixed width is close enough at this line density, and a
 * slightly soft line is a far better failure than a shader that will not
 * compile.
 */
float pixelWidth(float v) {
#ifdef GL_OES_standard_derivatives
  return fwidth(v);
#else
  return 0.004;
#endif
}

/*
 * The terrain. Two noise fields warping a third, plus a broad rise toward a
 * point past the top right corner — the centre the mark's arcs turn about —
 * so the map has one dominant summit up there and the contours around it keep
 * the logo's sweep instead of wandering off as generic landscape.
 *
 * Time enters the warp rather than the sample point. Drifting the sample is
 * what you do for clouds and it would slide the whole map sideways like a
 * texture; drifting the warp deforms the ground in place, which is what makes
 * contour lines pinch, merge and part as they move.
 */
float terrain(vec2 p, float t, vec2 peak) {
  vec2 warp = vec2(
    fbm(p * 1.05 + vec2(0.0, t * 0.55)),
    fbm(p * 1.05 + vec2(5.2, -t * 0.45))
  );
  float height = fbm(p * 1.35 + 1.15 * warp + vec2(t * 0.22, t * 0.1));
  height += 0.42 * (1.0 - smoothstep(0.0, 1.9, length(p - peak)));
  return height;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  float t = uTime * 0.05;

  vec2 peak = vec2(0.5 * aspect + 0.16, 0.62);
  float height = terrain(p, t, peak);

  /*
   * Elevation, in contour intervals. The slow subtraction is a tide: every
   * line creeps up the slope and, at the top, a new one is born at the summit
   * — the one piece of motion that is legible even when the terrain is barely
   * moving. One interval takes about twenty seconds to cross.
   */
  float levels = 26.0;
  float v = height * levels - uTime * 0.05;

  /*
   * Index contours, every fifth line, as a real map prints them: heavier and
   * brighter, with the four intermediates between. Without them a field of
   * identical strokes reads as a moiré pattern rather than as a map.
   */
  float index = floor(v);
  float heavy = step(4.0, mod(index, 5.0));
  float thickness = mix(0.035, 0.085, heavy);

  float band = abs(fract(v) - 0.5);          // 0 at the centre of a contour
  float aa = pixelWidth(v);
  float stroke = 1.0 - smoothstep(thickness - aa, thickness + aa, band);
  float halo = exp(-band * 9.0);             // the light the line throws

  /*
   * Colour by elevation, not at random: one ramp from the low ground to the
   * summit, so neighbouring contours are neighbouring tones and the eye reads
   * height off the hue the way it would off a hypsometric tint.
   *
   * The ramp is then pushed away from its own luminance. The card pastels are
   * near-whites by design, and a near-white hairline on near-black is just a
   * grey hairline: at this width the hue has to be exaggerated to survive.
   */
  float elevation = clamp(height * 0.85, 0.0, 1.0);
  vec3 periwinkle = vec3(0.788, 0.831, 0.949);
  vec3 sky = vec3(0.760, 0.851, 0.961);
  vec3 mint = vec3(0.788, 0.910, 0.831);
  vec3 pink = vec3(0.949, 0.788, 0.878);
  vec3 tone = mix(periwinkle, sky, smoothstep(0.08, 0.42, elevation));
  tone = mix(tone, mint, smoothstep(0.38, 0.68, elevation));
  tone = mix(tone, pink, smoothstep(0.62, 0.95, elevation));
  tone = mix(vec3(dot(tone, vec3(0.299, 0.587, 0.114))), tone, 2.4);

  /*
   * A light drifting over the map, so the sheet brightens in passages instead
   * of all burning at once — and so the panel keeps changing at a rhythm the
   * contour tide alone is too slow to supply.
   */
  float lamp = smoothstep(0.26, 0.74, fbm(p * 0.8 + vec2(t * 1.6, -t)));
  float lit = 0.34 + 1.25 * lamp * lamp;

  vec3 base = vec3(0.039, 0.039, 0.039);      // --color-bg
  vec3 colour = base;
  colour += tone * stroke * (0.22 + 0.95 * lit) * mix(0.8, 1.3, heavy);
  colour += tone * halo * 0.12 * lit;

  // The ground between the lines, barely. Enough that the high country reads
  // as filled and the low as empty, which is most of what makes a contour
  // drawing a map; any more and it is a gradient with lines on it.
  colour += tone * 0.055 * elevation * elevation * lit;

  // Pull the corners down so the sheet reads as lit from its middle.
  colour *= smoothstep(1.5, 0.3, length(p * vec2(0.7, 1.0)));

  // Grain, re-seeded every frame. Without it the wide empty passages between
  // contours band on an 8-bit display.
  colour += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) * 0.022;

  gl_FragColor = vec4(colour, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * Bring the canvas to life, and hand back the way to shut it down again.
 *
 * Separate from the effect because it is started and stopped by width, not by
 * mount: the panel is `display: none` under the `lg` breakpoint, and a canvas
 * inside a hidden element still allocates a WebGL context, a program and a
 * drawing buffer if you ask it to. On a phone — the device least able to
 * afford it — that was a GPU context held open for a backdrop nobody could
 * see.
 */
function start(canvas: HTMLCanvasElement): ((release: boolean) => void) | undefined {
  const gl =
    (canvas.getContext('webgl', { antialias: false, alpha: false, depth: false }) as
      | WebGLRenderingContext
      | null) ??
    (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
  // No context: the wrapper's CSS gradient is already behind this canvas.
  if (!gl) return;

  /*
   * Asked for before compiling, because the fragment shader's `#extension`
   * line only takes effect if the context has the extension enabled. If it
   * is absent the shader still compiles — it falls back to a fixed line
   * width — so this is deliberately not checked.
   */
  gl.getExtension('OES_standard_derivatives');

  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uResolution = gl.getUniformLocation(program, 'uResolution');
  const uTime = gl.getUniformLocation(program, 'uTime');

  /*
   * Device pixels, capped at 2x. An earlier gradient version of this panel
   * ran at half resolution and nobody could tell; line art can, because a
   * one-pixel stroke upscaled by two is a two-pixel stroke with soft edges,
   * and a panel of those looks like a blurred screenshot.
   */
  const resize = () => {
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(canvas.clientWidth * scale));
    const height = Math.max(1, Math.round(canvas.clientHeight * scale));
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
  };

  const draw = (seconds: number) => {
    resize();
    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform1f(uTime, seconds);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const still = window.matchMedia('(prefers-reduced-motion: reduce)');

  let frame = 0;
  let visible = true;
  const began = performance.now();

  const loop = (now: number) => {
    draw((now - began) / 1000);
    frame = requestAnimationFrame(loop);
  };

  /*
   * One shared gate. The panel is decorative, so it should cost nothing
   * while it is scrolled away, on a background tab, or in front of someone
   * who turned motion off — but each of those still wants one frame drawn,
   * or the panel is black.
   */
  const sync = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    if (!visible || document.hidden || still.matches) {
      // A fixed, pleasant moment in the loop rather than t=0, which is the
      // one frame where the warp has not yet separated the colours.
      draw(still.matches ? 12 : (performance.now() - began) / 1000);
      return;
    }
    frame = requestAnimationFrame(loop);
  };

  const observer = new ResizeObserver(() => {
    if (!frame) draw(still.matches ? 12 : (performance.now() - began) / 1000);
  });
  observer.observe(canvas);

  const onScreen = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    sync();
  });
  onScreen.observe(canvas);

  document.addEventListener('visibilitychange', sync);
  still.addEventListener('change', sync);
  sync();

  /*
   * `release` separates the two ways this stops.
   *
   * Narrowing the window past the breakpoint stops the loop and drops the
   * drawing buffer to a single pixel, which is where the memory was, but
   * leaves the context alone — losing it is permanent for that canvas, and a
   * first attempt that did lose it left the panel blank for anyone who
   * widened the window again, because every later `getContext` handed back
   * the same dead context. Unmounting is the one case with no way back, and
   * only that one hands the context in.
   */
  return (release: boolean) => {
    cancelAnimationFrame(frame);
    frame = 0;
    observer.disconnect();
    onScreen.disconnect();
    document.removeEventListener('visibilitychange', sync);
    still.removeEventListener('change', sync);
    canvas.width = 1;
    canvas.height = 1;
    if (!release) return;
    gl.deleteProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    gl.deleteBuffer(buffer);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}

export function AuthShader({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /*
     * The breakpoint stays in the stylesheet and is read back here as layout
     * rather than restated as a matchMedia query: a canvas with no box is a
     * canvas the page has decided not to show, whatever the reason — and if
     * someone widens the window, the same observer starts it.
     */
    let stop: ((release: boolean) => void) | undefined;
    const gate = new ResizeObserver(() => {
      const shown = canvas.clientWidth > 0 && canvas.clientHeight > 0;
      if (shown && !stop) stop = start(canvas);
      else if (!shown && stop) {
        stop(false);
        stop = undefined;
      }
    });
    gate.observe(canvas);

    return () => {
      gate.disconnect();
      stop?.(true);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`h-full w-full ${className}`}
    />
  );
}
