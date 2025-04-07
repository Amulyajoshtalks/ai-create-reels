'use client';

import { Player } from '@remotion/player';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const MyRemotionVideo = dynamic(
  () => import('../remotion/VideoComp').then((mod) => mod.MyRemotionVideo),
  { ssr: false }
);

const languages = [
  { label: 'English', code: 'en' },
  { label: 'Hindi', code: 'hi' },
  { label: 'Odia', code: 'or' },
  { label: 'Bengali', code: 'bn' },
  { label: 'Tamil', code: 'ta' },
  { label: 'Telugu', code: 'te' },
  { label: 'Marathi', code: 'mr' },
  { label: 'Malayalam', code: 'ml' },
  { label: 'Kannada', code: 'kn' },
  { label: 'Gujarati', code: 'gu' },
  { label: 'Punjabi', code: 'pa' },
  { label: 'Urdu', code: 'ur' },
  { label: 'Spanish', code: 'es' },
  { label: 'French', code: 'fr' },
];

export default function CreatePage() {
  const [nameOrTopic, setNameOrTopic] = useState('');
  const [script, setScript] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [fileUrls, setFileUrls] = useState([]);
  const [step, setStep] = useState('form');
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(false);
  const [vedioUrl, setVedioUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const router = useRouter();

  async function generateScriptAndAudio() {
    try {
      setLoading(true);
      setStep('processing');

      const res = await fetch('/api/generate-ai-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nameOrTopic, lang }),
      });

      const data = await res.json();
      setScript(data.script);
      setAudioUrl(data.audioUrl);
      setFileUrls(data.visualUrls || []);
      setVedioUrl(data.videoUrl);
      setStep('editor');
    } catch (err) {
      console.error('Error generating content:', err);
      alert('Failed to generate content.');
      setStep('form');
    } finally {
      setLoading(false);
    }
  }

  const handleUploadDB = async () => {
    try {
      setUploading(true);
      const res = await fetch('/api/upload-to-s3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, audioUrl, visualUrls: fileUrls, vedioUrl }),
      });

      const data = await res.json();
      console.log('S3 Video URL:', data);
      alert('Video uploaded successfully!');
      setScript('');
      setAudioUrl('');
      setFileUrls([]);
      setVedioUrl('');
      setStep('form');
      setLang('en');
      router.push('/');
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 p-4 md:p-8 text-white">
      <div className="max-w-3xl mx-auto bg-[#1a1a1a] p-6 md:p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">🎬 Create AI Reel</h1>

        {step === 'form' && (
          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Enter celebrity name or topic..."
              value={nameOrTopic}
              onChange={(e) => setNameOrTopic(e.target.value)}
              className="p-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="p-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {languages.map(({ label, code }) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>

            <button
              onClick={generateScriptAndAudio}
              className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300"
            >
              🧠 Generate Video
            </button>

            <button
              onClick={() => router.push('/')}
              className="bg-red-600 hover:bg-red-500 px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300"
            >
              Cancel
            </button>
          </div>
        )}

        {step === 'processing' && (
          <div className="text-center text-lg text-yellow-400 font-semibold mt-6">
            ⚙️ Generating Video...
          </div>
        )}

        {step === 'editor' && (
          <div className="mt-6 space-y-4">
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              className="w-full h-40 bg-gray-900 text-white p-4 rounded-lg border border-gray-700 resize-none"
            />

            <audio controls src={audioUrl} className="w-full rounded-lg" />

            {fileUrls.length > 0 && audioUrl && (
              <div className="rounded-xl overflow-hidden mt-4">
                <Player
                  component={MyRemotionVideo}
                  durationInFrames={300}
                  compositionWidth={1080}
                  compositionHeight={1080}
                  fps={30}
                  controls
                  inputProps={{ visualUrls: fileUrls, audioUrl, script }}
                  style={{ borderRadius: '1rem' }}
                />
              </div>
            )}

            <button
              onClick={handleUploadDB}
              className="w-full bg-green-600 hover:bg-green-500 px-6 py-3 rounded-lg text-white font-semibold mt-4 transition-all duration-300"
            >
              ⬆️ Upload Final Video
            </button>

            <button
              onClick={() => router.push('/')}
              className="bg-red-600 hover:bg-red-500 px-6 w-full py-3 rounded-lg text-white font-semibold transition-all duration-300"
            >
              Back to Home
            </button>
          </div>
        )}

        {loading && (
          <div className="mt-6 text-yellow-400 font-semibold text-center">
            ⏳ Working on it...
          </div>
        )}
      </div>

      {/* Uploading Overlay */}
      {uploading && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex flex-col items-center justify-center z-50 text-white">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-green-400 opacity-75 animate-ping"></div>
            <div className="absolute inset-0 rounded-full border-4 border-green-500" />
          </div>
          <p className="text-xl font-semibold">Uploading video to cloud...</p>
        </div>
      )}
    </div>
  );
}
