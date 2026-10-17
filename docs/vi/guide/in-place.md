---
description: "Tạo hiệu ứng shared element ngay trên cùng một màn hình không cần router bằng hook useSharedHero() và React key riêng biệt."
---

# Chuyển cảnh tại chỗ (`useSharedHero`)

Shared element transition không chỉ dành cho việc chuyển đổi giữa hai màn hình khác nhau. Rất nhiều trường hợp bạn muốn phóng to một thành phần nhỏ thành giao diện chi tiết **ngay trên cùng một màn hình** khi đổi state:

- Bung thanh mini-player ở đáy màn hình thành giao diện phát nhạc lớn.
- Mở rộng một ảnh thumbnail ngay trong bài viết thành khung xem ảnh lớn tại chỗ.
- Biến đổi một thẻ thu gọn thành thẻ chi tiết nhiều dòng.

## Cơ chế ghép cặp tại chỗ hoạt động thế nào?

Khi bạn render có điều kiện hai nhánh `<SharedHero>` có cùng `id` (và khác `key` của React) trên cùng một màn hình:

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

Vì sao cần đặt `key` khác nhau cho hai nhánh?

1. Đặt hai `key` khác nhau (`key="player-expanded"` và `key="player-compact"`) báo cho React biết cần **unmount** `<SharedHero>` thu gọn và **mount** một `<SharedHero>` mở rộng mới trong cùng một lần commit, thay vì tái sử dụng chung một instance native view rồi chỉ đổi `style`.
2. Khi view thu gọn unmount, `HeroRegistry` lưu tạm bản chụp snapshot và khung tọa độ của nó vào bảng `recentlyUnregistered` trong cửa sổ ghép cặp hiện tại.
3. Trong cùng nhịp đó, view mở rộng vừa mount sẽ đăng ký và hoàn tất layout. `HeroRegistry` ghép cặp snapshot nguồn đang chờ với view đích mới và cho bay mượt trên lớp overlay.

::: tip Thay đổi kích thước trực tiếp trên cùng một instance
Trên iOS, `HeroRegistry` cũng hỗ trợ tự động nhận diện khi một `SharedHeroViewImpl` đổi kích thước tại chỗ thông qua `notifyLayout`, nhưng việc dùng hai nhánh có `key` riêng biệt là cách rõ ràng và đồng nhất nhất trên cả iOS lẫn Android khi cấu trúc giao diện lúc đóng và lúc mở khác nhau.
:::

## Sử dụng hook `useSharedHero`

`useSharedHero(initial = false)` là một state hook gọn nhẹ dành cho chuyển cảnh tại chỗ, trả về `{ active, start, end, toggle }` với các hàm điều khiển đã được memoize ổn định:

| Android | iOS |
| --- | --- |
| <video src="https://github.com/user-attachments/assets/05a81333-c76f-4864-8047-4eb46a0e50d0" controls loop muted playsinline></video> | <video src="https://github.com/user-attachments/assets/d3020dbc-cf82-4cc7-bf77-98509f474f57" controls loop muted playsinline></video> |

```tsx
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SharedHero, useSharedHero } from 'react-native-shared-hero';

export function InPlacePhotoToggle({ photo }) {
  const { active, toggle } = useSharedHero(false);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Chạm vào ảnh để phóng to tại chỗ</Text>

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

## Tóm tắt API của `useSharedHero`

| Thuộc tính | Kiểu | Mô tả |
| --- | --- | --- |
| `active` | `boolean` | Trạng thái hiện tại (`false` khi thu gọn, `true` khi mở rộng). |
| `start` | `() => void` | Đặt `active` thành `true`. |
| `end` | `() => void` | Đặt `active` thành `false`. |
| `toggle` | `() => void` | Đảo giá trị `active` giữa `false` và `true`. |
