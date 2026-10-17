<script setup lang="ts">
import { useData } from 'vitepress';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

type HeroMode = 'morph' | 'snapshot';
type PathMode = 'arc' | 'linear';
type TimingKind = 'spring' | 'duration';
type FadeKind = 'cross' | 'through' | 'in' | 'out';
type EasingKind =
  | 'standard'
  | 'emphasized'
  | 'easeOut'
  | 'easeInOut'
  | 'easeIn'
  | 'linear';

const strings = {
  en: {
    mode: 'Transition mode',
    motionPath: 'Motion path',
    timing: 'Timing driver',
    spring: 'Spring physics',
    durationDriver: 'Duration + Easing',
    duration: 'Duration (ms)',
    easing: 'Easing preset',
    damping: 'Spring damping',
    stiffness: 'Spring stiffness',
    mass: 'Spring mass',
    fadeMode: 'Fade curve',
    sourceRadius: 'Source borderRadius',
    destRadius: 'Destination borderRadius',
    playForward: 'Fly to Detail',
    playBack: 'Fly Back to List',
    autoLoop: 'Auto-loop',
    reset: 'Reset',
    copy: 'Copy JSX',
    copied: 'Copied!',
    sourceScreen: 'List Screen (Source)',
    destScreen: 'Detail Screen (Destination)',
    scrubber: 'Scrub progress',
    previewHint:
      'Interactive simulation of the native window-overlay flight. Tap "Fly to Detail" or drag the progress slider to inspect how bounds, corner radius, fade curve, and trajectory behave.',
  },
  vi: {
    mode: 'Chế độ chuyển cảnh',
    motionPath: 'Quỹ đạo bay',
    timing: 'Bộ điều khiển thời gian',
    spring: 'Vật lý Spring',
    durationDriver: 'Duration + Easing',
    duration: 'Thời lượng (ms)',
    easing: 'Đường cong Easing',
    damping: 'Độ cản (damping)',
    stiffness: 'Độ cứng (stiffness)',
    mass: 'Khối lượng (mass)',
    fadeMode: 'Chế độ chuyển mờ (fadeMode)',
    sourceRadius: 'Bo góc nguồn (borderRadius)',
    destRadius: 'Bo góc đích (borderRadius)',
    playForward: 'Bay sang Detail',
    playBack: 'Bay về List',
    autoLoop: 'Tự động lặp',
    reset: 'Đặt lại',
    copy: 'Sao chép JSX',
    copied: 'Đã chép!',
    sourceScreen: 'Màn hình danh sách (Nguồn)',
    destScreen: 'Màn hình chi tiết (Đích)',
    scrubber: 'Kéo xem từng bước',
    previewHint:
      'Mô phỏng trực quan chuyển động trên lớp phủ window. Bấm nút bay hoặc kéo thanh tiến trình để quan sát cách khung hình, độ bo góc, độ mờ và quỹ đạo phối hợp với nhau.',
  },
  zh: {
    mode: '过渡模式 (mode)',
    motionPath: '运动轨迹 (motionPath)',
    timing: '动画驱动方式',
    spring: '弹簧物理 (spring)',
    durationDriver: '时长 + 缓动 (duration)',
    duration: '持续时间 (ms)',
    easing: '缓动曲线 (easing)',
    damping: '阻尼 (damping)',
    stiffness: '刚度 (stiffness)',
    mass: '质量 (mass)',
    fadeMode: '淡入淡出曲线 (fadeMode)',
    sourceRadius: '起点圆角 (borderRadius)',
    destRadius: '终点圆角 (borderRadius)',
    playForward: '飞向详情页',
    playBack: '返回列表页',
    autoLoop: '自动循环',
    reset: '重置',
    copy: '复制 JSX',
    copied: '已复制！',
    sourceScreen: '列表页（起点）',
    destScreen: '详情页（终点）',
    scrubber: '拖动查看进度',
    previewHint:
      '原生窗口覆盖层飞行动画的交互式模拟。点击飞行按钮或拖动进度滑块，观察尺寸、圆角、淡入淡出曲线与运动轨迹的变化。',
  },
};

