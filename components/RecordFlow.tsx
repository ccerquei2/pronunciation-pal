import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MicrophoneIcon, StopCircleIcon } from './icons/EditorIcons';
import { RecordingState } from '../types';
import { transcribeAudio } from '../services/openaiService';

interface RecordFlowProps {
  onRecordingComplete: (audioBlob: Blob, transcript: string) => void;
  disabled?: boolean;
}

const SoundWaveAnimation: React.FC<{isActive: boolean}> = ({ isActive }) => (
  <div className="flex items-center justify-center h-10 w-full my-2">
    <div className="flex space-x-1">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-full transition-all duration-300 ${isActive ? 'bg-sky-400 h-6 animate-pulse' : 'bg-slate-600 h-2'}`}
          style={{ animationDelay: isActive ? `${i * 100}ms` : undefined }}
        />
      ))}
    </div>
  </div>
);

export const RecordFlow: React.FC<RecordFlowProps> = ({ onRecordingComplete, disabled }) => {
  const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.IDLE);
  const [statusMessage, setStatusMessage] = useState('Click the microphone to start recording.');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    audioChunksRef.current = [];
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const startRecording = useCallback(async () => {
    if (disabled) return;
    setRecordingState(RecordingState.REQUESTING_PERMISSION);
    setStatusMessage('Requesting microphone permission...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorderRef.current.onstop = async () => {
        setRecordingState(RecordingState.PROCESSING);
        setStatusMessage('Transcribing...');
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        cleanup();
        try {
          const text = await transcribeAudio(blob);
          onRecordingComplete(blob, text);
          setStatusMessage('Recording complete.');
        } catch (err) {
          console.error('[RecordFlow] STT error:', err);
          onRecordingComplete(blob, '');
          setStatusMessage('Transcription failed.');
        }
        setRecordingState(RecordingState.IDLE);
      };
      mediaRecorderRef.current.start();
      setRecordingState(RecordingState.RECORDING);
      setStatusMessage('Recording... Click stop when done.');
    } catch (err) {
      console.error('[RecordFlow] Mic error:', err);
      setStatusMessage('Microphone error.');
      setRecordingState(RecordingState.IDLE);
    }
  }, [disabled, cleanup, onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const handleMicButtonClick = () => {
    if (disabled) return;
    if (recordingState === RecordingState.RECORDING) {
      stopRecording();
    } else if (recordingState === RecordingState.IDLE) {
      startRecording();
    }
  };

  return (
    <div className="bg-slate-700/50 p-6 rounded-xl shadow-xl flex flex-col items-center space-y-4 transition-all duration-300 ease-in-out">
      <button
        onClick={handleMicButtonClick}
        disabled={disabled || recordingState === RecordingState.REQUESTING_PERMISSION || recordingState === RecordingState.PROCESSING}
        className={`relative flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-opacity-50 ${recordingState === RecordingState.RECORDING ? 'bg-red-500 hover:bg-red-600 focus:ring-red-400 animate-pulse' : 'bg-sky-500 hover:bg-sky-600 focus:ring-sky-400'} ${(disabled || recordingState === RecordingState.REQUESTING_PERMISSION || recordingState === RecordingState.PROCESSING) ? 'opacity-60 cursor-not-allowed' : ''}`}
        aria-label={recordingState === RecordingState.RECORDING ? 'Stop recording' : 'Start recording'}
        aria-live="polite"
      >
        {recordingState === RecordingState.RECORDING ? <StopCircleIcon className="w-12 h-12 text-white" /> : <MicrophoneIcon className="w-12 h-12 text-white" />}
      </button>
      <SoundWaveAnimation isActive={recordingState === RecordingState.RECORDING} />
      <p className="text-sm text-slate-300 h-5 min-h-[1.25rem]" aria-live="assertive">{statusMessage}</p>
    </div>
  );
};
