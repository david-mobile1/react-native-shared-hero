---
description: Understand snapshot vs morph transition modes, FadeMode options (cross, in, out, through), text heroes, and high-resolution image transitions.
---

# Transition modes & morphing

`SharedHero` supports multiple transition styles through the `mode` and `fadeMode` props. Choosing the right combination keeps transitions crisp whether you are animating a photo, a complex card with text and badges, or a headline.

## `mode="snapshot"` (default)

In `snapshot` mode, the native coordinator captures a bitmap of the source view and a bitmap of the destination view, places both in the window overlay, scales each bitmap to fill the interpolated frame, and fades between them according to `fadeMode`.

Use `snapshot` when:

- Both endpoints have the same shape (for example, rectangular photos or avatars with identical `borderRadius`).
- You want the lowest possible GPU overhead during flight.

```tsx
<SharedHero id={`avatar-${user.id}`} mode="snapshot">
  <Image source={{ uri: user.avatar }} style={styles.avatar} />
</SharedHero>
```

## `mode="morph"` (Material container transform)

When a small rounded card (`borderRadius: 16`, dark slate background) expands into a full-bleed detail screen (`borderRadius: 0`, midnight background), a plain snapshot cross-fade looks flat because the corners do not round or un-round progressively.

In `morph` mode, the native overlay builds a morphing container layer that interpolates:

- **Bounds**: width, height, and center position in window coordinates.
- **Corner radius**: read directly from the `borderRadius` in each `<SharedHero>`'s `style` prop (on iOS via `layer.cornerRadius`, on Android via a custom `ViewOutlineProvider` with `clipToOutline = true`).
- **Background color**: read from `style.backgroundColor` and interpolated in RGBA space across the flight.

```tsx
// Source card: 16px corners, #1E293B surface
<SharedHero
  id={`card-${item.id}`}
  mode="morph"
  style={{ borderRadius: 16, backgroundColor: '#1E293B', overflow: 'hidden' }}
>
  <CardSummary item={item} />
</SharedHero>

// Destination container: 28px corners, #0F172A surface
<SharedHero
  id={`card-${item.id}`}
  mode="morph"
  style={{ borderRadius: 28, backgroundColor: '#0F172A', overflow: 'hidden' }}
>
  <CardFullContent item={item} />
</SharedHero>
```

::: tip Where to put `borderRadius` and `backgroundColor`
Always put `borderRadius` and `backgroundColor` on the `<SharedHero style={...}>` itself rather than only on an inner child `<View>`. The native view inspects its own layer/background properties to drive the morph interpolation.
:::

## Other `mode` values

- `"shuttle"`: Currently an alias of `"snapshot"` in v1, reserved for a future native portal that mounts a custom live React subtree inside the overlay mid-flight.
- `"zoom"` / `"auto"`: Reserved for iOS 18+ system `UIViewController.Transition.zoom` integration; currently falls back to `"morph"` so you can adopt the prop safely across iOS and Android today.

## Controlling opacity with `fadeMode`

While the flying container moves and scales from the source rect to the destination rect, two snapshot layers sit inside it: the outgoing source visual and the incoming destination visual. `fadeMode` controls their alpha curves over normalized flight progress \(p \in [0, 1]\):

| `fadeMode` | Source alpha | Destination alpha | Best used for |
| --- | --- | --- | --- |
| `"cross"` (default) | \(1 - p\) | \(p\) | Photos, avatars, and cards with similar visual density |
| `"through"` | \(1 \to 0\) over \(p \in [0, 0.35]\), then \(0\) | \(0\) until \(p = 0.40\), then \(0 \to 1\) over \(p \in [0.40, 1]\) | Material 3 container transforms where source and destination layouts contain different text or controls |
| `"in"` | Stays \(1\) throughout | \(0 \to 1\) on top of source | Progressive reveal where the destination overlays the source |
| `"out"` | \(1 \to 0\) on top of destination | Stays \(1\) underneath | Dissolving a cover or badge to reveal the destination beneath |

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

## High-resolution image upgrades on zoom-in

A classic artifact in shared-element transitions happens when a small \(120 \times 160\) thumbnail image flies into a \(400 \times 520\) hero banner: if the overlay flies the source view's cached bitmap, the image looks pixelated until the flight finishes and snaps to the destination view.

`react-native-shared-hero` solves this automatically:

1. When zooming in (destination area is larger than source area) and both `<SharedHero>` views wrap a single image view (`RCTImageComponentView` on iOS or `ReactImageView` on Android), the coordinator checks whether the destination image has already decoded its bitmap.
2. If the destination image is still loading from memory/disk cache, the coordinator waits up to ~120 ms (8 display frames) for the image to draw.
3. Once ready, the flight uses the destination's full-resolution bitmap for both layers of the overlay, keeping the entire zoom-in razor-sharp with no snap at the end.

## Animating `<Text>` heroes without glyph clipping

When transitioning a small single-line title into a large multi-line headline, the destination `<Text>` wraps onto different line breaks and has a different aspect ratio from the source `<Text>`.

Instead of center-cropping (`aspectFill`) the snapshots, which would slice off ascenders, descenders, or line ends on composite views containing text, the overlay stretches each snapshot layer independently to match the flying frame while cross-fading. Both the single-line label and the multi-line headline remain 100% legible throughout the flight.
