---
description: 在开启新架构 (Fabric) 的裸 React Native 项目或 Expo 项目中安装和配置 react-native-shared-hero。
---

# 安装与 Expo

`react-native-shared-hero` 是一个原生 Fabric 组件（iOS 端使用 Swift/Objective-C++，Android 端使用 Kotlin），在 React Native 0.76+ 和 Expo 自定义开发构建中支持开箱即用的自动链接（Autolinking）。

## 1. 安装依赖包

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

核心库无需额外配置 Babel 插件、Metro 包装器或其他手势库依赖。

## 2. iOS 配置

在项目根目录下安装 CocoaPods 依赖：

```sh
npx pod-install
# 或者
cd ios && pod install
```

### `use_frameworks!` 兼容性

如果你的 `Podfile` 启用了 `use_frameworks!` 或 `use_frameworks! :linkage => :static`（例如集成了 Firebase 或在 Expo 中配置了 `ios.useFrameworks`），`react-native-shared-hero` 已在内部自动兼容 `<SharedHero/SharedHero-Swift.h>` 与 `"SharedHero-Swift.h"` 两种头文件查找路径，无需编写任何 Podfile 补丁。

## 3. Android 配置

Android 端无需手动修改 `MainApplication.kt` 或 `build.gradle`。React Native 的 Gradle 自动链接机制会自动注册 `SharedHeroPackage` 并为 `SharedHeroView` 生成 Fabric Codegen 绑定代码。

库内部会自动引入 `androidx.dynamicanimation:dynamicanimation:1.0.0` 以驱动原生弹簧物理动画（`SpringAnimation`）。

## 4. Expo 配置（Dev Client / Prebuild）

由于 `react-native-shared-hero` 包含自定义 iOS 与 Android 原生代码，无法在应用商店下载的 **Expo Go** 中直接运行。请使用 Expo 自定义开发构建：

```sh
npx expo install react-native-shared-hero
npx expo run:ios
# 或者
npx expo run:android
```

使用 EAS Build 构建时无需配置额外的 config plugin，`expo prebuild` 会通过标准 autolinking 自动识别 podspec 与 Android 模块。

## 确认已开启新架构（Fabric）

`react-native-shared-hero` 要求启用新架构（`newArchEnabled`）：

- **React Native 0.76+**：iOS 与 Android 默认均已启用。
- **Expo SDK 52+**：默认已启用。
- 如果是从旧版本升级的项目，请确认 `android/gradle.properties` 中设置了 `newArchEnabled=true`，且执行 `pod install` 时未禁用 `RCT_NEW_ARCH_ENABLED`。
