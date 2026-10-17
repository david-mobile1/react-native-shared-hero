---
description: "排查 React Native 共享元素过渡中的常见问题：动画未触发、圆角变形不生效、Android 返回动画提前截断以及图片放大模糊。"
---

# 故障排查

如果共享元素过渡没有触发或视觉效果不符合预期，请按以下清单排查。

## 过渡动画完全没有触发

1. **检查两端 `id` 和 `namespace` 是否完全一致**：可以在两端加上 `onTransitionStart` 回调或打印 `id`。两端必须共享相同的 `id` 与 `namespace`（默认值为 `"default"`）。
2. **确认 `enabled` 未被设为 `false`**：源端和目标端 `<SharedHero>` 的 `enabled` 都必须为 `true`（默认值）。
3. **同屏原地状态切换时，为两个分支设置不同的 React `key`**：在同一页面内通过 React state 切换两个 `<SharedHero id="x">` 分支时，请赋予不同的 `key`（如 `key="collapsed"` 与 `key="expanded"`），让 React 真正卸载源视图并挂载目标视图，而不是复用同一个实例。
4. **确保两端视图布局后的宽高均大于 0**：如果 `<SharedHero>` 包裹的 `<Image>` 没有设置明确的 `width`/`height` 或 `aspectRatio`，挂载初期的布局尺寸可能是 `0x0`。请始终为 `<SharedHero>` 或其子视图指定明确的尺寸样式。
5. **确认已启用新架构（Fabric）**：`react-native-shared-hero` 仅支持 Fabric 新架构。

## Android Stack 导航器返回时动画被提前截断

**现象**：向前进入详情页时动画非常流畅，但在 Android 上点击返回键时，飞行到一半详情页就突然消失了。

**原因**：在 Android 的 `@react-navigation/native-stack` 中设置 `animation: 'fade'` 会使用很短的原生 XML 淡出动画（约 150 ms），导致目标 Fragment 视图树在 320 ms 返程飞行完成前就被卸载。

**解决方案**：仅在 iOS 上启用 `animation: 'fade'`，Android 保持默认栈转场动画即可：

```tsx
const detailOptions = Platform.select({
  ios: { animation: 'fade' as const },
  default: {},
});
```

## `mode="morph"` 下 `borderRadius` 或 `backgroundColor` 没有平滑变形

**现象**：已经设置了 `mode="morph"`，但飞行过程中圆角没有渐变，而是在动画结束时才变化。

**原因**：`borderRadius` 和 `backgroundColor` 被写在了内部的子组件 `<View>` 或 `<Image>` 上，而不是 `<SharedHero>` 自身的 `style` 属性上。

**解决方案**：将 `borderRadius`、`backgroundColor` 和 `overflow: 'hidden'` 直接移到 `<SharedHero style={...}>` 上：

```tsx
<SharedHero
  id={`card-${item.id}`}
  mode="morph"
  style={{ borderRadius: 20, backgroundColor: '#1E293B', overflow: 'hidden' }}
>
  <Image source={{ uri: item.url }} style={{ width: '100%', height: 240 }} />
</SharedHero>
```

## 放大过渡时目标图片模糊并在落地瞬间跳变

**现象**：从小缩略图放大到全屏大图时，飞行途中图片模糊，落地瞬间才突然变清晰。

**原因**：如果详情页加载的是一个全新的远程图片 URL，且该图片不在内存/磁盘缓存中、网络下载耗时超过了约 `120 ms`，`HeroRegistry` 会优先使用源缩略图位图立即启动飞行，以避免阻塞页面跳转。

**解决方案**：
- 在卡片进入视口或 `onPressIn` 时调用 `Image.prefetch(item.fullUrl)` 预加载高清图。
- 或者当缩略图分辨率已足够清晰时，在两端使用相同的图片 URL 以直接命中内存缓存。

## 开启 `use_frameworks!` 时 CocoaPods 编译报错

**现象**：旧版本在 Xcode 编译时报 `'SharedHero/SharedHero-Swift.h' file not found`。

**解决方案**：升级到最新版本的 `react-native-shared-hero`。`ios/SharedHeroView.mm` 已内置 `__has_include(<SharedHero/SharedHero-Swift.h>)` 自动回退逻辑，同时兼容静态库与 `use_frameworks!`。
