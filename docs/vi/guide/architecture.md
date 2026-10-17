---
description: "Giải phẫu kiến trúc native trên iOS (Swift / OverlayHost UIWindow) và Android (Kotlin / ViewGroupOverlay) của react-native-shared-hero trên React Native Fabric."
---

# Kiến trúc bên dưới

`react-native-shared-hero` được thiết kế chuyên biệt cho React Native New Architecture (Fabric) với lớp vỏ TypeScript cực gọn và phần lõi điều phối đối xứng nhau giữa iOS và Android.

## Luồng dữ liệu tổng thể

```
┌────────────────────────────────────────────────────────────────────────┐
│ React Native JS (Fabric)                                               │
│   <SharedHero id="photo-1" namespace="default" mode="morph" />         │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Codegen C++ ShadowNode / Props
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Native Endpoint View                                                   │
│   iOS:     SharedHeroView.mm (ObjC++) -> SharedHeroViewImpl.swift      │
│   Android: SharedHeroViewManager.kt   -> SharedHeroView.kt             │
│                                                                        │
│   • Theo dõi heroId, heroNamespace, mode, timing, borderRadius, bgColor│
│   • Chụp HeroSnapshot + khung tọa độ Window sau khi layout ổn định     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ register / notifyLayout / unregister
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Singleton Registry & Match Engine                                      │
│   iOS:     HeroRegistry.shared (HeroRegistry.swift)                    │
│   Android: HeroRegistry        (HeroRegistry.kt)                       │
│                                                                        │
│   • live[key]: danh sách có thứ tự các view đang mount theo ns::id     │
│   • recentlyUnregistered[key]: snapshot nguồn vừa tháo (~300 ms)       │
│   • lastKnownSnapshots: bộ đệm LRU dự phòng có giới hạn                │
│   • lastFlightSourceFrame: gợi ý tọa độ đối xứng giữa chiều đi & về    │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Khởi chạy / bắt giữa đường
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Flight Engine & Lớp Overlay cấp Window                                 │
│   iOS:     FlightEngine.swift + OverlayHost.swift (UIWindow .alert + 1)│
│   Android: FlightEngine.kt    + OverlayHost.kt    (ViewGroupOverlay)   │
└────────────────────────────────────────────────────────────────────────┘
```

## Hai nhánh ghép cặp trong `HeroRegistry`

Khác với các thư viện phải móc vào sự kiện chuyển trang của router, `HeroRegistry` tự ghép cặp hai đầu dựa hoàn toàn trên tín hiệu vòng đời của native view thông qua hai nhánh kích hoạt:

### Nhánh 1: View đích xuất hiện khi view nguồn vẫn đang mount (Stack push, Modal, Sheet)

1. Màn hình A đang hiển thị. `live["default::photo-1"]` chứa `[viewA]`.
2. Màn hình B mount `viewB` với cùng khóa. Hàm `register(viewB)` lập tức chụp lại snapshot của `viewA` (ghi nhận khung tọa độ trước khi navigator trượt màn hình) và xếp hàng một chuyến bay chờ tới `viewB`.
3. Ngay khi `viewB` hoàn tất bước layout của Fabric (`notifyLayout`) và ảnh `<Image>` đích khi zoom-in đã decode xong (đợi tối đa ~120 ms), `HeroRegistry` chuyển cả hai snapshot cùng thông số hình học sang `FlightEngine`.

### Nhánh 2: Hủy đăng ký (Bay về) & Đổi state tại chỗ

1. **Pop màn hình / Đóng Modal**: Khi `viewB` tách khỏi cửa sổ trong khi `viewA` vẫn còn sống bên dưới, `unregister(viewB)` chụp lại khung tọa độ thực tế cuối cùng của `viewB` (bao gồm cả biến đổi kéo thả pan-to-dismiss) và cho bay về vị trí nghỉ của `viewA` (`destFrameHint`).
2. **Đổi state tại chỗ (In-place toggle)**: Khi `viewA` unmount làm `live[key]` trống, `unregister(viewA)` cất tạm snapshot của `viewA` vào `recentlyUnregistered[key]` (cửa sổ khớp `300 ms` kèm chốt chặn trùng `sourceViewId`). Khi `viewB` mount với cùng khóa ở nhịp tiếp theo, `runMatchPass` ghép cặp bản ghi nguồn đang chờ với `viewB` và thực hiện chuyến bay.

## Chi tiết triển khai trên từng nền tảng

### iOS (`ios/*.swift` + `SharedHeroView.mm`)

- **`OverlayHost.swift`**: Khởi tạo một `UIWindow` trong suốt, không nhận tương tác chạm (`windowLevel = .alert + 1`, `isUserInteractionEnabled = false`) đi kèm `OverlayRootViewController`. Cửa sổ được chuẩn bị sẵn ngay khi đăng ký hero đầu tiên để tránh hiện tượng nháy trắng 1 frame lúc bắt đầu bay, đồng thời chuyển tiếp toàn bộ truy vấn thanh trạng thái / xoay màn hình về cửa sổ chính của ứng dụng.
- **`FlightEngine.swift`**: Điều khiển các chuyến bay theo thời gian bằng `UIViewPropertyAnimator` (`UICubicTimingParameters`) và các chuyến bay lò xo bằng `UISpringTimingParameters(mass:stiffness:damping:initialVelocity:)`. Hỗ trợ bắt lấy chuyến bay ngay giữa không trung (`canTakeOver` / `interrupt`) thông qua `flightView.layer.presentation()`.
- **`InteractiveStackPop.swift` & `InteractiveModalReturn.swift`**: Gắn `CADisplayLink` theo dõi `interactivePopGestureRecognizer` của `UINavigationController` cũng như cử chỉ vuốt đóng modal/sheet của UIKit, giúp lớp overlay bám sát ngón tay 1:1 và bù trừ độ trượt parallax của màn hình danh sách bên dưới.

### Android (`android/src/main/java/com/sharedhero/*.kt`)

- **`OverlayHost.kt`**: Lấy `ViewGroupOverlay` từ `view.rootView` (`DecorView`). Nhờ ưu tiên kiểm tra `rootView` của chính view đích trước khi fallback về `activity.window.decorView.overlay`, hiệu ứng bay hoạt động trơn tru cả trong Activity chính lẫn xuyên qua cửa sổ `Dialog` riêng của `<Modal>` React Native.
- **`FlightEngine.kt`**: Dựng một container `FrameLayout` bên trong `ViewGroupOverlay` kết hợp `ViewOutlineProvider` động (`outline.setRoundRect(0, 0, w, h, currentRadius)`) cho chế độ `morph`. Chạy đường cong cubic-Bezier bằng `Choreographer` + `PathInterpolator` và chạy vật lý lò xo bằng `androidx.dynamicanimation.animation.SpringAnimation` (`FloatValueHolder(0f..1000f)`).
- **`HeroRegistry.kt` & `HeroSnapshot.kt`**: Duy trì bộ nhớ đệm `lastKnownSnapshots` theo cơ chế LRU có giới hạn nghiêm ngặt để dung lượng native heap (`Bitmap`) luôn phẳng dù người dùng mở hàng trăm màn hình chi tiết khác nhau.
