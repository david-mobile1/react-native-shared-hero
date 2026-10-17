---
description: Tạo hiệu ứng shared element transition đầu tiên trong React Native với SharedHero chỉ trong vài phút.
---

# Bắt đầu nhanh

Để tạo một hiệu ứng chuyển cảnh shared element, bạn chỉ cần đặt hai component `<SharedHero>` có cùng chuỗi `id` ở hai màn hình (hoặc ở hai nhánh điều kiện render).

## Ví dụ cơ bản: Bay ảnh từ danh sách sang màn hình chi tiết

Giả sử bạn có màn hình lưới ảnh (`PhotoGridScreen`) và màn hình chi tiết (`PhotoDetailScreen`) nằm trong một native stack navigator (`@react-navigation/native-stack` hoặc `expo-router`).

| Android | iOS |
| --- | --- |
| <video src="https://github.com/user-attachments/assets/8902a96b-59cf-4893-a0fd-a5b4316b4abd" controls loop muted playsinline></video> | <video src="https://github.com/user-attachments/assets/65177700-0503-4ad5-9f7c-912f55cf6e45" controls loop muted playsinline></video> |

### Bước 1: Bọc phần tử nguồn ở danh sách

Ở màn hình danh sách, bọc ảnh thumbnail trong `<SharedHero>` và truyền vào `id` gắn với ID duy nhất của từng item:

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

### Bước 2: Bọc phần tử đích ở màn hình chi tiết

Ở màn hình chi tiết, bọc ảnh bìa trong `<SharedHero>` với chính xác cùng `id` đó:

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

### Bước 3: Cấu hình `screenOptions` gợi ý cho Stack Navigator

Trên iOS, hiệu ứng push mặc định của `createNativeStackNavigator` sẽ trượt cả màn hình mới từ phải sang trái, dễ gây rối mắt khi kết hợp với phần tử hero đang bay từ dưới lên. Đặt `animation: 'fade'` trên iOS giúp nền màn hình chuyển mờ nhẹ nhàng, nhường tâm điểm cho phần tử hero.

Trên Android, bạn nên giữ nguyên animation mặc định của `react-native-screens` thay vì đặt `animation: 'fade'`, vì XML fade của Android tháo Fragment khá sớm khi pop về, có thể làm màn hình đích biến mất trước khi hành trình bay 320 ms kết thúc.

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

## Chuyện gì diễn ra bên dưới khi chuyển màn hình?

1. **Khi mở màn hình chi tiết (Forward push)**: Ngay khi `PhotoDetailScreen` mount, `<SharedHero id="photo-1">` đăng ký với native coordinator và hoàn tất layout. Coordinator tìm thấy `<SharedHero id="photo-1">` vẫn đang mount ở `PhotoGridScreen`, chụp lại trạng thái hai đầu, đặt `opacity = 0` cho hai view thật và điều khiển bản sao bay từ khung của thumbnail sang khung của ảnh bìa.
2. **Tự động nâng cấp ảnh nét**: Nếu `item.thumbUrl` là ảnh nhỏ và `item.fullUrl` là ảnh chất lượng cao, coordinator sẽ đợi tối đa khoảng ~120 ms để `UIImageView` / `ImageView` ở màn hình đích giải mã xong bitmap, sau đó dùng luôn ảnh sắc nét đó cho toàn bộ quãng đường bay.
3. **Khi bấm Back hoặc vuốt cạnh trả về**: Khi bạn đóng `PhotoDetailScreen` hoặc vuốt từ mép trái màn hình trên iOS, phần tử hero ở màn hình chi tiết sẽ bay ngược về đúng ô của nó trong `PhotoGridScreen`.
