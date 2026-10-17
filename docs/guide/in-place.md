---
description: "Animate shared elements between two states on the same screen without a router using useSharedHero() and distinct React keys."
---

# In-place transitions (`useSharedHero`)

Shared element transitions are not limited to screen-to-screen navigation. You often want to expand a compact element into a larger layout **on the same screen** when local React state flips:

- Expanding a floating mini-player bar into a full-screen music player.
- Opening an inline thumbnail into an expanded card or lightbox on the same screen.
- Morphing a compact pill into a multi-line detail card.

## How in-place pairing works

When you conditionally render two `<SharedHero>` branches with the same `id` (and distinct React `key` props) on the same screen:

```tsx
{active ? (
  <SharedHero key="player-expanded" id="player-art" namespace="inplace">
    <LargeArtwork />
  </SharedHero>
) : (
  <SharedHero key="player-compact" id="player-art" namespace="inplace">
    <MiniArtwork />
  </SharedHero>
)}
```

Why is the distinct `key` important?

1. Giving the two branches different React `key` props (`key="player-expanded"` vs `key="player-compact"`) tells React to **unmount** the compact `<SharedHero>` and **mount** a new expanded `<SharedHero>` within the same commit, rather than reusing the same native view instance and merely mutating its `style`.
2. When the compact view unmounts, `HeroRegistry` parks its pre-unmount snapshot and window frame in `recentlyUnregistered` for the current matching window.
3. In the same tick, the newly mounted expanded view registers and lays out. `HeroRegistry` pairs the parked source snapshot with the newly mounted destination view and runs the flight in the window overlay.

::: tip In-place size changes on the same instance
On iOS, `HeroRegistry` also detects when a single mounted `SharedHeroViewImpl` resizes in place during a commit (`notifyLayout` size-change path), but using distinct `key` props across two branches is the clearest and most cross-platform pattern whenever the collapsed and expanded subtrees differ.
:::

## Using the `useSharedHero` state hook

`useSharedHero(initial = false)` is a lightweight state helper hook for in-place transitions. It returns `{ active, start, end, toggle }` with stable memoized callbacks:

```tsx
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SharedHero, useSharedHero } from 'react-native-shared-hero';

export function InPlacePhotoToggle({ photo }) {
  const { active, toggle } = useSharedHero(false);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Tap the image to toggle in-place</Text>

      <Pressable onPress={toggle}>
        {active ? (
          <SharedHero
            key="hero-inplace-large"
            id="hero-inplace"
            namespace="inplace"
            mode="morph"
            duration={420}
            style={styles.large}
          >
            <Image source={{ uri: photo.uri }} style={styles.fill} />
          </SharedHero>
        ) : (
          <SharedHero
            key="hero-inplace-small"
            id="hero-inplace"
            namespace="inplace"
            mode="morph"
            duration={420}
            style={styles.small}
          >
            <Image source={{ uri: photo.uri }} style={styles.fill} />
          </SharedHero>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 32 },
  heading: { fontSize: 18, fontWeight: '700', marginBottom: 24 },
  small: { width: 120, height: 120, borderRadius: 12, overflow: 'hidden' },
  large: { width: 320, height: 320, borderRadius: 24, overflow: 'hidden' },
  fill: { width: '100%', height: '100%' },
});
```

## API summary of `useSharedHero`

| Property | Type | Description |
| --- | --- | --- |
| `active` | `boolean` | Current state (`false` when collapsed, `true` when expanded). |
| `start` | `() => void` | Sets `active` to `true`. |
| `end` | `() => void` | Sets `active` to `false`. |
| `toggle` | `() => void` | Flips `active` between `false` and `true`. |
