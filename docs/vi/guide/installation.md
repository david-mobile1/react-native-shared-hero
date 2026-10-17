---
description: Hướng dẫn cài đặt react-native-shared-hero cho dự án React Native thuần hoặc Expo trên iOS và Android với New Architecture (Fabric).
---

# Cài đặt và Expo

`react-native-shared-hero` là một Fabric component viết bằng Swift/Objective-C++ trên iOS và Kotlin trên Android. Thư viện hỗ trợ autolinking tự động với React Native 0.76+ và các bản build Expo Dev Client.

## 1. Cài đặt package

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

Bạn không cần cấu hình thêm Babel plugin, Metro wrapper hay cài thêm peer dependency nào khác.

## 2. Thiết lập cho iOS

Chạy cài đặt CocoaPods từ thư mục gốc của dự án:

```sh
npx pod-install
# hoặc
cd ios && pod install
```

### Tương thích với `use_frameworks!`

Nếu `Podfile` của bạn bật `use_frameworks!` hoặc `use_frameworks! :linkage => :static` (rất phổ biến khi dùng chung với Firebase hoặc cấu hình `ios.useFrameworks` trong Expo), `react-native-shared-hero` đã xử lý sẵn cả hai đường dẫn header `<SharedHero/SharedHero-Swift.h>` và `"SharedHero-Swift.h"`. Bạn không cần viết thêm đoạn script sửa Podfile nào.

## 3. Thiết lập cho Android

Trên Android, bạn không cần sửa `MainApplication.kt` hay `build.gradle`. Cơ chế autolinking của Gradle sẽ tự động đăng ký `SharedHeroPackage` và chạy Codegen cho Fabric component `SharedHeroView`.

Thư viện cũng tự động kéo dependency `androidx.dynamicanimation:dynamicanimation:1.0.0` để chạy bộ giải vật lý lò xo (`SpringAnimation`).

## 4. Sử dụng với Expo (Dev Client / Prebuild)

Vì `react-native-shared-hero` chứa mã nguồn native riêng cho iOS và Android, bạn không thể chạy trong ứng dụng **Expo Go** tải từ Store. Thay vào đó, hãy tạo bản development build:

```sh
npx expo install react-native-shared-hero
npx expo run:ios
# hoặc
npx expo run:android
```

Khi build trên EAS Build, bạn không cần khai báo thêm config plugin trong `app.json` vì bước `expo prebuild` đã tự nhận diện podspec và Android module qua autolinking chuẩn của React Native.

## Kiểm tra New Architecture (Fabric)

`react-native-shared-hero` yêu cầu dự án bật New Architecture (`newArchEnabled`).

- **React Native 0.76+**: Đã bật mặc định trên cả iOS và Android.
- **Expo SDK 52+**: Đã bật mặc định.
- Nếu dự án của bạn nâng cấp từ các bản React Native cũ hơn, hãy kiểm tra `newArchEnabled=true` trong `android/gradle.properties` và đảm bảo không tắt `RCT_NEW_ARCH_ENABLED` khi chạy `pod install`.
