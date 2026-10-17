---
layout: home
title: React Native Shared Hero
titleTemplate: Shared element transition ở tầng Window cho React Native (Fabric)
description: "Thư viện shared element transition native chạy trên tầng Window cho React Native New Architecture (Fabric): không phụ thuộc router, hỗ trợ snapshot và morph, vật lý spring 60/120 fps trên iOS và Android."

hero:
  name: React Native Shared Hero
  text: Shared element transition ở tầng Window cho Fabric.
  tagline: Bọc bất kỳ view nào trong <SharedHero id="..."> ở hai màn hình hoặc hai state trên cùng màn hình. Animation chạy mượt 60/120 fps trên một lớp native overlay nằm trên mọi stack, modal, sheet và tab.
  actions:
    - theme: brand
      text: Bắt đầu ngay
      link: /vi/guide/
    - theme: alt
      text: Playground trực quan
      link: /vi/guide/timing-and-motion#interactive-playground
    - theme: alt
      text: API Reference
      link: /api/

features:
  - title: Overlay ở tầng Window
    details: Quá trình bay diễn ra trong một UIWindow trong suốt riêng biệt trên iOS và DecorView.overlay trên Android. Nhờ nằm trên toàn bộ cây navigation, view không bao giờ bị cắt (clip) khi bay qua stack, modal, transparent modal, form sheet hay tab.
  - title: Không phụ thuộc Router
    details: Dùng tốt với React Navigation, Expo Router, react-native-screens, <Modal> mặc định của React Native hoặc đổi state tại chỗ với useSharedHero(). Không cần bọc custom navigator hay provider phức tạp.
  - title: Chế độ Snapshot & Material Morph
    details: Chọn snapshot để bay nhanh với bitmap cross-fade, hoặc bật morph để nội suy mượt mà kích thước khung, borderRadius, backgroundColor và vùng cắt (clip).
  - title: Vật lý Spring & quỹ đạo vòng cung
    details: Chạy bằng CASpringAnimation trên iOS và AndroidX DynamicAnimation SpringAnimation trên Android, hoặc dùng các preset đường cong cubic-Bezier theo đường thẳng (linear) hay đường vòng cung (arc).
  - title: Vuốt cạnh trả về & kéo để đóng
    details: Tự động bám theo cử chỉ interactive pop trên iOS theo từng pixel ngón tay, đồng thời hỗ trợ bắt lấy vị trí thực tế khi người dùng kéo thả (pan-to-dismiss) để bay về.
  - title: Tối ưu cho Fabric & FlatList
    details: Thiết kế riêng cho React Native New Architecture (0.76+ đến 0.82+). Xử lý gọn gàng việc recycle cell trong FlatList/FlashList, đổi hướng ngay giữa không trung và tự động nâng cấp ảnh nét khi zoom lớn.
---

<div class="home-section vp-doc">

## Hai component, chung một `id`

Chỉ cần gắn cùng một `id` cho hai `<SharedHero>` ở màn hình danh sách và màn hình chi tiết. Khi bạn chuyển màn hình hoặc bấm quay lại, bộ điều phối (coordinator) dưới tầng native sẽ tự đo tọa độ trên window của cả hai view và cho phần tử bay mượt giữa hai vị trí.

```tsx
import { Image, Pressable } from 'react-native';
import { SharedHero } from 'react-native-shared-hero';

// 1. Màn hình nguồn (ví dụ: một ô trong danh sách hoặc lưới ảnh)
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

// 2. Màn hình đích (stack push, modal, sheet hoặc tab chi tiết)
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

## Playground thử nghiệm trực tiếp

Hãy thử chỉnh `mode`, `motionPath`, thông số `spring` và độ bo góc (`borderRadius`) ngay bên dưới để xem cách `react-native-shared-hero` nội suy chuyển động và sinh ra đoạn JSX tương ứng:

<TransitionPlayground />

</div>
