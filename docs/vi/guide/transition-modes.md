---
description: Phân biệt chế độ snapshot và morph, các tuỳ chọn fadeMode (cross, in, out, through), xử lý Text và nâng cấp độ phân giải ảnh khi zoom.
---

# Chế độ chuyển cảnh và Morph

`SharedHero` cung cấp nhiều cách thức biến đổi hình ảnh thông qua hai prop `mode` và `fadeMode`. Chọn đúng chế độ sẽ giúp hiệu ứng tự nhiên dù bạn đang cho bay một bức ảnh đơn lẻ, một chiếc thẻ phức tạp chứa nhiều nút bấm hay một dòng tiêu đề.

## `mode="snapshot"` (mặc định)

Ở chế độ `snapshot`, native coordinator chụp lại bitmap của view nguồn và view đích, đặt cả hai vào lớp overlay trên Window, co giãn hai lớp bitmap khớp với khung đang bay và pha trộn độ mờ giữa chúng theo `fadeMode`.

Bạn nên dùng `snapshot` khi:

- Cả hai đầu có hình dáng tương đồng (ví dụ: hai tấm ảnh cùng tỉ lệ hoặc hai avatar tròn).
- Bạn muốn tối ưu chi phí GPU thấp nhất trong lúc bay.

```tsx
<SharedHero id={`avatar-${user.id}`} mode="snapshot">
  <Image source={{ uri: user.avatar }} style={styles.avatar} />
</SharedHero>
```

## `mode="morph"` (Biến đổi khung chứa kiểu Material)

Khi một chiếc thẻ nhỏ có bo góc (`borderRadius: 16`, nền xám đậm) bung ra thành màn hình chi tiết tràn viền (`borderRadius: 0`, nền đen), nếu chỉ dùng `snapshot` thì bốn góc sẽ không tự thu nhỏ hoặc mở rộng độ cong một cách mượt mà.

Khi bật `mode="morph"`, lớp overlay sẽ dựng một container động và nội suy trực tiếp trên từng frame:

- **Khung kích thước (Bounds)**: chiều rộng, chiều cao và tọa độ tâm trên hệ quy chiếu Window.
- **Độ bo góc (`borderRadius`)**: đọc trực tiếp từ `style.borderRadius` của mỗi `<SharedHero>` (trên iOS thông qua `layer.cornerRadius`, trên Android thông qua `ViewOutlineProvider` kết hợp `clipToOutline = true`).
- **Màu nền (`backgroundColor`)**: đọc từ `style.backgroundColor` và nội suy từng kênh màu RGBA suốt quá trình bay.

| Android | iOS |
| --- | --- |
| <video src="https://github.com/user-attachments/assets/0d6a614a-0584-414a-ad20-b090a414ad8b" controls loop muted playsinline></video> | <video src="https://github.com/user-attachments/assets/6f64a280-2c31-4d24-91b8-cabbf2e24a66" controls loop muted playsinline></video> |

```tsx
// Thẻ ở danh sách: bo góc 16px, nền #1E293B
<SharedHero
  id={`card-${item.id}`}
  mode="morph"
  style={{ borderRadius: 16, backgroundColor: '#1E293B', overflow: 'hidden' }}
>
  <CardSummary item={item} />
</SharedHero>

// Khung ở màn hình chi tiết: bo góc 28px, nền #0F172A
<SharedHero
  id={`card-${item.id}`}
  mode="morph"
  style={{ borderRadius: 28, backgroundColor: '#0F172A', overflow: 'hidden' }}
>
  <CardFullContent item={item} />
</SharedHero>
```

::: tip Đặt `borderRadius` và `backgroundColor` ở đâu?
Hãy luôn đặt `borderRadius` và `backgroundColor` trực tiếp vào prop `style` của chính thẻ `<SharedHero>` thay vì chỉ đặt ở một `<View>` con bên trong. Native view sẽ đọc thuộc tính layer/background của chính nó để tính toán quá trình morph.
:::

## Các giá trị `mode` khác

- `"shuttle"`: Trong phiên bản v1 hiện tại hoạt động tương đương với `"snapshot"`, được giữ chỗ cho tính năng di chuyển trực tiếp cây view con vào portal trong các bản tới.
- `"zoom"` / `"auto"`: Giữ chỗ cho hiệu ứng `UIViewController.Transition.zoom` trên iOS 18+; hiện tại tự động fallback về `"morph"` để bạn có thể sử dụng an toàn trên cả iOS và Android.

