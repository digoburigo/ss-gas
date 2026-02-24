import { Sequence } from "remotion";
import { COLORS, SCREENSHOTS, TEXTS } from "../constants";
import { AnimatedScreenshot } from "../components/AnimatedScreenshot";
import { TextOverlay } from "../components/TextOverlay";
import { SectionTitle } from "../components/SectionTitle";
import { useSceneTransition } from "../lib/animations";

export function ReportsScene() {
  const opacity = useSceneTransition(360);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        opacity,
      }}
    >
      <Sequence from={0} durationInFrames={90}>
        <SectionTitle
          title="Relatorios"
          subtitle={TEXTS.reports}
        />
      </Sequence>

      <Sequence from={90} durationInFrames={270}>
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: `linear-gradient(135deg, ${COLORS.dark} 0%, ${COLORS.darkGradient} 100%)`,
            position: "relative",
          }}
        >
          <AnimatedScreenshot
            src={SCREENSHOTS.reports}
            direction="bottom"
            delay={5}
            zoomFrom={1}
            zoomTo={1.15}
            zoomDuration={265}
            style={{ width: 1700, height: 950 }}
          />
          <TextOverlay
            text={TEXTS.reports}
            subtitle="Exportacao em Excel e PDF"
            delay={15}
          />
        </div>
      </Sequence>
    </div>
  );
}
