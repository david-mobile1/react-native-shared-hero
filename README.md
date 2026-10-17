# react-native-shared-hero

Window-level native shared element transitions for React Native on the New Architecture (Fabric) for iOS and Android.

[**Documentation & Interactive Playground**](https://maitrungduc1410.github.io/react-native-shared-hero/) · [**Tiếng Việt**](https://maitrungduc1410.github.io/react-native-shared-hero/vi/) · [**简体中文**](https://maitrungduc1410.github.io/react-native-shared-hero/zh/) · [**API Reference**](https://maitrungduc1410.github.io/react-native-shared-hero/api/)

## Showcase

| Android | iOS |
| --- | --- |
| <video src="https://github.com/user-attachments/assets/35170436-3921-43ad-ac1c-face5a00c7ec" controls loop muted></video> | <video src="https://github.com/user-attachments/assets/3aee83c7-190e-41fa-87b2-9a8ada59a481" controls loop muted></video> |

## Highlights

- **Window-level overlay**: Renders transitions in a passthrough `UIWindow` on iOS and `decorView.overlay` on Android, sitting above every stack, modal, transparent modal, form sheet, and tab bar without parent clipping.
- **Router-agnostic**: Works with React Navigation, Expo Router, `react-native-screens`, React Native core `<Modal>`, or plain React state toggles via `useSharedHero()`.
- **Snapshot & Material morph modes**: Choose fast bitmap cross-fades (`mode="snapshot"`) or progressively interpolate bounds, `borderRadius`, and `backgroundColor` (`mode="morph"`).
- **Native springs & curved motion paths**: Drive flights with `CASpringAnimation` (iOS) and `SpringAnimation` (Android), or cubic-Bezier timing presets along `"linear"` or `"arc"` trajectories.
- **Interactive gestures & virtualized lists**: Tracks iOS edge swipe-back (`interactivePopGestureRecognizer`), hands off from custom pan-to-dismiss transforms, upgrades to high-res destination images on zoom-in, and cleans up recycled `FlatList` / `FlashList` cells.

## Installation

```sh
yarn add react-native-shared-hero
# or
npm install react-native-shared-hero
```

For iOS, install pods:

```sh
npx pod-install
```

> Requires React Native **0.76+** with the New Architecture (Fabric) enabled (iOS 14+, Android `minSdkVersion` 24+). For Expo, use a custom development build (`npx expo run:ios` / `npx expo run:android`).

## Quick Start

Wrap the source view and the destination view with `<SharedHero>` using the same `id`:

```tsx
import { Image, Pressable } from 'react-native';
import { SharedHero } from 'react-native-shared-hero';

// 1. Source screen
export function ThumbnailCard({ item, onPress }) {
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

// 2. Destination screen
export function DetailScreen({ item }) {
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

## Documentation

Full guides, interactive transition playground, architecture deep dive, and TypeDoc API reference are available on the documentation site:

- **English**: [https://maitrungduc1410.github.io/react-native-shared-hero/](https://maitrungduc1410.github.io/react-native-shared-hero/)
- **Tiếng Việt**: [https://maitrungduc1410.github.io/react-native-shared-hero/vi/](https://maitrungduc1410.github.io/react-native-shared-hero/vi/)
- **简体中文**: [https://maitrungduc1410.github.io/react-native-shared-hero/zh/](https://maitrungduc1410.github.io/react-native-shared-hero/zh/)
- **API Reference**: [https://maitrungduc1410.github.io/react-native-shared-hero/api/](https://maitrungduc1410.github.io/react-native-shared-hero/api/)

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT © [Duc Mai](https://github.com/maitrungduc1410)
