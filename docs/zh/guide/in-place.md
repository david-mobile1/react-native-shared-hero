---
description: "无需路由导航，使用 useSharedHero() 与独立的 React key 在同一页面的两个状态之间实现原地共享元素过渡。"
---

# 同屏原地过渡（`useSharedHero`）

共享元素过渡不仅适用于跨页面跳转。很多时候，我们希望在**同一个页面内**通过切换 React 状态将紧凑小组件展开为大视图：

- 将底部的迷你音乐播放条展开为全屏播放器面板。
- 将内联缩略图原地展开为详情卡片或预览大图。
- 将胶囊标签变形为多行操作面板。

## 同屏配对的工作原理

当你在同一页面内根据状态条件渲染两个具有相同 `id`（以及不同 React `key`）的 `<SharedHero>` 分支时：

```tsx
{active ? (
  <SharedHero key="player-expanded" id="player-art" namespace="inplace">
    <LargeArtwork />
  </SharedHero>
) : (
  <SharedHero key="player-compact" id="player-art" namespace="inplace">
    <MiniArtwork />
  </SharedHero>
)}
```

为什么要为两个分支设置不同的 `key`？

1. 为两个分支赋予不同的 React `key`（如 `key="player-expanded"` 与 `key="player-compact"`）会告知 React 在同一次提交中**卸载**紧凑态 `<SharedHero>` 并**挂载**新的展开态 `<SharedHero>`，而不是复用同一个原生视图实例仅修改其 `style`。
2. 紧凑态视图卸载时，`HeroRegistry` 会将其卸载前的快照与窗口坐标框暂存到 `recentlyUnregistered` 表中。
3. 在同一帧内，新挂载的展开态视图完成注册与布局，`HeroRegistry` 将暂存的源快照与新目标视图配对，并在窗口浮层中启动过渡动画。

::: tip 同一实例的原地尺寸变化
在 iOS 上，`HeroRegistry` 也能通过 `notifyLayout` 自动检测单个已挂载 `SharedHeroViewImpl` 的原地尺寸跳变；但当折叠态与展开态的子树结构不同时，为两个分支设置不同的 `key` 是双端最清晰、最一致的做法。
:::

## 使用 `useSharedHero` 状态辅助 Hook

`useSharedHero(initial = false)` 是专为同屏原地过渡提供的轻量状态 Hook，返回 `{ active, start, end, toggle }` 以及引用稳定的回调函数：

| Android | iOS |
| --- | --- |
| <video src="https://github.com/user-attachments/assets/05a81333-c76f-4864-8047-4eb46a0e50d0" controls loop muted playsinline></video> | <video src="https://github.com/user-attachments/assets/d3020dbc-cf82-4cc7-bf77-98509f474f57" controls loop muted playsinline></video> |

```tsx
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SharedHero, useSharedHero } from 'react-native-shared-hero';

export function InPlacePhotoToggle({ photo }) {
  const { active, toggle } = useSharedHero(false);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>点击图片在同屏原地切换大小</Text>

      <Pressable onPress={toggle}>
        {active ? (
          <SharedHero
            key="hero-inplace-large"
            id="hero-inplace"
            namespace="inplace"
            mode="morph"
            duration={420}
            style={styles.large}
          >
            <Image source={{ uri: photo.uri }} style={styles.fill} />
          </SharedHero>
        ) : (
          <SharedHero
            key="hero-inplace-small"
            id="hero-inplace"
            namespace="inplace"
            mode="morph"
            duration={420}
            style={styles.small}
          >
            <Image source={{ uri: photo.uri }} style={styles.fill} />
          </SharedHero>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 32 },
  heading: { fontSize: 18, fontWeight: '700', marginBottom: 24 },
  small: { width: 120, height: 120, borderRadius: 12, overflow: 'hidden' },
  large: { width: 320, height: 320, borderRadius: 24, overflow: 'hidden' },
  fill: { width: '100%', height: '100%' },
});
```

## `useSharedHero` 返回值说明

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `active` | `boolean` | 当前是否处于激活（展开）状态，初始值默认为 `false`。 |
| `start` | `() => void` | 将 `active` 设为 `true`。 |
| `end` | `() => void` | 将 `active` 设为 `false`。 |
| `toggle` | `() => void` | 在 `false` 与 `true` 之间切换 `active`。 |
