import { COLORS, SCREENSHOTS, TEXTS } from "../constants";
import { AnimatedScreenshot } from "../components/AnimatedScreenshot";
import { TextOverlay } from "../components/TextOverlay";
import { useSceneTransition } from "../lib/animations";

export function SidebarOverview() {
  const opacity = useSceneTransition(180);

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
        src={SCREENSHOTS.sidebar}
        direction="left"
        delay={5}
        zoomTo={1.05}
        zoomDuration={170}
        style={{
          width: 1600,
          height: 900,
        }}
      />
      <TextOverlay
        text="14 modulos integrados para gestao completa"
        subtitle="Navegacao intuitiva com acesso rapido a todas as funcionalidades"
        delay={30}
        position="bottom-right"
      />
    </div>
  );
}
