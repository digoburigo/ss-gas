import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { interpolate, spring } from "remotion";

interface AnimatedScreenshotProps {
  src: string;
  direction?: "left" | "right" | "bottom";
  delay?: number;
  zoomFrom?: number;
  zoomTo?: number;
  zoomDuration?: number;
  style?: React.CSSProperties;
}

export function AnimatedScreenshot({
  src,
  direction = "left",
  delay = 0,
  zoomFrom = 1,
  zoomTo = 1.08,
  zoomDuration = 300,
  style,
}: AnimatedScreenshotProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideProgress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.8 },
  });

  const offsets = {
    left: { x: -300, y: 0 },
    right: { x: 300, y: 0 },
    bottom: { x: 0, y: 300 },
  };

  const offset = offsets[direction];
  const translateX = interpolate(slideProgress, [0, 1], [offset.x, 0]);
  const translateY = interpolate(slideProgress, [0, 1], [offset.y, 0]);

  const zoom = interpolate(
    frame - delay,
    [0, zoomDuration],
    [zoomFrom, zoomTo],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div
      style={{
        overflow: "hidden",
        borderRadius: 16,
        boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
        opacity: slideProgress,
        transform: `translate(${translateX}px, ${translateY}px)`,
        ...style,
      }}
    >
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${zoom})`,
          transformOrigin: "center center",
        }}
      />
    </div>
  );
}
