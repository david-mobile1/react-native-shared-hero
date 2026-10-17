---
description: 在 react-native-shared-hero 中配置 duration、cubic-Bezier 缓动预设、原生弹簧物理参数（damping、stiffness、mass）以及直线与弧线运动轨迹。
---

# 时间曲线、弹簧与运动轨迹

`react-native-shared-hero` 中的每一次飞行都由两个正交维度共同决定：

1. **空间运动轨迹（`motionPath`）**：元素中心点在屏幕上的移动路径（`"linear"` 直线或 `"arc"` 弧线）。
2. **时间推进器（`spring` 或 `duration` + `easing`）**：动画进度如何随时间在轨迹上推进。

## 交互式演练场 {#interactive-playground}

使用下方的交互式模拟器对比弹簧物理与固定时长曲线的差异，切换 `"arc"` 与 `"linear"` 轨迹，并一键复制生成的 `<SharedHero>` JSX 代码：

<TransitionPlayground />

## 原生弹簧物理（`spring`）

当向 `<SharedHero>` 传入 `spring` 对象时，它会覆盖 `duration` 和 `easing`，直接调用系统原生的弹簧物理求解器驱动动画：

- **iOS**：由 Core Animation 渲染服务直接执行的 `CASpringAnimation`。
- **Android**：基于 `Choreographer` 帧回调运行的 `androidx.dynamicanimation` `SpringAnimation`。

| Android (Spring 对比 Duration) | iOS (Spring 对比 Duration) |
| --- | --- |
| <video src="https://github.com/user-attachments/assets/172f6e38-2c55-40dd-af5f-dfaae2eb79da" controls loop muted playsinline></video> | <video src="https://github.com/user-attachments/assets/530774c9-15b4-45c1-a987-cc927c5e1c2c" controls loop muted playsinline></video> |

```tsx
<SharedHero
  id={`card-${item.id}`}
  mode="morph"
  spring={{
    damping: 22,
    stiffness: 260,
    mass: 1,
  }}
>
  <CardDetail item={item} />
</SharedHero>
```

### 弹簧参数与默认值

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `damping` | `22` | 粘性阻尼系数 \(c\)。较小的值（`12` 至 `16`）会产生明显的回弹；`22` 至 `28` 之间则能快速利落地收敛到位。 |
| `stiffness` | `260` | 弹簧刚度常数 \(k\)。数值越大（`320` 至 `450`），起步阶段的加速响应越干脆。 |
| `mass` | `1` | 飞行物体的虚拟质量 \(m\)。iOS 原生支持 `CASpringAnimation.mass`；Android 的 `SpringForce` 固定为单位质量（`1`），并将 `damping` 与 `stiffness` 转换为等效阻尼比 \(\zeta = \frac{c}{2\sqrt{k}}\) 与固有频率。 |

::: info 为什么弹簧动画在触屏设备上更自然？
基于 `duration` 的缓动曲线无论移动距离长短都固定耗时相同的毫秒数；而弹簧物理在半空被打断接管时能够自然延续速度感（参见[半空飞行打断与接管](/zh/guide/events-and-lifecycle#mid-air-flight-takeovers)），并在接近目标槽位时平滑减速。
:::

## 固定时长与三次贝塞尔缓动（`duration` + `easing`）

如果未传入 `spring`，飞行将按 `duration` 毫秒（默认 `320` ms）结合 `easing` 指定的三次贝塞尔预设（默认 `"standard"`）运行：

```tsx
<SharedHero
  id={`poster-${item.id}`}
  duration={380}
  easing="emphasized"
>
  <PosterDetail item={item} />
</SharedHero>
```

### 可用的 `easing` 预设

| 预设名称 | 控制点 \((x_1, y_1, x_2, y_2)\) | 曲线特征 |
| --- | --- | --- |
| `"standard"`（默认） | `(0.2, 0.0, 0.0, 1.0)` | Material 3 标准曲线：起步迅速，收尾减速柔和悠长。 |
| `"emphasized"` | `(0.3, 0.0, 0.0, 1.0)` | 比 `"standard"` 更具爆发力的初速度，非常适合全屏卡片展开。 |
| `"easeOut"` | `(0.0, 0.0, 0.58, 1.0)` | 以最大速度起步，接近终点时平滑减速。 |
| `"easeInOut"` | `(0.42, 0.0, 0.58, 1.0)` | 首尾对称地加速与减速。 |
| `"easeIn"` | `(0.42, 0.0, 1.0, 1.0)` | 缓慢起步并持续加速直至终点。 |
| `"linear"` | `(0.0, 0.0, 1.0, 1.0)` | 全程匀速移动。 |

## 运动轨迹：`"linear"` 与 `"arc"`

默认情况下（`motionPath="linear"`），飞行视图的中心点沿直线从源中心 \((x_0, y_0)\) 移动到目标中心 \((x_1, y_1)\)。

当元素同时在水平和垂直方向上发生较大位移时（例如从网格右下角的小缩略图飞向详情页顶部的居中大图），笔直的对角线往往显得有些生硬。设置 `motionPath="arc"` 会将中心点轨迹切换为二次贝塞尔弧线：

\[
B(t) = (1 - t)^2 P_0 + 2(1 - t)t P_{\text{ctrl}} + t^2 P_1
\]

其中控制点 \(P_{\text{ctrl}}\) 沿垂直于弦 \(P_0 \to P_1\) 的屏幕上方偏移弦长的 **18%**。

| Android (`motionPath="arc"`) | iOS (`motionPath="arc"`) |
| --- | --- |
| <video src="https://github.com/user-attachments/assets/1d951962-e393-48aa-8ad0-7e338a2d70f4" controls loop muted playsinline></video> | <video src="https://github.com/user-attachments/assets/58a7ab8b-aaa6-4254-8d3c-1db7f883c528" controls loop muted playsinline></video> |

```tsx
<SharedHero
  id={`badge-${item.id}`}
  mode="morph"
  motionPath="arc"
  duration={420}
>
  <BadgeExpanded item={item} />
</SharedHero>
```

## 哪一端的配置生效？

一次过渡中同时存在源视图与目标视图两个 `<SharedHero>`：

- **去程飞行（源视图 -> 目标视图）**：由**目标视图**上的 `mode`、`duration`、`spring`、`easing`、`fadeMode` 与 `motionPath` 决定动画行为。
- **返程飞行（目标视图 -> 源视图）**：同样由**正在卸载的目标视图**上的动画属性驱动返程动画。这样你只需在详情页配置一次参数，去程和返程就能自动保持对称，无需在列表项中重复声明时间配置。
