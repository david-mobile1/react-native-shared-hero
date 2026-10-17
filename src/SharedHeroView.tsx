import { useMemo } from 'react';
import type { NativeSyntheticEvent } from 'react-native';
import NativeSharedHero from './SharedHeroViewNativeComponent';
import type { SharedHeroProps } from './types';

type NativeTransitionEvent = NativeSyntheticEvent<{
  id: string;
  ns: string;
}>;

/**
 * Native shared-element container component for React Native (Fabric).
 *
 * Wrap any image, card, or view subtree in `<SharedHero id="...">` on both the
 * source and destination screens. When navigation or state changes mount a
 * matching hero with the same `id` (and `namespace`), the native coordinator
 * captures both endpoints and runs the flight in an overlay above the host
 * window at display refresh rate.
 *
 * Also exported under the alias `SharedHero`.
 *
 * @example
 * ```tsx
 * import { SharedHero } from 'react-native-shared-hero';
 *
 * // Source screen
 * <SharedHero id={`poster-${item.id}`} mode="morph" style={{ borderRadius: 12 }}>
 *   <Image source={{ uri: item.uri }} style={{ width: 120, height: 160 }} />
 * </SharedHero>
 *
 * // Destination screen
 * <SharedHero id={`poster-${item.id}`} mode="morph" style={{ borderRadius: 24 }}>
 *   <Image source={{ uri: item.uri }} style={{ width: '100%', height: 420 }} />
 * </SharedHero>
 * ```
 */
export function SharedHeroView({
  id,
  namespace = 'default',
  mode = 'snapshot',
  duration,
  spring,
  fadeMode = 'cross',
  easing = 'standard',
  motionPath = 'linear',
  enabled = true,
  returnFlightEnabled = true,
  onTransitionStart,
  onTransitionEnd,
  style,
  children,
  ...rest
}: SharedHeroProps) {
  const startHandler = useMemo(() => {
    if (!onTransitionStart) return undefined;
    return (e: NativeTransitionEvent) =>
      onTransitionStart({ id: e.nativeEvent.id, namespace: e.nativeEvent.ns });
  }, [onTransitionStart]);

  const endHandler = useMemo(() => {
    if (!onTransitionEnd) return undefined;
    return (e: NativeTransitionEvent) =>
      onTransitionEnd({ id: e.nativeEvent.id, namespace: e.nativeEvent.ns });
  }, [onTransitionEnd]);

  return (
    <NativeSharedHero
      {...rest}
      style={style}
      heroId={id}
      heroNamespace={namespace}
      mode={mode}
      duration={duration}
      springDamping={spring?.damping}
      springStiffness={spring?.stiffness}
      springMass={spring?.mass}
      fadeMode={fadeMode}
      easing={easing}
      motionPath={motionPath}
      enabled={enabled}
      returnFlightEnabled={returnFlightEnabled}
      onTransitionStart={startHandler}
      onTransitionEnd={endHandler}
    >
      {children}
    </NativeSharedHero>
  );
}
