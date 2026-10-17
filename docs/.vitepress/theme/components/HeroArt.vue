<script setup lang="ts">
import { useData } from 'vitepress';
import { computed, ref } from 'vue';

const { lang } = useData();

const labels = computed(() => {
  const code = lang.value.slice(0, 2);
  if (code === 'vi') {
    return {
      aria: 'Minh họa thẻ SharedHero bay theo đường cong từ danh sách sang màn hình chi tiết trên lớp phủ window',
      sourceTitle: 'Danh sách',
      detailTitle: 'Chi tiết',
      arc: 'Đường cong (arc)',
      linear: 'Đường thẳng (linear)',
      overlay: 'Window Overlay · 120 fps',
    };
  }
  if (code === 'zh') {
    return {
      aria: 'SharedHero 卡片在窗口覆盖层上沿弧线从列表页飞入详情页的动画示意',
      sourceTitle: '列表页',
      detailTitle: '详情页',
      arc: '弧线轨迹 (arc)',
      linear: '直线轨迹 (linear)',
      overlay: '窗口覆盖层 · 120 fps',
    };
  }
  return {
    aria: 'Animated SharedHero card flying along a curved arc from a list screen to a detail header on the window overlay',
    sourceTitle: 'Feed Screen',
    detailTitle: 'Detail Screen',
    arc: 'Arc path',
    linear: 'Linear path',
    overlay: 'Window Overlay · 120 fps',
  };
});

const pathType = ref<'arc' | 'linear'>('arc');
function togglePath() {
  pathType.value = pathType.value === 'arc' ? 'linear' : 'arc';
}
</script>

<template>
  <div class="hero-art-wrap">
    <svg
      class="hero-art"
      :class="`path-${pathType}`"
      viewBox="0 0 420 320"
      role="img"
      :aria-label="labels.aria"
      @click="togglePath"
    >
      <defs>
        <linearGradient id="rnsh-card-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#4f46e5" />
          <stop offset="0.55" stop-color="#6366f1" />
          <stop offset="1" stop-color="#0ea5e9" />
        </linearGradient>
        <linearGradient id="rnsh-arc-grad" x1="100" y1="185" x2="296" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#f59e0b" />
          <stop offset="0.5" stop-color="#38bdf8" />
          <stop offset="1" stop-color="#818cf8" />
        </linearGradient>
      </defs>

      <!-- Source Phone (left) -->
      <g class="phone phone-source" transform="translate(18, 44)">
        <rect class="phone-body" x="0" y="0" width="154" height="248" rx="22" />
        <rect class="notch" x="52" y="9" width="50" height="5" rx="2.5" />
        <text class="phone-label" x="16" y="31">{{ labels.sourceTitle }}</text>

        <!-- Source Hero Slot -->
        <rect
          class="source-slot"
          x="14"
          y="42"
          width="126"
          height="74"
          rx="10"
        />
        <text class="slot-code" x="77" y="83">id="poster-42"</text>

        <!-- Static feed rows -->
        <rect class="feed-row" x="14" y="128" width="126" height="46" rx="8" />
        <rect class="feed-line" x="24" y="140" width="68" height="7" rx="3.5" />
        <rect class="feed-line muted" x="24" y="154" width="96" height="6" rx="3" />

        <rect class="feed-row" x="14" y="184" width="126" height="46" rx="8" />
        <rect class="feed-line" x="24" y="196" width="54" height="7" rx="3.5" />
        <rect class="feed-line muted" x="24" y="210" width="84" height="6" rx="3" />
      </g>

      <!-- Destination Phone (right) -->
      <g class="phone phone-dest" transform="translate(226, 16)">
        <rect class="phone-body" x="0" y="0" width="176" height="276" rx="24" />
        <rect class="notch" x="58" y="10" width="60" height="5" rx="2.5" />
        <text class="phone-label" x="16" y="31">{{ labels.detailTitle }}</text>

        <!-- Destination Hero Slot -->
        <rect
          class="dest-slot"
          x="14"
          y="40"
          width="148"
          height="118"
          rx="18"
        />

        <!-- Detail content lines -->
        <rect class="detail-title" x="14" y="174" width="108" height="10" rx="5" />
        <rect class="feed-line" x="14" y="194" width="142" height="7" rx="3.5" />
        <rect class="feed-line" x="14" y="208" width="132" height="7" rx="3.5" />
        <rect class="feed-line muted" x="14" y="222" width="92" height="7" rx="3.5" />
        <rect class="cta-pill" x="14" y="242" width="148" height="20" rx="10" />
      </g>

      <!-- Trajectory Guide Line -->
      <path
        v-if="pathType === 'arc'"
        class="trajectory"
        d="M 95 123 Q 195 20 318 115"
      />
      <path
        v-else
        class="trajectory"
        d="M 95 123 L 318 115"
      />
      <circle class="endpoint source-dot" cx="95" cy="123" r="4.5" />
      <circle class="endpoint dest-dot" cx="318" cy="115" r="5" />

      <!-- Flying Morphing Card on Window Overlay -->
      <g class="flying-hero">
        <rect
          class="flying-card"
          x="0"
          y="0"
          width="126"
          height="74"
          rx="10"
          fill="url(#rnsh-card-grad)"
        />
        <circle class="art-sun" cx="32" cy="24" r="9" />
        <path class="art-hills" d="M 10 64 L 42 32 L 66 52 L 84 36 L 116 64 Z" />
        <rect class="art-badge" x="14" y="50" width="56" height="7" rx="3.5" />
      </g>

      <!-- Interactive status pill at bottom -->
      <g class="status-pill" transform="translate(105, 294)">
        <rect x="0" y="0" width="210" height="22" rx="11" />
        <text x="105" y="15">
          {{ labels.overlay }} · {{ pathType === 'arc' ? labels.arc : labels.linear }}
        </text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.hero-art-wrap {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 320px;
  transform: translate(-50%, -50%);
}

