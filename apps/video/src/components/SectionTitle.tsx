import { useCurrentFrame, useVideoConfig } from "remotion";
import { interpolate, spring } from "remotion";
import { COLORS } from "../constants";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  icon?: string;
}

export function SectionTitle({ title, subtitle, icon }: SectionTitleProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 80, mass: 1 },
  });

  const subtitleProgress = spring({
    frame: frame - 8,
    fps,
    config: { damping: 15, stiffness: 80, mass: 1 },
  });

  const lineWidth = interpolate(titleProgress, [0, 1], [0, 120]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: `linear-gradient(135deg, ${COLORS.dark} 0%, ${COLORS.primary} 50%, ${COLORS.darkGradient} 100%)`,
      }}
    >
      {icon ? (
        <div
          style={{
            fontSize: 64,
            marginBottom: 24,
            opacity: titleProgress,
            transform: `scale(${titleProgress})`,
          }}
        >
          {icon}
        </div>
      ) : null}
      <div
        style={{
          color: COLORS.white,
          fontSize: 56,
          fontWeight: 700,
          fontFamily: "Inter, system-ui, sans-serif",
          opacity: titleProgress,
          transform: `translateY(${interpolate(titleProgress, [0, 1], [30, 0])}px)`,
          textAlign: "center",
        }}
      >
        {title}
      </div>
      <div
        style={{
          width: lineWidth,
          height: 4,
          background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.accentGlow})`,
          borderRadius: 2,
          marginTop: 20,
          marginBottom: 20,
        }}
      />
      {subtitle ? (
        <div
          style={{
            color: COLORS.gray,
            fontSize: 28,
            fontWeight: 400,
            fontFamily: "Inter, system-ui, sans-serif",
            opacity: subtitleProgress,
            transform: `translateY(${interpolate(subtitleProgress, [0, 1], [20, 0])}px)`,
            textAlign: "center",
            maxWidth: 800,
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}
