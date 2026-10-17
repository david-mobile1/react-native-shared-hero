---
description: "Troubleshoot common issues with shared element transitions in React Native: missing flights, corner radius morphing, Android fade animations, and blurry images."
---

# Troubleshooting

If a shared element transition is not triggering or looks slightly off, check the solutions below.

## The transition does not run at all

1. **Check that both `id` and `namespace` match**: Add an `onTransitionStart` callback or log both `id` values. Both endpoints must share the same `id` and `namespace` (which defaults to `"default"`).
2. **Verify `enabled` is not `false`**: Both the source and destination `<SharedHero>` must have `enabled={true}` (the default).
3. **For in-place toggles on the same screen, use distinct React `key` props**: When swapping two `<SharedHero id="x">` branches via React state on the same screen, give the two branches different `key` props (`key="collapsed"` and `key="expanded"`) so React unmounts the source and mounts the destination instead of reusing the same view instance.
4. **Ensure both views have non-zero layout dimensions**: If a `<SharedHero>` wraps an `<Image>` with no explicit `width`/`height` or `aspectRatio`, its initial layout size may be `0x0` when the screen mounts. Always give the `<SharedHero>` or its child explicit layout dimensions.
5. **Confirm New Architecture (Fabric) is enabled**: `react-native-shared-hero` is a Fabric-only component.

## Return animation cuts off early on Android Stack Navigator

**Symptom**: Navigating forward works smoothly, but pressing Back on Android makes the destination screen disappear halfway through the return flight.

**Cause**: Setting `animation: 'fade'` in `@react-navigation/native-stack` on Android uses a short native XML fade animation (~150 ms) that detaches the outgoing Fragment view hierarchy before a 320 ms return flight completes.

**Fix**: Only apply `animation: 'fade'` on iOS, and keep the default stack animation on Android:

```tsx
const detailOptions = Platform.select({
  ios: { animation: 'fade' as const },
  default: {},
});
```

## `borderRadius` or `backgroundColor` does not morph

**Symptom**: You set `mode="morph"`, but the corners jump at the end of the flight instead of rounding progressively.

**Cause**: `borderRadius` and `backgroundColor` were placed on an inner child `<View>` or `<Image>` where they cannot be inspected or overridden cleanly during snapshot capture.

**Fix**: Place `borderRadius`, `backgroundColor`, and `overflow: 'hidden'` directly on `<SharedHero style={...}>`:

```tsx
<SharedHero
  id={`card-${item.id}`}
  mode="morph"
  style={{ borderRadius: 20, backgroundColor: '#1E293B', overflow: 'hidden' }}
>
  <Image source={{ uri: item.url }} style={{ width: '100%', height: 240 }} />
</SharedHero>
```

## Destination image flashes or looks blurry during zoom-in

**Symptom**: Expanding a tiny thumbnail into a full-screen photo looks blurry during flight and then sharpens when the flight lands.

**Cause**: If the destination screen fetches a completely different remote URL that is not yet in disk/memory cache and takes longer than `~120 ms` to download over the network, `HeroRegistry` starts the flight using the source thumbnail bitmap rather than freezing your navigation.

**Fix**:
- Prefetch the full-resolution URL (`Image.prefetch(item.fullUrl)`) when the card enters the viewport or on `onPressIn`.
- Or use the same cached image URL on both endpoints when the resolution is already sufficient for the detail header.

## CocoaPods build error with `use_frameworks!`

**Symptom**: Xcode reports `'SharedHero/SharedHero-Swift.h' file not found` in an older release.

**Fix**: Upgrade to the latest version of `react-native-shared-hero`, which includes a conditional `__has_include(<SharedHero/SharedHero-Swift.h>)` fallback in `ios/SharedHeroView.mm` that supports both static libraries and `use_frameworks!`.
