---
description: How to install react-native-shared-hero in a bare React Native or Expo project on iOS and Android with the New Architecture (Fabric).
---

# Installation & Expo

`react-native-shared-hero` is a native Fabric component written in Swift/Objective-C++ on iOS and Kotlin on Android. It autolinks out of the box with React Native 0.76+ and Expo custom development builds.

## 1. Install the package

::: code-group

```sh [yarn]
yarn add react-native-shared-hero
```

```sh [npm]
npm install react-native-shared-hero
```

```sh [pnpm]
pnpm add react-native-shared-hero
```

```sh [bun]
bun add react-native-shared-hero
```

:::

No extra Babel plugin, Metro wrapper, or gesture-handler peer dependency is required for the core library.

## 2. iOS setup

Install CocoaPods dependencies from your project root:

```sh
npx pod-install
# or
cd ios && pod install
```

### `use_frameworks!` compatibility

If your Podfile uses `use_frameworks!` or `use_frameworks! :linkage => :static` (common with Firebase or Expo `ios.useFrameworks`), `react-native-shared-hero` handles both `<SharedHero/SharedHero-Swift.h>` and `"SharedHero-Swift.h"` header lookups automatically. No Podfile workarounds are needed.

## 3. Android setup

No manual changes to `MainApplication.kt` or `build.gradle` are needed. React Native's Gradle autolinking registers `SharedHeroPackage` and runs Codegen for the `SharedHeroView` Fabric component automatically.

The library pulls in `androidx.dynamicanimation:dynamicanimation:1.0.0` automatically to power native spring physics (`SpringAnimation`).

## 4. Expo setup (Dev Client / Prebuild)

Because `react-native-shared-hero` contains custom native iOS and Android code, it is not included in the prebuilt **Expo Go** client. Use an Expo development build instead:

```sh
npx expo install react-native-shared-hero
npx expo run:ios
# or
npx expo run:android
```

If you build on EAS, no config plugin is required. Standard autolinking picks up the podspec and Android module during `expo prebuild`.

## Verifying New Architecture (Fabric)

`react-native-shared-hero` requires the New Architecture (`newArchEnabled`).

- **React Native 0.76+**: Enabled by default on both iOS and Android.
- **Expo SDK 52+**: Enabled by default.
- If you are upgrading an older project, verify that `newArchEnabled=true` is set in `android/gradle.properties` and `RCT_NEW_ARCH_ENABLED=1` is active when running `pod install`.
