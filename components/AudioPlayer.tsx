
import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';

// URL ke file musik mars SWAPRO.
const AUDIO_URL = 'https://raw.githubusercontent.com/snnnxs25024-ux/mp3/main/Langkahkan%20kaki%20dengan%20pasti%20Menyongsong.mp3';

const AudioPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.15);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<HTMLDivElement>(null); // Ref for click-outside detection

  // Effect for handling click outside to close the expanded player
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (playerRef.current && !playerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.volume = volume;
    audio.play().catch(e => {
        console.info("Autoplay in silent mode was prevented by browser.");
    });

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  const handleInitialPlay = () => {
    const audio = audioRef.current;
    if (audio && !hasInteracted) {
      audio.muted = false;
      setIsMuted(false);
      if (audio.paused) {
        audio.play().catch(e => console.error("Error playing audio after interaction:", e));
      }
      setHasInteracted(true);
    }
  };
  
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (audio) {
      if (audio.paused) {
        audio.play().catch(e => console.error("Tidak dapat memutar audio:", e));
      } else {
        audio.pause();
      }
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      const newMutedState = !audio.muted;
      audio.muted = newMutedState;
      setIsMuted(newMutedState);
      if (!newMutedState && audio.volume === 0) {
        setVolume(0.15);
        audio.volume = 0.15;
      }
    }
  };

  const handleMainButtonClick = () => {
    // If expanded, the button's job is to mute/unmute.
    // If not expanded, its job is to expand the controls.
    if (isExpanded) {
      toggleMute();
    } else {
      setIsExpanded(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      if (newVolume > 0 && isMuted) {
        audioRef.current.muted = false;
        setIsMuted(false);
      } else if (newVolume === 0 && !isMuted) {
        audioRef.current.muted = true;
        setIsMuted(true);
      }
    }
  };

  const isEffectivelyMuted = isMuted || volume === 0;

  return (
    <>
      <audio ref={audioRef} src={AUDIO_URL} loop muted />
      
      {!hasInteracted ? (
        <div
          className="fixed bottom-6 right-6 z-[100] group"
          role="button"
          tabIndex={0}
          onClick={handleInitialPlay}
          onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && handleInitialPlay()}
        >
          <div className="flex items-center h-12 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-slate-200 transition-all duration-300 ease-in-out overflow-hidden group-hover:w-40 w-12">
            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center text-slate-600 group-hover:text-blue-600 transition-colors">
               <VolumeX className="w-6 h-6" />
            </div>
            <span className="whitespace-nowrap text-sm font-semibold text-slate-700 pr-4">Aktifkan Musik</span>
          </div>
        </div>
      ) : (
        <div
          ref={playerRef}
          className={`fixed bottom-6 right-6 z-[100] flex items-center h-12 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-slate-200 transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'w-52' : 'w-12'}`}
        >
          <button
            onClick={handleMainButtonClick}
            title={isEffectivelyMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
            aria-label="Toggle mute or expand controls"
            className="flex-shrink-0 w-12 h-12 flex items-center justify-center text-slate-600 hover:text-blue-600 transition-colors"
          >
            {isEffectivelyMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>
          <div className={`flex items-center gap-2 pl-1 pr-4 transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
            <button
              onClick={togglePlayPause}
              title={isPlaying ? 'Jeda' : 'Putar'}
              aria-label="Play/Pause"
              className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-blue-600 transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-24 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600"
              aria-label="Volume slider"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AudioPlayer;
