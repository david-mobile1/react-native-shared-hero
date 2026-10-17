---
description: 深入了解 snapshot 与 morph 过渡模式、fadeMode 透明度曲线（cross、in、out、through）、文本过渡与高清图片自动升级机制。
---

# 过渡模式与容器变形

`SharedHero` 通过 `mode` 与 `fadeMode` 两个属性提供灵活的视觉变形能力。合理搭配这两个属性，无论是纯图片、带圆角与背景色的复合卡片，还是多行标题文本，都能获得细腻的过渡效果。

## `mode="snapshot"`（默认模式）

在 `snapshot` 模式下，原生协调器分别捕获源视图与目标视图的位图快照，将两层位图放入窗口级浮层，按当前插值出的矩形框缩放位图，并根据 `fadeMode` 在两层之间做透明度混合。

适用场景：

- 源视图与目标视图形状一致（例如直角图片，或圆角比例完全相同的头像）。
- 希望在飞行过程中保持最低的 GPU 渲染开销。

```tsx
<SharedHero id={`avatar-${user.id}`} mode="snapshot">
  <Image source={{ uri: user.avatar }} style={styles.avatar} />
</SharedHero>
```

## `mode="morph"`（Material 容器变形）

当一张带圆角的小卡片（`borderRadius: 16`，深灰背景）展开为全屏详情页（`borderRadius: 0`，纯黑背景）时，单纯的位图交叉淡化无法呈现圆角逐渐拉直的物理过程。

开启 `mode="morph"` 后，原生浮层会创建一个变形容器并在每一帧实时插值以下属性：

- **几何边界（Bounds）**：窗口坐标系下的宽度、高度与中心点坐标。
- **圆角半径（`borderRadius`）**：直接读取两端 `<SharedHero>` 的 `style.borderRadius`（iOS 通过 `layer.cornerRadius` 驱动，Android 通过自定义 `ViewOutlineProvider` 配合 `clipToOutline = true` 驱动）。
- **背景颜色（`backgroundColor`）**：读取 `style.backgroundColor` 并在 RGBA 空间逐帧平滑插值。

```tsx
// 源卡片：16px 圆角，#1E293B 背景
<SharedHero
  id={`card-${item.id}`}
  mode="morph"
  style={{ borderRadius: 16, backgroundColor: '#1E293B', overflow: 'hidden' }}
>
  <CardSummary item={item} />
</SharedHero>

// 目标容器：28px 圆角，#0F172A 背景
<SharedHero
  id={`card-${item.id}`}
  mode="morph"
  style={{ borderRadius: 28, backgroundColor: '#0F172A', overflow: 'hidden' }}
>
  <CardFullContent item={item} />
</SharedHero>
```

::: tip `borderRadius` 和 `backgroundColor` 应该写在哪里？
请务必将 `borderRadius` 和 `backgroundColor` 直接写在 `<SharedHero style={...}>` 自身上，而不是只写在内部的 `<View>` 子节点上。原生组件会直接读取自身视图层的圆角与背景色来驱动变形插值。
:::

## 其他 `mode` 取值

- `"shuttle"`：在 v1 中作为 `"snapshot"` 的同义别名，预留给未来版本将实时 React 子树直接移入浮层容器的能力。
- `"zoom"` / `"auto"`：预留给 iOS 18+ 系统级 `UIViewController.Transition.zoom` 集成；当前版本会自动回退到 `"morph"`，方便你在双端安全使用。

## 使用 `fadeMode` 控制透明度曲线

在飞行容器从源矩形移动到目标矩形的过程中，内部包含源视图快照和目标视图快照两个图层。`fadeMode` 决定了它们随归一化进度 \(p \in [0, 1]\) 变化的透明度曲线：

| `fadeMode` | 源图层 Alpha | 目标图层 Alpha | 最佳适用场景 |
| --- | --- | --- | --- |
| `"cross"`（默认） | \(1 - p\) | \(p\) | 图片、头像或两端视觉结构相近的卡片 |
| `"through"` | 在 \(p \in [0, 0.35]\) 内从 \(1 \to 0\)，之后保持 \(0\) | 在 \(p = 0.40\) 前保持 \(0\)，在 \(p \in [0.40, 1]\) 内从 \(0 \to 1\) | 符合 Material 3 规范的容器变形，适合两端文本排版或操作按钮差异较大的卡片 |
| `"in"` | 全程保持 \(1\) | 在源图层上方从 \(0 \to 1\) 渐显 | 目标内容逐步覆盖在源画面之上的揭示效果 |
| `"out"` | 在目标图层上方从 \(1 \to 0\) 渐隐 | 在底层全程保持 \(1\) | 溶解顶层封面或徽章以露出底部完整视图 |

```tsx
<SharedHero
  id={`article-${post.id}`}
  mode="morph"
  fadeMode="through"
  style={{ borderRadius: 20, backgroundColor: '#111827' }}
>
  <ArticleDetail post={post} />
</SharedHero>
```

## 放大时的高清目标图自动升级

共享元素动画中常见的一个视觉瑕疵是：当 \(120 \times 160\) 的列表缩略图飞向 \(400 \times 520\) 的详情页头图时，如果直接使用源缩略图的缓存位图进行放大，飞行途中图片会明显模糊，直到动画结束切换回真实视图时才突然变清晰。

`react-native-shared-hero` 在原生层自动解决了这一问题：

1. 当处于放大过渡（目标面积大于源面积）且两端 `<SharedHero>` 均包裹单个图片视图（iOS 为 `RCTImageComponentView`，Android 为 `ReactImageView`）时，协调器会检查目标端图片是否已完成位图解码。
2. 如果目标图片正在从内存或磁盘缓存解码，协调器最多等待约 120 ms（约 8 个显示帧）让其完成绘制。
3. 一旦高清位图就绪，浮层的两个图层都会采用目标端的高分辨率图像进行渲染，确保整个放大过程清晰锐利、落地时毫无跳变。

## `<Text>` 标题过渡防裁切保护

当单行紧凑标题过渡为多行大字号标题时，两端 `<Text>` 的换行位置与宽高比往往不同。

如果对快照采用居中裁切（`aspectFill`），多行文本的上下边缘或行尾很容易在飞行途中被切掉。为此，浮层会让源快照与目标快照各自独立拉伸贴合当前飞行框并配合交叉淡入淡出，保证单行与多行文本在整个飞行过程中都完整可读。