const { lang } = useData();
const t = computed(() => {
  const key = lang.value.slice(0, 2) as keyof typeof strings;
  return strings[key] ?? strings.en;
});

const mode = ref<HeroMode>('morph');
const motionPath = ref<PathMode>('arc');
const timingKind = ref<TimingKind>('spring');
const duration = ref(360);
const easing = ref<EasingKind>('standard');
const damping = ref(22);
const stiffness = ref(260);
const mass = ref(1);
const fadeMode = ref<FadeKind>('cross');
const sourceRadius = ref(10);
const destRadius = ref(24);
const autoLoop = ref(true);

// Progress: 0 = at source, 1 = at destination. Can slightly overshoot > 1 on underdamped springs.
const progress = ref(0);
const direction = ref<1 | -1>(1);

let rafId: number | null = null;
let startTime = 0;
let pauseUntil = 0;

function sampleCubicBezier(
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
  u: number
): number {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  // Solve x(t) = u via Newton-Raphson
  let s = u;
  for (let i = 0; i < 6; i++) {
    const x =
      3 * (1 - s) * (1 - s) * s * p1x +
      3 * (1 - s) * s * s * p2x +
      s * s * s -
      u;
    const dx =
      3 * (1 - s) * (1 - s) * p1x +
      6 * (1 - s) * s * (p2x - p1x) +
      3 * s * s * (1 - p2x);
    if (Math.abs(dx) < 1e-5) break;
    s = Math.min(1, Math.max(0, s - x / dx));
  }
  return (
    3 * (1 - s) * (1 - s) * s * p1y + 3 * (1 - s) * s * s * p2y + s * s * s
  );
}

function evalEasing(name: EasingKind, u: number): number {
  switch (name) {
    case 'linear':
      return u;
    case 'easeIn':
      return sampleCubicBezier(0.42, 0, 1, 1, u);
    case 'easeOut':
      return sampleCubicBezier(0, 0, 0.58, 1, u);
    case 'easeInOut':
      return sampleCubicBezier(0.42, 0, 0.58, 1, u);
    case 'emphasized':
      return sampleCubicBezier(0.3, 0, 0, 1, u);
    case 'standard':
    default:
      return sampleCubicBezier(0.2, 0, 0, 1, u);
  }
}

function evalSpring(elapsedSec: number): { value: number; settled: boolean } {
  const m = Math.max(0.1, mass.value);
  const k = Math.max(10, stiffness.value);
  const c = Math.max(1, damping.value);
  const omega0 = Math.sqrt(k / m);
  const zeta = c / (2 * Math.sqrt(k * m));

  let displacement = 0;
  if (zeta < 1) {
    const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
    const env = Math.exp(-zeta * omega0 * elapsedSec);
    displacement =
      env *
      (Math.cos(omegaD * elapsedSec) +
        ((zeta * omega0) / omegaD) * Math.sin(omegaD * elapsedSec));
  } else {
    const env = Math.exp(-omega0 * elapsedSec);
    displacement = env * (1 + omega0 * elapsedSec);
  }
  const value = 1 - displacement;
  const settled = elapsedSec > 0.15 && Math.abs(displacement) < 0.003;
  return { value, settled };
}

function triggerFlight(dir: 1 | -1) {
  direction.value = dir;
  startTime = performance.now();
  pauseUntil = 0;
  if (rafId === null) {
    rafId = requestAnimationFrame(step);
  }
}

function step(now: number) {
  if (pauseUntil > 0) {
    if (now < pauseUntil) {
      rafId = requestAnimationFrame(step);
      return;
    }
    direction.value = direction.value === 1 ? -1 : 1;
    startTime = now;
    pauseUntil = 0;
  }

  const elapsedMs = Math.max(0, now - startTime);
  let unit = 0;
  let done = false;

  if (timingKind.value === 'spring') {
    const res = evalSpring(elapsedMs / 1000);
    unit = res.value;
    done = res.settled || elapsedMs > 1800;
  } else {
    const u = Math.min(1, elapsedMs / Math.max(80, duration.value));
    unit = evalEasing(easing.value, u);
    done = u >= 1;
  }

  progress.value = direction.value === 1 ? unit : 1 - unit;

  if (done) {
    progress.value = direction.value === 1 ? 1 : 0;
    if (autoLoop.value) {
      pauseUntil = now + 750;
      rafId = requestAnimationFrame(step);
    } else {
      rafId = null;
    }
    return;
  }

  rafId = requestAnimationFrame(step);
}

