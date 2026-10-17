---
description: "Overview of react-native-shared-hero: why window-level shared element transitions solve modal, sheet, and router limitations on React Native Fabric."
---

# What is it?

`react-native-shared-hero` is a native shared element (hero) transition library for React Native's New Architecture (Fabric) on iOS and Android.

You wrap a view on screen A and a view on screen B in `<SharedHero id="...">`. When screen B mounts (or screen A unmounts), the native coordinator captures both views, hides the real endpoints while the transition is in flight, and animates a clone across a window-level overlay at the display's native refresh rate (60 fps or 120 fps ProMotion).

## Showcase

| Android | iOS |
| --- | --- |
| <video src="https://github.com/user-attachments/assets/35170436-3921-43ad-ac1c-face5a00c7ec" controls loop muted playsinline></video> | <video src="https://github.com/user-attachments/assets/3aee83c7-190e-41fa-87b2-9a8ada59a481" controls loop muted playsinline></video> |

## Why another shared element library?

Existing shared element solutions in React Native run into three recurring pain points on the New Architecture:

<div class="comparison-grid">
  <div class="comparison-card">
    <h3>1. Navigator lock-in</h3>
    <p>
      Many implementations hook directly into <code>react-native-screens</code> stack transitions. That breaks as soon as you present a native modal, a transparent modal, a form sheet, a core React Native <code>&lt;Modal&gt;</code>, or an in-place card expansion without navigation.
    </p>
  </div>
  <div class="comparison-card">
    <h3>2. View-hierarchy clipping</h3>
    <p>
      When a flying clone is reparented inside a screen container or navigation view controller, parent <code>overflow: 'hidden'</code> bounds or sheet presentation frames clip the element mid-flight.
    </p>
  </div>
  <div class="comparison-card">
    <h3>3. Thumbnail blur on zoom-in</h3>
    <p>
      Scaling a small list thumbnail bitmap up to a full-width detail header looks blurry. <code>react-native-shared-hero</code> detects image-only heroes and swaps in the destination's full-resolution image as soon as it finishes decoding.
    </p>
  </div>
</div>

`react-native-shared-hero` takes a different architectural approach:

- **Window-level overlay**: On iOS, flights render inside a transparent, non-interactive `UIWindow` (`windowLevel = .alert + 1`, `isUserInteractionEnabled = false`) that sits above every `UIViewController`, modal, and sheet. On Android, flights render in the target window's `DecorView.overlay` (`ViewGroupOverlay`). Nothing in your React tree can clip the flying element.
- **Zero router coupling**: Pairing is driven by native view mount, layout, and unmount lifecycles within a short matching window. It works identically with React Navigation, Expo Router, custom state toggles, or React Native's built-in `<Modal>`.
- **Zero idle cost**: When no transition is running, the overlay holds zero child views (`backgroundColor = .clear`, `isUserInteractionEnabled = false`), fallback snapshot caches are strictly bounded with an LRU policy, and views skip redundant offscreen renders when nothing has changed.

## Feature matrix

| Capability | iOS | Android | Notes |
| --- | --- | --- | --- |
| Fabric (New Architecture) | Yes | Yes | Built as a Fabric `ViewManager` / `RCTViewComponentView` |
| `mode="snapshot"` | Yes | Yes | Fast bitmap capture, translate + scale + fade |
| `mode="morph"` | Yes | Yes | Interpolates bounds, `borderRadius`, `backgroundColor`, and clip shape |
| `motionPath="linear"` / `"arc"` | Yes | Yes | Straight line or Material quadratic Bezier arc |
| Duration + cubic-Bezier `easing` | Yes | Yes | `linear`, `easeIn`, `easeOut`, `easeInOut`, `standard`, `emphasized` |
| Native `spring` physics | Yes | Yes | `CASpringAnimation` on iOS, `SpringAnimation` on Android |
| Fade curves (`fadeMode`) | Yes | Yes | `cross`, `in`, `out`, `through` |
| High-res destination image upgrade | Yes | Yes | Sharp zoom-in when both endpoints wrap a single `<Image>` |
| Text reflow protection | Yes | Yes | Scales snapshots proportionally instead of cropping re-wrapped glyphs |
| Interactive iOS swipe-back | Yes | N/A | Automatically tracks `interactivePopGestureRecognizer` progress |
| Mid-flight takeover | Yes | Yes | Interrupts an active flight smoothly from its live mid-air rect |
| `FlatList` / `FlashList` recycling | Yes | Yes | Cleans up stale `id` buckets when cells recycle |

## Requirements

- **React Native**: `0.76+` with the New Architecture (Fabric) enabled (tested through React Native `0.82`).
- **iOS**: iOS `14.0+` (works with both static linkage and `use_frameworks!`).
- **Android**: `minSdkVersion 24+`, Kotlin + AndroidX `dynamicanimation`.
- **Expo**: Works in Expo custom development builds (`npx expo run:ios` / `npx expo run:android` / EAS Build). Not available in Expo Go because it includes custom native code.
