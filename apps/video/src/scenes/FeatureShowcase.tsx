import { COLORS } from "../constants";
import { AnimatedScreenshot } from "../components/AnimatedScreenshot";
import { TextOverlay } from "../components/TextOverlay";
import { useSceneTransition } from "../lib/animations";

interface FeatureShowcaseProps {
  screenshot: string;
  text: string;
  subtitle?: string;
  direction?: "left" | "right" | "bottom";
  sceneDuration: number;
}

export function FeatureShowcase({
  screenshot,
  text,
  subtitle,
  direction = "left",
  sceneDuration,
}: FeatureShowcaseProps) {
  const opacity = useSceneTransition(sceneDuration);

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
        src={screenshot}
        direction={direction}
        delay={5}
        zoomTo={1.08}
        zoomDuration={sceneDuration - 10}
        style={{ width: 1700, height: 950 }}
      />
      <TextOverlay text={text} subtitle={subtitle} delay={15} />
    </div>
  );
}
