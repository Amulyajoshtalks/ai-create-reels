import { v4 as uuidv4 } from 'uuid';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from '@/lib/s3';
import dynamo from '@/lib/dynamodb';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { script, audioUrl, visualUrls, vedioUrl } = req.body;

    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const region = process.env.AWS_REGION;
    const baseUrl = "https://ai-create-reels.vercel.app/" || 'http://localhost:3000';

    if (!bucketName || !region) {
      throw new Error('Missing AWS environment variables');
    }

    if (!vedioUrl) {
      throw new Error('vedioUrl is required');
    }

    // ✅ Create absolute URL if it's relative
    const fullVideoUrl = vedioUrl.startsWith('http')
      ? vedioUrl
      : `${baseUrl}${vedioUrl}`;

    try {
      new URL(fullVideoUrl); // Validate URL
    } catch (e) {
      throw new Error(`Invalid video URL: ${fullVideoUrl}`);
    }

    // ✅ Fetch video data
    const response = await fetch(fullVideoUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch video from URL: ${fullVideoUrl}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const videoBuffer = Buffer.from(arrayBuffer);

    // ✅ Upload to S3
    const videoKey = `videos/${uuidv4()}.mp4`;

    const uploadParams = {
      Bucket: bucketName,
      Key: videoKey,
      Body: videoBuffer,
      ContentType: 'video/mp4',
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${videoKey}`;

    // ✅ Store metadata in DynamoDB
    const metadata = {
      id: uuidv4(),
      script,
      audioUrl,
      visualUrls,
      s3Url,
      createdAt: new Date().toISOString(),
      creator: {
        name: "Amulya",
        profilePic: "https://example.com/profile.jpg"
      }
    };

    await dynamo.storeMetadata(metadata);

    return res.status(200).json({ s3Url });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({
      error: 'Upload failed',
      details: err.message,
    });
  }
}
