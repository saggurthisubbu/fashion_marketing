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

function generateClearOrderBuzzer() {
  const sampleRate = 44100;
  const duration = 1.4; // 1.4s clear buzzer alert
  const totalSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(totalSamples);

  // Helper for buzzer tone: rich square-soft harmonics
  function addBuzzerTone(startTime, durationSec, fundamentalFreq, volume = 0.9) {
    const startSample = Math.floor(startTime * sampleRate);
    const endSample = Math.min(totalSamples, startSample + Math.floor(durationSec * sampleRate));

    for (let i = startSample; i < endSample; i++) {
      const t = (i - startSample) / sampleRate;
      // Fast attack & decay envelope
      const attack = Math.min(1.0, t / 0.005);
      const remaining = durationSec - t;
      const release = Math.min(1.0, Math.max(0, remaining / 0.02));
      const envelope = attack * release;

      // Rich harmonic series for clear buzzer sound (fundamental + 3rd + 5th harmonics)
      const f1 = fundamentalFreq;
      const f2 = fundamentalFreq * 1.5;
      const f3 = fundamentalFreq * 2;
      const f5 = fundamentalFreq * 3;

      const wave = Math.sin(2 * Math.PI * f1 * t) * 0.55 +
                   Math.sin(2 * Math.PI * f2 * t) * 0.25 +
                   Math.sin(2 * Math.PI * f3 * t) * 0.20 +
                   Math.sin(2 * Math.PI * f5 * t) * 0.15;

      samples[i] += wave * envelope * volume;
    }
  }

  // Helper for clear bell chime ending
  function addChime(startTime, durationSec, freq, volume = 0.8) {
    const startSample = Math.floor(startTime * sampleRate);
    const endSample = Math.min(totalSamples, startSample + Math.floor(durationSec * sampleRate));

    for (let i = startSample; i < endSample; i++) {
      const t = (i - startSample) / sampleRate;
      const attack = Math.min(1.0, t / 0.003);
      const envelope = attack * Math.exp(-t * 3.5);
      const tone = Math.sin(2 * Math.PI * freq * t) * 0.6 +
                   Math.sin(2 * Math.PI * freq * 2 * t) * 0.3 +
                   Math.sin(2 * Math.PI * freq * 3 * t) * 0.1;
      samples[i] += tone * envelope * volume;
    }
  }

  // Clear 2-stage buzzer alert:
  // Beep 1: 880 Hz buzzer at 0.0s (0.18s duration)
  addBuzzerTone(0.00, 0.18, 880, 0.95);

  // Beep 2: 1175 Hz buzzer at 0.24s (0.20s duration)
  addBuzzerTone(0.24, 0.20, 1175, 1.0);

  // Chime: 1760 Hz bright bell chime at 0.48s (0.85s duration)
  addChime(0.48, 0.85, 1760, 0.95);

  // Normalize samples to peak at -0.1 dB (0.988)
  let maxPeak = 0;
  for (let i = 0; i < totalSamples; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > maxPeak) maxPeak = abs;
  }

  const normFactor = maxPeak > 0 ? 0.988 / maxPeak : 1;
  for (let i = 0; i < totalSamples; i++) {
    samples[i] *= normFactor;
  }

  const wavBuffer = createWavBuffer(samples, sampleRate);
  const tempWavPath = path.resolve('scratch/temp_buzzer.wav');
  fs.writeFileSync(tempWavPath, wavBuffer);

  const tempMp3Path = path.resolve('scratch/temp_buzzer.mp3');
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
  console.log(`Generated clear buzzer MP3 size: ${mp3Buffer.length} bytes`);

  const targetDirs = [
    path.resolve('client/public/sounds'),
    path.resolve('client/public/public/sounds'),
    path.resolve('client/dist/sounds'),
    path.resolve('client/dist/public/sounds'),
    path.resolve('public/sounds')
  ];

  for (const dir of targetDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const mp3Dest = path.join(dir, 'order-alert.mp3');
    fs.writeFileSync(mp3Dest, mp3Buffer);
    console.log(`✅ Saved buzzer MP3 to: ${mp3Dest}`);

    const wavDest = path.join(dir, 'order-alert.wav');
    fs.writeFileSync(wavDest, wavBuffer);
  }

  // Also save to legacy audio paths for complete backwards compatibility
  const legacyDirs = [
    path.resolve('client/public/audio'),
    path.resolve('client/dist/audio')
  ];
  for (const dir of legacyDirs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'order_notification.mp3'), mp3Buffer);
    fs.writeFileSync(path.join(dir, 'order_notification.wav'), wavBuffer);
    console.log(`✅ Saved legacy audio to: ${dir}`);
  }
}

generateClearOrderBuzzer();
