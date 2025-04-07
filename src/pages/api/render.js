// pages/api/render.js
import { bundle } from '@remotion/bundler';
import { render } from '@remotion/renderer';
import path from 'path';
import os from 'os';
import fs from 'fs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  const { audioUrl, visualUrl, subtitle } = req.body;

  try {
    const compositionPath = await bundle({
      entryPoint: path.resolve('./remotion/Root.js'),
      webpackOverride: (config) => config,
      outDir: path.join(os.tmpdir(), 'remotion'),
    });

    const outputLocation = path.resolve('./public/output.mp4');

    await render({
      composition: 'MyVideo',
      serveUrl: compositionPath,
      codec: 'h264',
      outputLocation,
      inputProps: {
        audioUrl,
        visualUrl,
        subtitle,
      },
    });

    return res.status(200).json({ success: true, url: '/output.mp4' });
  } catch (err) {
    console.error('Render error:', err);
    return res.status(500).json({ error: err.message });
  }
}
