---
description: Build your first shared element transition in React Native with SharedHero in under 5 minutes.
---

# Quick start

A shared element transition only needs two `<SharedHero>` components that render the same `id` string on two screens (or across two conditional branches).

## Basic image transition (List to Detail)

Suppose you have a photo grid and a detail screen inside a native stack navigator (`@react-navigation/native-stack` or `expo-router`).

| Android | iOS |
| --- | --- |
| <video src="https://github.com/user-attachments/assets/8902a96b-59cf-4893-a0fd-a5b4316b4abd" controls loop muted playsinline></video> | <video src="https://github.com/user-attachments/assets/65177700-0503-4ad5-9f7c-912f55cf6e45" controls loop muted playsinline></video> |

### Step 1: Wrap the source element

On the list screen, wrap the thumbnail in `<SharedHero>` and give it a unique, deterministic `id` tied to the item's data ID:

```tsx
import { FlatList, Image, Pressable, StyleSheet } from 'react-native';
import { SharedHero } from 'react-native-shared-hero';

export function PhotoGridScreen({ navigation, items }) {
  return (
    <FlatList
      data={items}
      numColumns={2}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => navigation.navigate('PhotoDetail', { item })}
          style={styles.cell}
        >
          <SharedHero id={`photo-${item.id}`} style={styles.thumbHero}>
            <Image source={{ uri: item.thumbUrl }} style={styles.thumbImage} />
          </SharedHero>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  cell: { flex: 1, margin: 8 },
  thumbHero: { borderRadius: 12, overflow: 'hidden' },
  thumbImage: { width: '100%', aspectRatio: 3 / 4 },
});
```

### Step 2: Wrap the destination element

On the detail screen, wrap the header image in `<SharedHero>` with the exact same `id`:

```tsx
import { Image, ScrollView, StyleSheet, Text } from 'react-native';
import { SharedHero } from 'react-native-shared-hero';

export function PhotoDetailScreen({ route }) {
  const { item } = route.params;

  return (
    <ScrollView style={styles.container}>
      <SharedHero
        id={`photo-${item.id}`}
        mode="morph"
        style={styles.detailHero}
      >
        <Image source={{ uri: item.fullUrl }} style={styles.detailImage} />
      </SharedHero>
      <Text style={styles.title}>{item.title}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F19' },
  detailHero: { borderRadius: 0, overflow: 'hidden' },
  detailImage: { width: '100%', height: 420 },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '700', padding: 20 },
});
```

### Step 3: Recommended screen options for Stack navigators

On iOS, the default `createNativeStackNavigator` push animation slides the new screen in from the right, which visually competes with the hero flying upward. Setting `animation: 'fade'` on iOS lets the screen cross-fade gently while the shared element takes center stage.

On Android, `react-native-screens` default animation (`scale` + brief alpha) is smoother than `animation: 'fade'` because Android's XML fade animation triggers fragment removal right in the middle of a 350 ms flight.

```tsx
import { Platform } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

export const heroScreenOptions: NativeStackNavigationOptions = Platform.select({
  ios: {
    animation: 'fade',
    headerTransparent: true,
  },
  default: {
    headerTransparent: true,
  },
})!;
```

## What happens when you navigate?

1. **Forward push**: When `PhotoDetailScreen` mounts, its `<SharedHero id="photo-1">` registers with the native coordinator and lays out. The coordinator finds the still-mounted `<SharedHero id="photo-1">` on `PhotoGridScreen`, captures both views, hides the real source and destination views (`opacity = 0`), and flies the clone from the thumbnail's window rect to the detail header's window rect.
2. **High-res image handoff**: If `item.thumbUrl` is a small thumbnail and `item.fullUrl` is a higher-resolution image, the coordinator waits briefly (up to ~120 ms) for the destination `UIImageView` / `ImageView` to decode its bitmap and flies the sharp destination image instead of scaling up the low-res thumbnail.
3. **Back pop / swipe-back**: When you pop `PhotoDetailScreen` or drag from the left edge on iOS, the detail hero unregisters (or tracks the interactive pop gesture) and flies smoothly back into its slot in `PhotoGridScreen`.
