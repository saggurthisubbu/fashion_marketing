import fs from 'fs';
import path from 'path';

// Generate a 16-bit PCM Mono WAV chime (880Hz -> 1320Hz bell chord)
function generateBellChime() {
  const sampleRate = 44100;
  const duration = 1.2; // seconds
  const totalSamples = Math.floor(sampleRate * duration);
  const buffer = Buffer.alloc(44 + totalSamples * 2);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + totalSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // audio format (1 = PCM)
  buffer.writeUInt16LE(1, 22); // num channels (1 = mono)
  buffer.writeUInt32LE(sampleRate, 24); // sample rate
  buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate (SampleRate * NumChannels * BitsPerSample/8)
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(totalSamples * 2, 40);

  // Generate chime tones
  // Tone 1: 784 Hz (G5) with quick decay
  // Tone 2: 1046.5 Hz (C6) with sustain and sparkle decay
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    
    // Tone 1 starts at 0, decays in 0.5s
    const env1 = Math.exp(-t * 6);
    const wave1 = Math.sin(2 * Math.PI * 784 * t) * env1;

    // Tone 2 starts at 0.1s, decays in 1.1s
    let wave2 = 0;
    if (t >= 0.08) {
      const t2 = t - 0.08;
      const env2 = Math.exp(-t2 * 3.5);
      const fundamental = Math.sin(2 * Math.PI * 1046.5 * t2);
      const harmonic = Math.sin(2 * Math.PI * 2093 * t2) * 0.3; // sparkle overtone
      wave2 = (fundamental + harmonic) * env2;
    }

    const mixed = (wave1 * 0.45 + wave2 * 0.55);
    const sample = Math.max(-1, Math.min(1, mixed));
    const intSample = Math.floor(sample * 32767);
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  const outDir = path.resolve('client/public/audio');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(path.join(outDir, 'order_notification.wav'), buffer);
  // Also save copy as .mp3 extension so both URLs resolve correctly
  fs.writeFileSync(path.join(outDir, 'order_notification.mp3'), buffer);
  console.log('✅ Generated chime in client/public/audio/order_notification.wav and .mp3');
}

generateBellChime();
