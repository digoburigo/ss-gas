import { Sequence, useCurrentFrame } from "remotion";
import { COLORS, SCREENSHOTS, TEXTS } from "../constants";
import { AnimatedScreenshot } from "../components/AnimatedScreenshot";
import { TextOverlay } from "../components/TextOverlay";
import { useSceneTransition } from "../lib/animations";

export function DashboardScene() {
  const frame = useCurrentFrame();
  const opacity = useSceneTransition(360);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: `linear-gradient(135deg, ${COLORS.dark} 0%, ${COLORS.darkGradient} 100%)`,
        opacity,
        position: "relative",
      }}
    >
      <AnimatedScreenshot
        src={SCREENSHOTS.dashboard}
        direction="bottom"
        delay={5}
        zoomFrom={1}
        zoomTo={1.12}
        zoomDuration={350}
        style={{
          width: 1700,
          height: 950,
        }}
      />
      <Sequence from={10}>
        <TextOverlay
          text={TEXTS.dashboard}
          subtitle="Visao consolidada de todos os indicadores de gas"
          delay={0}
          position="bottom-left"
        />
      </Sequence>
    </div>
  );
}
