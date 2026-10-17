import { useCallback, useState } from 'react';

/**
 * State helper for in-place (non-navigation) shared-hero transitions within the
 * same screen.
 *
 * Render two `<SharedHero id="x">` branches keyed on `active` (for example, a
 * collapsed pill and an expanded card). Calling `start()`, `end()`, or
 * `toggle()` swaps which branch is mounted, and the native coordinator matches
 * the unmounting and mounting views within the same frame to run a flight.
 *
 * Navigation-driven transitions (React Navigation, Expo Router, `<Modal>`) do
 * not need this hook.
 *
 * @param initial - Initial value of `active`. Defaults to `false`.
 * @returns An object with the current `active` boolean and stable `start`,
 *   `end`, and `toggle` callbacks.
 *
 * @example
 * ```tsx
 * const { active, toggle } = useSharedHero();
 *
 * return (
 *   <Pressable onPress={toggle}>
 *     {active ? (
 *       <SharedHero id="player" mode="morph" style={styles.expanded}>
 *         <ExpandedPlayer />
 *       </SharedHero>
 *     ) : (
 *       <SharedHero id="player" mode="morph" style={styles.mini}>
 *         <MiniPlayer />
 *       </SharedHero>
 *     )}
 *   </Pressable>
 * );
 * ```
 */
export function useSharedHero(initial = false): {
  /** Whether the transition is currently in the active (expanded) state. */
  active: boolean;
  /** Sets `active` to `true`. */
  start: () => void;
  /** Sets `active` to `false`. */
  end: () => void;
  /** Flips `active` between `false` and `true`. */
  toggle: () => void;
} {
  const [active, setActive] = useState(initial);
  const start = useCallback(() => setActive(true), []);
  const end = useCallback(() => setActive(false), []);
  const toggle = useCallback(() => setActive((a) => !a), []);
  return { active, start, end, toggle };
}
