---
description: Hỗ trợ cử chỉ vuốt cạnh trái trả về (swipe-back) trên iOS, kéo thả để đóng (pan-to-dismiss) và cơ chế recycle cell trong FlatList / FlashList.
---

# Vuốt trả về và FlatList

Trong các ứng dụng thực tế, danh sách cuộn có tái sử dụng cell (`FlatList` hoặc `FlashList`) luôn đi kèm với thao tác vuốt cạnh màn hình để quay lại hoặc kéo ảnh xuống để đóng. `react-native-shared-hero` hỗ trợ sẵn cả hai kịch bản này ở tầng native.

## 1. Vuốt cạnh trái trả về (Interactive swipe-back trên iOS)

Trên iOS, khi người dùng đặt ngón tay ở mép trái màn hình và kéo sang phải để pop một màn hình trong `UINavigationController` (`interactivePopGestureRecognizer`):

1. Ngay khi cử chỉ bắt đầu, native coordinator phát hiện `UIGestureRecognizer` đang chạy cùng `UINavigationController.topViewController?.transitionCoordinator`.
2. Thay vì tự chạy bộ đếm thời gian cố định, coordinator chuyển sang **chế độ điều khiển tương tác (interactive driver mode)**.
3. Ngón tay người dùng kéo tới đâu, vị trí, tỉ lệ thu phóng, độ bo góc `borderRadius` và độ mờ của phần tử đang bay sẽ bám sát 1:1 theo phần trăm quãng đường kéo.
4. Khi người dùng nhấc ngón tay lên:
   - **Hoàn tất đóng màn hình (commit)**: Bản sao bay nốt từ vị trí nhả tay về đúng khung của ô nguồn trong danh sách (`~220 ms`).
   - **Hủy thao tác (nhả tay khi mới kéo nhẹ ở mép trái)**: Bản sao bay mượt trở lại khung của màn hình chi tiết và mở hiển thị lại view chi tiết như cũ.

Bạn không cần bật thêm bất kỳ prop hay cấu hình nào cho tính năng này trên iOS; nó tự động kích hoạt mỗi khi thao tác back được khởi tạo bởi cử chỉ vuốt cạnh của hệ thống.

## 2. Kéo để đóng màn hình (Pan-to-dismiss gesture handoff)

Nhiều ứng dụng xem ảnh/video cho phép người dùng kéo dọc bức ảnh trên màn hình chi tiết để thu nhỏ dần rồi đóng màn hình (tương tự Instagram hay Apple Photos).

Khi người dùng kéo một `<SharedHero>` bên trong `PanResponder` hoặc `react-native-gesture-handler` bằng `transform: [{ translateX }, { translateY }, { scale }]`:

```tsx
<Animated.View
  {...panResponder.panHandlers}
  style={{
    transform: [
      { translateX: dragX },
      { translateY: dragY },
      { scale: dragScale },
    ],
  }}
>
  <SharedHero
    id={`photo-${item.id}`}
    mode="morph"
    spring={{ damping: 24, stiffness: 260, mass: 1 }}
    style={{ borderRadius: 20, overflow: 'hidden' }}
  >
    <Image source={{ uri: item.fullUrl }} style={styles.heroImage} />
  </SharedHero>
</Animated.View>
```

Khi người dùng kéo vượt ngưỡng đóng và bạn gọi `navigation.goBack()`:

1. Ngay trước khi unmount, `SharedHeroView` ở tầng native sẽ đo **khung tọa độ thực tế đã bao gồm ma trận transform** (tức là đúng vị trí và kích thước thu nhỏ ngay tại điểm ngón tay vừa buông ra) thay vì dùng khung layout tĩnh ban đầu.
2. Chuyến bay chiều về bắt đầu nối tiếp ngay từ vị trí ngón tay buông ra và đáp về đúng ô trong danh sách mà không bị giật về giữa màn hình.

## 3. Danh sách ảo hóa (`FlatList` & `FlashList`)

Các danh sách ảo hóa liên tục tái sử dụng (recycle) native view khi người dùng cuộn. Nếu không xử lý kỹ ở tầng native, khi một cell được tái sử dụng và đổi prop `id` từ `"photo-1"` sang `"photo-19"`, bucket của `"photo-1"` có thể trỏ nhầm sang cell đang hiển thị ảnh số 19.

`react-native-shared-hero` giải quyết triệt để bài toán recycle này:

- **Tự động dọn `id` cũ khi đổi prop**: Ngay khi `heroId` thay đổi trên một native view được tái sử dụng, `HeroRegistry` lập tức gỡ view đó khỏi bucket của `id` cũ và xóa snapshot cũ trước khi đăng ký vào `id` mới.
- **Bộ nhớ đệm snapshot giới hạn bằng LRU**: Bộ nhớ đệm dự phòng `HeroRegistry.lastKnownSnapshots` sử dụng cơ chế LRU có giới hạn nghiêm ngặt (`SnapshotLRU`). Dù người dùng cuộn qua hàng nghìn bức ảnh, các bitmap cũ nhất sẽ tự động được giải phóng để không gây tràn RAM.
- **Chỉ chụp lại snapshot khi có thay đổi (Dirty check)**: View chỉ cập nhật lại snapshot dự phòng khi kích thước `bounds` hoặc số lượng view con thực sự thay đổi, tránh việc chụp lại bitmap liên tục trong lúc danh sách đang trôi theo quán tính.

### Kinh nghiệm thực tế khi dùng với `FlatList`

1. **Luôn truyền `keyExtractor` ổn định**: Dùng ID định danh của dữ liệu (`keyExtractor={(item) => item.id}`), tránh dùng `index` của mảng.
2. **Cuộn danh sách theo nếu màn hình chi tiết có vuốt ngang**: Nếu người dùng mở ảnh số 1 rồi vuốt ngang sang ảnh số 8 ở màn hình chi tiết trước khi bấm Back, hãy gọi `flatListRef.current?.scrollToIndex({ index, animated: false })` để ô nguồn của ảnh số 8 kịp mount trên cửa sổ trước khi bay về.
3. **Tự động hủy an toàn khi ô nguồn đã cuộn khuất**: Nếu ô nguồn có kích thước bằng 0 hoặc đã bị tháo khỏi cửa sổ hiển thị, `react-native-shared-hero` sẽ tự động bỏ qua chuyến bay và hiển thị màn hình bình thường, tuyệt đối không gây crash hay làm kẹt trạng thái ẩn của view.
