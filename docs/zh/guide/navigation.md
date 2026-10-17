---
description: "在原生 Stack、Modal、透明弹窗、半屏面板 (formSheet)、React Native 内置 Modal 与底部 Tab 导航器之间使用 react-native-shared-hero。"
---

# Stack、弹窗、半屏面板与标签页

由于 `react-native-shared-hero` 将飞行克隆节点渲染在窗口级浮层（`OverlayHost` 在 iOS 上使用 `UIWindow.Level.alert + 1` 的独立 `UIWindow`，在 Android 上使用 `DecorView.overlay`），它不受限于单一导航容器，几乎可以跨越所有页面呈现形式。

## 1. 原生栈导航（`@react-navigation/native-stack` / Expo Router）

对于标准的推入/弹出转场，建议为详情页设置如下导航选项，使背景转场与共享元素飞行相得益彰：

```tsx
<Stack.Screen
  name="Detail"
  component={DetailScreen}
  options={Platform.select({
    ios: {
      animation: 'fade',
      headerTransparent: true,
    },
    default: {
      headerTransparent: true,
    },
  })}
/>
```

### 为什么只在 iOS 上设置 `animation: 'fade'`？

- **iOS**：iOS 默认的 Stack 推入会将整个页面从右向左平移，设置 `animation: 'fade'` 可以让背景柔和淡化，将视觉焦点留给共享元素。
- **Android**：在 `react-native-screens` 中，`animation: 'fade'` 在返回时使用较短的 XML 淡出动画，会在 320 ms 的返程飞行结束前提前卸载目标 Fragment 视图树。保留 Android 默认的 Stack 转场动画能让往返过程都保持流畅。

## 2. 原生 Modal 与透明弹窗（`transparentModal`）

当使用 `presentation: 'modal'` 或 `presentation: 'transparentModal'` 打开新路由时，底层的源页面**依然保持挂载状态**，不会被卸载。

`HeroRegistry` 通过为每个 `namespace::id` 维护有序挂载列表（`live[key]`）自动处理这种场景：

- 当弹窗挂载第二个 `<SharedHero id="item-1">` 时，`HeroRegistry` 将弹窗中新挂载的视图作为目标端，将底层列表页上的视图作为源端进行配对。
- 当弹窗关闭（点击关闭按钮或下拉手势关闭）时，弹窗内的视图注销并自动飞回底层列表页中仍在挂载的源视图。

### 原生 Modal（`presentation: 'modal'`）

| Android | iOS |
| --- | --- |
| <video src="https://github.com/user-attachments/assets/400aaaf4-834c-4b56-9685-039f550b3dae" controls loop muted playsinline></video> | <video src="https://github.com/user-attachments/assets/fa454b2c-52eb-44e2-b1e0-2b4365894ead" controls loop muted playsinline></video> |

### 透明弹窗（`presentation: 'transparentModal'`）

| Android | iOS |
| --- | --- |
| <video src="https://github.com/user-attachments/assets/75c35270-4264-45c0-be64-f53ea62a2bbf" controls loop muted playsinline></video> | <video src="https://github.com/user-attachments/assets/67607ca1-05e3-4604-a151-5b175642d288" controls loop muted playsinline></video> |

```tsx
<Stack.Screen
  name="QuickPreviewModal"
  component={QuickPreviewModal}
  options={{
    presentation: 'transparentModal',
    animation: 'fade',
    headerShown: false,
  }}
/>
```

## 3. 半屏面板与 Bottom Sheet（`presentation: 'formSheet'`）

在 iOS 15+ 上，`react-native-screens` 支持基于系统 `UISheetPresentationController` 的原生半屏面板（`presentation: 'formSheet'` 配合 `sheetAllowedDetents`）。

