import { Sequence } from "remotion";
import { COLORS, SCREENSHOTS, TEXTS } from "../constants";
import { AnimatedScreenshot } from "../components/AnimatedScreenshot";
import { TextOverlay } from "../components/TextOverlay";
import { SectionTitle } from "../components/SectionTitle";
import { useSceneTransition } from "../lib/animations";

export function SchedulingScene() {
  const opacity = useSceneTransition(540);

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
          title="Programacao e Acuracia"
          subtitle={TEXTS.scheduling}
        />
      </Sequence>

      <Sequence from={90} durationInFrames={150}>
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
            src={SCREENSHOTS.scheduling}
            direction="left"
            delay={5}
            zoomTo={1.08}
            zoomDuration={145}
            style={{ width: 1700, height: 950 }}
          />
          <TextOverlay text={TEXTS.scheduling} delay={15} />
        </div>
      </Sequence>

      <Sequence from={240} durationInFrames={150}>
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
            src={SCREENSHOTS.schedulingDashboard}
            direction="right"
            delay={5}
            zoomTo={1.08}
            zoomDuration={145}
            style={{ width: 1700, height: 950 }}
          />
          <TextOverlay text={TEXTS.schedulingDashboard} delay={15} />
        </div>
      </Sequence>

      <Sequence from={390} durationInFrames={150}>
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
            src={SCREENSHOTS.schedulingAccuracy}
            direction="bottom"
            delay={5}
            zoomTo={1.08}
            zoomDuration={145}
            style={{ width: 1700, height: 950 }}
          />
          <TextOverlay text={TEXTS.accuracy} delay={15} />
        </div>
      </Sequence>
    </div>
  );
}
