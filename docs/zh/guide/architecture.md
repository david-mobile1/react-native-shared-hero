---
description: "深入解析 react-native-shared-hero 在 React Native Fabric 下的 iOS (Swift / OverlayHost UIWindow) 与 Android (Kotlin / ViewGroupOverlay) 原生架构设计。"
---

# 底层架构原理

`react-native-shared-hero` 专为 React Native 新架构（Fabric）设计，保持了极简的 TypeScript 包装层，并在 iOS 与 Android 原生层实现了完全对称的注册配对与飞行引擎。

## 整体数据流

```
┌────────────────────────────────────────────────────────────────────────┐
│ React Native JS (Fabric)                                               │
│   <SharedHero id="photo-1" namespace="default" mode="morph" />         │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Codegen C++ ShadowNode / Props
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 原生端点视图 (Native Endpoint View)                                    │
│   iOS:     SharedHeroView.mm (ObjC++) -> SharedHeroViewImpl.swift      │
│   Android: SharedHeroViewManager.kt   -> SharedHeroView.kt             │
│                                                                        │
│   • 维护 heroId、heroNamespace、mode、timing、borderRadius、bgColor    │
│   • 布局稳定后按需捕获 HeroSnapshot 与实时窗口坐标框                   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ register / notifyLayout / unregister
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 原生单例注册表与配对引擎 (HeroRegistry)                                │
│   iOS:     HeroRegistry.shared (HeroRegistry.swift)                    │
│   Android: HeroRegistry        (HeroRegistry.kt)                       │
│                                                                        │
│   • live[key]: 每个 namespace::id 下已挂载视图的有序列表               │
│   • recentlyUnregistered[key]: 暂存刚卸载的源快照（约 300 ms 窗口）    │
│   • lastKnownSnapshots: 容量受限的 LRU 兜底快照缓存                    │
│   • lastFlightSourceFrame: 推入/返回对称坐标提示（destFrameHint）      │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ 启动 / 半空接管飞行
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 飞行引擎与窗口级浮层 (FlightEngine & OverlayHost)                      │
│   iOS:     FlightEngine.swift + OverlayHost.swift (UIWindow .alert + 1)│
│   Android: FlightEngine.kt    + OverlayHost.kt    (ViewGroupOverlay)   │
└────────────────────────────────────────────────────────────────────────┘
```

## `HeroRegistry` 的两条配对路径

不同于依赖路由转场钩子的方案，`HeroRegistry` 完全通过原生视图生命周期信号在两条路径上完成配对：

### 路径 1：源视图保持挂载时挂载新孪生视图（Stack 推入、Modal、半屏面板）

1. 页面 A 已挂载，`live["default::photo-1"]` 中包含 `[viewA]`。
2. 页面 B 挂载具有相同键的 `viewB`。`register(viewB)` 会在栈转场移动页面前立即捕获 `viewA` 的快照与窗口坐标框，并将飞向 `viewB` 的任务加入待定队列。
3. 当 `viewB` 完成 Fabric 布局（`notifyLayout`）且放大场景下的目标 `<Image>` 完成位图解码（最多等待约 120 ms）后，`HeroRegistry` 将两端快照与几何参数交给 `FlightEngine` 启动飞行。

### 路径 2：视图注销（返程飞行）与同屏原地状态切换

1. **Pop 返回 / 关闭弹窗**：当 `viewB` 脱离窗口而底层 `viewA` 仍然存活（或正在重新挂载）时，`unregister(viewB)` 捕获 `viewB` 最后的实时窗口坐标框（包含下拉关闭手势产生的 `transform` 偏移与缩放），飞回 `viewA` 的静止目标框（`destFrameHint`）。
2. **同屏原地切换（In-place toggle）**：当 `viewA` 卸载使 `live[key]` 变空时，`unregister(viewA)` 将 `viewA` 的快照暂存到 `recentlyUnregistered[key]`（保留 `300 ms` 匹配窗口并记录 `sourceViewId` 防止同实例重挂载产生幽灵残影）。当下一帧 `viewB` 以相同键挂载时，`runMatchPass` 将暂存的源快照与 `viewB` 配对并启动飞行。

## 双端实现细节

### iOS（`ios/*.swift` + `SharedHeroView.mm`）

- **`OverlayHost.swift`**：按需创建透明、不可交互的 `UIWindow`（`windowLevel = .alert + 1`，`isUserInteractionEnabled = false`）及 `OverlayRootViewController`。浮层窗口在首次注册时即完成渲染服务预热并保持常驻可见，消除首次飞行时的 1 帧白闪，同时将状态栏与屏幕旋转查询委托给应用主窗口。
- **`FlightEngine.swift`**：固定时长动画基于 `UIViewPropertyAnimator`（`UICubicTimingParameters`），弹簧动画基于 `UISpringTimingParameters(mass:stiffness:damping:initialVelocity:)`。通过读取 `flightView.layer.presentation()` 支持半空打断与无缝接管（`canTakeOver` / `interrupt`）。
- **`InteractiveStackPop.swift` 与 `InteractiveModalReturn.swift`**：通过 `CADisplayLink` 监听 `UINavigationController` 的 `interactivePopGestureRecognizer` 以及 UIKit 弹窗/半屏面板的下拉关闭手势，使浮层 1:1 跟随手指进度并自动补偿底层列表的视差滑动（parallax）。

### Android（`android/src/main/java/com/sharedhero/*.kt`）

- **`OverlayHost.kt`**：优先从目标视图自身的 `view.rootView`（`DecorView`）解析 `ViewGroupOverlay`，回退到 `activity.window.decorView.overlay`。因此无论是在主 Activity 窗口内，还是跨越 React Native `<Modal>` 的独立 `Dialog` 窗口，浮层都能处于正确的窗口层级。
- **`FlightEngine.kt`**：在 `ViewGroupOverlay` 中挂载自定义 `FrameLayout`，通过动态 `ViewOutlineProvider`（`outline.setRoundRect(0, 0, w, h, currentRadius)`）实现 `morph` 圆角变形。三次贝塞尔曲线动画由 `Choreographer` + `PathInterpolator` 驱动，弹簧动画由 `androidx.dynamicanimation.animation.SpringAnimation`（`FloatValueHolder(0f..1000f)`）驱动。
- **`HeroRegistry.kt` 与 `HeroSnapshot.kt`**：维护严格受限的 `lastKnownSnapshots` LRU 缓存，确保即使连续打开上百个不同的详情页，原生 `Bitmap` 堆内存占用也始终保持恒定。
