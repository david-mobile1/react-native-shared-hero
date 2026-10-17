---
description: "Cách xử lý các lỗi thường gặp khi làm shared element transition trong React Native: không kích hoạt bay, không bo góc morph, lỗi cắt animation trên Android và ảnh bị mờ."
---

# Khắc phục sự cố

Nếu hiệu ứng chuyển cảnh chưa chạy như ý hoặc gặp hiện tượng lạ trên giao diện, bạn hãy kiểm tra nhanh các mục dưới đây.

## Phần tử không bay khi chuyển màn hình

1. **Kiểm tra chuỗi `id` và `namespace` ở hai đầu có khớp nhau chính xác không**: Hãy thử log giá trị `id` hoặc gắn callback `onTransitionStart`. Cả hai đầu phải có cùng `id` và `namespace` (mặc định là `"default"`).
2. **Đảm bảo `enabled` không bị đặt bằng `false`**: Cả `<SharedHero>` nguồn và đích đều cần `enabled={true}` (giá trị mặc định).
3. **Với chuyển cảnh tại chỗ trên cùng màn hình, hãy đặt `key` khác nhau cho hai nhánh**: Khi đổi giữa hai nhánh `<SharedHero id="x">` bằng React state trên cùng một màn hình, hãy gắn `key` khác nhau (`key="collapsed"` và `key="expanded"`) để React thực sự unmount view nguồn và mount view đích thay vì dùng lại cùng một instance.
4. **Đảm bảo cả hai view đều có kích thước lớn hơn 0 khi layout**: Nếu `<SharedHero>` bọc một `<Image>` mà chưa khai báo `width`/`height` hoặc `aspectRatio`, kích thước lúc vừa mount có thể là `0x0`. Hãy luôn gán kích thước rõ ràng trong `style` cho `<SharedHero>` hoặc phần tử con bên trong.
5. **Kiểm tra dự án đã bật New Architecture (Fabric) chưa**: `react-native-shared-hero` được viết riêng cho Fabric.

## Chiều bay về trên Android bị ngắt nửa chừng trong Stack Navigator

**Triệu chứng**: Khi bấm mở màn hình chi tiết thì bay rất mượt, nhưng khi bấm nút Back trên Android thì màn hình chi tiết biến mất đột ngột khi phần tử mới bay về được một nửa.

**Nguyên nhân**: Khi bạn đặt `animation: 'fade'` cho `@react-navigation/native-stack` trên Android, `react-native-screens` dùng hiệu ứng XML fade khá ngắn (~150 ms) và tháo luôn cây view của Fragment màn hình chi tiết trước khi chuyến bay về dài 320 ms kịp hoàn tất.

**Cách khắc phục**: Chỉ bật `animation: 'fade'` trên iOS và giữ nguyên animation mặc định của stack trên Android:

```tsx
const detailOptions = Platform.select({
  ios: { animation: 'fade' as const },
  default: {},
});
```

## `borderRadius` hoặc `backgroundColor` không biến đổi mượt ở chế độ `morph`

**Triệu chứng**: Bạn đã bật `mode="morph"`, nhưng bốn góc của thẻ không bo tròn/vuông dần trong lúc bay mà nhảy ở cuối hành trình.

**Nguyên nhân**: Bạn đang đặt `borderRadius` và `backgroundColor` ở thẻ `<View>` hoặc `<Image>` con bên trong chứ không phải trên prop `style` của chính `<SharedHero>`.

**Cách khắc phục**: Đưa `borderRadius`, `backgroundColor` và `overflow: 'hidden'` lên thẳng `<SharedHero style={...}>`:

```tsx
<SharedHero
  id={`card-${item.id}`}
  mode="morph"
  style={{ borderRadius: 20, backgroundColor: '#1E293B', overflow: 'hidden' }}
>
  <Image source={{ uri: item.url }} style={{ width: '100%', height: 240 }} />
</SharedHero>
```

## Ảnh ở màn hình đích bị mờ trong lúc phóng to rồi mới nét

**Triệu chứng**: Khi phóng một ảnh thumbnail rất nhỏ lên thành ảnh toàn màn hình, bức ảnh trông hơi mờ trong lúc đang bay và chỉ nét căng sau khi đã đáp xuống.

**Nguyên nhân**: Nếu màn hình chi tiết tải một URL ảnh hoàn toàn mới chưa từng có trong bộ nhớ đệm (cache) và mất nhiều hơn `~120 ms` để tải qua mạng, `HeroRegistry` sẽ chủ động dùng bitmap của ảnh thumbnail nguồn để bay ngay thay vì bắt người dùng chờ đơ màn hình.

**Cách khắc phục**:
- Gọi `Image.prefetch(item.fullUrl)` trước khi mở màn hình (ví dụ khi item lọt vào khung nhìn hoặc ngay trong sự kiện `onPressIn`).
- Hoặc dùng chung một URL ảnh đủ nét cho cả hai đầu nếu ảnh đó đã được cache sẵn.

## Lỗi build CocoaPods khi bật `use_frameworks!`

**Triệu chứng**: Xcode báo lỗi `'SharedHero/SharedHero-Swift.h' file not found` ở các bản cũ.

**Cách khắc phục**: Nâng cấp lên phiên bản mới nhất của `react-native-shared-hero`. File `ios/SharedHeroView.mm` đã bổ sung kiểm tra `__has_include(<SharedHero/SharedHero-Swift.h>)` để tự động tương thích với cả liên kết tĩnh lẫn `use_frameworks!`.
