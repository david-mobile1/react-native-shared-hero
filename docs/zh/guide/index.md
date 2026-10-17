---
description: react-native-shared-hero 概览：为什么窗口级共享元素过渡能够解决 React Native Fabric 上的弹窗、半屏面板与路由限制。
---

# 概览

`react-native-shared-hero` 是面向 React Native 新架构（Fabric）的 iOS 与 Android 原生共享元素（Hero）过渡动画库。

你只需在页面 A 和页面 B 中用 `<SharedHero id="...">` 包裹对应视图。当页面 B 挂载（或卸载返回页面 A）时，原生协调器会捕获两端视图状态，在飞行期间隐藏真实端点，并在窗口级浮层中以屏幕原生刷新率（60 fps 或 120 fps ProMotion）驱动过渡动画。

## 效果展示

| Android | iOS |
| --- | --- |
| <video src="https://github.com/user-attachments/assets/35170436-3921-43ad-ac1c-face5a00c7ec" controls loop muted playsinline></video> | <video src="https://github.com/user-attachments/assets/3aee83c7-190e-41fa-87b2-9a8ada59a481" controls loop muted playsinline></video> |

## 为什么需要新的实现方案？

在 React Native 新架构下实现共享元素过渡时，传统方案通常会遇到三个痛点：

<div class="comparison-grid">
  <div class="comparison-card">
    <h3>1. 与特定导航器强绑定</h3>
    <p>
      许多库直接侵入 <code>react-native-screens</code> 的栈转场生命周期。一旦换成原生 Modal、透明弹窗、半屏面板（formSheet）、React Native 核心 <code>&lt;Modal&gt;</code>，或仅通过组件 state 原地展开卡片，动画就会失效。
    </p>
  </div>
  <div class="comparison-card">
    <h3>2. 父级视图容器裁切（Clipping）</h3>
    <p>
      如果飞行克隆节点挂载在页面容器内部，任何带有 <code>overflow: 'hidden'</code> 的父节点或半屏面板边界都会在飞行途中裁切掉溢出的画面。
    </p>
  </div>
  <div class="comparison-card">
    <h3>3. 缩略图放大时的模糊闪烁</h3>
    <p>
      将列表中的小尺寸缩略图位图直接拉伸到详情页全宽大图时，飞行途中画面会明显发虚。<code>react-native-shared-hero</code> 会自动检测纯图片端点，并在目标页高清图解码完成后立即用于飞行渲染。
    </p>
  </div>
</div>

`react-native-shared-hero` 从架构层面解决了这些问题：

- **窗口级浮层（Window-level overlay）**：iOS 端在独立的透明穿透 `UIWindow`（`windowLevel = .alert + 1`，`isUserInteractionEnabled = false`）中渲染飞行视图，位于所有 `UIViewController`、Modal 与 Sheet 之上；Android 端在目标窗口的 `DecorView.overlay`（`ViewGroupOverlay`）中渲染。React 视图树中的任何容器都无法裁切飞行元素。
- **零路由耦合**：配对完全由原生视图的挂载、布局与卸载生命周期在短时间窗口内自动触发，无论是 React Navigation、Expo Router、`<Modal>` 还是普通 `useState` 切换都能一致工作。
- **静默时零开销**：无动画运行时，浮层容器不保留任何子视图（`backgroundColor = .clear`，`isUserInteractionEnabled = false`），兜底快照缓存（`lastKnownSnapshots`）采用严格受限的 LRU 淘汰策略，且仅在尺寸或子节点实际变化时按需刷新。

## 功能矩阵

| 能力 | iOS | Android | 说明 |
| --- | --- | --- | --- |
| Fabric（新架构） | 支持 | 支持 | 原生 Fabric `ViewManager` / `RCTViewComponentView` 实现 |
| `mode="snapshot"` | 支持 | 支持 | 高速位图捕获，平移 + 缩放 + 透明度混合 |
| `mode="morph"` | 支持 | 支持 | 逐帧插值宽高边界、`borderRadius`、`backgroundColor` 与裁切形状 |
| `motionPath="linear"` / `"arc"` | 支持 | 支持 | 直线轨迹或 Material 二次贝塞尔弧线轨迹 |
| `duration` + cubic-Bezier `easing` | 支持 | 支持 | `linear`、`easeIn`、`easeOut`、`easeInOut`、`standard`、`emphasized` |
| 原生 `spring` 弹簧物理 | 支持 | 支持 | iOS 使用 `CASpringAnimation`，Android 使用 `SpringAnimation` |
| 透明度混合曲线（`fadeMode`） | 支持 | 支持 | `cross`、`in`、`out`、`through` |
| 放大时高清目标图升级 | 支持 | 支持 | 两端均为单张 `<Image>` 时自动使用高清目标纹理飞行 |
| `<Text>` 换行防裁切保护 | 支持 | 支持 | 独立缩放双层快照并交叉淡入淡出，避免文字重排被截断 |
| iOS 交互式侧滑返回 | 支持 | 不适用 | 自动跟随 `interactivePopGestureRecognizer` 手势进度 |
| 半空打断无缝接管 | 支持 | 支持 | 飞行途中返回时直接从当前半空真实位置反向飞回 |
| `FlatList` / `FlashList` 复用保护 | 支持 | 支持 | 单元格复用更新 `id` 时自动清理旧桶与旧快照 |

## 环境要求

- **React Native**：`0.76+` 并开启新架构（Fabric），已验证支持至 React Native `0.82`。
- **iOS**：iOS `14.0+`（同时支持静态链接与 `use_frameworks!`）。
- **Android**：`minSdkVersion 24+`，Kotlin + AndroidX `dynamicanimation`。
- **Expo**：支持 Expo 自定义开发构建（`npx expo run:ios` / `npx expo run:android` / EAS Build）。由于包含自定义原生代码，不支持预构建的 Expo Go 客户端。
