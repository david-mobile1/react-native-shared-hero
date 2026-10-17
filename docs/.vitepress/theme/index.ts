import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { h } from 'vue';
import HeroArt from './components/HeroArt.vue';
import TransitionPlayground from './components/TransitionPlayground.vue';
import './style.css';

export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, { 'home-hero-image': () => h(HeroArt) }),
  enhanceApp({ app }) {
    app.component('TransitionPlayground', TransitionPlayground);
  },
} satisfies Theme;
