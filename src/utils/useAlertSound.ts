import { useRef, useCallback, useEffect } from 'react';

// Generates a short beep using the Web Audio API — no audio file needed.
function createAlertSound(ctx: AudioContext, frequency = 880, durationMs = 300, type: OscillatorType = 'sine'): void {
  const oscillator = ctx.createOscillator();
  const gainNode   = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type      = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

  gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + durationMs / 1000);
}

export function useAlertSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  // Lazy-init AudioContext on first user interaction to comply with browser policy
  const ensureContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume().catch(() => {});
    }
    return ctxRef.current;
  }, []);

  // Prime the context on first click anywhere (Safari / Chrome autoplay policy)
  useEffect(() => {
    const prime = () => { ensureContext(); };
    document.addEventListener('click', prime, { once: true });
    return () => document.removeEventListener('click', prime);
  }, [ensureContext]);

  const playWarning = useCallback(() => {
    try {
      const ctx = ensureContext();
      // Two-tone warning: 660 Hz then 880 Hz
      createAlertSound(ctx, 660, 200, 'triangle');
      setTimeout(() => createAlertSound(ctx, 880, 250, 'triangle'), 220);
    } catch (e) { /* audio not available */ }
  }, [ensureContext]);

  const playCritical = useCallback(() => {
    try {
      const ctx = ensureContext();
      // Three rapid high-pitched beeps for critical
      [0, 180, 360].forEach(offset => {
        setTimeout(() => createAlertSound(ctx, 1200, 150, 'square'), offset);
      });
    } catch (e) { /* audio not available */ }
  }, [ensureContext]);

  return { playWarning, playCritical };
}
