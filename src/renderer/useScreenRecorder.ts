import { useRef, useState } from 'react';

/**
 * Video export: capture the screen/tab with getDisplayMedia and record it with
 * MediaRecorder, then download a .webm. No renderer rewrite, no deps.
 * Shared by both battle views (FFA + PL Brawl).
 *
 * Tuned for maximum quality, because MediaRecorder's defaults are tuned for
 * video calls — talking heads at low bitrate. Battle footage is the opposite:
 * constant motion behind hard-edged crests, flags and text, which is exactly
 * what a low bitrate smears. Four things do the work here:
 *
 *   1. An explicit `videoBitsPerSecond`, computed from the pixels actually
 *      being captured rather than a fixed guess (see `targetBitrate`).
 *   2. VP9 over VP8 — noticeably more detail retained at the same bitrate.
 *   3. `contentHint = 'detail'`, which tells the encoder to protect sharpness
 *      instead of smoothing motion. Aimed squarely at crests and labels.
 *   4. Capture constraints that ask for the surface's native resolution instead
 *      of letting the browser hand back a downscaled stream.
 */

/**
 * Bits per pixel per frame. Rule of thumb: 0.1 is "good", 0.2 is visually
 * lossless for screen content. We sit at the top of that range on purpose —
 * these files are re-encoded again by every platform they get uploaded to, so
 * the master needs headroom to survive a second lossy pass.
 */
const BITS_PER_PIXEL = 0.2;

/** 1080p30 at 0.2 bpp is ~12.4 Mbps; the floor keeps small surfaces crisp too. */
const MIN_BITRATE = 8_000_000;
/** Above this, MediaRecorder is more likely to drop frames than gain quality. */
const MAX_BITRATE = 50_000_000;

/**
 * 30 fps until the renderer animates continuously (MVP_PLAN 4.0) — the battle
 * currently steps at 400ms, so 60 fps would only record the same stutter twice
 * as faithfully while halving the bits available to each frame.
 */
const CAPTURE_FPS = 30;

/**
 * Best first. AV1 is deliberately absent: realtime AV1 encoding drops frames on
 * most machines, and dropped frames cost more than the codec gains.
 */
const CODEC_PREFERENCE = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
];

/** What we actually got — surfaced in the UI so quality is verifiable, not assumed. */
export interface CaptureStats {
  width: number;
  height: number;
  frameRate: number;
  /** Bits per second requested from the encoder. */
  bitrate: number;
  /** Short codec label, e.g. "VP9". */
  codec: string;
}

/**
 * getDisplayMedia takes constraints the DOM types don't model yet (`cursor`,
 * `surfaceSwitching`), and they matter: a mouse pointer sitting in frame ruins
 * an otherwise clean export.
 */
interface DisplayCaptureConstraints {
  video: MediaTrackConstraints & {
    cursor?: string;
    displaySurface?: string;
  };
  audio: false;
  surfaceSwitching?: string;
  selfBrowserSurface?: string;
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return undefined;
  return CODEC_PREFERENCE.find(type => MediaRecorder.isTypeSupported(type));
}

function codecLabel(mimeType: string | undefined): string {
  const match = mimeType?.match(/codecs=([\w.]+)/);
  return match ? match[1].toUpperCase() : 'default';
}

/** Bitrate scaled to the real capture size, clamped to what the encoder handles well. */
function targetBitrate(width: number, height: number, frameRate: number): number {
  const raw = width * height * frameRate * BITS_PER_PIXEL;
  return Math.round(Math.min(MAX_BITRATE, Math.max(MIN_BITRATE, raw)));
}

export function useScreenRecorder(fileNamePrefix = 'battle') {
  const [isRecording, setIsRecording] = useState(false);
  const [stats, setStats] = useState<CaptureStats | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      alert(
        'Screen recording is not available. Open the app over http://localhost ' +
        '(a secure context) in Chrome/Edge/Firefox — it is blocked on plain HTTP over a network IP.'
      );
      return;
    }
    try {
      const constraints: DisplayCaptureConstraints = {
        video: {
          // Ask high so the browser hands back the surface's native pixels; it
          // caps to what the surface actually has rather than upscaling.
          width: { ideal: 3840 },
          height: { ideal: 2160 },
          frameRate: { ideal: CAPTURE_FPS, max: CAPTURE_FPS },
          // Keep the pointer out of the export.
          cursor: 'never',
          // Nudge the picker toward a single tab: no browser chrome in frame.
          displaySurface: 'browser',
        },
        audio: false,
        surfaceSwitching: 'exclude',
        selfBrowserSurface: 'include',
      };

      const stream = await navigator.mediaDevices.getDisplayMedia(
        constraints as unknown as DisplayMediaStreamOptions
      );

      const track = stream.getVideoTracks()[0];
      // Screen content: favour sharp edges over smooth motion.
      track.contentHint = 'detail';

      const settings = track.getSettings();
      const width = settings.width ?? 1920;
      const height = settings.height ?? 1080;
      const frameRate = Math.round(settings.frameRate ?? CAPTURE_FPS);
      const bitrate = targetBitrate(width, height, frameRate);
      const mimeType = pickMimeType();

      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        videoBitsPerSecond: bitrate,
      });

      setStats({ width, height, frameRate, bitrate, codec: codecLabel(recorder.mimeType) });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileNamePrefix}-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setIsRecording(false);
      };
      // If the user stops sharing via the browser UI, stop cleanly too.
      track.addEventListener('ended', () => {
        if (recorder.state !== 'inactive') recorder.stop();
      });
      // Chunk per second so a long battle doesn't sit in one growing buffer.
      recorder.start(1000);
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      // Abort/NotAllowed = the user dismissed the picker; anything else is a real error.
      const name = (err as DOMException)?.name;
      if (name !== 'AbortError' && name !== 'NotAllowedError') {
        alert(`Could not start recording: ${(err as Error)?.message ?? err}`);
      }
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  };

  return { isRecording, startRecording, stopRecording, stats };
}

/** e.g. "1920×1080 · 30 fps · 12.4 Mbps · VP9" */
export function formatCaptureStats(stats: CaptureStats): string {
  const mbps = (stats.bitrate / 1_000_000).toFixed(1);
  return `${stats.width}×${stats.height} · ${stats.frameRate} fps · ${mbps} Mbps · ${stats.codec}`;
}
