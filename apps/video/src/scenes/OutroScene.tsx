import {
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { interpolate, spring } from "remotion";
import { COLORS, TEXTS } from "../constants";

export function OutroScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoProgress = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 60, mass: 1.2 },
  });

  const textProgress = spring({
    frame: frame - 15,
    fps,
    config: { damping: 15, stiffness: 80, mass: 1 },
  });

  const words = TEXTS.outro.split(". ");

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
          opacity: logoProgress,
          transform: `scale(${interpolate(logoProgress, [0, 1], [0.8, 1])})`,
          marginBottom: 48,
        }}
      >
        <Img
          src={staticFile("logo-blue.jpg")}
          style={{
            width: 200,
            height: 200,
            borderRadius: 24,
            objectFit: "cover",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          gap: 32,
          alignItems: "center",
        }}
      >
        {words.map((word, i) => {
          const wordProgress = spring({
            frame: frame - 20 - i * 12,
            fps,
            config: { damping: 15, stiffness: 80, mass: 1 },
          });
          return (
            <div
              key={word}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 32,
              }}
            >
              {i > 0 ? (
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: COLORS.accent,
                    opacity: wordProgress,
                  }}
                />
              ) : null}
              <div
                style={{
                  color: COLORS.white,
                  fontSize: 48,
                  fontWeight: 700,
                  fontFamily: "Inter, system-ui, sans-serif",
                  opacity: wordProgress,
                  transform: `translateY(${interpolate(wordProgress, [0, 1], [20, 0])}px)`,
                }}
              >
                {word.replace(".", "")}
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          color: COLORS.gray,
          fontSize: 22,
          fontFamily: "Inter, system-ui, sans-serif",
          opacity: textProgress,
          marginTop: 32,
        }}
      >
        {TEXTS.title}
      </div>
    </div>
  );
}
