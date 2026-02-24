import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export function useFadeIn(delay = 0, duration = 20) {
  const frame = useCurrentFrame();
  return interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

export function useFadeOut(startAt: number, duration = 20) {
  const frame = useCurrentFrame();
  return interpolate(frame - startAt, [0, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

export function useSlideIn(
  direction: "left" | "right" | "bottom" | "top" = "left",
  delay = 0,
) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.8 },
  });

  const offsets: Record<string, { x: number; y: number }> = {
    left: { x: -200, y: 0 },
    right: { x: 200, y: 0 },
    bottom: { x: 0, y: 200 },
    top: { x: 0, y: -200 },
  };

  const offset = offsets[direction];
  return {
    x: interpolate(progress, [0, 1], [offset.x, 0]),
    y: interpolate(progress, [0, 1], [offset.y, 0]),
    opacity: progress,
  };
}

export function useZoom(delay = 0, from = 1, to = 1.1, duration = 300) {
  const frame = useCurrentFrame();
  return interpolate(frame - delay, [0, duration], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

export function useSpring(delay = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 100, mass: 0.8 },
  });
}

export function useSceneTransition(sceneDuration: number, fadeFrames = 15) {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, fadeFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(
    frame,
    [sceneDuration - fadeFrames, sceneDuration],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return Math.min(fadeIn, fadeOut);
}
