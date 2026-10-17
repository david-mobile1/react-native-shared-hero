import type { ReactNode } from 'react';
import type { ViewProps } from 'react-native';

/**
 * Transition style for a shared-hero element.
 *
 * - `"snapshot"` (default): captures bitmaps of the source and destination
 *   views, translates and scales the flying clone on the window overlay, and
 *   cross-fades between the two snapshots.
 * - `"morph"`: Material container transform that interpolates bounds, corner
 *   radius (`borderRadius`), and background color while clipping the two
 *   snapshots inside the morphing container.
 * - `"shuttle"`: alias of `"snapshot"` in v1; reserved for a future native
 *   portal that renders a custom React subtree mid-flight.
 * - `"zoom"`: reserved for iOS 18+ system zoom transitions on a
 *   `UINavigationController` push; currently falls back to `"morph"`.
 * - `"auto"`: uses `"zoom"` where natively supported, otherwise `"morph"`.
 */
export type SharedHeroMode = 'snapshot' | 'morph' | 'shuttle' | 'zoom' | 'auto';

/**
 * Controls how the source and destination snapshots fade against each other
 * during a flight.
 *
 * - `"cross"` (default): source fades `1 -> 0` while destination fades `0 -> 1`
 *   linearly across the full duration.
 * - `"in"`: source stays opaque (`1`) while destination fades `0 -> 1` on top.
 * - `"out"`: destination stays opaque (`1`) underneath while source fades `1 -> 0`.
 * - `"through"`: Material fade-through curve. Source fades out over the first
 *   35% of progress, followed by a 5% gap, then destination fades in over the
 *   remaining 60%.
 */
export type FadeMode = 'cross' | 'in' | 'out' | 'through';

/**
 * Trajectory followed by the flying element's center point.
 *
 * - `"linear"` (default): straight line from the source center to the
 *   destination center.
 * - `"arc"`: quadratic Bezier arc bowed perpendicular to the chord by 18% of
 *   the center-to-center distance (Material Motion arc path).
 */
export type MotionPath = 'linear' | 'arc';

/**
 * Physics parameters for spring-driven flights. When `spring` is provided on
 * {@link SharedHeroProps}, it takes precedence over `duration` and `easing`.
 */
export type SpringConfig = {
  /**
   * Spring damping coefficient (c) on iOS (`CASpringAnimation.damping`) and
   * converted to damping ratio on Android (`SpringForce.dampingRatio`).
   *
   * @defaultValue 22
   */
  damping?: number;

  /**
   * Spring stiffness constant (k).
   *
   * @defaultValue 260
   */
  stiffness?: number;

  /**
   * Virtual mass attached to the spring (m). Supported natively on iOS
   * (`CASpringAnimation.mass`); Android's `SpringForce` assumes unit mass (`1`).
   *
   * @defaultValue 1
   */
  mass?: number;
};

/**
 * Named cubic-Bezier timing curves for duration-based flights.
 *
 * - `"linear"`: `(0, 0, 1, 1)`
 * - `"easeIn"`: `(0.42, 0, 1, 1)`
 * - `"easeOut"`: `(0, 0, 0.58, 1)`
 * - `"easeInOut"`: `(0.42, 0, 0.58, 1)`
 * - `"standard"` (default): `(0.2, 0, 0, 1)` (Material 3 standard curve)
 * - `"emphasized"`: `(0.3, 0, 0, 1)` (Material 3 emphasized curve)
 */
export type EasingName =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'standard'
  | 'emphasized';

/**
 * Payload delivered to the `onTransitionStart` and `onTransitionEnd` callbacks
 * on {@link SharedHeroProps}.
 */
export type SharedHeroTransitionEvent = {
  /** The `id` prop of the hero participating in the transition. */
  id: string;
  /** The `namespace` prop of the hero participating in the transition. */
  namespace: string;
};

/**
 * Props accepted by {@link SharedHero} / {@link SharedHeroView}.
 *
 * Extends React Native's standard `ViewProps` (`style`, `onLayout`,
 * accessibility props, etc.). Style properties such as `borderRadius` and
 * `backgroundColor` are read directly by the native transition coordinator in
 * `"morph"` mode.
 */
export type SharedHeroProps = ViewProps & {
  /**
   * Stable identifier matched across screens or in-place state swaps. When a
   * `SharedHero` with the same `namespace` and `id` unmounts (or becomes
   * covered by a pushed screen) and another mounts within the native matching
   * window, a flight runs between their window-space rects.
   */
  id: string;

  /**
   * Namespace for isolating hero registries across independent tab trees or
   * feature flows. The internal matching key is `namespace::id`.
   *
   * @defaultValue "default"
   */
  namespace?: string;

  /**
   * Visual transition style.
   *
   * - `"snapshot"` (default): bitmap clone, translate + scale + crossfade.
   * - `"morph"`: Material container transform that interpolates bounds, corner
   *   radius, background color, and clip shape.
   * - `"shuttle"`: alias of `"snapshot"` in v1.
   * - `"zoom"` / `"auto"`: system zoom where supported, otherwise `"morph"`.
   *
   * @defaultValue "snapshot"
   */
  mode?: SharedHeroMode;

  /**
   * Animation duration in milliseconds for time-based flights. Ignored when
   * `spring` is provided.
   *
   * @defaultValue 320
   */
  duration?: number;

  /**
   * Optional spring physics configuration. When set, overrides `duration` and
   * `easing` and drives the flight with native spring animations
   * (`CASpringAnimation` on iOS, `SpringAnimation` on Android).
   */
  spring?: SpringConfig;

  /**
   * Controls how the source and destination snapshots fade during the flight.
   *
   * @defaultValue "cross"
   */
  fadeMode?: FadeMode;

  /**
   * Easing preset for duration-based flights. Ignored when `spring` is set.
   *
   * @defaultValue "standard"
   */
  easing?: EasingName;

  /**
   * Trajectory path followed by the flying element's center point.
   *
   * - `"linear"` (default): straight line from source to destination.
   * - `"arc"`: curved Material-style arc.
   *
   * @defaultValue "linear"
   */
  motionPath?: MotionPath;

  /**
   * Whether this hero view participates in shared-element flights. Set to
   * `false` to temporarily unregister the view without unmounting its React
   * subtree.
   *
   * @defaultValue true
   */
  enabled?: boolean;

  /**
   * Whether unmounting this hero triggers a return (back) flight to a still-mounted
   * source hero with the same `namespace::id`.
   *
   * Set to `false` when the dismissal animation already moves the element away
   * (for example, a React Native `<Modal animationType="slide">` sliding down),
   * preventing a redundant return flight after the modal closes. Affects only
   * the unregister / back-flight path; inbound flights are unaffected.
   *
   * @defaultValue true
   */
  returnFlightEnabled?: boolean;

  /**
   * Callback fired on the source view when an outbound flight begins, or on the
   * destination view when an interactive/automatic return flight begins.
   */
  onTransitionStart?: (e: SharedHeroTransitionEvent) => void;

  /**
   * Callback fired on the destination view when an inbound flight finishes, or
   * on the source view when a return flight finishes.
   */
  onTransitionEnd?: (e: SharedHeroTransitionEvent) => void;

  /** React children rendered inside the native hero container view. */
  children?: ReactNode;
};
