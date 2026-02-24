import { AbsoluteFill, Sequence } from "remotion";
import { SCENES } from "./constants";
import { IntroScene } from "./scenes/IntroScene";
import { SidebarOverview } from "./scenes/SidebarOverview";
import { DashboardScene } from "./scenes/DashboardScene";
import { ContractsScene } from "./scenes/ContractsScene";
import { FeatureShowcase } from "./scenes/FeatureShowcase";
import { SchedulingScene } from "./scenes/SchedulingScene";
import { ConsumptionScene } from "./scenes/ConsumptionScene";
import { ReportsScene } from "./scenes/ReportsScene";
import { AdminScene } from "./scenes/AdminScene";
import { OutroScene } from "./scenes/OutroScene";
import { SCREENSHOTS, TEXTS } from "./constants";

export function Video() {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0f172a" }}>
      <Sequence
        from={SCENES.intro.start}
        durationInFrames={SCENES.intro.duration}
      >
        <IntroScene />
      </Sequence>

      <Sequence
        from={SCENES.sidebar.start}
        durationInFrames={SCENES.sidebar.duration}
      >
        <SidebarOverview />
      </Sequence>

      <Sequence
        from={SCENES.dashboard.start}
        durationInFrames={SCENES.dashboard.duration}
      >
        <DashboardScene />
      </Sequence>

      <Sequence
        from={SCENES.contracts.start}
        durationInFrames={SCENES.contracts.duration}
      >
        <ContractsScene />
      </Sequence>

      <Sequence
        from={SCENES.units.start}
        durationInFrames={SCENES.units.duration}
      >
        <FeatureShowcase
          screenshot={SCREENSHOTS.consumerUnits}
          text={TEXTS.units}
          subtitle="Cadastro e gestao de unidades consumidoras"
          direction="left"
          sceneDuration={SCENES.units.duration}
        />
      </Sequence>

      <Sequence
        from={SCENES.scheduling.start}
        durationInFrames={SCENES.scheduling.duration}
      >
        <SchedulingScene />
      </Sequence>

      <Sequence
        from={SCENES.consumption.start}
        durationInFrames={SCENES.consumption.duration}
      >
        <ConsumptionScene />
      </Sequence>

      <Sequence
        from={SCENES.reports.start}
        durationInFrames={SCENES.reports.duration}
      >
        <ReportsScene />
      </Sequence>

      <Sequence
        from={SCENES.admin.start}
        durationInFrames={SCENES.admin.duration}
      >
        <AdminScene />
      </Sequence>

      <Sequence
        from={SCENES.outro.start}
        durationInFrames={SCENES.outro.duration}
      >
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
}
