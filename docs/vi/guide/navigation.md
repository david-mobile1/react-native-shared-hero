---
description: "Sử dụng react-native-shared-hero xuyên qua native stack, modal, transparent modal, form sheet, Modal của React Native và bottom tab navigator."
---

# Stack, Modal, Sheet và Tab

Nhờ việc render bản sao đang bay trên một lớp overlay cấp Window (`OverlayHost` dùng `UIWindow` ở mức `UIWindow.Level.alert + 1` trên iOS và `DecorView.overlay` trên Android), `react-native-shared-hero` không bị bó buộc trong một container điều hướng cố định. Bạn có thể cho phần tử bay xuyên qua hầu hết các kiểu trình bày màn hình.

## 1. Native Stack (`@react-navigation/native-stack` / Expo Router)

Với các màn hình push/pop tiêu chuẩn, hãy cấu hình route chi tiết sao cho hiệu ứng chuyển màn hình hỗ trợ tôn lên phần tử hero:

```tsx
<Stack.Screen
  name="Detail"
  component={DetailScreen}
  options={Platform.select({
    ios: {
      animation: 'fade',
      headerTransparent: true,
    },
    default: {
      headerTransparent: true,
    },
  })}
/>
```

### Vì sao chỉ đặt `animation: 'fade'` trên iOS?

- **iOS**: Hiệu ứng push mặc định của iOS trượt ngang cả màn hình từ phải sang trái. Đổi sang `animation: 'fade'` giúp nền màn hình mờ dần nhẹ nhàng, làm nổi bật quỹ đạo bay của phần tử hero.
- **Android**: Trong `react-native-screens`, `animation: 'fade'` dùng hiệu ứng XML fade khá ngắn khi pop, khiến Fragment của màn hình chi tiết bị gỡ khỏi cây hiển thị trước khi chuyến bay về dài 320 ms kết thúc. Giữ nguyên animation mặc định của stack trên Android sẽ đảm bảo nền màn hình luôn mượt mà cả lúc đi lẫn lúc về.

## 2. Native Modal & Transparent Modal

Khi bạn mở một route với `presentation: 'modal'` hoặc `presentation: 'transparentModal'`, màn hình nguồn ở bên dưới **vẫn tiếp tục được mount** chứ không bị tháo ra.

`HeroRegistry` tự động xử lý trường hợp này nhờ việc lưu danh sách có thứ tự (`live[key]`) các view đang mount cho mỗi khóa `namespace::id`:

- Khi modal mount thêm một `<SharedHero id="item-1">` thứ hai, `HeroRegistry` sẽ lấy view mới mount trong modal làm đích và view ở màn hình danh sách bên dưới làm nguồn.
- Khi đóng modal (bằng nút bấm hoặc vuốt dọc để đóng), view trong modal hủy đăng ký và bay ngược về đúng view nguồn vẫn đang nằm chờ ở màn hình danh sách.

```tsx
<Stack.Screen
  name="QuickPreviewModal"
  component={QuickPreviewModal}
  options={{
    presentation: 'transparentModal',
    animation: 'fade',
    headerShown: false,
  }}
/>
```

## 3. Form Sheet & Bottom Sheet (`presentation: 'formSheet'`)

Trên iOS 15+, `react-native-screens` hỗ trợ sheet native thông qua `UISheetPresentationController` (`presentation: 'formSheet'` kèm `sheetAllowedDetents`).

Với các thư viện dùng portal nằm trong cây view, phần tử khi bay ra khỏi mép trên bo tròn của sheet sẽ bị cắt cụt. Nhờ cửa sổ `UIWindow` của `OverlayHost` nằm ở mức `.alert + 1` cao hơn cả container của sheet presentation controller, phần tử hero có thể bay thẳng từ màn hình nền vào đúng vị trí dừng (detent) hiện tại của sheet, đồng thời `InteractiveModalReturn` tự động bám theo thao tác vuốt đóng sheet.

```tsx
<Stack.Screen
  name="ProductSheet"
  component={ProductSheetScreen}
  options={{
    presentation: 'formSheet',
    sheetAllowedDetents: [0.55, 1.0],
    sheetGrabberVisible: true,
    headerShown: false,
  }}
/>
```

## 4. `<Modal>` mặc định của React Native

Bạn không cần tới thư viện navigation để chạy shared element transition qua cửa sổ modal. Component `<Modal>` tích hợp sẵn của React Native render nội dung trong một cửa sổ native riêng biệt (`RCTModalHostView` `UIWindow` trên iOS và `Dialog` `Window` riêng trên Android).

`OverlayHost` xử lý tự động trên cả hai hệ điều hành:

- **iOS**: Mức cửa sổ `UIWindow.Level.alert + 1` của `OverlayHost` nằm cao hơn cửa sổ của `RCTModalHostView`.
- **Android**: `OverlayHost.resolveOverlay(view)` lấy `ViewGroupOverlay` trực tiếp từ `view.rootView` (`DecorView` của chính cửa sổ đích). Khi mở `<Modal>`, chuyến bay hiển thị trên `DecorView.overlay` của `Dialog` (nằm trên nội dung modal); khi đóng `<Modal>`, chuyến bay về hiển thị trên `DecorView.overlay` của Activity chính.

```tsx
<Modal
  visible={activeItem != null}
  transparent
  animationType="slide"
  statusBarTranslucent
  navigationBarTranslucent
  onRequestClose={() => setActiveItem(null)}
>
  {activeItem ? (
    <View style={styles.modalRoot}>
      <SharedHero
        id={`core-modal-${activeItem.id}`}
        namespace="core-modal"
        mode="snapshot"
        duration={380}
        style={styles.hero}
      >
        <Image source={{ uri: activeItem.uri }} style={styles.fill} />
      </SharedHero>
    </View>
  ) : null}
</Modal>
```

## 5. Tabs & chuyển cảnh nhiều chặng (Multi-step)

- **Từ màn hình Tab push sang màn hình chi tiết**: Đặt `namespace="tabs"` cho các thẻ trong tab và truyền cùng `namespace="tabs"` ở màn hình chi tiết.
- **Chuyển cảnh nối tiếp nhiều tầng (A -> B -> C)**: Bạn có thể nối tiếp hiệu ứng bay qua nhiều màn hình liên tiếp (`Danh sách -> Tổng quan -> Ảnh toàn màn hình`) bằng cách dùng cùng `id` giữa các chặng.
