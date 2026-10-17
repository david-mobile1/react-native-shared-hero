---
layout: home
title: React Native Shared Hero
titleTemplate: Native shared element transitions for React Native (Fabric)
description: "Window-level native shared element transitions for React Native on the New Architecture (Fabric): router-agnostic, snapshot and morph modes, spring physics, and interactive gestures on iOS and Android."

hero:
  name: React Native Shared Hero
  text: Window-level shared element transitions for Fabric.
  tagline: Wrap any view in <SharedHero id="..."> on two screens, or across two states on the same screen. Flights run at 60/120 fps in a native window overlay above every stack, modal, sheet, and tab navigator.
  actions:
    - theme: brand
      text: Get started
      link: /guide/
    - theme: alt
      text: Interactive playground
      link: /guide/timing-and-motion#interactive-playground
    - theme: alt
      text: API reference
      link: /api/

features:
  - title: Window-level overlay
    details: Flights run inside a dedicated passthrough UIWindow on iOS and the activity DecorView.overlay on Android. Because the overlay sits above every navigation container, transitions work across stacks, modals, transparent modals, form sheets, and tabs.
  - title: Router-agnostic
    details: Works with React Navigation, Expo Router, react-native-screens, React Native core <Modal>, or plain React state swaps with useSharedHero(). No custom navigator wrappers or transition providers required.
  - title: Snapshot & Material morph
    details: Use snapshot mode for fast bitmap clones with cross-fade, or switch to morph mode to smoothly interpolate bounds, borderRadius, backgroundColor, and container clip shapes.
  - title: Native springs & curved arcs
    details: Drive transitions with CASpringAnimation on iOS and AndroidX DynamicAnimation SpringAnimation on Android, or pick Material cubic-Bezier presets along linear or curved arc trajectories.
  - title: Interactive swipe-back & drag-to-dismiss
    details: Tracks UINavigationController interactive pop gestures on iOS automatically, and supports pan-to-dismiss gesture handoffs from any live on-screen position.
  - title: Built for Fabric & FlatList recycling
    details: Purpose-built for React Native's New Architecture (0.76+ through 0.82+). Handles recycled cells in virtualized lists, mid-air flight takeovers, and high-resolution destination image upgrades.
---

<div class="home-section vp-doc">

## Two components, one matching `id`

Give two `<SharedHero>` views the same `id` on your list screen and detail screen. When you navigate forward or pop back, the native coordinator measures both views in window coordinates and flies the element between them.

```tsx
import { Image, Pressable } from 'react-native';
import { SharedHero } from 'react-native-shared-hero';

// 1. Source screen (for example, a feed or grid cell)
export function FeedCard({ item, onPress }) {
  return (
    <Pressable onPress={onPress}>
      <SharedHero
        id={`photo-${item.id}`}
        mode="morph"
        style={{ borderRadius: 12, overflow: 'hidden' }}
      >
        <Image source={{ uri: item.thumbUrl }} style={{ width: 140, height: 180 }} />
      </SharedHero>
    </Pressable>
  );
}

// 2. Destination screen (stack push, modal, sheet, or tab detail)
export function PhotoDetailScreen({ item }) {
  return (
    <SharedHero
      id={`photo-${item.id}`}
      mode="morph"
      motionPath="arc"
      spring={{ damping: 22, stiffness: 260, mass: 1 }}
      style={{ borderRadius: 24, overflow: 'hidden' }}
    >
      <Image source={{ uri: item.fullUrl }} style={{ width: '100%', height: 420 }} />
    </SharedHero>
  );
}
```

## Live transition playground

Try changing the transition mode, motion path, spring physics, and corner radii below to preview how `react-native-shared-hero` interpolates your view and generates the corresponding JSX props:

<TransitionPlayground />

</div>
