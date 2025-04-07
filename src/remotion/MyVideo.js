import { AbsoluteFill, Audio, Sequence, Img, Video, Series } from "remotion";

export const MyVideo = ({ audioUrl, visualUrl, subtitle }) => {
  const isImage = visualUrl?.match(/\.(jpeg|jpg|gif|png)$/i);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", backgroundColor: "black" }}>
      <Audio src={audioUrl} />
      {isImage ? (
        <Img src={visualUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <Video src={visualUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      )}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          width: "100%",
          textAlign: "center",
          fontSize: 40,
          color: "white",
        }}
      >
        {subtitle}
      </div>
    </AbsoluteFill>
  );
};
