
import React, { useState, useEffect, useRef } from 'react';
import { PlayIcon, PauseIcon } from './icons/PlaybackIcons';

interface AudioPlayerProps {
  audioBlob: Blob | null;
  audioUrl?: string; // Optional: direct URL if not using blob
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioBlob, audioUrl }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0); // Can be number or Infinity
  const [currentTime, setCurrentTime] = useState(0);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrlCreatedInThisEffect: string | null = null;

    if (audioBlob && audioBlob.size > 0) {
      objectUrlCreatedInThisEffect = URL.createObjectURL(audioBlob);
      setSourceUrl(objectUrlCreatedInThisEffect);
      console.log(`[AudioPlayer Effect1] Created object URL: ${objectUrlCreatedInThisEffect} for blob size: ${audioBlob.size}`);
    } else if (audioUrl) {
      setSourceUrl(audioUrl);
      console.log(`[AudioPlayer Effect1] Using provided audioUrl: ${audioUrl}`);
    } else {
      setSourceUrl(null);
      console.log("[AudioPlayer Effect1] No valid audioBlob or audioUrl, setting sourceUrl to null.");
    }

    return () => {
      if (objectUrlCreatedInThisEffect) {
        console.log(`[AudioPlayer Effect1 Cleanup] Revoking object URL: ${objectUrlCreatedInThisEffect}`);
        URL.revokeObjectURL(objectUrlCreatedInThisEffect);
      }
    };
  }, [audioBlob, audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      console.warn("[AudioPlayer Effect2] Audio element ref is null.");
      return;
    }

    if (!sourceUrl) {
      console.log("[AudioPlayer Effect2] sourceUrl is null. Resetting player state.");
      audio.src = '';
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    console.log(`[AudioPlayer Effect2] Detected sourceUrl: ${sourceUrl}. Resetting player state and attaching listeners.`);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    const handleAudioEvent = (event: Event) => {
      if (!audioRef.current) return;
      const currentAudioEl = audioRef.current;
      const rawElementDuration = currentAudioEl.duration;

      // Generic log for all handled events
      console.log(`[AudioPlayer] Event '${event.type}'. Raw duration: ${rawElementDuration}, ReadyState: ${currentAudioEl.readyState}, CurrentSrc: ${currentAudioEl.currentSrc?.slice(-50)}`);

      switch (event.type) {
        case 'loadedmetadata':
          setDuration(rawElementDuration); // Directly use browser's duration
          setCurrentTime(0);
          console.log(`[AudioPlayer] 'loadedmetadata' - Set duration to ${rawElementDuration}`);
          break;
        case 'canplay':
          // Update duration if it was 0/NaN or if new duration is finite and more accurate
          setDuration(prevInternalDuration => {
            if ((!isFinite(prevInternalDuration) || prevInternalDuration === 0) && rawElementDuration > 0) {
              console.log(`[AudioPlayer] 'canplay' - Updating duration from ${prevInternalDuration} to ${rawElementDuration} (was 0 or non-finite)`);
              return rawElementDuration;
            }
            if (isFinite(rawElementDuration) && rawElementDuration > 0 && !isFinite(prevInternalDuration)) {
              console.log(`[AudioPlayer] 'canplay' - Updating duration from Infinity to finite ${rawElementDuration}`);
              return rawElementDuration;
            }
            return prevInternalDuration;
          });
          break;
        case 'timeupdate':
          setCurrentTime(currentAudioEl.currentTime);
          break;
        case 'ended':
          console.log("[AudioPlayer] Audio ended.");
          setIsPlaying(false);
          // Set currentTime to duration if finite, otherwise keep it as is (or reset to 0)
          setCurrentTime(isFinite(duration) && duration > 0 ? duration : 0);
          break;
        case 'error':
          console.error("[AudioPlayer] Error event on audio element:", currentAudioEl.error, "for source:", currentAudioEl.currentSrc);
          setIsPlaying(false);
          // Optionally reset duration/currentTime on error
          // setDuration(0); 
          // setCurrentTime(0);
          break;
        case 'loadstart':
        case 'progress':
        case 'suspend':
        case 'emptied':
        case 'stalled':
          // These are mostly for verbose logging during debugging if needed
          break;
      }
    };
    
    const eventTypes: (keyof HTMLMediaElementEventMap)[] = [
        'loadedmetadata', 'canplay', 'timeupdate', 'ended', 'error',
        'loadstart', 'progress', 'suspend', 'emptied', 'stalled'
    ];
    eventTypes.forEach(type => audio.addEventListener(type, handleAudioEvent));

    console.log(`[AudioPlayer Effect2] Setting audio.src to: ${sourceUrl} and calling load().`);
    audio.src = sourceUrl;
    audio.load();

    return () => {
      console.log(`[AudioPlayer Effect2 Cleanup] Removing listeners for sourceUrl: ${sourceUrl}`);
      eventTypes.forEach(type => audio.removeEventListener(type, handleAudioEvent));
    };
  }, [sourceUrl]); // Removed 'duration' from here as it caused loops

  const togglePlayPause = () => {
    const audio = audioRef.current;
    // Enable play if readyState suggests metadata is loaded (>=1 HAVE_METADATA) and duration is positive
    // readyState 1 means metadata loaded, 2 means data for current position available, 3 data for next frame, 4 enough data
    if (!audio || !sourceUrl || !(audio.readyState >= 1 && duration > 0) ) {
        console.warn(`[AudioPlayer] togglePlayPause called but conditions not met. sourceUrl: ${sourceUrl}, duration: ${duration}, readyState: ${audio?.readyState}`);
        return;
    }

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(error => {
          console.error("[AudioPlayer] Error trying to play audio:", error);
          setIsPlaying(false);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (timeInSeconds: number) => {
    if (timeInSeconds === Infinity) {
      return "--:--";
    }
    if (!isFinite(timeInSeconds) || timeInSeconds < 0) {
      return "0:00";
    }
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  if (!sourceUrl && audioBlob && audioBlob.size > 0) {
    return <p className="text-xs text-slate-500 py-1 px-2">Audio preparing...</p>;
  }
  if (!sourceUrl) {
    return <p className="text-xs text-slate-500 py-1 px-2">No audio.</p>;
  }
  
  const isPlayButtonDisabled = !((audioRef.current && audioRef.current.readyState >= 1 && duration > 0)) && !isPlaying;

  return (
    <div className="flex items-center space-x-2 p-2 bg-slate-600/70 rounded-md w-full">
      <audio ref={audioRef} preload="metadata" className="hidden"></audio>
      <button
        onClick={togglePlayPause}
        className="p-1.5 rounded-full text-sky-300 hover:bg-sky-700/50 transition-colors focus:outline-none disabled:opacity-50"
        aria-label={isPlaying ? 'Pause' : 'Play'}
        disabled={isPlayButtonDisabled}
      >
        {isPlaying ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
      </button>
      <div className="text-xs text-slate-300 w-10 text-center tabular-nums">{formatTime(currentTime)}</div>
      <input
        type="range"
        min="0"
        max={isFinite(duration) && duration > 0 ? duration : 0}
        value={isFinite(currentTime) ? currentTime : 0}
        onChange={(e) => {
          if (audioRef.current && isFinite(duration) && duration > 0) {
            const newTime = Number(e.target.value);
            if(isFinite(newTime)) audioRef.current.currentTime = newTime;
          }
        }}
        className="w-full h-1 bg-slate-500 rounded-lg appearance-none cursor-pointer accent-sky-400 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!isFinite(duration) || !(duration > 0)}
      />
      <div className="text-xs text-slate-300 w-10 text-center tabular-nums">{formatTime(duration)}</div>
    </div>
  );
};
