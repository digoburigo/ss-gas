import { Sequence, useCurrentFrame } from "remotion";
import { COLORS, SCREENSHOTS, TEXTS } from "../constants";
import { AnimatedScreenshot } from "../components/AnimatedScreenshot";
import { TextOverlay } from "../components/TextOverlay";
import { SectionTitle } from "../components/SectionTitle";
import { useSceneTransition } from "../lib/animations";

export function ContractsScene() {
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
        <SectionTitle title="Contratos" subtitle={TEXTS.contracts} />
      </Sequence>

      <Sequence from={90} durationInFrames={135}>
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
            src={SCREENSHOTS.contracts}
            direction="left"
            delay={5}
            zoomTo={1.08}
            zoomDuration={130}
            style={{ width: 1700, height: 950 }}
          />
          <TextOverlay text={TEXTS.contracts} delay={15} />
        </div>
      </Sequence>

      <Sequence from={225} durationInFrames={135}>
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
            src={SCREENSHOTS.contractAlerts}
            direction="right"
            delay={5}
            zoomTo={1.08}
            zoomDuration={130}
            style={{ width: 1700, height: 950 }}
          />
          <TextOverlay text={TEXTS.contractAlerts} delay={15} />
        </div>
      </Sequence>
    </div>
  );
}
