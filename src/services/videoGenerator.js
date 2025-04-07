import axios from 'axios';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"; 
import { v4 as uuidv4 } from 'uuid'; 
import path from 'path';
import os from 'os';
import https from 'https';

class VideoGenerator {
  async generateCelebrityReel(celebrityName, imageUrls) {
    try {
      if (!celebrityName?.trim() || !imageUrls?.length) {
        throw new Error('Invalid input parameters');
      }

      const script = await this.generateScript(celebrityName)
        .catch(() => this.getFallbackScript(celebrityName));

      const audioUrl = await this.generateAudio(script);
      const videoUrl = await this.generateVideoMockup(imageUrls, audioUrl)
        .catch(() => this.getFallbackVideoUrl());

      return {
        success: true,
        videoUrl,
        script,
        audioUrl,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        fallbackContent: this.getFallbackContent(celebrityName),
        generatedAt: new Date().toISOString()
      };
    }
  }

  async generateScript(name) {
    const prompt = `You are a sports historian. Generate a 30-second engaging reel script about a sports celebrity: ${name}. Include career achievements, stats, legacy.`;

    const response = await axios.post(
      "https://api.mistral.ai/v1/chat/completions",
      {
        model: "mistral-large-latest",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: `Generate script about: ${name}` }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
          "Content-Type": "application/json",
        }
      }
    );

    const content = response.data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Invalid response");

    return this.cleanScript(content);
  }

  cleanScript(text) {
    return text.replace(/[\*\_\<\>]/g, '').replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  }

  async generateAudio(script) {
    const truncated = script.slice(0, 200);
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&q=${encodeURIComponent(truncated)}&client=tw-ob`;
    return audioUrl;
  }

  async generateVideoMockup(imageUrls, audioUrl) {
    try {
      const tmpDir = os.tmpdir();
      const timestamp = Date.now();
      const imagePaths = [];

      // 1. Download and save first 3 images locally
      const downloadImage = (url, index) => new Promise((resolve, reject) => {
        const filePath = path.join(tmpDir, `image_${timestamp}_${index}.jpg`);
        const file = writeFileSync(filePath, '');

        https.get(url, res => {
          const data = [];
          res.on('data', chunk => data.push(chunk));
          res.on('end', () => {
            writeFileSync(filePath, Buffer.concat(data));
            resolve(filePath);
          });
        }).on('error', reject);
      });

      const downloads = imageUrls.slice(0, 3).map(downloadImage);
      const downloadedPaths = await Promise.all(downloads);

      imagePaths.push(...downloadedPaths);

      // 2. Download and save audio locally
      const audioPath = path.join(tmpDir, `audio_${timestamp}.mp3`);
      await new Promise((resolve, reject) => {
        const file = writeFileSync(audioPath, '');
        https.get(audioUrl, res => {
          const data = [];
          res.on('data', chunk => data.push(chunk));
          res.on('end', () => {
            writeFileSync(audioPath, Buffer.concat(data));
            resolve();
          });
        }).on('error', reject);
      });

      // 3. Create FFmpeg input file list
      const inputTxtPath = path.join(tmpDir, `input_${timestamp}.txt`);
      const inputList = imagePaths.map(img => `file '${img}'\nduration 5`).join('\n');
      writeFileSync(inputTxtPath, inputList);

      const videoPath = path.join(tmpDir, `video_${timestamp}.mp4`);

      // 4. Run FFmpeg to generate video with audio
      execSync(
        `ffmpeg -y -f concat -safe 0 -i "${inputTxtPath}" -i "${audioPath}" -shortest -vf "scale=1280:720,format=yuv420p" -c:v libx264 -c:a aac "${videoPath}"`
      );

      const buffer = readFileSync(videoPath);
      const url = await this.uploadToS3(buffer, 'video/mp4');

      // Cleanup
      imagePaths.forEach(p => unlinkSync(p));
      unlinkSync(audioPath);
      unlinkSync(inputTxtPath);
      unlinkSync(videoPath);

      return url;
    } catch (err) {
      console.error('Video generation failed:', err.message);
      throw err;
    }
  }

  async uploadToS3(buffer, contentType) {
    const s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    const fileName = `${uuidv4()}.mp4`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `videos/${fileName}`,
      Body: buffer,
      ContentType: contentType
    });

    await s3Client.send(command);
    return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/videos/${fileName}`;
  }

  getFallbackVideoUrl() {
    return 'https://dummyimage.com/600x400/000/fff&text=Video+Preview+Unavailable';
  }

  getFallbackScript(name) {
    const fallbacks = [
      `${name} has made significant contributions to their sport through dedication and skill.`,
      `The career of ${name} serves as an inspiration to aspiring athletes worldwide.`,
      `${name}'s legacy in sports history remains unmatched.`
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  getFallbackContent(name) {
    return {
      videoUrl: this.getFallbackVideoUrl(),
      script: this.getFallbackScript(name),
      audioUrl: 'https://example.com/fallback-audio.mp3'
    };
  }
}

export default VideoGenerator;