function onScrub(event: Event) {
  autoLoop.value = false;
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  progress.value = Number((event.target as HTMLInputElement).value);
}

watch(autoLoop, (enabled) => {
  if (enabled && rafId === null) {
    triggerFlight(progress.value > 0.5 ? -1 : 1);
  }
});

onMounted(() => {
  if (
    typeof window !== 'undefined' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    triggerFlight(1);
  } else {
    autoLoop.value = false;
    progress.value = 0.55;
  }
});

onBeforeUnmount(() => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
});

// Stage geometry (in a 360x220 coordinate space)
const srcRect = { x: 24, y: 112, w: 92, h: 72 };
const dstRect = { x: 186, y: 24, w: 150, h: 156 };

const flyingBox = computed(() => {
  const p = progress.value;
  const w = srcRect.w + (dstRect.w - srcRect.w) * p;
  const h = srcRect.h + (dstRect.h - srcRect.h) * p;

  const sx = srcRect.x + srcRect.w / 2;
  const sy = srcRect.y + srcRect.h / 2;
  const dx = dstRect.x + dstRect.w / 2;
  const dy = dstRect.y + dstRect.h / 2;

  let cx = sx + (dx - sx) * p;
  let cy = sy + (dy - sy) * p;

  if (motionPath.value === 'arc') {
    // Quadratic Bezier with control point bowed upward
    const ctrlX = (sx + dx) / 2 - 18;
    const ctrlY = Math.min(sy, dy) - 44;
    const inv = 1 - p;
    cx = inv * inv * sx + 2 * inv * p * ctrlX + p * p * dx;
    cy = inv * inv * sy + 2 * inv * p * ctrlY + p * p * dy;
  }

  const r =
    mode.value === 'morph'
      ? Math.max(0, sourceRadius.value + (destRadius.value - sourceRadius.value) * p)
      : sourceRadius.value;

  // Fade alphas matching native iOS & Android implementation
  const clamped = Math.min(1, Math.max(0, p));
  let srcAlpha = 1 - clamped;
  let dstAlpha = clamped;
  if (fadeMode.value === 'in') {
    srcAlpha = 1;
    dstAlpha = clamped;
  } else if (fadeMode.value === 'out') {
    srcAlpha = 1 - clamped;
    dstAlpha = 1;
  } else if (fadeMode.value === 'through') {
    srcAlpha = clamped < 0.35 ? 1 - clamped / 0.35 : 0;
    dstAlpha = clamped < 0.4 ? 0 : (clamped - 0.4) / 0.6;
  }

  return {
    x: cx - w / 2,
    y: cy - h / 2,
    w,
    h,
    r,
    srcAlpha,
    dstAlpha,
  };
});

const snippet = computed(() => {
  const props: string[] = [`id="poster-42"`];
  if (mode.value !== 'snapshot') props.push(`mode="${mode.value}"`);
  if (motionPath.value !== 'linear') props.push(`motionPath="${motionPath.value}"`);
  if (fadeMode.value !== 'cross') props.push(`fadeMode="${fadeMode.value}"`);
  if (timingKind.value === 'spring') {
    props.push(
      `spring={{ damping: ${damping.value}, stiffness: ${stiffness.value}, mass: ${mass.value} }}`
    );
  } else {
    if (duration.value !== 320) props.push(`duration={${duration.value}}`);
    if (easing.value !== 'standard') props.push(`easing="${easing.value}"`);
  }
  const propLines = props.map((line) => `  ${line}`).join('\n');
  return `// Source screen\n<SharedHero\n  id="poster-42"\n  mode="${mode.value}"\n  style={{ borderRadius: ${sourceRadius.value} }}\n>\n  <Image source={{ uri }} style={styles.thumb} />\n</SharedHero>\n\n// Destination screen\n<SharedHero\n${propLines}\n  style={{ borderRadius: ${destRadius.value} }}\n>\n  <Image source={{ uri }} style={styles.heroHeader} />\n</SharedHero>`;
});

