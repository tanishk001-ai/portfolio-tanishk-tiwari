import { Effect } from 'postprocessing'
import * as THREE from 'three'

// GLSL taken verbatim (logic) from the original "Overlay" effect (Background-*.js, shader `hI`).
const fragment = /* glsl */ `
uniform sampler2D tMudNormal;
uniform sampler2D tNoise;
uniform float uPosition;
uniform float uTime;
uniform vec3 uColor;
uniform vec2 uResolution;

float sampleNoise(vec2 uv) { return texture(tNoise, uv).r * 2.0 - 1.0; }

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  if (abs(uPosition) >= 1.0) { outputColor = inputColor; return; }
  vec3 mudNormal = texture(tMudNormal, uv * 2.0).rgb;
  float mudOffset = (mudNormal.r - 0.5) * mix(0.3, 0.6, 0.5 + 0.5 * sin(uTime - uv.x * 10.0)) * 0.1;
  float aspect = uResolution.x / uResolution.y;
  vec2 aspectUv = vec2(uv.x * aspect, uv.y) + vec2(0.0, uTime * 0.02);
  float noiseValue = sampleNoise(aspectUv * 0.375 - uTime * 0.00625);
  float threshold = mix(uv.y, uv.x, smoothstep(0.6, -0.4, abs(uv.x - 0.4)) * 0.5);
  threshold = threshold * 2.0 - 1.0;
  threshold = threshold / 1.2 + noiseValue * 0.2 + mudOffset;
  threshold = threshold * 0.5 + 0.5;
  float progress; float thresholdFinal = threshold;
  if (uPosition <= 0.0) { progress = uPosition + 1.0; }
  else { progress = 1.0 - uPosition; thresholdFinal = 1.0 - threshold; }
  float edge = progress - thresholdFinal;
  float aa = fwidth(edge) * 10.0;
  float alpha = smoothstep(-aa, aa, edge);
  float glowFactor = smoothstep(0.0, 0.005, abs(edge));
  vec3 color = pow(uColor, vec3(2.2));
  color = mix(color, color * mix(2.0, 4.0, 0.5 + 0.5 * sin(uTime + uv.x * 10.0)), 1.0 - glowFactor);
  outputColor = vec4(mix(inputColor.rgb, color, alpha), 1.0);
}`

// Smooth tileable value-noise stand-in for the original's pre-computed noise texture (only the .r channel is read, remapped to [-1,1]).
function makeNoise(size = 256) {
  const grid = 16, g = new Float32Array(grid * grid).map(() => Math.random())
  const at = (x, y) => g[((y % grid) + grid) % grid * grid + ((x % grid) + grid) % grid]
  const sm = t => t * t * (3 - 2 * t)
  const data = new Uint8Array(size * size * 4)
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    let v = 0, amp = 0.6, tot = 0
    for (let o = 0; o < 3; o++) {
      const f = (grid / size) * 2 ** o, x = i * f, y = j * f, x0 = Math.floor(x), y0 = Math.floor(y), tx = sm(x - x0), ty = sm(y - y0)
      const a = at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx, b = at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx
      v += (a * (1 - ty) + b * ty) * amp; tot += amp; amp *= 0.5
    }
    v /= tot
    const k = (j * size + i) * 4; data[k] = data[k + 1] = data[k + 2] = Math.round(v * 255); data[k + 3] = 255
  }
  const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.minFilter = t.magFilter = THREE.LinearFilter; t.needsUpdate = true
  return t
}

export class OverlayEffect extends Effect {
  constructor() {
    const mud = new THREE.TextureLoader().load('/mud_normal.webp')
    mud.wrapS = mud.wrapT = THREE.RepeatWrapping
    super('Overlay', fragment, {
      uniforms: new Map([
        ['tMudNormal', new THREE.Uniform(mud)],
        ['tNoise', new THREE.Uniform(makeNoise())],
        ['uPosition', new THREE.Uniform(-1)],
        ['uTime', new THREE.Uniform(0)],
        ['uColor', new THREE.Uniform(new THREE.Color('#dcdcd0'))],
        ['uResolution', new THREE.Uniform(new THREE.Vector2(1, 1))],
      ]),
    })
  }
  update(renderer, inputBuffer, dt) {
    this.uniforms.get('uTime').value += dt
    renderer.getDrawingBufferSize(this.uniforms.get('uResolution').value)
  }
}
