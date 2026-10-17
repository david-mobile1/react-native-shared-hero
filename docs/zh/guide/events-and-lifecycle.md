---
description: "监听 onTransitionStart 与 onTransitionEnd 生命周期事件，使用 returnFlightEnabled 控制返程飞行，使用 namespace 隔离注册表，并处理半空飞行打断。"
---

# 事件与生命周期

`SharedHero` 提供了生命周期回调与控制属性（`enabled`、`returnFlightEnabled`、`namespace`），方便你同步周边 UI 元素、在不同导航树之间隔离 `id` 空间，并优雅地处理半空打断。

## 生命周期回调属性

两个回调均直接接收已解包的 `SharedHeroTransitionEvent` 对象（`{ id: string, namespace: string }`）：

| 属性 | 事件负载（`SharedHeroTransitionEvent`） | 触发时机 |
| --- | --- | --- |
| `onTransitionStart` | `{ id: string, namespace: string }` | 去程飞行开始时在源视图上触发，或返程飞行开始时在目标视图上触发。 |
| `onTransitionEnd` | `{ id: string, namespace: string }` | 去程飞行落地时在目标视图上触发，或返程飞行结束时在源视图上触发。 |

```tsx
import { useState } from 'react';
import { SharedHero } from 'react-native-shared-hero';

export function DetailHeader({ item }) {
  const [chromeVisible, setChromeVisible] = useState(false);

  return (
    <>
      <SharedHero
        id={`photo-${item.id}`}
        namespace="feed"
        mode="morph"
        onTransitionStart={({ id, namespace }) => {
          console.log('开始飞行:', namespace, id);
          setChromeVisible(false);
        }}
        onTransitionEnd={({ id, namespace }) => {
          console.log('结束飞行:', namespace, id);
          setChromeVisible(true);
        }}
      >
        <HeroImage uri={item.fullUrl} />
      </SharedHero>

      {chromeVisible && <FloatingActionButtons />}
    </>
  );
}
```

## 使用 `namespace` 隔离共享元素注册表

默认情况下，所有 `<SharedHero>` 实例共享 `namespace="default"`，并按复合键 `namespace::id` 进行配对。

如果你的应用在多个同时保持挂载的独立导航树（例如“首页推荐”标签页与“个人收藏”标签页）中渲染相同的数据项，可以为不同区域指定独立的 `namespace`，避免跨标签页误配对：

```tsx
<SharedHero id={`post-${post.id}`} namespace="bookmarks" mode="morph">
  <PostThumbnail post={post} />
</SharedHero>
```

## 使用 `returnFlightEnabled` 控制返程飞行

默认情况下（`returnFlightEnabled={true}`），当目标端 `<SharedHero>` 卸载时，会自动触发飞回源端 `<SharedHero>` 的返程动画。

如果目标视图所在的容器在关闭时本身已经带有将视图移出屏幕的退场动画，可以将 `returnFlightEnabled` 设为 `false`，仅禁用卸载时的返程飞行而不影响进入时的去程飞行：

```tsx
<SharedHero
  id={`modal-photo-${item.id}`}
  returnFlightEnabled={false}
>
  <Image source={{ uri: item.uri }} style={styles.image} />
</SharedHero>
```

## 飞行期间的端点显隐与柔和交接（Soft handoff）

当某个 `namespace::id` 的过渡动画正在运行时：

1. `FlightEngine` 会将源端与目标端真实视图隐藏（iOS 设置 `contentView.isHidden = true`，Android 设置 `alpha = 0f`），确保浮层下方不会出现重影。
2. 当几何飞行到达终点时，`FlightEngine` 会先恢复目标端真实视图的显示，再将浮层克隆视图快速淡出完成柔和交接（soft handoff），彻底消除单帧白屏闪烁。

## 半空飞行打断与接管 {#mid-air-flight-takeovers}

真实用户常常在页面刚推入一半时就立刻点击返回或侧滑退出。

如果 `id="photo-1"` 的去程飞行正处于半空，此时目标页面被弹出卸载：

1. `FlightEngine` 检测到同一个键下仍有正在运行的 `ActiveFlight`（`canTakeOver`）。
2. `FlightEngine` 不会同时叠加两个浮层，也不会生硬地跳到终点再往回飞，而是立即中断旧飞行，读取飞行容器在窗口坐标系下的**实时呈现位置**（iOS 读取 `layer.presentation()`，Android 读取容器当前实时边界），并直接从该半空位置启动返程飞行。
3. 元素在半空中丝滑折返，平稳落回列表源槽位。

## 使用 `enabled` 动态启用或禁用

你可以通过传入 `enabled={false}` 将某个 `<SharedHero>` 暂时移出 `HeroRegistry`，而无需改动组件树结构：

```tsx
<SharedHero
  id={`video-${clip.id}`}
  enabled={!isPictureInPictureActive}
>
  <VideoPreview clip={clip} />
</SharedHero>
```

当已挂载视图上的 `enabled` 从 `true` 变为 `false` 时，原生视图会立即从 `HeroRegistry` 注销自身，后续页面跳转将按普通页面转场执行。
