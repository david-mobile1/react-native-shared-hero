---
description: Cấu hình duration, các preset easing cubic-Bezier, vật lý lò xo spring (damping, stiffness, mass) và quỹ đạo bay thẳng hoặc vòng cung trong react-native-shared-hero.
---

# Thời gian, Spring và quỹ đạo bay

Mọi chuyển động trong `react-native-shared-hero` được quyết định bởi hai yếu tố độc lập:

1. **Quỹ đạo không gian (`motionPath`)**: đường đi của tâm phần tử trên màn hình (`"linear"` đi thẳng hoặc `"arc"` đi vòng cung).
2. **Bộ điều khiển thời gian (`spring` so với `duration` + `easing`)**: cách tiến độ dịch chuyển dọc theo quỹ đạo đó theo thời gian.

## Playground tương tác {#interactive-playground}

Bạn có thể kéo thanh trượt hoặc đổi các thông số bên dưới để so sánh chuyển động vật lý `spring` với đường cong `duration` + `easing`, thử quỹ đạo `"arc"` và copy nhanh đoạn JSX cho `<SharedHero>`:

<TransitionPlayground />

## Vật lý lò xo (`spring`)

Khi bạn truyền prop `spring` vào `<SharedHero>`, thư viện sẽ bỏ qua `duration` và `easing` để chạy bộ giải phương trình lò xo thuần native của từng hệ điều hành:

- **iOS**: `CASpringAnimation` chạy trực tiếp trên render server của Core Animation.
- **Android**: `SpringAnimation` của `androidx.dynamicanimation` đồng bộ theo từng nhịp `Choreographer`.

| Android (Spring so với Duration) | iOS (Spring so với Duration) |
| --- | --- |
| <video src="https://github.com/user-attachments/assets/172f6e38-2c55-40dd-af5f-dfaae2eb79da" controls loop muted playsinline></video> | <video src="https://github.com/user-attachments/assets/530774c9-15b4-45c1-a987-cc927c5e1c2c" controls loop muted playsinline></video> |

```tsx
<SharedHero
  id={`card-${item.id}`}
  mode="morph"
  spring={{
    damping: 22,
    stiffness: 260,
    mass: 1,
  }}
>
  <CardDetail item={item} />
</SharedHero>
```

### Ý nghĩa các thông số `spring`

| Thông số | Mặc định | Giải thích |
| --- | --- | --- |
| `damping` | `22` | Hệ số cản nhớt \(c\). Giá trị thấp (`12` đến `16`) tạo độ nảy rõ rệt khi chạm đích; khoảng `22` đến `28` giúp phần tử đáp êm và dứt khoát. |
| `stiffness` | `260` | Độ cứng lò xo \(k\). Giá trị càng cao (`320` đến `450`) thì lực bật ban đầu càng nhanh và mạnh. |
| `mass` | `1` | Khối lượng ảo \(m\) của vật thể. Được áp dụng trực tiếp cho `CASpringAnimation.mass` trên iOS. Trên Android, `SpringForce` chuẩn hóa về khối lượng đơn vị (`1`) và quy đổi `damping` + `stiffness` sang tỉ số tắt dần \(\zeta = \frac{c}{2\sqrt{k}}\) cùng tần số dao động riêng tương ứng. |

