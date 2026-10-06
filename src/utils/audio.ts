// Web Audio API sound synthesis for boss alerts
export function playBossAlertSound(type: 'spawn' | 'soon' = 'spawn') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'spawn') {
      // High triumph double chime for Spawned Boss
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      // Notes C5 -> G5 -> C6
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.setValueAtTime(783.99, now + 0.12); // G5
      osc1.frequency.setValueAtTime(1046.50, now + 0.28); // C6

      osc2.frequency.setValueAtTime(261.63, now); // C4
      osc2.frequency.setValueAtTime(392.00, now + 0.12); // G4
      osc2.frequency.setValueAtTime(523.25, now + 0.28); // C5

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.85);
      osc2.stop(now + 0.85);
    } else {
      // Gentle double-ping warning for Spawning Soon
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.setValueAtTime(880.00, now + 0.15); // A5

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.55);
    }
  } catch (err) {
    console.warn('Audio play failed:', err);
  }
}