## Điều khiển đường cong độ mờ với `fadeMode`

Trong suốt hành trình bay từ khung nguồn sang khung đích, bên trong container đang bay có hai lớp hình ảnh: lớp nguồn (source) và lớp đích (destination). Prop `fadeMode` quyết định cách thay đổi alpha của hai lớp này theo tiến độ chuẩn hóa \(p \in [0, 1]\):

| `fadeMode` | Alpha lớp nguồn | Alpha lớp đích | Phù hợp nhất cho |
| --- | --- | --- | --- |
| `"cross"` (mặc định) | \(1 - p\) | \(p\) | Ảnh, avatar hoặc thẻ có bố cục hai đầu gần giống nhau |
| `"through"` | Giảm \(1 \to 0\) trong đoạn \(p \in [0, 0.35]\), sau đó giữ \(0\) | Giữ \(0\) đến \(p = 0.40\), rồi tăng \(0 \to 1\) trong đoạn \(p \in [0.40, 1]\) | Chuyển đổi thẻ sang màn hình chi tiết có nội dung chữ và nút bấm khác hẳn nhau (chuẩn Material 3) |
| `"in"` | Giữ nguyên \(1\) suốt đường bay | Tăng dần \(0 \to 1\) đè lên trên lớp nguồn | Hiệu ứng phủ dần nội dung mới lên trên ảnh gốc |
| `"out"` | Giảm dần \(1 \to 0\) phía trên lớp đích | Giữ nguyên \(1\) ở lớp dưới | Làm tan lớp vỏ bọc ngoài để lộ nội dung chi tiết bên dưới |

| Android (`fadeMode="through"`) | iOS (`fadeMode="through"`) |
| --- | --- |
| <video src="https://github.com/user-attachments/assets/8a489841-fea5-4fca-9728-2b549b0d6a0b" controls loop muted playsinline></video> | <video src="https://github.com/user-attachments/assets/f5bd5d09-48c1-4b9c-9705-182d07dd9512" controls loop muted playsinline></video> |

```tsx
<SharedHero
  id={`article-${post.id}`}
  mode="morph"
  fadeMode="through"
  style={{ borderRadius: 20, backgroundColor: '#111827' }}
>
  <ArticleDetail post={post} />
</SharedHero>
```

## Tự động nâng cấp ảnh độ phân giải cao khi phóng to

Một lỗi thị giác rất hay gặp ở các thư viện shared element là khi phóng một ảnh thumbnail nhỏ \(120 \times 160\) lên thành ảnh bìa \(400 \times 520\): nếu chỉ dùng bitmap chụp từ thumbnail thì ảnh sẽ bị rỗ và mờ suốt lúc bay, rồi đột ngột giật nét khi kết thúc.

`react-native-shared-hero` xử lý tự động bước này:

1. Khi diện tích đích lớn hơn diện tích nguồn (zoom-in) và cả hai `<SharedHero>` đều bọc một component ảnh duy nhất (`RCTImageComponentView` trên iOS hoặc `ReactImageView` trên Android), coordinator sẽ kiểm tra xem ảnh đích đã giải mã (decode) xong bitmap hay chưa.
2. Nếu ảnh đích đang đọc từ bộ nhớ đệm, coordinator sẵn sàng đợi tối đa ~120 ms (khoảng 8 frame màn hình) để ảnh vẽ xong.
3. Ngay khi có bitmap nét của màn hình đích, cả hai lớp trong overlay đều dùng bức ảnh độ phân giải cao này để bay, giúp quá trình phóng to sắc nét từ frame đầu tiên đến frame cuối cùng.

## Xử lý `<Text>` không bị mất dấu hay cắt chữ

Khi chuyển cảnh một tiêu đề 1 dòng ở danh sách sang tiêu đề lớn nhiều dòng ở màn hình chi tiết, tỉ lệ khung hình (aspect ratio) của hai khối chữ sẽ khác nhau.

Thay vì dùng chế độ cắt giữa (`aspectFill`) vốn dễ làm bay mất dấu tiếng Việt hoặc cắt cụt đầu/cuối dòng chữ, lớp overlay sẽ co giãn độc lập từng lớp snapshot khớp với khung đang bay đồng thời kết hợp cross-fade. Nhờ vậy chữ ở cả hai trạng thái đều hiển thị trọn vẹn trong suốt quá trình chuyển cảnh.
