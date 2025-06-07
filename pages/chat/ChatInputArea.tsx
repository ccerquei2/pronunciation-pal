
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MicrophoneIcon, StopCircleIcon, PaperAirplaneIcon } from '../../components/icons/EditorIcons';
import { RecordingState, SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from '../../types';
import { AI_TUTOR_NAME } from '../../constants'; // Added import

interface ChatInputAreaProps {
  onSendMessage: (transcript: string, audioBlob?: Blob) => void;
  isLoadingAiResponse: boolean;
  isAiSpeakingGlobal: boolean;
}

const SoundWaveAnimationSmall: React.FC<{isActive: boolean}> = ({ isActive }) => {
  return (
    <div className="flex items-center justify-center h-6 w-10">
      <div className="flex space-x-0.5">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-200 ${
              isActive 
                ? 'bg-sky-400 h-4 animate-pulse'
                : 'bg-slate-500 h-1'
            }`}
            style={{ animationDelay: isActive ? `${i * 80}ms` : undefined }}
          />
        ))}
      </div>
    </div>
  );
};

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({ onSendMessage, isLoadingAiResponse, isAiSpeakingGlobal }) => {
  const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.IDLE);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const finalTranscriptFromSpeechRecRef = useRef<string>(''); // For accumulating final speech rec results
  const sttErrorOccurredRef = useRef<boolean>(false); // Flag to track if STT error was handled

  const isDisabled = isLoadingAiResponse || isAiSpeakingGlobal;

  const cleanupRecordingResources = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    audioChunksRef.current = [];
    finalTranscriptFromSpeechRecRef.current = '';
    sttErrorOccurredRef.current = false;
  }, []);

  useEffect(() => {
    return cleanupRecordingResources; // Cleanup on unmount
  }, [cleanupRecordingResources]);

  const startRecording = useCallback(async () => {
    if (isDisabled) return;
    
    setRecordingState(RecordingState.REQUESTING_PERMISSION);
    setCurrentTranscript(''); 
    sttErrorOccurredRef.current = false;
    cleanupRecordingResources(); 

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setRecordingState(RecordingState.RECORDING);
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        console.log('[ChatInputArea] mediaRecorder.onstop triggered.');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        const sttFinalRefValue = finalTranscriptFromSpeechRecRef.current.trim();
        // Use currentTranscript state, which might have been updated by STT error/end handlers
        const stateTranscriptValue = currentTranscript.trim(); 
        console.log(`[ChatInputArea] In onstop - Raw values: sttFinalRef: "${sttFinalRefValue}", stateTranscript: "${stateTranscriptValue}"`);

        // Prioritize final STT ref, then state (which might contain diagnostic messages)
        const transcriptToSend = sttFinalRefValue || stateTranscriptValue;
        console.log(`[ChatInputArea] In onstop - Transcript to send: "${transcriptToSend}", Blob size: ${audioBlob.size}`);
        
        if (transcriptToSend || audioBlob.size > 0) {
           onSendMessage(transcriptToSend, audioBlob);
        } else {
           console.log('[ChatInputArea] In onstop - Neither transcript nor audio blob has content. Not sending message.');
           // If sttErrorOccurredRef wasn't set (meaning no specific error or nomatch event handled it),
           // but we still have no transcript, provide a generic message.
           if (!sttErrorOccurredRef.current) {
               onSendMessage("[No transcript captured]", audioBlob.size > 0 ? audioBlob : undefined);
           }
        }
        
        setCurrentTranscript(''); 
        setRecordingState(RecordingState.IDLE);
        finalTranscriptFromSpeechRecRef.current = ''; // Ensure this is also cleared
        sttErrorOccurredRef.current = false; // Reset flag
      };

      mediaRecorderRef.current.start();

      const SpeechRecognitionAPI = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        recognitionRef.current = new SpeechRecognitionAPI();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        finalTranscriptFromSpeechRecRef.current = ''; 
        sttErrorOccurredRef.current = false;

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          console.log('[ChatInputArea] STT onresult event:', event);
          let interim = '';
          let finalSegment = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalSegment += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          console.log(`[ChatInputArea] STT onresult - Interim: "${interim}", FinalSegment: "${finalSegment}"`);

          if (finalSegment){
            finalTranscriptFromSpeechRecRef.current = (finalTranscriptFromSpeechRecRef.current + " " + finalSegment).trim();
            console.log('[ChatInputArea] STT Final segment processed, accumulated finalTranscriptRef:', finalTranscriptFromSpeechRecRef.current);
            setCurrentTranscript(finalTranscriptFromSpeechRecRef.current); 
            sttErrorOccurredRef.current = false; // Reset error flag if we get a final result
          } else if (interim) {
            setCurrentTranscript(finalTranscriptFromSpeechRecRef.current + (finalTranscriptFromSpeechRecRef.current ? " " : "") + interim);
          }
        };

        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('[ChatInputArea] STT Error:', event.error, 'Message:', event.message, 'Full event:', event);
          setCurrentTranscript(prev => prev.trim() ? prev : `[STT Error: ${event.error}]`);
          sttErrorOccurredRef.current = true;
        };

        recognitionRef.current.onnomatch = (event: SpeechRecognitionEvent) => {
            console.warn('[ChatInputArea] STT NoMatch event. Speech was detected but not recognized.', event);
            setCurrentTranscript(prev => prev.trim() ? prev : "[Speech not recognized]");
            sttErrorOccurredRef.current = true;
        };
        
        recognitionRef.current.onend = () => {
          console.log('[ChatInputArea] Speech recognition service ended.');
          // If it ended, no error occurred, no final transcript captured, and currentTranscript is empty
          if (!sttErrorOccurredRef.current && !finalTranscriptFromSpeechRecRef.current.trim() && !currentTranscript.trim()) {
            setCurrentTranscript("[STT ended: No transcript]");
            sttErrorOccurredRef.current = true; // Mark that we've set a diagnostic
          }
        };
        
        console.log('[ChatInputArea] Starting SpeechRecognition...');
        recognitionRef.current.start();
      } else {
        console.warn('[ChatInputArea] Speech recognition not supported.');
        setCurrentTranscript("[STT not supported by browser]");
        sttErrorOccurredRef.current = true;
      }
    } catch (err) {
      console.error("[ChatInputArea] Error starting recording:", err);
      let errorMessage = "[Error starting mic]";
      if (err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")) {
        errorMessage = "[Mic permission denied]";
      }
      setCurrentTranscript(errorMessage);
      sttErrorOccurredRef.current = true;
      setRecordingState(RecordingState.IDLE);
      cleanupRecordingResources();
    }
  }, [onSendMessage, isDisabled, cleanupRecordingResources]);

  const stopRecordingAndProcess = useCallback(() => {
    console.log('[ChatInputArea] stopRecordingAndProcess called.');
    if (recognitionRef.current) {
      console.log('[ChatInputArea] Stopping STT explicitly.');
      recognitionRef.current.stop(); 
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      console.log('[ChatInputArea] Stopping MediaRecorder.');
      mediaRecorderRef.current.stop(); 
    } else { 
        const trimmedTranscript = currentTranscript.trim();
        if(trimmedTranscript && !sttErrorOccurredRef.current){ // Only send typed if no STT error message is there
            console.log('[ChatInputArea] Sending typed text:', trimmedTranscript);
            onSendMessage(trimmedTranscript);
            setCurrentTranscript('');
        } else if (trimmedTranscript && sttErrorOccurredRef.current) {
             // If there's a diagnostic message, send it (mediaRecorder.onstop would handle this if recording was active)
            onSendMessage(trimmedTranscript); 
            setCurrentTranscript('');
        }
        setRecordingState(RecordingState.IDLE);
        finalTranscriptFromSpeechRecRef.current = '';
        sttErrorOccurredRef.current = false;
    }
  }, [currentTranscript, onSendMessage]);

  const handleMicButtonClick = () => {
    if (recordingState === RecordingState.RECORDING) {
      stopRecordingAndProcess();
    } else {
      startRecording();
    }
  };

  const handleSendText = () => {
    if (recordingState === RecordingState.RECORDING) {
        stopRecordingAndProcess();
    } else if (currentTranscript.trim()) {
        // If currentTranscript holds a diagnostic message from STT, send it.
        // If it's user-typed text, send it.
        onSendMessage(currentTranscript.trim());
        setCurrentTranscript('');
        finalTranscriptFromSpeechRecRef.current = '';
        sttErrorOccurredRef.current = false;
    }
  };
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendText();
    }
  };

  return (
    <div className="bg-slate-700/80 backdrop-blur-md p-3 md:p-4 border-t border-slate-600">
      <div className="flex items-end space-x-2">
        <button
          onClick={handleMicButtonClick}
          disabled={isDisabled && recordingState !== RecordingState.RECORDING}
          className={`p-2.5 rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-700
            ${recordingState === RecordingState.RECORDING 
              ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400 animate-pulse' 
              : 'bg-sky-500 hover:bg-sky-600 text-white focus:ring-sky-400'}
            ${isDisabled && recordingState !== RecordingState.RECORDING ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          aria-label={recordingState === RecordingState.RECORDING ? "Stop recording and send" : "Start recording"}
        >
          {recordingState === RecordingState.RECORDING ? <StopCircleIcon className="w-6 h-6" /> : <MicrophoneIcon className="w-6 h-6" />}
        </button>
        <textarea
          rows={1}
          value={currentTranscript}
          onChange={(e) => {
              setCurrentTranscript(e.target.value);
              sttErrorOccurredRef.current = false; // User typing clears any STT diagnostic
              finalTranscriptFromSpeechRecRef.current = ''; // If user types, STT ref is no longer primary
          }}
          onKeyDown={handleKeyDown}
          placeholder={recordingState === RecordingState.RECORDING ? "Listening..." : "Type or record your message..."}
          className="flex-1 p-2.5 bg-slate-600 border border-slate-500 rounded-lg text-slate-100 placeholder-slate-400 resize-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-shadow min-h-[50px]"
          disabled={isDisabled && recordingState !== RecordingState.RECORDING} 
        />
        {recordingState === RecordingState.RECORDING && <SoundWaveAnimationSmall isActive={true} />}
        <button
          onClick={handleSendText}
          disabled={isDisabled || (!currentTranscript.trim() && recordingState !== RecordingState.RECORDING)}
          className="p-2.5 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-700 focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <PaperAirplaneIcon className="w-6 h-6" />
        </button>
      </div>
      {(isLoadingAiResponse || isAiSpeakingGlobal) && (
         <p className="text-xs text-sky-300 text-center mt-2 animate-pulse">
            {isLoadingAiResponse ? `${AI_TUTOR_NAME} is typing...` : `${AI_TUTOR_NAME} is speaking...`}
        </p>
      )}
    </div>
  );
};
