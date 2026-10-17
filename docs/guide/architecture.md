---
description: "Deep dive into the native iOS (Swift / OverlayHost UIWindow) and Android (Kotlin / ViewGroupOverlay) architecture of react-native-shared-hero on React Native Fabric."
---

# Architecture

`react-native-shared-hero` is built specifically for React Native's New Architecture (Fabric) with a thin TypeScript wrapper and a symmetrical native core on iOS and Android.

## High-level data flow

```
┌────────────────────────────────────────────────────────────────────────┐
│ React Native JS (Fabric)                                               │
│   <SharedHero id="photo-1" namespace="default" mode="morph" />         │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Codegen C++ ShadowNode / Props
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Native Endpoint View                                                   │
│   iOS:     SharedHeroView.mm (ObjC++) -> SharedHeroViewImpl.swift      │
│   Android: SharedHeroViewManager.kt   -> SharedHeroView.kt             │
│                                                                        │
│   • Tracks heroId, heroNamespace, mode, timing, borderRadius, bgColor  │
│   • Captures HeroSnapshot + live window rect when layout settles       │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ register / notifyLayout / unregister
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Singleton Registry & Match Engine                                      │
│   iOS:     HeroRegistry.shared (HeroRegistry.swift)                    │
│   Android: HeroRegistry        (HeroRegistry.kt)                       │
│                                                                        │
│   • live[key]: ordered list of mounted views per namespace::id         │
│   • recentlyUnregistered[key]: parked source snapshots (~300 ms window)│
│   • lastKnownSnapshots: bounded LRU fallback cache                     │
│   • lastFlightSourceFrame: push/pop symmetry frame hints               │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Launches / interrupts flights
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Flight Engine & Window-Level Overlay                                   │
│   iOS:     FlightEngine.swift + OverlayHost.swift (UIWindow .alert + 1)│
│   Android: FlightEngine.kt    + OverlayHost.kt    (ViewGroupOverlay)   │
└────────────────────────────────────────────────────────────────────────┘
```

## Pairing paths in `HeroRegistry`

Unlike navigation-coupled libraries that require a transition hook from the router, `HeroRegistry` pairs endpoints purely from native view lifecycle signals using two trigger paths:

### Path 1: Twin appears while another is still live (Stack push, Modal, Sheet)

1. Screen A is mounted. `live["default::photo-1"]` contains `[viewA]`.
2. Screen B mounts `viewB` with the same key. `register(viewB)` immediately snapshots `viewA` (recording its pre-navigation window frame before the stack push slides it) and queues a pending flight into `viewB`.
3. Once `viewB` finishes its Fabric layout pass (`notifyLayout`) and any zoom-in destination `<Image>` has decoded (up to a bounded ~120 ms wait), `HeroRegistry` hands both snapshots and geometries to `FlightEngine`.

### Path 2: Unregister / Return flight & In-place state swap

1. **Back pop / Modal dismiss**: When `viewB` detaches from its window while `viewA` is still live (or re-attaching underneath), `unregister(viewB)` captures `viewB`'s current live window frame (including any drag-to-dismiss transform) and flies back to `viewA`'s resting frame (`destFrameHint`).
2. **In-place toggle**: When `viewA` unmounts and `live[key]` becomes empty, `unregister(viewA)` parks `viewA`'s snapshot in `recentlyUnregistered[key]` (with a `300 ms` matching window and `sourceViewId` churn guard). When `viewB` mounts with the same key on the next tick, `runMatchPass` pairs the parked `PendingSource` with `viewB` and runs the flight.

## Platform implementation details

### iOS (`ios/*.swift` + `SharedHeroView.mm`)

- **`OverlayHost.swift`**: Lazily creates a transparent, non-interactive `UIWindow` (`windowLevel = .alert + 1`, `isUserInteractionEnabled = false`) backed by `OverlayRootViewController`. The window stays visible once prepared so flights never suffer a 1-frame render-server creation flash, and defers status bar / orientation queries to the app's real root window.
- **`FlightEngine.swift`**: Drives time-based flights with `UIViewPropertyAnimator` (`UICubicTimingParameters`) and spring flights with `UISpringTimingParameters(mass:stiffness:damping:initialVelocity:)`. Supports mid-air takeover (`canTakeOver` / `interrupt`) by reading `flightView.layer.presentation()` geometry.
- **`InteractiveStackPop.swift` & `InteractiveModalReturn.swift`**: Attach a `CADisplayLink` observer to `UINavigationController`'s `interactivePopGestureRecognizer` and UIKit modal/sheet swipe dismissals so the overlay tracks finger progress 1:1 and accounts for underlying list parallax.

### Android (`android/src/main/java/com/sharedhero/*.kt`)

- **`OverlayHost.kt`**: Resolves `ViewGroupOverlay` from `view.rootView` (`DecorView`). Because it inspects the destination view's attached `rootView` first and falls back to `activity.window.decorView.overlay`, flights work both inside the main Activity window and across React Native `<Modal>` Dialog windows.
- **`FlightEngine.kt`**: Renders a custom `FrameLayout` container in the `ViewGroupOverlay` with a dynamic `ViewOutlineProvider` (`outline.setRoundRect(0, 0, w, h, currentRadius)`) for `morph` mode. Runs cubic-Bezier flights via `Choreographer` + `PathInterpolator` and spring flights via `androidx.dynamicanimation.animation.SpringAnimation` (`FloatValueHolder(0f..1000f)`).
- **`HeroRegistry.kt` & `HeroSnapshot.kt`**: Maintain a bounded `lastKnownSnapshots` LRU cache so native `Bitmap` allocations stay strictly bounded even after opening hundreds of detail screens.
