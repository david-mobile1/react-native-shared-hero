---
description: Configure duration, cubic-Bezier easing presets, native spring physics (damping, stiffness, mass), and linear vs curved arc motion paths in react-native-shared-hero.
---

# Timing, springs & motion paths

Every flight in `react-native-shared-hero` is driven by two orthogonal choices:

1. **Spatial trajectory (`motionPath`)**: the path the element's center point follows across the screen (`"linear"` or `"arc"`).
2. **Temporal driver (`spring` vs `duration` + `easing`)**: how progress advances along that trajectory over time.

## Interactive playground

Use the interactive simulator below to compare spring physics against duration-based curves, switch between `"arc"` and `"linear"` paths, and copy the resulting `<SharedHero>` JSX:

<TransitionPlayground />

## Spring physics (`spring`)

When you pass a `spring` object to `<SharedHero>`, it overrides `duration` and `easing` and drives the animation using native platform spring solvers:

- **iOS**: `CASpringAnimation` rendered by Core Animation's render server.
- **Android**: `SpringAnimation` from `androidx.dynamicanimation` running on the choreographer frame callback.

| Android (Spring vs Duration) | iOS (Spring vs Duration) |
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

### Spring parameters and defaults

| Parameter | Default | Description |
| --- | --- | --- |
| `damping` | `22` | Viscous damping coefficient \(c\). Lower values (`12` to `16`) produce a visible bounce; values around `22` to `28` settle briskly with minimal overshoot. |
| `stiffness` | `260` | Spring constant \(k\). Higher values (`320` to `450`) make the initial acceleration snappier. |
| `mass` | `1` | Virtual mass \(m\) of the flying object. Honored natively on iOS (`CASpringAnimation.mass`). On Android, `SpringForce` normalizes to unit mass (`1`) and converts `damping` and `stiffness` into the equivalent damping ratio \(\zeta = \frac{c}{2\sqrt{k}}\) and natural frequency. |

::: info Why springs feel more natural on touch screens
Duration-based curves always take a fixed number of milliseconds regardless of distance or interruption. Spring animations preserve velocity when interrupted mid-flight (see [Mid-air flight takeovers](/guide/events-and-lifecycle#mid-air-flight-takeovers)) and decelerate organically into the destination slot.
:::

## Duration and cubic-Bezier easing (`duration` + `easing`)

If `spring` is omitted, the flight runs as a time-based animation over `duration` milliseconds (default `320` ms) using the cubic-Bezier preset named by `easing` (default `"standard"`):

```tsx
<SharedHero
  id={`poster-${item.id}`}
  duration={380}
  easing="emphasized"
>
  <PosterDetail item={item} />
</SharedHero>
```

### Available `easing` presets

| Preset | Control points \((x_1, y_1, x_2, y_2)\) | Character |
| --- | --- | --- |
| `"standard"` (default) | `(0.2, 0.0, 0.0, 1.0)` | Material 3 standard curve: fast outgoing acceleration, long gentle deceleration. |
| `"emphasized"` | `(0.3, 0.0, 0.0, 1.0)` | Stronger initial kick than `"standard"`, suited for full-screen card expansions. |
| `"easeOut"` | `(0.0, 0.0, 0.58, 1.0)` | Starts at full speed and eases into the target. |
| `"easeInOut"` | `(0.42, 0.0, 0.58, 1.0)` | Symmetric acceleration and deceleration. |
| `"easeIn"` | `(0.42, 0.0, 1.0, 1.0)` | Starts slowly and accelerates into the end state. |
| `"linear"` | `(0.0, 0.0, 1.0, 1.0)` | Constant velocity from start to finish. |

## Motion paths: `"linear"` vs `"arc"`

By default (`motionPath="linear"`), the flying view's center moves in a straight line from the source center \((x_0, y_0)\) to the destination center \((x_1, y_1)\).

When an element moves both horizontally and vertically (for example, from a small thumbnail in the bottom-right of a grid to a hero header at the top of a detail screen), a straight diagonal line can look mechanical. Setting `motionPath="arc"` switches the center trajectory to a quadratic Bezier curve:

\[
B(t) = (1 - t)^2 P_0 + 2(1 - t)t P_{\text{ctrl}} + t^2 P_1
\]

where the control point \(P_{\text{ctrl}}\) is offset perpendicular to the chord \(P_0 \to P_1\) by **18%** of the chord length in the upward screen direction.

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

## Which side's config wins?

During a flight, two `<SharedHero>` instances exist: the source view and the destination view.

- **Forward flight (Source -> Destination)**: The **destination** view's `mode`, `duration`, `spring`, `easing`, `fadeMode`, and `motionPath` control the flight.
- **Return flight (Destination -> Source)**: The **unregistering destination** view's animation props also drive the return flight back to the source, so your forward and back transitions stay symmetric automatically without duplicating timing props on the list cell.
