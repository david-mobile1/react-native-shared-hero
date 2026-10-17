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

- **Tab screens pushing to a stack detail**: Give the tab cards a dedicated `namespace="tabs"` and match that `namespace` on the stack detail screen.
- **Multi-step drill-down (A -> B -> C)**: You can chain hero flights across multiple pushed screens (`List -> Overview -> Fullscreen Photo`) by giving the overview screen one hero that matches the list (`id="photo-1"`) or chaining into a second hero for the deeper screen.
