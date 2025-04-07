import { useState, useEffect, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { useGesture } from '@use-gesture/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Heart, MessageCircle, Share2, Smile } from 'lucide-react';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const dynamoClient = new DynamoDBClient({ region: "eu-north-1"});

export default function ReelPlayer({ videos }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [direction, setDirection] = useState(1);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [shareCount, setShareCount] = useState(0);
  const [emojiReaction, setEmojiReaction] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [videoError, setVideoError] = useState(false);
  const[commentBox,setCommentBox]=useState(false)

  const current = videos[index] || {};
  console.log("ghfsgfdg",current)
  useEffect(() => {
    setLikeCount(current.likes || 0);
    setShareCount(current.shares || 0);
    setComments(current.comments || []);
    setEmojiReaction(current.reaction || null);
    setVideoError(false);
  }, [current]);

  const updateDynamo = async (field, value) => {
    const updatedItem = {
      ...current,
      [field]: value,
    };
  
    try {
      const res = await fetch('/api/update-reel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ item: updatedItem })
      });
  
      if (!res.ok) {
        throw new Error('Failed to update via API');
      }
    } catch (err) {
      console.error('Failed to update DynamoDB:', err);
    }
  };

  const handleLike = () => {
    const updated = likeCount + 1;
    setLikeCount(updated);
    updateDynamo('likes', updated);
  };

  const handleShare = () => {
    const updated = shareCount + 1;
    setShareCount(updated);
    updateDynamo('shares', updated);
  };

  const handleReact = (emoji) => {
    setEmojiReaction(emoji);
    updateDynamo('reaction', emoji);
  };

  const handleCommentSubmit = async () => {
    const updatedComments = [...comments, newComment];
    setComments(updatedComments);
    updateDynamo('comments', updatedComments);
    setNewComment('');
  };

  const navigate = useCallback((newIndex) => {
    if (newIndex < 0 || newIndex >= videos.length) return;
    setDirection(newIndex > index ? 1 : -1);
    setIndex(newIndex);
    setPlaying(true);
  }, [index, videos.length]);

  const bind = useGesture({
    onDrag: ({ active, movement: [, y], velocity: [, vy], direction: [, yDir] }) => {
      if (active && vy > 0.3) {
        if (yDir > 0) navigate(index - 1);
        if (yDir < 0) navigate(index + 1);
      }
    },
    onPointerDown: () => {
      setHasInteracted(true);
      setPlaying(false);
    }
  });

  const handleWheel = useCallback((e) => {
    if (Math.abs(e.deltaY) > 5) {
      navigate(e.deltaY > 0 ? index + 1 : index - 1);
    }
  }, [index, navigate]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowDown') navigate(index + 1);
      if (e.key === 'ArrowUp') navigate(index - 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [navigate, index]);

  if (!videos?.length) {
    return (
      <div className="h-screen w-screen bg-black text-white flex items-center justify-center">
        No videos available
      </div>
    );
  }

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = current.s3Url;
    link.download = 'video.mp4';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div {...bind()} onWheel={handleWheel} className="h-screen  w-screen overflow-hidden bg-black touch-none relative">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={index}
          custom={direction}
          initial={{ y: direction > 0 ? '100%' : '-100%' }}
          animate={{ y: 0 }}
          exit={{ y: direction > 0 ? '-100%' : '100%' }}
          transition={{ duration: 0.3 }}
          className="absolute w-full h-full"
        >
          {!videoError ? (
            <ReactPlayer
              url={current.s3Url}
              playing={hasInteracted ? playing : true}
              muted={!hasInteracted}
              width="100%"
              height="100%"
              controls
              onPlay={() => setHasInteracted(true)}
              onEnded={() => navigate((index + 1) % videos.length)}
              onError={() => setVideoError(true)}
              style={{ position: 'absolute', top: 0, left: 0, objectFit: 'cover' }}
              config={{
                file: {
                  attributes: {
                    controlsList: 'nodownload',
                    disablePictureInPicture: true,
                  }
                }
              }}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-white bg-black">
              Failed to load video.
            </div>
          )}

          {current.script && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute bottom-20 w-full px-6 text-center text-white text-sm md:text-base"
            >
          
            </motion.div>
          )}

          <div className="absolute bottom-0 p-4 w-full text-white bg-gradient-to-t from-black via-transparent to-transparent md:p-6">
            <div className="flex items-center mb-2">
              <img src={current.creatorAvatar || 'https://img-new.cgtrader.com/items/4504445/5a3f2ab57d/large/cricket-player-avatar-3d-icon-3d-model-5a3f2ab57d.jpg'} alt="creator" className="w-8 h-8 md:w-10 md:h-10 rounded-full mr-2" />
              <span className="font-semibold text-sm md:text-base bg-amber-500">{current.creatorName || 'Unknown Creator'}</span>
            </div>
            <p className="text-xs md:text-sm mb-1 line-clamp-2 md:line-clamp-3">{current.script || 'No description available.'}</p>
            {current.audioUrl && <p className="text-xs text-gray-300">🎵 {current.audioCaption || 'Audio Available'}</p>}
            <div className={`absolute w-screen flex gap-2  items-center z-30 bg-white h-fit flex-col p-0 m-0 left-0 ${commentBox ? "bottom-[0%]" : "bottom-[-100%]"} transition-all duration-300 ${commentBox ? "block" : "hidden"}`}>
            <div className=" w-full flex gap-2 mt-2 items-center z-[4000] bg-white h-fit  p-4  ">
              <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add comment..." className="flex-1 p-1 text-xs text-black rounded w-full h-8 lg:h-12 border outline-none border-blue-500" />
              <button onClick={handleCommentSubmit} className="text-xs px-2 py-1 bg-blue-500 rounded w-28 lg:w-36 text-white cursor-pointer h-8 lg:h-12">Post</button>
            </div>

            {comments.length > 0 ?(
              <div className="max-h-32 overflow-y-auto mt-2 space-y-1">
                {comments.map((comment, i) => (
                  <p key={i} className="text-sm text-gray-700">💬 {comment}</p>
                ))}
              </div> 
            ):
     
              <div className='text-black'> No Comment</div>}
            </div>
          </div>

          <div className="absolute right-3 md:right-5 bottom-24 md:bottom-28 flex flex-col gap-4 text-white items-center">
            <button aria-label="like" onClick={handleLike} className="flex flex-col items-center">
              <Heart className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-xs mt-1">{likeCount}</span>
            </button>
            <button aria-label="comment" className="flex flex-col items-center" onClick={()=>setCommentBox(!commentBox)}>
              <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-xs mt-1">{comments.length}</span>
            </button>
            <button aria-label="share" onClick={handleShare} className="flex flex-col items-center">
              <Share2 className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-xs mt-1">{shareCount}</span>
            </button>
            <button aria-label="download" onClick={handleDownload} className="flex flex-col items-center">
              <Download className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <button aria-label="react" onClick={() => handleReact('😍')} className="flex flex-col items-center">
              <Smile className="w-5 h-5 md:w-6 md:h-6" />
              {emojiReaction && <span className="text-xl mt-1">{emojiReaction}</span>}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