传统的视图树内 Portal 方案在飞出半屏面板顶部圆角边界时会被裁切；而 `OverlayHost` 的 `UIWindow` 层级（`.alert + 1`）高于半屏面板容器，共享元素可以直接从背景页面飞入半屏面板当前的停靠高度（detent），且 `InteractiveModalReturn` 会自动跟踪半屏面板的下拉关闭手势。

| Android | iOS |
| --- | --- |
| <video src="https://github.com/user-attachments/assets/33ab7627-e958-4477-8787-6642226c8a71" controls loop muted playsinline></video> | <video src="https://github.com/user-attachments/assets/ad56aa9d-eb1f-4157-9c9e-1822f699d4fe" controls loop muted playsinline></video> |

```tsx
<Stack.Screen
  name="ProductSheet"
  component={ProductSheetScreen}
  options={{
    presentation: 'formSheet',
    sheetAllowedDetents: [0.55, 1.0],
    sheetGrabberVisible: true,
    headerShown: false,
  }}
/>
```

## 4. React Native 内置 `<Modal>`

你甚至不需要使用导航库就能触发跨窗口的共享元素过渡。React Native 内置的 `<Modal>` 会在独立的原生窗口中挂载内容（iOS 为 `RCTModalHostView` 的 `UIWindow`，Android 为独立的 `Dialog` `Window`）。

`OverlayHost` 在双端均已自动适配：

- **iOS**：`OverlayHost` 的窗口层级（`UIWindow.Level.alert + 1`）位于 `RCTModalHostView` 窗口之上。
- **Android**：`OverlayHost.resolveOverlay(view)` 会直接从目标视图自身的 `rootView`（`DecorView`）解析 `ViewGroupOverlay`。打开 `<Modal>` 时，去程飞行渲染在 `Dialog` 自身的 `DecorView.overlay` 上（位于弹窗内容上方）；关闭 `<Modal>` 时，返程飞行渲染在宿主 Activity 的 `DecorView.overlay` 上。

| Android | iOS |
| --- | --- |
| <video src="https://github.com/user-attachments/assets/eb76f4bc-1014-4abd-b626-851b7577c9e9" controls loop muted playsinline></video> | <video src="https://github.com/user-attachments/assets/d70f7f85-8db7-482f-89af-d3dcba0d1169" controls loop muted playsinline></video> |

```tsx
<Modal
  visible={activeItem != null}
  transparent
  animationType="slide"
  statusBarTranslucent
  navigationBarTranslucent
  onRequestClose={() => setActiveItem(null)}
>
  {activeItem ? (
    <View style={styles.modalRoot}>
      <SharedHero
        id={`core-modal-${activeItem.id}`}
        namespace="core-modal"
        mode="snapshot"
        duration={380}
        style={styles.hero}
      >
        <Image source={{ uri: activeItem.uri }} style={styles.fill} />
      </SharedHero>
    </View>
  ) : null}
</Modal>
```

## 5. 标签页与多级连续跳转（Multi-step）

### 从标签页推入详情页

为标签页中的卡片指定 `namespace="tabs"`，并在详情页使用相同的 `namespace="tabs"`：

| Android | iOS |
| --- | --- |
| <video src="https://github.com/user-attachments/assets/2de41d36-1a22-4064-b33c-3e498add10d0" controls loop muted playsinline></video> | <video src="https://github.com/user-attachments/assets/e27aae00-8c37-461b-ba8f-b15f306cd52d" controls loop muted playsinline></video> |

### 多级连续跳转（A -> B -> C）

可以在多个连续推入的页面（如 `列表页 -> 概览页 -> 全屏大图页`）之间通过匹配的 `id` 串联起每一步的共享元素飞行：

| Android | iOS |
| --- | --- |
| <video src="https://github.com/user-attachments/assets/425bb373-5a88-46cf-8fa3-3207938fa06c" controls loop muted playsinline></video> | <video src="https://github.com/user-attachments/assets/172ca32e-0e9a-44f0-8d69-90dcfad1c36e" controls loop muted playsinline></video> |
