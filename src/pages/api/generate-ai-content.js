import axios from 'axios';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { v4 as uuidv4 } from 'uuid';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegPath.path);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { nameOrTopic, lang = 'en' } = req.body;

  if (!nameOrTopic) {
    return res.status(400).json({ error: 'Missing name or topic' });
  }

  try {
    // 1. Generate script with Mistral
    const systemPrompt = `
You are a talented documentary scriptwriter who writes powerful, cinematic, emotional, and inspiring 60-second video scripts on sports celebrities. Your tone is storytelling, with a human voice. Focus on major turning points, struggles, hard work, and iconic achievements.

Start with a compelling hook (e.g., "He wasn’t born a legend…"), and end with a closing line that gives goosebumps (e.g., “That’s how legends are born.”). Avoid robotic terms like "opening shot" or "fade in". Write in plain narrative style for human voiceover.
`;
    const userPrompt = `Write a motivational 60-second script about: ${nameOrTopic}`;

    const aiRes = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      {
        model: 'mistral-large-latest',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.75,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer fmRwUzCY3Mzy9lltTqIfK0davJRAXjit`,
          'Content-Type': 'application/json',
        },
      }
    );

    let script = aiRes.data.choices?.[0]?.message?.content || 'Script not available.';

    // 2. Clean and Translate
    const cleanedScript = script
      .replace(/["'\`]/g, '')
      .replace(/\*\*/g, '')
      .replace(/_/g, '')
      .replace(/[\[\]\(\)]/g, '')
      .replace(/(?:\.\s){2,}/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();

    const translationRes = await axios.get(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${lang}&dt=t&q=${encodeURIComponent(cleanedScript)}`
    );

    const translatedScript = translationRes.data[0].map((part) => part[0]).join(' ').trim();
    const shortScript = translatedScript.slice(0, 200); // for TTS

    // 3. Generate TTS audio
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&q=${encodeURIComponent(
      shortScript
    )}&client=tw-ob`;

    const audioRes = await axios.get(ttsUrl, {
      responseType: 'arraybuffer',
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const audioFilename = `audio-${uuidv4()}.mp3`;
    const audioPath = path.join(process.cwd(), 'public', audioFilename);
    fs.writeFileSync(audioPath, audioRes.data);
    const audioUrl = `/${audioFilename}`;

    // 4. Get multiple images from Unsplash
    const unsplashRes = await axios.get(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        nameOrTopic
      )}&per_page=6&orientation=squarish`,
      {
        headers: {
          Authorization: `Client-ID _DxHvnPWD9aFjpfBdL7-9xIhy8Iy311zwcBm_o_nyrs`,
        },
      }
    );

    const imageUrls = unsplashRes.data.results.map((img) => img.urls.regular);
    const imagePaths = [];

    for (let i = 0; i < imageUrls.length; i++) {
      const imageRes = await axios.get(imageUrls[i], { responseType: 'arraybuffer' });
      const imgFilename = `img-${uuidv4()}.jpg`;
      const imgPath = path.join(process.cwd(), 'public', imgFilename);
      fs.writeFileSync(imgPath, imageRes.data);
      imagePaths.push(imgPath);
    }

    // 5. Create FFmpeg-compatible image list file
    const listFilename = `imagelist-${uuidv4()}.txt`;
    const listPath = path.join(process.cwd(), 'public', listFilename);

    const listFileContent = imagePaths
      .map((imgPath) => `file '${imgPath.replace(/\\/g, '/')}'\nduration 2`)
      .join('\n');
    fs.writeFileSync(listPath, listFileContent + '\n');

    const videoFilename = `video-${uuidv4()}.mp4`;
    const videoPath = path.join(process.cwd(), 'public', videoFilename);

    // 6. Generate video from image list + audio
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(listPath)
        .inputFormat('concat')
        .inputOptions(['-safe 0'])
        .input(audioPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions(['-pix_fmt yuv420p', '-shortest'])
        .size('720x720')
        .output(videoPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    const videoUrl = `/${videoFilename}`;

    res.status(200).json({
      script: translatedScript,
      audioUrl,
      visualUrls: imageUrls,
      langUsed: lang,
      videoUrl,
    });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Failed to generate content', message: err.message });
  }
}
