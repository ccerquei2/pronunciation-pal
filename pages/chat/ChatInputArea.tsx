import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MicrophoneIcon, StopCircleIcon, PaperAirplaneIcon } from '../../components/icons/EditorIcons';
import { RecordingState } from '../../types';
import { transcribeAudio } from '../../services/openaiService';
import { AI_TUTOR_NAME } from '../../constants';

interface ChatInputAreaProps {
  onSendMessage: (transcript: string, audioBlob?: Blob) => void;
  isLoadingAiResponse: boolean;
  isAiSpeakingGlobal: boolean;
}

const SoundWaveAnimationSmall: React.FC<{isActive: boolean}> = ({ isActive }) => (
  <div className="flex items-center justify-center h-5 w-8">
    <div className="flex space-x-0.5">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className={`w-0.5 rounded-full transition-all duration-200 ${isActive ? 'bg-sky-300 h-3.5 animate-pulse' : 'bg-slate-500 h-1'}`}
          style={{ animationDelay: isActive ? `${i * 80}ms` : undefined }}
        />
      ))}
    </div>
  </div>
);

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({ onSendMessage, isLoadingAiResponse, isAiSpeakingGlobal }) => {
  const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.IDLE);
  const [currentTextValue, setCurrentTextValue] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const isDisabled = isLoadingAiResponse || isAiSpeakingGlobal;

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

  const startRecording = async () => {
    if (isDisabled) return;
    setRecordingState(RecordingState.REQUESTING_PERMISSION);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorderRef.current.onstop = async () => {
        setRecordingState(RecordingState.PROCESSING);
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        cleanup();
        try {
          const text = await transcribeAudio(blob);
          setCurrentTextValue('');
          onSendMessage(text, blob);
        } catch (err) {
          console.error('[ChatInputArea] STT error:', err);
          setCurrentTextValue('[STT error]');
        }
        setRecordingState(RecordingState.IDLE);
      };
      mediaRecorderRef.current.start();
      setRecordingState(RecordingState.RECORDING);
      setCurrentTextValue('Listening...');
    } catch (err) {
      console.error('[ChatInputArea] Microphone error:', err);
      setRecordingState(RecordingState.IDLE);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleMicButtonClick = () => {
    if (recordingState === RecordingState.RECORDING) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSendText = () => {
    const text = currentTextValue.trim();
    if (isDisabled || !text || text === 'Listening...') return;
    onSendMessage(text);
    setCurrentTextValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRecordingState(RecordingState.PROCESSING);
    try {
      const text = await transcribeAudio(file);
      onSendMessage(text, file);
    } catch (err) {
      console.error('[ChatInputArea] STT file error:', err);
    }
    setRecordingState(RecordingState.IDLE);
    e.target.value = '';
  };

  return (
    <div className="bg-slate-700/70 backdrop-blur-sm p-2.5 md:p-3 border-t border-slate-600/50">
      <div className="flex items-end space-x-1.5">
        <button
          onClick={handleMicButtonClick}
          disabled={isDisabled}
          className={`p-2 rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-700/70 ${recordingState === RecordingState.RECORDING ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400 animate-pulse' : 'bg-sky-500 hover:bg-sky-600 text-white focus:ring-sky-400'} ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          aria-label={recordingState === RecordingState.RECORDING ? 'Stop recording and send' : 'Start recording'}
        >
          {recordingState === RecordingState.RECORDING ? <StopCircleIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
        </button>
        <textarea
          rows={1}
          value={currentTextValue}
          onChange={e => setCurrentTextValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={recordingState === RecordingState.RECORDING ? 'Listening...' : recordingState === RecordingState.PROCESSING ? 'Processing...' : 'Type or record...'}
          className="flex-1 p-2 bg-slate-600/80 border border-slate-500/70 rounded-lg text-slate-100 placeholder-slate-400/80 resize-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition-shadow text-sm min-h-[42px]"
          disabled={isDisabled}
        />
        {recordingState === RecordingState.RECORDING && <SoundWaveAnimationSmall isActive={true} />}
        <button
          onClick={handleSendText}
          disabled={isDisabled || !currentTextValue.trim() || currentTextValue === 'Listening...' || currentTextValue === 'Processing...'}
          className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-700/70 focus:ring-green-400 disabled:opacity-60 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
        <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" id="audio-upload" />
        <label htmlFor="audio-upload" className="p-2 bg-slate-600 hover:bg-slate-500 text-white rounded-full cursor-pointer">
          &#128190;
        </label>
      </div>
      {(isLoadingAiResponse || isAiSpeakingGlobal) && (
        <p className="text-xs text-sky-300/80 text-center mt-1.5 animate-pulse">
          {isLoadingAiResponse ? `${AI_TUTOR_NAME} is typing...` : `${AI_TUTOR_NAME} is speaking...`}
        </p>
      )}
    </div>
  );
};
