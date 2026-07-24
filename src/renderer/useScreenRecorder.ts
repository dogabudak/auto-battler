import { useRef, useState } from 'react';

/**
 * Easiest video export: capture the screen/tab with getDisplayMedia and record
 * it with MediaRecorder, then download a .webm. No renderer rewrite, no deps.
 * Shared by both battle views (FFA + PL Brawl).
 */
export function useScreenRecorder(fileNamePrefix = 'battle') {
  const [isRecording, setIsRecording] = useState(false);
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
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: false,
      });
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileNamePrefix}-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setIsRecording(false);
      };
      // If the user stops sharing via the browser UI, stop cleanly too.
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        if (recorder.state !== 'inactive') recorder.stop();
      });
      recorder.start();
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

  return { isRecording, startRecording, stopRecording };
}
