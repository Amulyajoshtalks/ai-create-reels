import { Audio, Sequence, Video, Img, AbsoluteFill } from 'remotion';
import { Subtitle } from './Subtitle';

export const MyRemotionVideo = ({ visualUrls = [], audioUrl, script }) => {
  const framesPerVisual = 60; // 2 seconds per visual (30fps)
  const totalFrames = visualUrls.length * framesPerVisual;

  return (
    <>
      <Audio src={audioUrl} />
      {visualUrls.map((url, index) => (
        <Sequence
          key={index}
          from={index * framesPerVisual}
          durationInFrames={framesPerVisual}
        >
          <AbsoluteFill className="bg-black">
            <VideoOrImage src={url} />
          </AbsoluteFill>
        </Sequence>
      ))}
      {/* <Subtitle text={script} /> */}
    </>
  );
};

const VideoOrImage = ({ src }) => {
  const isVideo = src.match(/\.(mp4|mov|webm)$/);
  return isVideo ? (
    <Video src={src} />
  ) : (
    <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  );
};