@media (min-width: 640px) {
  .hero-art-wrap {
    width: 380px;
  }
}

@media (min-width: 960px) {
  .hero-art-wrap {
    width: 420px;
  }
}

.hero-art {
  width: 100%;
  height: auto;
  cursor: pointer;
  user-select: none;
  overflow: visible;
}

.phone-body {
  fill: #0f172a;
  stroke: rgba(148, 163, 184, 0.28);
  stroke-width: 2;
}

.notch {
  fill: #334155;
}

.phone-label {
  fill: #94a3b8;
  font: 600 10px var(--vp-font-family-base);
  letter-spacing: 0.02em;
}

.source-slot {
  fill: rgba(99, 102, 241, 0.12);
  stroke: #6366f1;
  stroke-width: 1.5;
  stroke-dasharray: 4 3;
}

.slot-code {
  fill: #818cf8;
  font: 600 10px var(--vp-font-family-mono);
  text-anchor: middle;
}

.dest-slot {
  fill: rgba(56, 189, 248, 0.1);
  stroke: rgba(56, 189, 248, 0.45);
  stroke-width: 1.5;
  stroke-dasharray: 4 3;
}

.feed-row {
  fill: #1e293b;
}

.feed-line {
  fill: #475569;
}

.feed-line.muted {
  fill: #334155;
}

.detail-title {
  fill: #cbd5e1;
}

.cta-pill {
  fill: rgba(99, 102, 241, 0.28);
}

.trajectory {
  fill: none;
  stroke: url(#rnsh-arc-grad);
  stroke-width: 2.5;
  stroke-dasharray: 6 5;
  stroke-linecap: round;
}

.source-dot {
  fill: #f59e0b;
}

.dest-dot {
  fill: #38bdf8;
}

.flying-hero {
  filter: drop-shadow(0 12px 20px rgba(15, 23, 42, 0.55));
  animation: fly-arc 4.4s cubic-bezier(0.2, 0, 0, 1) infinite;
}

.path-linear .flying-hero {
  animation-name: fly-linear;
}

.flying-card {
  stroke: rgba(248, 250, 252, 0.75);
  stroke-width: 1.5;
  animation: morph-card 4.4s cubic-bezier(0.2, 0, 0, 1) infinite;
}

.art-sun {
  fill: rgba(15, 23, 42, 0.42);
}

.art-hills {
  fill: rgba(15, 23, 42, 0.48);
}

.art-badge {
  fill: rgba(248, 250, 252, 0.9);
}

.status-pill rect {
  fill: rgba(15, 23, 42, 0.88);
  stroke: rgba(129, 140, 248, 0.4);
  stroke-width: 1;
}

.status-pill text {
  fill: #e2e8f0;
  font: 600 10px var(--vp-font-family-mono);
  text-anchor: middle;
}

@keyframes fly-arc {
  0%,
  12%,
  100% {
    transform: translate(32px, 86px) scale(1, 1);
  }
  28% {
    transform: translate(136px, 34px) scale(1.09, 1.28);
  }
  48%,
  66% {
    transform: translate(240px, 56px) scale(1.174, 1.594);
  }
  82% {
    transform: translate(136px, 34px) scale(1.09, 1.28);
  }
}

@keyframes fly-linear {
  0%,
  12%,
  100% {
    transform: translate(32px, 86px) scale(1, 1);
  }
  48%,
  66% {
    transform: translate(240px, 56px) scale(1.174, 1.594);
  }
}

@keyframes morph-card {
  0%,
  12%,
  100% {
    rx: 10px;
  }
  48%,
  66% {
    rx: 15px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .flying-hero,
  .flying-card {
    animation: none;
  }
  .flying-hero {
    transform: translate(136px, 34px) scale(1.09, 1.28);
  }
}
</style>