::: info Vì sao `spring` cho cảm giác tự nhiên hơn trên màn hình cảm ứng?
Các đường cong theo `duration` luôn ép chuyển động chạy trong một khoảng mili-giây cố định bất kể quãng đường ngắn hay dài. Ngược lại, vật lý `spring` bảo toàn vận tốc khi bị ngắt quãng giữa chừng (xem phần [Đổi hướng ngay giữa không trung](/vi/guide/events-and-lifecycle#mid-air-flight-takeovers)) và giảm tốc tự nhiên khi tiến sát vị trí đích.
:::

## Thời lượng cố định và đường cong Bezier (`duration` + `easing`)

Nếu bạn không truyền `spring`, chuyến bay sẽ chạy theo thời gian cố định `duration` (mặc định `320` ms) cùng đường cong cubic-Bezier được chọn trong `easing` (mặc định `"standard"`):

```tsx
<SharedHero
  id={`poster-${item.id}`}
  duration={380}
  easing="emphasized"
>
  <PosterDetail item={item} />
</SharedHero>
```

### Danh sách các preset `easing`

| Preset | Tọa độ điểm điều khiển \((x_1, y_1, x_2, y_2)\) | Đặc tính chuyển động |
| --- | --- | --- |
| `"standard"` (mặc định) | `(0.2, 0.0, 0.0, 1.0)` | Đường cong chuẩn Material 3: bứt tốc nhanh ở đầu và giảm tốc mượt, kéo dài ở cuối. |
| `"emphasized"` | `(0.3, 0.0, 0.0, 1.0)` | Nhịp xuất phát dứt khoát hơn `"standard"`, rất hợp khi bung thẻ ra toàn màn hình. |
| `"easeOut"` | `(0.0, 0.0, 0.58, 1.0)` | Xuất phát ở tốc độ tối đa và chậm dần khi vào đích. |
| `"easeInOut"` | `(0.42, 0.0, 0.58, 1.0)` | Tăng tốc và giảm tốc đối xứng ở hai đầu. |
| `"easeIn"` | `(0.42, 0.0, 1.0, 1.0)` | Khởi đầu chậm rồi tăng tốc dần về phía đích. |
| `"linear"` | `(0.0, 0.0, 1.0, 1.0)` | Vận tốc không đổi từ đầu đến cuối. |

## Quỹ đạo bay: `"linear"` so với `"arc"`

Mặc định (`motionPath="linear"`), tâm của view đang bay di chuyển theo một đường thẳng nối từ tâm nguồn \((x_0, y_0)\) tới tâm đích \((x_1, y_1)\).

Khi một phần tử vừa dịch chuyển ngang vừa dịch chuyển dọc (chẳng hạn từ một ô nhỏ ở góc dưới bên phải bay lên làm ảnh header ở chính giữa phía trên), đường chéo thẳng tắp đôi khi trông hơi cứng. Đặt `motionPath="arc"` sẽ chuyển quỹ đạo tâm sang đường cong Bezier bậc hai:

\[
B(t) = (1 - t)^2 P_0 + 2(1 - t)t P_{\text{ctrl}} + t^2 P_1
\]

trong đó điểm điều khiển \(P_{\text{ctrl}}\) được đẩy lệch vuông góc với dây cung \(P_0 \to P_1\) một khoảng bằng **18%** độ dài dây cung về phía trên màn hình.

| Android (`motionPath="arc"`) | iOS (`motionPath="arc"`) |
| --- | --- |
| <video src="https://github.com/user-attachments/assets/1d951962-e393-48aa-8ad0-7e338a2d70f4" controls loop muted playsinline></video> | <video src="https://github.com/user-attachments/assets/58a7ab8b-aaa6-4254-8d3c-1db7f883c528" controls loop muted playsinline></video> |

```tsx
<SharedHero
  id={`badge-${item.id}`}
  mode="morph"
  motionPath="arc"
  duration={420}
>
  <BadgeExpanded item={item} />
</SharedHero>
```

## Cấu hình ở đầu nào sẽ được ưu tiên?

Trong một chuyển cảnh luôn có hai `<SharedHero>`: view nguồn và view đích.

- **Khi bay tới (Source -> Destination)**: Các prop `mode`, `duration`, `spring`, `easing`, `fadeMode` và `motionPath` của **view đích** sẽ quyết định chuyến bay.
- **Khi bay về (Destination -> Source)**: Chính cấu hình của **view đích vừa unmount** cũng sẽ điều khiển chuyến bay quay lại view nguồn. Nhờ đó hai chiều đi và về luôn đồng bộ với nhau mà bạn không cần lặp lại cấu hình timing ở từng item trong danh sách.
