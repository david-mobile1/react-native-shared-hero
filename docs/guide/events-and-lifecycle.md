---
description: "Listen to onTransitionStart and onTransitionEnd events, control return flights with returnFlightEnabled, isolate registries with namespace, and handle mid-air flight takeovers."
---

# Events & lifecycle

`SharedHero` provides lifecycle callbacks and control props (`enabled`, `returnFlightEnabled`, and `namespace`) so you can coordinate surrounding UI elements, scope hero IDs across independent navigation trees, and handle interrupted transitions cleanly.

## Lifecycle callbacks

Both callbacks receive a plain `SharedHeroTransitionEvent` object (`{ id: string, namespace: string }`) unwrapped from the native synthetic event:

| Prop | Payload (`SharedHeroTransitionEvent`) | When it fires |
| --- | --- | --- |
| `onTransitionStart` | `{ id: string, namespace: string }` | Fired on the source view when a forward flight begins, or on the destination view when a return flight begins. |
| `onTransitionEnd` | `{ id: string, namespace: string }` | Fired on the destination view when a forward flight lands, or on the source view when a return flight finishes. |

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
          console.log('Flight started:', namespace, id);
          setChromeVisible(false);
        }}
        onTransitionEnd={({ id, namespace }) => {
          console.log('Flight ended:', namespace, id);
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

## Isolating hero registries with `namespace`

By default, all `<SharedHero>` instances share `namespace="default"` and are matched by the composite key `namespace::id`.

If your app renders the same data item across multiple independent navigation trees (for example, a Home feed tab and a Profile bookmarks tab that can both stay mounted), pass a distinct `namespace` to prevent cross-tab collisions:

```tsx
<SharedHero id={`post-${post.id}`} namespace="bookmarks" mode="morph">
  <PostThumbnail post={post} />
</SharedHero>
```

## Controlling back flights with `returnFlightEnabled`

By default (`returnFlightEnabled={true}`), unmounting a destination `<SharedHero>` automatically triggers a return flight back to the matching source `<SharedHero>`.

If your destination lives inside a container whose own dismissal animation already carries the view off-screen, you can disable only the outbound return flight while keeping the inbound flight intact:

```tsx
<SharedHero
  id={`modal-photo-${item.id}`}
  returnFlightEnabled={false}
>
  <Image source={{ uri: item.uri }} style={styles.image} />
</SharedHero>
```

## Endpoint visibility and soft handoff

While a transition for `namespace::id` is running:

1. Both the source view and the destination view are hidden by `FlightEngine` (`isHidden = true` on `contentView` on iOS, `alpha = 0f` on Android) so you never see duplicate ghost elements underneath the flying overlay.
2. When the geometric flight finishes, `FlightEngine` un-hides the destination endpoint first and then fades out the overlay clone over a brief soft-handoff window, eliminating single-frame flicker.

## Mid-air flight takeovers

Users frequently tap Back or swipe to dismiss while the forward push flight is still in mid-air.

If a transition for `id="photo-1"` is currently halfway across the screen when the destination screen pops:

1. `FlightEngine` detects that an `ActiveFlight` for the same key is still on screen (`canTakeOver`).
2. Instead of running two conflicting overlays or snapping to the settled destination rect, `FlightEngine` interrupts the old flight, reads the flying view's **live presentation rect** in window coordinates (`layer.presentation()?.frame` on iOS, live container bounds on Android), and starts the return flight from that exact mid-air position.
3. The element reverses course smoothly back into its source slot without jumping.

## Conditional participation with `enabled`

Pass `enabled={false}` to temporarily take a `<SharedHero>` out of `HeroRegistry` without changing your React component tree:

```tsx
<SharedHero
  id={`video-${clip.id}`}
  enabled={!isPictureInPictureActive}
>
  <VideoPreview clip={clip} />
</SharedHero>
```

When `enabled` changes from `true` to `false` on a mounted view, the native view immediately unregisters from `HeroRegistry`, so subsequent navigations proceed as normal screen transitions.
