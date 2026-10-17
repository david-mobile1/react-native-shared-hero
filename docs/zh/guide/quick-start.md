---
description: 5 分钟内在 React Native 中使用 SharedHero 构建你的第一个共享元素过渡动画。
---

# 快速开始

实现一次共享元素过渡只需在两个页面（或两个条件渲染分支）中放置具有相同 `id` 字符串的 `<SharedHero>` 组件。

## 基础图片过渡（列表页到详情页）

假设你在原生栈导航器（`@react-navigation/native-stack` 或 `expo-router`）中有一个图片网格列表页和一个详情页。

| Android | iOS |
| --- | --- |
| <video src="https://github.com/user-attachments/assets/8902a96b-59cf-4893-a0fd-a5b4316b4abd" controls loop muted playsinline></video> | <video src="https://github.com/user-attachments/assets/65177700-0503-4ad5-9f7c-912f55cf6e45" controls loop muted playsinline></video> |

### 第一步：包裹源视图

在列表页中，使用 `<SharedHero>` 包裹缩略图，并绑定一个与数据项 ID 对应的唯一 `id`：

```tsx
import { FlatList, Image, Pressable, StyleSheet } from 'react-native';
import { SharedHero } from 'react-native-shared-hero';

export function PhotoGridScreen({ navigation, items }) {
  return (
    <FlatList
      data={items}
      numColumns={2}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => navigation.navigate('PhotoDetail', { item })}
          style={styles.cell}
        >
          <SharedHero id={`photo-${item.id}`} style={styles.thumbHero}>
            <Image source={{ uri: item.thumbUrl }} style={styles.thumbImage} />
          </SharedHero>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  cell: { flex: 1, margin: 8 },
  thumbHero: { borderRadius: 12, overflow: 'hidden' },
  thumbImage: { width: '100%', aspectRatio: 3 / 4 },
});
```

### 第二步：包裹目标视图

在详情页中，使用完全相同的 `id` 包裹顶部大图：

```tsx
import { Image, ScrollView, StyleSheet, Text } from 'react-native';
import { SharedHero } from 'react-native-shared-hero';

export function PhotoDetailScreen({ route }) {
  const { item } = route.params;

  return (
    <ScrollView style={styles.container}>
      <SharedHero
        id={`photo-${item.id}`}
        mode="morph"
        style={styles.detailHero}
      >
        <Image source={{ uri: item.fullUrl }} style={styles.detailImage} />
      </SharedHero>
      <Text style={styles.title}>{item.title}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F19' },
  detailHero: { borderRadius: 0, overflow: 'hidden' },
  detailImage: { width: '100%', height: 420 },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '700', padding: 20 },
});
```

### 第三步：推荐的 Stack 导航器选项

在 iOS 上，`createNativeStackNavigator` 默认的推入动画会将新页面从右侧滑入，容易与向上飞行的共享元素产生视觉冲突。在 iOS 上设置 `animation: 'fade'` 可以让背景柔和淡入，突出共享元素本身的飞行轨迹。

在 Android 上，建议保留 `react-native-screens` 的默认转场动画，不要设置 `animation: 'fade'`，因为 Android 的 XML 淡出动画会在返回途中提前卸载 Fragment 视图树，导致 320 ms 的返程飞行被提前截断。

```tsx
import { Platform } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

export const heroScreenOptions: NativeStackNavigationOptions = Platform.select({
  ios: {
    animation: 'fade',
    headerTransparent: true,
  },
  default: {
    headerTransparent: true,
  },
})!;
```

## 导航触发时底层发生了什么？

1. **向前推入（Forward push）**：当 `PhotoDetailScreen` 挂载时，其中的 `<SharedHero id="photo-1">` 向原生协调器注册并完成布局。协调器匹配到 `PhotoGridScreen` 上仍处于挂载状态的 `<SharedHero id="photo-1">`，捕获两端视图并隐藏真实节点（`opacity = 0`），然后在窗口浮层中驱动克隆视图从缩略图位置飞向详情页大图位置。
2. **高清图无缝升级**：如果 `item.thumbUrl` 是小尺寸缩略图而 `item.fullUrl` 是高清大图，协调器会等待最多约 120 ms 让目标端的 `UIImageView` / `ImageView` 完成位图解码，直接用清晰的目标大图完成整个飞行过程。
3. **返回或侧滑返回（Back pop）**：当退出 `PhotoDetailScreen` 或在 iOS 上从左边缘侧滑返回时，详情页的共享元素会平滑飞回 `PhotoGridScreen` 中对应的网格位置。
