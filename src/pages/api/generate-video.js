import VideoGenerator from '../../services/videoGenerator';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { celebrityName, imageUrls } = req.body;
    const generator = new VideoGenerator();
    const result = await generator.generateCelebrityReel(celebrityName, imageUrls || []);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      generatedAt: new Date().toISOString()
    });
  }
}