import { bundle } from '@remotion/bundler';
import { getCompositions, renderMedia } from '@remotion/renderer';
import path from 'path';
import os from 'os';

export default async function handler(req, res) {
  try {
    const entry = path.resolve(process.cwd(), 'src', 'remotion', 'RegisterRoot.js');

    const bundled = await bundle(entry, () => undefined, {
      outDir: path.join(os.tmpdir(), 'remotion-bundle'),
      ignoreRegisterRootWarning: true,
    });

    const comps = await getCompositions(bundled, {
      inputProps: req.body,
    });

    const composition = comps.find((c) => c.id === 'MyVideo');

    if (!composition) {
      return res.status(404).json({ error: 'Composition not found' });
    }

    const videoPath = path.join(os.tmpdir(), `video-${Date.now()}.mp4`);

    await renderMedia({
      composition,
      serveUrl: bundled,
      codec: 'h264',
      outputLocation: videoPath,
      inputProps: req.body,
    });

    const fileBuffer = await fs.promises.readFile(videoPath);
    res.setHeader('Content-Type', 'video/mp4');
    res.send(fileBuffer);
  } catch (err) {
    console.error('Render error:', err);
    res.status(500).json({ error: err.message });
  }
}
