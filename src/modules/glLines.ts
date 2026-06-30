import { Renderer, Program, Mesh, Triangle, Vec2 } from "ogl";

/**
 * "Touch the lines" — a fullscreen fragment-shader line field.
 * Lines organically bend toward the cursor and emit a neon glow whose
 * intensity is driven by mouse proximity + velocity. Pure GPU, so it
 * stays off the main thread and holds 60fps.
 */
const vertex = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform float uTime;
  uniform vec2  uRes;       // pixel resolution
  uniform vec2  uMouse;     // mouse in 0..1, y up
  uniform float uVel;       // mouse velocity 0..1
  uniform vec3  uNeon;

  // distance from point p to a grid of lines spaced by grid
  float lineField(vec2 p, float grid, float warp) {
    // organic warp so the grid breathes
    p.x += sin(p.y * 6.2831 * 1.5 + uTime * 0.6) * warp;
    p.y += cos(p.x * 6.2831 * 1.5 + uTime * 0.5) * warp;

    vec2 g = abs(fract(p / grid) - 0.5) * grid;
    return min(g.x, g.y);
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uRes.x / uRes.y;
    vec2 p = uv;
    p.x *= aspect;

    vec2 m = uMouse;
    m.x *= aspect;

    // proximity to mouse (0 far -> 1 near)
    float d = distance(p, m);
    float prox = smoothstep(0.55, 0.0, d);

    // lines bend toward the cursor; bend grows with proximity + velocity
    vec2 dir = normalize(p - m + 1e-4);
    float pull = prox * (0.045 + uVel * 0.12);
    vec2 warpedP = p - dir * pull;

    float grid = 0.12;
    float warpAmt = 0.004 + prox * 0.02 + uVel * 0.02;
    float dist = lineField(warpedP, grid, warpAmt);

    // crisp line core
    float lw = 0.0016 + prox * 0.0018;
    float line = smoothstep(lw, 0.0, dist);

    // base brown lines etched into the cream
    vec3 base = vec3(0.16, 0.12, 0.08);
    vec3 col = base * line;

    // warm brown glow near cursor, riding along the bent lines
    float glow = line * prox * (0.85 + uVel * 2.0);
    col = mix(col, uNeon, clamp(glow, 0.0, 1.0));

    // soft brown halo around the cursor itself (particle-ish trail)
    float halo = smoothstep(0.4, 0.0, d) * (0.08 + uVel * 0.34);
    col += uNeon * halo;

    float alpha = line * (0.26 + prox * 1.0) + halo * 0.6;
    gl_FragColor = vec4(col, alpha);
  }
`;

export function initGlLines(canvas: HTMLCanvasElement) {
  const renderer = new Renderer({
    canvas,
    alpha: true,
    antialias: true,
    dpr: Math.min(window.devicePixelRatio, 2),
  });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);

  const geometry = new Triangle(gl);

  const program = new Program(gl, {
    vertex,
    fragment,
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uRes: { value: new Vec2(1, 1) },
      uMouse: { value: new Vec2(0.5, 0.5) },
      uVel: { value: 0 },
      uNeon: { value: [0.561, 0.314, 0.157] }, // warm brown #8f5028
    },
  });

  const mesh = new Mesh(gl, { geometry, program });

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    program.uniforms.uRes.value.set(
      gl.canvas.width,
      gl.canvas.height
    );
  }
  window.addEventListener("resize", resize);
  resize();

  // pointer tracking with smoothed velocity
  const target = new Vec2(0.5, 0.5);
  const current = new Vec2(0.5, 0.5);
  let velTarget = 0;
  let last = { x: 0.5, y: 0.5 };

  function onMove(e: PointerEvent) {
    const x = e.clientX / window.innerWidth;
    const y = 1.0 - e.clientY / window.innerHeight;
    target.set(x, y);
    const dx = x - last.x;
    const dy = y - last.y;
    velTarget = Math.min(1, Math.hypot(dx, dy) * 14);
    last = { x, y };
  }
  window.addEventListener("pointermove", onMove, { passive: true });

  let raf = 0;
  let running = true;
  function loop(t: number) {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    // ease pointer + velocity
    current.x += (target.x - current.x) * 0.12;
    current.y += (target.y - current.y) * 0.12;
    velTarget *= 0.9; // decay
    const uVel = program.uniforms.uVel as { value: number };
    uVel.value += (velTarget - uVel.value) * 0.15;

    program.uniforms.uMouse.value.set(current.x, current.y);
    program.uniforms.uTime.value = t * 0.001;
    renderer.render({ scene: mesh });
  }
  raf = requestAnimationFrame(loop);

  // pause when tab hidden to save GPU
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else if (!running) {
      running = true;
      raf = requestAnimationFrame(loop);
    }
  });

  return { renderer };
}
