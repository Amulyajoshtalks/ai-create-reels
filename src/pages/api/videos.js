// /pages/api/videos.js
import dynamo from '../../lib/dynamodb';

export default async function handler(req, res) {
  try {
    const videos = await dynamo.getVideos();
    res.status(200).json({ videos });
  } catch (error) {
    console.error("DynamoDB Error:", error);
    res.status(500).json({ error: "Failed to fetch video metadata" });
  }
}
