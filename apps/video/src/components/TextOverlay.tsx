import { useCurrentFrame, useVideoConfig } from "remotion";
import { interpolate, spring } from "remotion";
import { COLORS } from "../constants";

interface TextOverlayProps {
  text: string;
  delay?: number;
  position?: "bottom-left" | "bottom-right" | "top-left" | "center";
  subtitle?: string;
}

export function TextOverlay({
  text,
  delay = 15,
  position = "bottom-left",
  subtitle,
}: TextOverlayProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 100, mass: 0.8 },
  });

  const positionStyles: Record<string, React.CSSProperties> = {
    "bottom-left": { bottom: 80, left: 80 },
    "bottom-right": { bottom: 80, right: 80 },
    "top-left": { top: 80, left: 80 },
    center: {
      top: "50%",
      left: "50%",
      transform: `translate(-50%, -50%) scale(${progress})`,
    },
  };

  const translateX =
    position !== "center" ? interpolate(progress, [0, 1], [-40, 0]) : 0;

  return (
    <div
      style={{
        position: "absolute",
        ...positionStyles[position],
        opacity: progress,
        transform:
          position !== "center"
            ? `translateX(${translateX}px)`
            : positionStyles[position].transform,
        maxWidth: 700,
      }}
    >
      <div
        style={{
          background: COLORS.overlay,
          backdropFilter: "blur(20px)",
          borderRadius: 12,
          padding: "24px 36px",
          borderLeft: `4px solid ${COLORS.accent}`,
        }}
      >
        <div
          style={{
            color: COLORS.white,
            fontSize: 32,
            fontWeight: 600,
            fontFamily: "Inter, system-ui, sans-serif",
            lineHeight: 1.3,
          }}
        >
          {text}
        </div>
        {subtitle ? (
          <div
            style={{
              color: COLORS.gray,
              fontSize: 22,
              fontWeight: 400,
              fontFamily: "Inter, system-ui, sans-serif",
              marginTop: 8,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
    </div>
  );
}
