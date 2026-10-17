---
description: "Tổng quan về react-native-shared-hero: vì sao shared element transition ở tầng Window giải quyết triệt để bài toán modal, sheet và router trên React Native Fabric."
---

# Tổng quan

`react-native-shared-hero` là thư viện shared element (hero) transition thuần native dành cho React Native New Architecture (Fabric) trên iOS và Android.

Cách dùng rất trực quan: bạn bọc view ở màn hình A và view ở màn hình B trong `<SharedHero id="...">`. Khi màn hình B được mount (hoặc khi màn hình B unmount để quay về A), coordinator ở tầng native sẽ chụp lại trạng thái hai đầu, tạm ẩn hai view thật trong lúc bay và diễn hoạt bản sao trên một lớp overlay cấp Window ở tốc độ làm tươi gốc của màn hình (60 fps hoặc 120 fps ProMotion).

## Vì sao lại cần một hướng tiếp cận mới?

Khi làm shared element transition trên React Native (đặc biệt với New Architecture), anh em dev thường vướng 3 vấn đề kinh điển:

<div class="comparison-grid">
  <div class="comparison-card">
    <h3>1. Phụ thuộc chặt vào Stack Navigator</h3>
    <p>
      Nhiều thư viện can thiệp trực tiếp vào transition của <code>react-native-screens</code>. Cách này sẽ gãy ngay khi bạn mở native modal, transparent modal, form sheet, <code>&lt;Modal&gt;</code> mặc định của React Native, hoặc chỉ muốn phóng to một chiếc thẻ ngay trên cùng màn hình thông qua state.
    </p>
  </div>
  <div class="comparison-card">
    <h3>2. Bị cắt khung (clipping) bởi view cha</h3>
    <p>
      Khi bản sao đang bay vẫn nằm bên trong view container của một màn hình hoặc sheet, bất kỳ view cha nào đặt <code>overflow: 'hidden'</code> hoặc khung giới hạn của bottom sheet đều sẽ cắt mất một phần view đang bay.
    </p>
  </div>
  <div class="comparison-card">
    <h3>3. Vỡ nét ảnh thumbnail khi phóng to</h3>
    <p>
      Nếu chỉ lấy ảnh bitmap của thumbnail nhỏ ở danh sách rồi kéo giãn (scale) lên kích thước ảnh bìa lớn ở màn hình chi tiết, ảnh sẽ bị mờ trong suốt quá trình bay. <code>react-native-shared-hero</code> tự động nhận diện trường hợp hai đầu là <code>&lt;Image&gt;</code> và thay bằng ảnh độ phân giải cao của màn hình đích ngay khi decode xong.
    </p>
  </div>
</div>

`react-native-shared-hero` giải quyết các điểm nghẽn này từ tầng kiến trúc:

- **Overlay ở tầng Window**: Trên iOS, quá trình bay được render trong một `UIWindow` riêng trong suốt (`windowLevel = .alert + 1`, `isUserInteractionEnabled = false`) cho phép xuyên thao tác chạm, nằm trên mọi `UIViewController`, modal và sheet. Trên Android, phần tử bay trong `DecorView.overlay` (`ViewGroupOverlay`). Không có bất kỳ container nào trong cây React có thể che hay cắt view đang bay.
- **Tách biệt hoàn toàn khỏi Router**: Việc ghép cặp (pairing) dựa trên vòng đời mount, layout và unmount của native view trong một cửa sổ thời gian ngắn. Nhờ vậy bạn dùng với React Navigation, Expo Router, `<Modal>` hay `useState` đều chạy giống hệt nhau.
- **Không tốn tài nguyên khi đứng yên**: Khi không có transition nào chạy, cửa sổ overlay không giữ bất kỳ view con nào (`backgroundColor = .clear`, `isUserInteractionEnabled = false`), bộ nhớ đệm snapshot dự phòng (`lastKnownSnapshots`) được giới hạn chặt bằng cơ chế LRU và chỉ chụp lại khi kích thước hoặc view con thực sự thay đổi.

## Bảng tính năng

| Tính năng | iOS | Android | Ghi chú |
| --- | --- | --- | --- |
| Fabric (New Architecture) | Có | Có | Viết dưới dạng Fabric `ViewManager` / `RCTViewComponentView` |
| `mode="snapshot"` | Có | Có | Chụp bitmap nhanh, di chuyển + scale + đổi độ mờ |
| `mode="morph"` | Có | Có | Nội suy mượt khung kích thước, `borderRadius`, `backgroundColor` và clip |
| `motionPath="linear"` / `"arc"` | Có | Có | Bay thẳng hoặc bay theo đường cong bậc hai kiểu Material |
| `duration` + `easing` cubic-Bezier | Có | Có | `linear`, `easeIn`, `easeOut`, `easeInOut`, `standard`, `emphasized` |
| Vật lý `spring` native | Có | Có | `CASpringAnimation` trên iOS, `SpringAnimation` trên Android |
| Chế độ chuyển độ mờ (`fadeMode`) | Có | Có | `cross`, `in`, `out`, `through` |
| Nâng cấp ảnh nét khi zoom-in | Có | Có | Giữ ảnh sắc nét khi cả hai đầu bọc một `<Image>` |
| Chống cắt chữ khi `<Text>` xuống dòng | Có | Có | Scale mượt hai lớp snapshot thay vì crop mất dấu hoặc chữ |
| Vuốt cạnh trái trả về (swipe-back) | Có | N/A | Tự động đồng bộ tiến độ với `interactivePopGestureRecognizer` |
| Đổi hướng ngay giữa không trung | Có | Có | Bắt lấy tọa độ thực đang bay nếu người dùng bấm Back ngay lập tức |
| Hỗ trợ recycle cho `FlatList` / `FlashList` | Có | Có | Tự dọn dẹp bucket `id` cũ khi cell được tái sử dụng |

## Yêu cầu hệ thống

- **React Native**: `0.76+` bật New Architecture (Fabric), đã kiểm thử tới React Native `0.82`.
- **iOS**: iOS `14.0+` (tương thích cả liên kết tĩnh lẫn `use_frameworks!`).
- **Android**: `minSdkVersion 24+`, Kotlin + AndroidX `dynamicanimation`.
- **Expo**: Chạy tốt với Expo Custom Dev Client (`npx expo run:ios` / `npx expo run:android` / EAS Build). Không dùng được trong app **Expo Go** dựng sẵn vì thư viện có mã native riêng.
