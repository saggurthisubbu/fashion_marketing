import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

const ffmpegPath = ffmpegInstaller.path;

function createWavBuffer(samples, sampleRate) {
  const totalSamples = samples.length;
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
  buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(totalSamples * 2, 40);

  for (let i = 0; i < totalSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const intSample = s < 0 ? Math.floor(s * 32768) : Math.floor(s * 32767);
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  return buffer;
}

function generateLoudOrderAlert() {
  const sampleRate = 44100;
  const duration = 2.6; // 2.6 seconds total
  const totalSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(totalSamples);

  // Helper to add a loud bell chime tone
  function addChime(startTime, durationSec, freqs, weights, decayRate = 3.5, volume = 1.0) {
    const startSample = Math.floor(startTime * sampleRate);
    const endSample = Math.min(totalSamples, startSample + Math.floor(durationSec * sampleRate));

    for (let i = startSample; i < endSample; i++) {
      const t = (i - startSample) / sampleRate;
      // Fast attack (3ms) for maximum impact punch
      const attack = Math.min(1.0, t / 0.003);
      // Exponential decay
      const envelope = attack * Math.exp(-t * decayRate);

      let tone = 0;
      for (let f = 0; f < freqs.length; f++) {
        const freq = freqs[f];
        const weight = weights[f] || 0.2;
        tone += Math.sin(2 * Math.PI * freq * t) * weight;
      }
      samples[i] += tone * envelope * volume;
    }
  }

  // Motive: Urgent, loud, clear order fanfare
  // Note 1: 932.33 Hz (Bb5) at 0.00s
  addChime(0.00, 0.45, [932.33, 1864.66, 2797, 3729], [0.65, 0.35, 0.2, 0.1], 5.0, 0.85);

  // Note 2: 1174.66 Hz (D6) at 0.18s
  addChime(0.18, 0.45, [1174.66, 2349.32, 3524], [0.7, 0.35, 0.15], 4.8, 0.90);

  // Note 3: 1396.91 Hz (F6) at 0.36s
  addChime(0.36, 0.60, [1396.91, 2793.82, 4190], [0.75, 0.35, 0.15], 4.2, 0.95);

  // Note 4: 1864.66 Hz (High Bb6) ringing alert bell at 0.60s (sustained loud chime)
  addChime(0.60, 1.20, [1864.66, 3729.32, 5594, 932.33], [0.85, 0.35, 0.15, 0.3], 2.8, 1.05);

  // Note 5: Second urgent double-ring at 1.30s (F6 -> Bb6) to ensure admin cannot miss it
  addChime(1.30, 0.40, [1396.91, 2793.82], [0.7, 0.3], 5.0, 0.90);
  addChime(1.48, 1.10, [1864.66, 3729.32, 5594], [0.85, 0.4, 0.2], 2.5, 1.05);

  // Normalize samples to peak at -0.2 dB (0.977) for maximum loud clarity without clipping
  let maxPeak = 0;
  for (let i = 0; i < totalSamples; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > maxPeak) maxPeak = abs;
  }

  const normFactor = maxPeak > 0 ? 0.977 / maxPeak : 1;
  for (let i = 0; i < totalSamples; i++) {
    samples[i] *= normFactor;
  }

  const wavBuffer = createWavBuffer(samples, sampleRate);
  const tempWavPath = path.resolve('scratch/temp_order_alert.wav');
  fs.writeFileSync(tempWavPath, wavBuffer);
  console.log(`Saved temporary WAV: ${tempWavPath} (${wavBuffer.length} bytes)`);

  const tempMp3Path = path.resolve('scratch/temp_order_alert.mp3');
  if (fs.existsSync(tempMp3Path)) {
    fs.unlinkSync(tempMp3Path);
  }

  // Convert to high quality 192k MP3 using ffmpeg
  execFileSync(ffmpegPath, [
    '-y',
    '-i', tempWavPath,
    '-codec:a', 'libmp3lame',
    '-b:a', '192k',
    '-ar', '44100',
    tempMp3Path
  ]);

  const mp3Buffer = fs.readFileSync(tempMp3Path);
  console.log(`Successfully generated MP3 via ffmpeg: ${mp3Buffer.length} bytes`);

  // Target directories
  const targetDirs = [
    path.resolve('client/public/sounds'),
    path.resolve('client/public/public/sounds'),
    path.resolve('public/sounds')
  ];

  for (const dir of targetDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const mp3Dest = path.join(dir, 'order-alert.mp3');
    fs.writeFileSync(mp3Dest, mp3Buffer);
    console.log(`✅ Written ${mp3Dest}`);

    const wavDest = path.join(dir, 'order-alert.wav');
    fs.writeFileSync(wavDest, wavBuffer);
  }
}

generateLoudOrderAlert();
