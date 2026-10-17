---
layout: home
title: React Native Shared Hero
titleTemplate: 面向 React Native 新架构 (Fabric) 的窗口级共享元素过渡库
description: 面向 React Native 新架构 (Fabric) 的原生窗口级共享元素过渡库：与路由解耦，支持快照与容器变形模式、原生弹簧物理以及 60/120 fps 交互手势。

hero:
  name: React Native Shared Hero
  text: 面向 Fabric 的窗口级共享元素过渡。
  tagline: 在两个页面或同一页面的两个状态中用 <SharedHero id="..."> 包裹任意视图。过渡动画在高于所有 Stack、Modal、半屏面板和 Tab 的原生窗口级浮层中以 60/120 fps 流畅运行。
  actions:
    - theme: brand
      text: 快速上手
      link: /zh/guide/
    - theme: alt
      text: 交互式演练场
      link: /zh/guide/timing-and-motion#interactive-playground
    - theme: alt
      text: API 参考
      link: /api/

features:
  - title: 窗口级原生浮层
    details: 在 iOS 上使用独立的触摸穿透 UIWindow，在 Android 上使用 Activity DecorView.overlay。浮层位于所有导航容器之上，跨越 Stack、Modal、透明弹窗、半屏面板（formSheet）与底部标签页时绝不会被父视图裁切。
  - title: 与路由完全解耦
    details: 原生适配 React Navigation、Expo Router、react-native-screens、React Native 内置 <Modal> 或配合 useSharedHero() 进行原地状态切换，无需自定义导航器包装或 Provider。
  - title: 快照模式与 Material 容器变形
    details: 可使用 snapshot 模式进行低开销位图交叉淡入淡出，也可切换至 morph 模式平滑插值宽高边界、borderRadius、backgroundColor 与裁切轮廓。
  - title: 原生弹簧物理与弧线轨迹
    details: iOS 基于 CASpringAnimation，Android 基于 AndroidX DynamicAnimation SpringAnimation，并支持沿直线（linear）或二次贝塞尔弧线（arc）运行预设 cubic-Bezier 曲线。
  - title: 交互式侧滑返回与拖拽关闭
    details: 在 iOS 上自动跟随 UINavigationController 侧滑返回手势进度，并支持从任意拖拽变换位置无缝衔接返回飞行动画。
  - title: 专为 Fabric 与虚拟列表打造
    details: 针对 React Native 新架构（0.76+ 至 0.82+）原生构建，妥善处理 FlatList/FlashList 单元格复用、半空飞行打断接管以及放大时的高清目标图无缝替换。
---

<div class="home-section vp-doc">

## 两个组件，共享同一个 `id`

只需在列表页与详情页给两个 `<SharedHero>` 传入相同的 `id`。当向前跳转或返回时，原生协调器会自动测量两个视图在窗口坐标系下的位置并在顶层浮层中完成飞行过渡。

```tsx
import { Image, Pressable } from 'react-native';
import { SharedHero } from 'react-native-shared-hero';

// 1. 源页面（例如列表或网格卡片）
export function FeedCard({ item, onPress }) {
  return (
    <Pressable onPress={onPress}>
      <SharedHero
        id={`photo-${item.id}`}
        mode="morph"
        style={{ borderRadius: 12, overflow: 'hidden' }}
      >
        <Image source={{ uri: item.thumbUrl }} style={{ width: 140, height: 180 }} />
      </SharedHero>
    </Pressable>
  );
}

// 2. 目标页面（Stack 推入、Modal、半屏面板或 Tab 详情）
export function PhotoDetailScreen({ item }) {
  return (
    <SharedHero
      id={`photo-${item.id}`}
      mode="morph"
      motionPath="arc"
      spring={{ damping: 22, stiffness: 260, mass: 1 }}
      style={{ borderRadius: 24, overflow: 'hidden' }}
    >
      <Image source={{ uri: item.fullUrl }} style={{ width: '100%', height: 420 }} />
    </SharedHero>
  );
}
```

## 实时过渡演练场

在下方切换过渡模式、运动轨迹、弹簧参数与圆角半径，实时预览 `react-native-shared-hero` 的插值效果并复制对应的 JSX 配置：

<TransitionPlayground />

</div>
