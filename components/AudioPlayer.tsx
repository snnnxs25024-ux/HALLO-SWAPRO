import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';

// URL ke file musik mars SWAPRO.
const AUDIO_URL = 'https://raw.githubusercontent.com/snnnxs25024-ux/mp3/main/Langkahkan%20kaki%20dengan%20pasti%20Menyongsong.mp3';

const AudioPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Mulai dalam mode senyap untuk autoplay
  const [volume, setVolume] = useState(0.15);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const setAudioTime = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    audio.volume = volume;

    // Coba putar audio secara otomatis. Ini akan berhasil karena elemennya disenyapkan.
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error("Autoplay dicegah:", error);
        setIsPlaying(false);
      });
    }

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

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
      <div
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        className={`fixed bottom-6 left-6 z-[100] flex items-center h-12 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-slate-200 transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'w-52' : 'w-12'}`}
      >
        <button
          onClick={toggleMute}
          title={isEffectivelyMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
          aria-label="Toggle mute"
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
    </>
  );
};

export default AudioPlayer;