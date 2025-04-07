import { Composition } from "remotion";
import { MyVideo } from "./MyVideo";

export const RemotionRoot = () => (
  <>
    <Composition
      id="MyVideo"
      component={MyVideo}
      durationInFrames={300}
      fps={30}
      width={1080}
      height={1080}
      defaultProps={{
        audioUrl: "",
        visualUrl: "",
        subtitle: "Default subtitle",
      }}
    />
  </>
);

export { MyVideo };
