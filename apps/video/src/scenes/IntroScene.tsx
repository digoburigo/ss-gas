import {
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { interpolate, spring } from "remotion";
import { COLORS, TEXTS } from "../constants";

export function IntroScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoProgress = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 60, mass: 1.2 },
  });

  const titleProgress = spring({
    frame: frame - 20,
    fps,
    config: { damping: 15, stiffness: 80, mass: 1 },
  });

  const taglineProgress = spring({
    frame: frame - 40,
    fps,
    config: { damping: 15, stiffness: 80, mass: 1 },
  });

  const glowSize = interpolate(frame, [0, 180], [200, 400], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: `radial-gradient(ellipse at center, ${COLORS.primaryLight} 0%, ${COLORS.dark} 70%)`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: glowSize,
          height: glowSize,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.accent}20 0%, transparent 70%)`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
      <div
        style={{
          opacity: logoProgress,
          transform: `scale(${interpolate(logoProgress, [0, 1], [0.5, 1])})`,
          marginBottom: 40,
        }}
      >
        <Img
          src={staticFile("logo-white.jpg")}
          style={{
            width: 280,
            height: 280,
            borderRadius: 32,
            objectFit: "cover",
          }}
        />
      </div>
      <div
        style={{
          color: COLORS.white,
          fontSize: 52,
          fontWeight: 700,
          fontFamily: "Inter, system-ui, sans-serif",
          opacity: titleProgress,
          transform: `translateY(${interpolate(titleProgress, [0, 1], [40, 0])}px)`,
          textAlign: "center",
          letterSpacing: -1,
        }}
      >
        {TEXTS.title}
      </div>
      <div
        style={{
          color: COLORS.accentGlow,
          fontSize: 26,
          fontWeight: 400,
          fontFamily: "Inter, system-ui, sans-serif",
          opacity: taglineProgress,
          transform: `translateY(${interpolate(taglineProgress, [0, 1], [20, 0])}px)`,
          textAlign: "center",
          marginTop: 16,
        }}
      >
        {TEXTS.tagline}
      </div>
    </div>
  );
}
