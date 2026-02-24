import { Sequence } from "remotion";
import { COLORS, SCREENSHOTS, TEXTS } from "../constants";
import { AnimatedScreenshot } from "../components/AnimatedScreenshot";
import { TextOverlay } from "../components/TextOverlay";
import { SectionTitle } from "../components/SectionTitle";
import { useSceneTransition } from "../lib/animations";

export function AdminScene() {
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
          title="Administracao"
          subtitle={TEXTS.admin}
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
            src={SCREENSHOTS.admin}
            direction="left"
            delay={5}
            zoomTo={1.08}
            zoomDuration={145}
            style={{ width: 1700, height: 950 }}
          />
          <TextOverlay text={TEXTS.admin} delay={15} />
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
            src={SCREENSHOTS.adminParameters}
            direction="right"
            delay={5}
            zoomTo={1.08}
            zoomDuration={145}
            style={{ width: 1700, height: 950 }}
          />
          <TextOverlay text={TEXTS.adminParameters} delay={15} />
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
            src={SCREENSHOTS.auditLog}
            direction="bottom"
            delay={5}
            zoomTo={1.08}
            zoomDuration={145}
            style={{ width: 1700, height: 950 }}
          />
          <TextOverlay text={TEXTS.auditLog} delay={15} />
        </div>
      </Sequence>
    </div>
  );
}
