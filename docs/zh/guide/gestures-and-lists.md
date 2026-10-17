---
description: 支持 iOS 交互式边缘侧滑返回、自定义下拉拖拽关闭手势，以及 FlatList / FlashList 虚拟列表单元格复用。
---

# 交互式手势返回与 FlatList

真实业务中的信息流往往将虚拟化滚动列表（`FlatList` 或 `FlashList`）与手势返回（iOS 左边缘侧滑返回或垂直下拉关闭）结合在一起。`react-native-shared-hero` 在原生层对这两类场景提供了专门支持。

## 1. iOS 交互式左边缘侧滑返回

在 iOS 上，当用户从屏幕左边缘向右拖动以弹出 `UINavigationController` 页面（`interactivePopGestureRecognizer`）时：

1. 手势开始瞬间，原生协调器会自动识别当前活跃的 `UIGestureRecognizer` 与 `UINavigationController.topViewController?.transitionCoordinator`。
2. 协调器不会立即运行固定计时器动画，而是进入**交互式手势驱动模式（interactive driver mode）**。
3. 随着手指在屏幕上滑动，飞行克隆节点的位置、缩放比例、圆角半径与透明度混合会 1:1 实时跟随手指位移百分比。
4. 当手指抬起时：
   - **确认返回（Commit）**：克隆节点在剩余时间内（约 `220 ms`）从松手位置平滑飞入列表源单元格。
   - **取消返回（手指在左边缘附近松开）**：克隆节点平滑飞回详情页原位置并恢复详情页真实视图显示。

你无需编写任何额外代码即可在 iOS 上获得交互式侧滑返回支持，只要系统侧滑返回手势触发，它就会自动生效。

## 2. 自定义拖拽关闭手势衔接（Pan-to-dismiss）

许多图片与视频应用允许用户在详情页垂直拖动图片进行缩放关闭（类似 Instagram 或 Apple 相册）。

当你在 `PanResponder` 或 `react-native-gesture-handler` 中通过 `transform: [{ translateX }, { translateY }, { scale }]` 实时拖拽 `<SharedHero>` 时：

```tsx
<Animated.View
  {...panResponder.panHandlers}
  style={{
    transform: [
      { translateX: dragX },
      { translateY: dragY },
      { scale: dragScale },
    ],
  }}
>
  <SharedHero
    id={`photo-${item.id}`}
    mode="morph"
    spring={{ damping: 24, stiffness: 260, mass: 1 }}
    style={{ borderRadius: 20, overflow: 'hidden' }}
  >
    <Image source={{ uri: item.fullUrl }} style={styles.heroImage} />
  </SharedHero>
</Animated.View>
```

当拖动距离超过阈值并调用 `navigation.goBack()` 时：

1. 在卸载前一刻，原生 `SharedHeroView` 会测量**包含当前 transform 矩阵在内的实时窗口坐标框**（即手指松开瞬间的真实偏移与缩放尺寸），而不是静态初始布局框。
2. 返程飞行直接从松手位置无缝接力并飞回列表单元格，不会出现先闪回屏幕中央再飞行的跳变。

## 3. 虚拟化列表（`FlatList` 与 `FlashList`）

虚拟列表在滚动时会不断复用原生组件实例。如果没有专门处理，当一个复用单元格的 `id` 从 `"photo-1"` 变为 `"photo-19"` 时，`"photo-1"` 的注册桶可能会错误地指向正在展示第 19 项内容的视图。

`react-native-shared-hero` 在原生层对虚拟列表做了三层保护：

- **属性变更时自动清理旧 `id`**：当复用视图上的 `heroId` 发生变化时，`HeroRegistry` 会先将该视图从旧 `id` 桶中移除并清理其旧快照，然后再注册到新 `id` 下。
- **严格受限的 LRU 快照缓存**：`HeroRegistry.lastKnownSnapshots` 采用容量受限的 LRU 缓存池（`SnapshotLRU`）。即使列表滚动浏览上千条数据，最早的位图也会被自动淘汰，内存占用始终保持平稳。
- **脏检查按需刷新（Dirty check）**：仅当视图的 `bounds` 尺寸或子视图数量实际发生变化时才重新捕获快照，避免在列表惯性滚动期间产生多余的位图渲染。

### `FlatList` 最佳实践

1. **始终提供稳定的 `keyExtractor`**：使用数据项的唯一 ID（`keyExtractor={(item) => item.id}`），不要使用数组下标 `index`。
2. **详情页横向翻页后同步滚动列表**：如果用户在详情页内左右滑动切换了当前图片（例如从第 1 张滑到了第 8 张），在返回前调用 `flatListRef.current?.scrollToIndex({ index, animated: false })`，确保第 8 张对应的源 `<SharedHero>` 已挂载在当前窗口中。
3. **源视图滚出屏幕时的安全降级**：如果返回时源 `<SharedHero>` 尺寸为 0 或已不在窗口中，`react-native-shared-hero` 会安全跳过本次飞行并正常恢复页面显示，绝不会崩溃或导致视图卡在隐藏状态。
