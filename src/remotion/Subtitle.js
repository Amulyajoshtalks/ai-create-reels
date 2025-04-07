import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

export const Subtitle = ({ text }) => {
  const frame = useCurrentFrame();
  const charactersToShow = Math.floor(interpolate(frame, [0, 150], [0, text.length], {
    extrapolateRight: 'clamp',
  }));

  const visibleText = text.slice(0, charactersToShow);

  return (
    <AbsoluteFill className="flex items-end justify-center p-10">
      <div
        style={{
          fontSize: 40,
          fontFamily: 'monospace',
          background: 'rgba(0,0,0,0.6)',
          color: 'white',
          padding: '1rem 2rem',
          borderRadius: '1rem',
          whiteSpace: 'pre-wrap',
          lineHeight: 1.4,
        }}
      >
        {visibleText}
        <span style={{ opacity: frame % 30 < 15 ? 1 : 0 }}>|</span>
      </div>
    </AbsoluteFill>
  );
};
