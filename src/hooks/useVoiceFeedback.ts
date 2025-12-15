import { useCallback, useRef } from "react";

// Audio feedback sounds using Web Audio API for soft chimes
export const useVoiceFeedback = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  };

  // Play a soft chime sound
  const playChime = useCallback((frequency: number, duration: number, volume: number = 0.3) => {
    try {
      const ctx = getAudioContext();
      
      // Create oscillator for the tone
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Soft sine wave for gentle sound
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      // Gentle fade in and out for soft chime effect
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      console.log("Audio feedback not available:", error);
    }
  }, []);

  // Play ascending chime when AI starts listening (user can speak)
  const playStartListening = useCallback(() => {
    // Two-note ascending chime (C5 -> E5)
    playChime(523.25, 0.25, 0.25); // C5
    setTimeout(() => playChime(659.25, 0.35, 0.2), 150); // E5
  }, [playChime]);

  // Play descending chime when AI stops listening (processing/speaking)
  const playStopListening = useCallback(() => {
    // Two-note descending chime (E5 -> C5)
    playChime(659.25, 0.25, 0.2); // E5
    setTimeout(() => playChime(523.25, 0.35, 0.15), 150); // C5
  }, [playChime]);

  // Play a gentle single tone for pause
  const playPause = useCallback(() => {
    playChime(440, 0.4, 0.15); // A4 - neutral tone
  }, [playChime]);

  // Play a soft double chime for resume
  const playResume = useCallback(() => {
    playChime(523.25, 0.2, 0.2); // C5
    setTimeout(() => playChime(523.25, 0.25, 0.2), 200); // C5 again
  }, [playChime]);

  return {
    playStartListening,
    playStopListening,
    playPause,
    playResume,
  };
};
