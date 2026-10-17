---
description: "Use react-native-shared-hero across native stacks, modals, transparent modals, form sheets, React Native core Modals, and bottom tab navigators."
---

# Stack, modals, sheets & tabs

Because `react-native-shared-hero` renders its flying clones in a window-level overlay (`OverlayHost` using a `UIWindow` at `UIWindow.Level.alert + 1` on iOS and `DecorView.overlay` on Android), it is not confined to a single navigation container. You can fly shared elements across almost any presentation style.

## 1. Native Stack (`@react-navigation/native-stack` / Expo Router)

For standard push/pop transitions, configure your detail route so the screen transition complements the hero flight rather than fighting it:

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

### Why `animation: 'fade'` on iOS only?

- **iOS**: The default iOS push slides the entire screen from right to left. Cross-fading the background (`animation: 'fade'`) keeps the focus on the shared element flying smoothly between its source and destination coordinates.
- **Android**: In `react-native-screens`, `animation: 'fade'` uses a short XML fade-out when popping, which detaches the outgoing Fragment view hierarchy before a 320 ms return flight finishes. Keeping Android's default native stack animation preserves the underlying screen during the return flight.

## 2. Native modals & transparent modals

When presenting a route with `presentation: 'modal'` or `presentation: 'transparentModal'`, the source screen **stays mounted** underneath the modal instead of detaching.

`HeroRegistry` handles this automatically by maintaining an ordered list (`live[key]`) of mounted views per `namespace::id`:

- When the modal mounts a second `<SharedHero id="item-1">`, `HeroRegistry` pairs the newly mounted view in the modal as the destination and the underlying list screen's view as the source.
- When the modal dismisses (via a close button or interactive swipe-down), the modal's view unregisters and flies back to the still-mounted source view on the list screen.

### Native modal (`presentation: 'modal'`)

| Android | iOS |
| --- | --- |
| <video src="https://github.com/user-attachments/assets/400aaaf4-834c-4b56-9685-039f550b3dae" controls loop muted playsinline></video> | <video src="https://github.com/user-attachments/assets/fa454b2c-52eb-44e2-b1e0-2b4365894ead" controls loop muted playsinline></video> |

### Transparent modal (`presentation: 'transparentModal'`)

| Android | iOS |
| --- | --- |
| <video src="https://github.com/user-attachments/assets/75c35270-4264-45c0-be64-f53ea62a2bbf" controls loop muted playsinline></video> | <video src="https://github.com/user-attachments/assets/67607ca1-05e3-4604-a151-5b175642d288" controls loop muted playsinline></video> |

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

## 3. Form sheets & bottom sheets (`presentation: 'formSheet'`)

On iOS 15+, `react-native-screens` supports native `UISheetPresentationController` sheets (`presentation: 'formSheet'` with `sheetAllowedDetents`).

Inside a sheet, standard view-hierarchy portals get clipped to the sheet's rounded top edge. Because `OverlayHost`'s `UIWindow` lives at `.alert + 1` above the sheet presentation controller's container view, the hero element flies cleanly from a background screen straight into the sheet's current detent position, and `InteractiveModalReturn` tracks interactive sheet swipe-to-dismiss gestures automatically.

| Android | iOS |
| --- | --- |
| <video src="https://github.com/user-attachments/assets/33ab7627-e958-4477-8787-6642226c8a71" controls loop muted playsinline></video> | <video src="https://github.com/user-attachments/assets/ad56aa9d-eb1f-4157-9c9e-1822f699d4fe" controls loop muted playsinline></video> |

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

## 4. React Native core `<Modal>`

You do not need a navigation library to trigger a cross-window shared element transition. React Native's built-in `<Modal>` mounts its content in a separate native window (`RCTModalHostView` `UIWindow` on iOS, and a separate `Dialog` `Window` on Android).

`OverlayHost` handles both platforms automatically:

- **iOS**: `OverlayHost`'s window level (`UIWindow.Level.alert + 1`) sits above `RCTModalHostView`'s window.
- **Android**: `OverlayHost.resolveOverlay(view)` resolves the `ViewGroupOverlay` from the destination view's own `rootView` (`DecorView`). On forward open, the flight renders in the `<Modal>` Dialog's `DecorView.overlay` (above the modal content); on dismiss, the return flight renders in the host Activity's `DecorView.overlay`.

| Android | iOS |
| --- | --- |
| <video src="https://github.com/user-attachments/assets/eb76f4bc-1014-4abd-b626-851b7577c9e9" controls loop muted playsinline></video> | <video src="https://github.com/user-attachments/assets/d70f7f85-8db7-482f-89af-d3dcba0d1169" controls loop muted playsinline></video> |

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

## 5. Tabs & multi-step flows

### Tabs to detail hero

Give the tab cards a dedicated `namespace="tabs"` and match that `namespace` on the stack detail screen:

| Android | iOS |
| --- | --- |
| <video src="https://github.com/user-attachments/assets/2de41d36-1a22-4064-b33c-3e498add10d0" controls loop muted playsinline></video> | <video src="https://github.com/user-attachments/assets/e27aae00-8c37-461b-ba8f-b15f306cd52d" controls loop muted playsinline></video> |

### Multi-step drill-down (A -> B -> C)

You can chain hero flights across multiple pushed screens (`List -> Overview -> Fullscreen Photo`) by sharing each step's `id` between the tapped thumbnail and the next detail screen's main hero:

| Android | iOS |
| --- | --- |
| <video src="https://github.com/user-attachments/assets/425bb373-5a88-46cf-8fa3-3207938fa06c" controls loop muted playsinline></video> | <video src="https://github.com/user-attachments/assets/172ca32e-0e9a-44f0-8d69-90dcfad1c36e" controls loop muted playsinline></video> |