interface CodeToken {
  text: string;
  style: string;
}

const SHIKI_COMMENT = '--shiki-light:#6A737D;--shiki-dark:#6A737D;';
const SHIKI_TAG = '--shiki-light:#005CC5;--shiki-dark:#79B8FF;';
const SHIKI_ATTR = '--shiki-light:#6F42C1;--shiki-dark:#B392F0;';
const SHIKI_OP = '--shiki-light:#D73A49;--shiki-dark:#F97583;';
const SHIKI_STR = '--shiki-light:#032F62;--shiki-dark:#9ECBFF;';
const SHIKI_NUM = '--shiki-light:#005CC5;--shiki-dark:#79B8FF;';
const SHIKI_PLAIN = '--shiki-light:#24292E;--shiki-dark:#E1E4E8;';

const TOKEN_RE =
  /"[^"]*"|\b(?:SharedHero|Image)\b|\b[a-zA-Z_]\w*(?==)|=|\b\d+(?:\.\d+)?\b|[^"=\d\w]+|\b\w+\b/g;

function tokenizeTsxLine(line: string): CodeToken[] {
  if (!line) return [];
  if (line.trimStart().startsWith('//')) {
    return [{ text: line, style: SHIKI_COMMENT }];
  }
  const tokens: CodeToken[] = [];
  for (const match of line.matchAll(TOKEN_RE)) {
    const text = match[0];
    let style = SHIKI_PLAIN;
    if (text.startsWith('"')) {
      style = SHIKI_STR;
    } else if (text === 'SharedHero' || text === 'Image') {
      style = SHIKI_TAG;
    } else if (text === '=') {
      style = SHIKI_OP;
    } else if (/^\d/.test(text)) {
      style = SHIKI_NUM;
    } else if (line[match.index! + text.length] === '=') {
      style = SHIKI_ATTR;
    }
    tokens.push({ text, style });
  }
  return tokens;
}

const highlightedLines = computed(() =>
  snippet.value.split('\n').map(tokenizeTsxLine)
);

const copied = ref(false);
async function copyCode() {
  await navigator.clipboard.writeText(snippet.value);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 1500);
}

function reset() {
  mode.value = 'morph';
  motionPath.value = 'arc';
  timingKind.value = 'spring';
  duration.value = 360;
  easing.value = 'standard';
  damping.value = 22;
  stiffness.value = 260;
  mass.value = 1;
  fadeMode.value = 'cross';
  sourceRadius.value = 10;
  destRadius.value = 24;
  autoLoop.value = true;
  triggerFlight(1);
}
</script>

