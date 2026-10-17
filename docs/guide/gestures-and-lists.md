---
description: Support interactive iOS swipe-back, custom drag-to-dismiss gestures, and virtualized FlatList / FlashList cell recycling.
---

# Interactive gestures & FlatList

Real-world feeds combine scrollable, virtualized lists (`FlatList` or `FlashList`) with gesture-driven dismissals (iOS edge swipe-back or vertical pan-to-dismiss). `react-native-shared-hero` includes dedicated support for both.

## 1. Interactive iOS edge swipe-back

On iOS, when a user drags from the left screen edge to pop a `UINavigationController` screen (`interactivePopGestureRecognizer`):

1. As soon as the pop begins, the native coordinator detects the active `UIGestureRecognizer` and `UINavigationController.topViewController?.transitionCoordinator`.
2. Instead of immediately running an autonomous timer animation, the coordinator enters **interactive driver mode**.
3. As the user's finger drags across the screen, the flying clone's position, scale, corner radius, and cross-fade scrub 1:1 with the gesture's translation percentage.
4. When the user lifts their finger:
   - **Commit (pop succeeds)**: The clone animates from the release point to the source cell's rect over the remaining duration (`~220 ms`).
   - **Cancel (finger released near the left edge)**: The clone animates smoothly back to the detail screen's rect and un-hides the detail view cleanly.

You do not need any extra configuration to enable interactive swipe-back on iOS; it activates automatically whenever a back transition is triggered by a native interactive pop gesture.

## 2. Custom pan-to-dismiss gesture handoff

Many media apps let users drag a photo or card vertically on the detail screen to dismiss it (like Instagram or Apple Photos).

When the user drags a `<SharedHero>` inside a `PanResponder` or `react-native-gesture-handler` pan gesture using `transform: [{ translateX }, { translateY }, { scale }]`:

| Android | iOS |
| --- | --- |
| <video src="https://github.com/user-attachments/assets/00ddc9a8-edac-4734-b229-baa12f0f4294" controls loop muted playsinline></video> | <video src="https://github.com/user-attachments/assets/0ffcaae6-be21-466a-9646-d9dc0a97e9b5" controls loop muted playsinline></video> |

```tsx
<Animated.View
  {...panResponder.panHandlers}
  style={{
    transform: [
      { translateX: dragX },
      { translateY: dragY },
      { scale: dragScale },
    ],
  }}
>
  <SharedHero
    id={`photo-${item.id}`}
    mode="morph"
    spring={{ damping: 24, stiffness: 260, mass: 1 }}
    style={{ borderRadius: 20, overflow: 'hidden' }}
  >
    <Image source={{ uri: item.fullUrl }} style={styles.heroImage} />
  </SharedHero>
</Animated.View>
```

When the user crosses your dismiss threshold and you call `navigation.goBack()`:

1. Just before unmounting, the native `SharedHeroView` measures its **live transformed window frame** (the exact position and scaled size where the user's finger released it) rather than its static initial layout rect.
2. The return flight starts seamlessly from that finger-release rect and flies back into the list cell.

## 3. Virtualized lists (`FlatList` & `FlashList`)

Virtualized lists recycle native component views as the user scrolls. Without special handling, changing a recycled cell's `id` prop from `"photo-1"` to `"photo-19"` could leave `"photo-1"` pointing to a cell that now displays item 19.

| Android | iOS |
| --- | --- |
| <video src="https://github.com/user-attachments/assets/e575ddb3-bc1d-4ba0-b692-46342e983ce8" controls loop muted playsinline></video> | <video src="https://github.com/user-attachments/assets/c8b5e622-9479-480f-93aa-9da9fa00558a" controls loop muted playsinline></video> |

`react-native-shared-hero` protects virtualized lists at the native level:

- **Previous-ID cleanup on prop change**: When `heroId` changes on a recycled native view, `HeroRegistry` removes the view from the old `id` bucket and clears its stashed snapshot before registering it under the new `id`.
- **Bounded LRU snapshot cache**: Fallback snapshots in `HeroRegistry.lastKnownSnapshots` are strictly bounded by an LRU eviction policy (`SnapshotLRU`). As the user scrolls through hundreds of items, oldest bitmaps are evicted automatically so memory usage stays flat.
- **Dirty-checked snapshot refresh**: The view only refreshes its stashed snapshot when its bounds or subview count actually change, avoiding redundant bitmap renders during scroll momentum.

### Best practices for `FlatList`

1. **Always provide a stable `keyExtractor`**: Use your item's unique ID (`keyExtractor={(item) => item.id}`), never the array index.
2. **Keep the tapped item mounted on return**: If the user scrolls inside the detail screen (for example, swiping horizontally through a photo pager) before popping back, scroll your `FlatList` to the active index (`flatListRef.current?.scrollToIndex({ index, animated: false })`) so the source `<SharedHero>` is mounted in the window when the detail screen pops.
3. **Graceful fallback when scrolled off-screen**: If the source `<SharedHero>` has zero size or is no longer mounted in the window when popping, `react-native-shared-hero` safely skips the flight and reveals the screen normally without crashing or leaving views hidden.
