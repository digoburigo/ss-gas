import { Composition } from "remotion";
import { Video } from "./Video";
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from "./constants";

export function RemotionRoot() {
  return (
    <Composition
      id="GasPromoVideo"
      component={Video}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
}