<template>
  <div class="playground">
    <form class="controls" @submit.prevent>
      <fieldset>
        <legend>{{ t.mode }}</legend>
        <label><input v-model="mode" type="radio" value="morph" /> <code>morph</code></label>
        <label><input v-model="mode" type="radio" value="snapshot" /> <code>snapshot</code></label>
      </fieldset>

      <fieldset>
        <legend>{{ t.motionPath }}</legend>
        <label><input v-model="motionPath" type="radio" value="arc" /> <code>arc</code></label>
        <label><input v-model="motionPath" type="radio" value="linear" /> <code>linear</code></label>
      </fieldset>

      <fieldset>
        <legend>{{ t.timing }}</legend>
        <label><input v-model="timingKind" type="radio" value="spring" /> {{ t.spring }}</label>
        <label><input v-model="timingKind" type="radio" value="duration" /> {{ t.durationDriver }}</label>
      </fieldset>

      <template v-if="timingKind === 'spring'">
        <label class="row">
          <span>{{ t.damping }}: <strong>{{ damping }}</strong></span>
          <input v-model.number="damping" type="range" min="8" max="40" step="1" />
        </label>
        <label class="row">
          <span>{{ t.stiffness }}: <strong>{{ stiffness }}</strong></span>
          <input v-model.number="stiffness" type="range" min="80" max="500" step="10" />
        </label>
        <label class="row">
          <span>{{ t.mass }}: <strong>{{ mass }}</strong></span>
          <input v-model.number="mass" type="range" min="0.5" max="2.5" step="0.1" />
        </label>
      </template>

      <template v-else>
        <label class="row">
          <span>{{ t.duration }}: <strong>{{ duration }} ms</strong></span>
          <input v-model.number="duration" type="range" min="150" max="800" step="10" />
        </label>
        <label class="row">
          <span>{{ t.easing }}</span>
          <select v-model="easing">
            <option value="standard">standard</option>
            <option value="emphasized">emphasized</option>
            <option value="easeOut">easeOut</option>
            <option value="easeInOut">easeInOut</option>
            <option value="easeIn">easeIn</option>
            <option value="linear">linear</option>
          </select>
        </label>
      </template>

      <label class="row">
        <span>{{ t.fadeMode }}</span>
        <select v-model="fadeMode">
          <option value="cross">cross (default)</option>
          <option value="through">through (Material)</option>
          <option value="in">in</option>
          <option value="out">out</option>
        </select>
      </label>

      <label class="row">
        <span>{{ t.sourceRadius }}: <strong>{{ sourceRadius }}px</strong></span>
        <input v-model.number="sourceRadius" type="range" min="0" max="36" step="2" />
      </label>

      <label class="row">
        <span>{{ t.destRadius }}: <strong>{{ destRadius }}px</strong></span>
        <input v-model.number="destRadius" type="range" min="0" max="44" step="2" />
      </label>

      <div class="action-bar">
        <button type="button" class="btn primary" @click="triggerFlight(1)">
          {{ t.playForward }}
        </button>
        <button type="button" class="btn" @click="triggerFlight(-1)">
          {{ t.playBack }}
        </button>
        <label class="auto-check">
          <input v-model="autoLoop" type="checkbox" />
          {{ t.autoLoop }}
        </label>
        <button type="button" class="btn ghost" @click="reset">{{ t.reset }}</button>
      </div>
    </form>

    <div class="preview-col">
      <div class="stage-card">
        <svg viewBox="0 0 360 210" class="stage-svg" role="img" :aria-label="t.previewHint">
          <!-- Source Card Outline -->
          <rect
            :x="srcRect.x"
            :y="srcRect.y"
            :width="srcRect.w"
            :height="srcRect.h"
            :rx="sourceRadius"
            class="slot-outline source"
          />
          <text :x="srcRect.x + srcRect.w / 2" :y="srcRect.y + srcRect.h + 15" class="slot-caption">
            {{ t.sourceScreen }}
          </text>

          <!-- Destination Card Outline -->
          <rect
            :x="dstRect.x"
            :y="dstRect.y"
            :width="dstRect.w"
            :height="dstRect.h"
            :rx="destRadius"
            class="slot-outline dest"
          />
          <text :x="dstRect.x + dstRect.w / 2" :y="dstRect.y + dstRect.h + 15" class="slot-caption">
            {{ t.destScreen }}
          </text>

          <!-- Trajectory Path -->
          <path
            v-if="motionPath === 'arc'"
            d="M 70 148 Q 147 58 261 102"
            class="flight-path"
          />
          <path
            v-else
            d="M 70 148 L 261 102"
            class="flight-path"
          />

          <!-- Flying Hero Overlay Element -->
          <g :transform="`translate(${flyingBox.x}, ${flyingBox.y})`">
            <!-- Destination Snapshot Layer -->
            <rect
              v-if="fadeMode === 'out' || fadeMode === 'cross' || fadeMode === 'through' || fadeMode === 'in'"
              x="0"
              y="0"
              :width="flyingBox.w"
              :height="flyingBox.h"
              :rx="flyingBox.r"
              fill="#0ea5e9"
              :fill-opacity="flyingBox.dstAlpha"
            />
            <!-- Source Snapshot Layer -->
            <rect
              x="0"
              y="0"
              :width="flyingBox.w"
              :height="flyingBox.h"
              :rx="flyingBox.r"
              fill="#6366f1"
              :fill-opacity="flyingBox.srcAlpha"
            />
            <!-- Container Border -->
            <rect
              x="0"
              y="0"
              :width="flyingBox.w"
              :height="flyingBox.h"
              :rx="flyingBox.r"
              fill="none"
              stroke="#f8fafc"
              stroke-width="1.5"
            />
            <!-- Inner vector mountain icon scaled to flying box -->
            <circle
              :cx="flyingBox.w * 0.28"
              :cy="flyingBox.h * 0.32"
              :r="Math.max(5, Math.min(flyingBox.w, flyingBox.h) * 0.1)"
              fill="rgba(15, 23, 42, 0.45)"
            />
            <path
              :d="`M ${flyingBox.w * 0.12} ${flyingBox.h * 0.82} L ${flyingBox.w * 0.38} ${flyingBox.h * 0.46} L ${flyingBox.w * 0.58} ${flyingBox.h * 0.68} L ${flyingBox.w * 0.72} ${flyingBox.h * 0.52} L ${flyingBox.w * 0.88} ${flyingBox.h * 0.82} Z`"
              fill="rgba(15, 23, 42, 0.5)"
            />
          </g>
        </svg>

        <label class="scrub-row">
          <span>{{ t.scrubber }}: <code>{{ Math.round(progress * 100) }}%</code></span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            :value="Math.min(1, Math.max(0, progress))"
            @input="onScrub"
          />
        </label>
        <p class="hint">{{ t.previewHint }}</p>
      </div>

      <div class="snippet">
        <button type="button" class="copy" @click="copyCode">
          {{ copied ? t.copied : t.copy }}
        </button>
        <pre
          class="shiki shiki-themes github-light github-dark vp-code"
        ><code><template v-for="(line, lineIdx) in highlightedLines" :key="lineIdx"><span class="line"><span v-for="(tok, tokIdx) in line" :key="tokIdx" :style="tok.style">{{ tok.text }}</span></span>{{ lineIdx < highlightedLines.length - 1 ? '\n' : '' }}</template></code></pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.playground {
  display: grid;
  gap: 24px;
  margin: 24px 0;
  padding: 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

@media (min-width: 820px) {
  .playground {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  }
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 14px;
}

fieldset {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin: 0;
  padding: 0;
  border: 0;
}

legend {
  width: 100%;
  margin-bottom: 4px;
  font-weight: 600;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.row input[type='range'] {
  width: 46%;
  accent-color: var(--vp-c-brand-1);
}

.row select {
  padding: 4px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 13px;
}

.action-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.btn {
  padding: 5px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn.primary {
  border-color: transparent;
  background: var(--vp-button-brand-bg);
  color: var(--vp-button-brand-text);
}

.btn.ghost {
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.auto-check {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.preview-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.stage-card {
  padding: 14px;
  border-radius: 12px;
  background: #0b0f19;
  color: #e2e8f0;
  box-shadow: 0 0 0 1px var(--vp-c-divider);
}

.stage-svg {
  width: 100%;
  height: auto;
  display: block;
}

.slot-outline {
  fill: rgba(99, 102, 241, 0.08);
  stroke-width: 1.5;
  stroke-dasharray: 4 3;
}

.slot-outline.source {
  stroke: #818cf8;
}

.slot-outline.dest {
  fill: rgba(14, 165, 233, 0.08);
  stroke: #38bdf8;
}

.slot-caption {
  fill: #94a3b8;
  font: 500 9.5px var(--vp-font-family-base);
  text-anchor: middle;
}

.flight-path {
  fill: none;
  stroke: #f59e0b;
  stroke-width: 2;
  stroke-dasharray: 5 4;
  opacity: 0.85;
}

.scrub-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
  font-size: 12px;
  color: #cbd5e1;
}

.scrub-row input[type='range'] {
  flex: 1;
  accent-color: #38bdf8;
}

.hint {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: #94a3b8;
}

.snippet {
  position: relative;
}

.snippet pre {
  margin: 0;
  padding: 14px 16px;
  overflow-x: auto;
  border-radius: 8px;
  background: var(--vp-code-block-bg);
  font: 12.5px/1.55 var(--vp-font-family-mono);
}

.copy {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 3px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  font-size: 12px;
  cursor: pointer;
}
</style>
