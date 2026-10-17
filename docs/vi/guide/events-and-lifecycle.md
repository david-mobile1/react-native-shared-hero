---
description: "Lắng nghe sự kiện onTransitionStart và onTransitionEnd, điều khiển chiều bay về với returnFlightEnabled, cô lập vùng tên bằng namespace và xử lý đổi hướng ngay giữa không trung."
---

# Sự kiện và vòng đời

`SharedHero` cung cấp các callback vòng đời cùng nhóm prop điều khiển (`enabled`, `returnFlightEnabled`, `namespace`) giúp bạn đồng bộ giao diện phụ trợ xung quanh, tách biệt vùng định danh giữa các nhánh tab độc lập và xử lý mượt mà khi người dùng ngắt thao tác.

## Các callback vòng đời

Cả hai callback đều nhận trực tiếp một object `SharedHeroTransitionEvent` (`{ id: string, namespace: string }`) đã được bóc tách sẵn từ `nativeEvent`:

| Prop | Dữ liệu (`SharedHeroTransitionEvent`) | Thời điểm kích hoạt |
| --- | --- | --- |
| `onTransitionStart` | `{ id: string, namespace: string }` | Gọi trên view nguồn khi bắt đầu bay chiều đi, hoặc trên view đích khi bắt đầu bay chiều về. |
| `onTransitionEnd` | `{ id: string, namespace: string }` | Gọi trên view đích khi chuyến bay chiều đi đáp xuống, hoặc trên view nguồn khi chuyến bay chiều về kết thúc. |

```tsx
import { useState } from 'react';
import { SharedHero } from 'react-native-shared-hero';

export function DetailHeader({ item }) {
  const [chromeVisible, setChromeVisible] = useState(false);

  return (
    <>
      <SharedHero
        id={`photo-${item.id}`}
        namespace="feed"
        mode="morph"
        onTransitionStart={({ id, namespace }) => {
          console.log('Bắt đầu bay:', namespace, id);
          setChromeVisible(false);
        }}
        onTransitionEnd={({ id, namespace }) => {
          console.log('Kết thúc bay:', namespace, id);
          setChromeVisible(true);
        }}
      >
        <HeroImage uri={item.fullUrl} />
      </SharedHero>

      {chromeVisible && <FloatingActionButtons />}
    </>
  );
}
```

## Tách biệt vùng định danh với `namespace`

Mặc định, mọi `<SharedHero>` đều dùng `namespace="default"` và được ghép cặp theo khóa tổng hợp `namespace::id`.

Nếu ứng dụng của bạn hiển thị cùng một item dữ liệu ở nhiều cây điều hướng độc lập cùng lúc (chẳng hạn tab Trang chủ và tab Đã lưu đều đang mount), hãy truyền `namespace` riêng cho từng khu vực để tránh ghép cặp nhầm giữa hai tab:

```tsx
<SharedHero id={`post-${post.id}`} namespace="bookmarks" mode="morph">
  <PostThumbnail post={post} />
</SharedHero>
```

## Bật/tắt chiều bay về với `returnFlightEnabled`

Mặc định (`returnFlightEnabled={true}`), khi `<SharedHero>` ở màn hình đích unmount, thư viện sẽ tự động kích hoạt chuyến bay chiều về lại `<SharedHero>` nguồn.

Nếu màn hình đích của bạn nằm trong một container mà bản thân hiệu ứng đóng của container đó đã tự cuốn phần tử ra khỏi màn hình, bạn có thể tắt riêng chiều bay về mà vẫn giữ nguyên chiều bay đi:

```tsx
<SharedHero
  id={`modal-photo-${item.id}`}
  returnFlightEnabled={false}
>
  <Image source={{ uri: item.uri }} style={styles.image} />
</SharedHero>
```

## Cơ chế ẩn/hiện hai đầu và chuyển giao êm (Soft handoff)

Khi một transition cho `namespace::id` đang chạy:

1. Cả view nguồn lẫn view đích đều được `FlightEngine` tạm ẩn ở tầng native (`contentView.isHidden = true` trên iOS, `alpha = 0f` trên Android) để người dùng không bao giờ nhìn thấy bóng mờ bị lặp bên dưới lớp overlay.
2. Khi phần tử bay tới đích, `FlightEngine` mở hiển thị lại view đích trước rồi mới làm mờ nhanh lớp overlay trong vài chục mili-giây (soft handoff), loại bỏ triệt để hiện tượng nháy trắng 1 frame.

## Đổi hướng ngay giữa không trung {#mid-air-flight-takeovers}

Trong thực tế, người dùng rất hay vừa bấm mở màn hình chi tiết được nửa chừng đã lập tức bấm Back hoặc vuốt quay lại.

Nếu chuyến bay của `id="photo-1"` đang đi được nửa đường mà màn hình đích bị đóng:

1. `FlightEngine` phát hiện đang có một `ActiveFlight` của cùng khóa `namespace::id` trên màn hình (`canTakeOver`).
2. Thay vì vẽ chồng hai lớp overlay hoặc bắt phần tử nhảy cóc tới vị trí đích rồi mới bay về, `FlightEngine` ngắt chuyến bay cũ, đọc trực tiếp **khung tọa độ đang hiển thị ngay trên không trung** (`layer.presentation()` trên iOS và khung thực tế của container trên Android) rồi khởi tạo chuyến bay về ngay từ vị trí đó.
3. Phần tử đổi chiều mượt mà và quay về đúng ô nguồn mà không hề bị giật.

## Bật/tắt linh hoạt với `enabled`

Bạn có thể truyền `enabled={false}` để tạm thời rút một `<SharedHero>` ra khỏi `HeroRegistry` mà không cần thay đổi cấu trúc cây component:

```tsx
<SharedHero
  id={`video-${clip.id}`}
  enabled={!isPictureInPictureActive}
>
  <VideoPreview clip={clip} />
</SharedHero>
```

Khi `enabled` chuyển từ `true` sang `false` trên một view đang mount, native view sẽ hủy đăng ký khỏi `HeroRegistry` ngay lập tức để các lần chuyển trang tiếp theo diễn ra bình thường.
