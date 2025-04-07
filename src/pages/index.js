'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { RotateCcw, AlertCircle } from 'lucide-react';
import ReelPlayer from '../components/ReelPlayer';
import CreateVideoButton from '../components/CreateVideoButton';

const fetcher = url => fetch(url).then(res => res.json());

export default function Home() {
  const { data, error, mutate } = useSWR('/api/videos', fetcher);
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    if (data?.videos) {
      const sorted = [...data.videos].sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setVideos(sorted);
    }
  }, [data]);

  //  Loading UI
  if (!data && !error) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white gap-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-opacity-75" />
        <p className="text-lg font-medium">Loading reels...</p>
      </div>
    );
  }

  // Error UI
  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-lg font-semibold">Oops! Failed to load videos.</p>
        <button
          onClick={() => mutate()}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition"
        >
          <RotateCcw className="w-5 h-5" />
          Retry
        </button>
      </div>
    );
  }

  // Success
  return (
    <div className="fixed inset-0 bg-black">
      <ReelPlayer videos={videos} />
      <CreateVideoButton />
    </div>
  );
}
