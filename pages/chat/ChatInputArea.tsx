
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MicrophoneIcon, StopCircleIcon, PaperAirplaneIcon } from '../../components/icons/EditorIcons';
import { RecordingState, SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from '../../types';
import { AI_TUTOR_NAME } from '../../constants';

interface ChatInputAreaProps {
  onSendMessage: (transcript: string, audioBlob?: Blob) => void;
  isLoadingAiResponse: boolean;
  isAiSpeakingGlobal: boolean;
}

const SoundWaveAnimationSmall: React.FC<{isActive: boolean}> = ({ isActive }) => {
  return (
    <div className="flex items-center justify-center h-5 w-8">
      <div className="flex space-x-0.5">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`w-0.5 rounded-full transition-all duration-200 ${
              isActive 
                ? 'bg-sky-300 h-3.5 animate-pulse'
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
  const [currentTextValue, setCurrentTextValue] = useState<string>(''); // For textarea input
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const finalTranscriptFromSpeechRecRef = useRef<string>('');
  const sttErrorRef = useRef<string | null>(null); // To store STT error messages

  const isDisabled = isLoadingAiResponse || isAiSpeakingGlobal;

  const cleanupRecordingResources = useCallback(() => {
    console.log('[ChatInputArea] cleanupRecordingResources called.');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log('[ChatInputArea] cleanup: Stopping active media recorder.');
      mediaRecorderRef.current.stop(); // This will trigger its onstop if not already called
    }
    mediaRecorderRef.current = null;
    
    if (recognitionRef.current) {
      console.log('[ChatInputArea] cleanup: Aborting speech recognition.');
      recognitionRef.current.abort(); // Stops recognition and triggers onend
      recognitionRef.current = null;
    }
    
    if (streamRef.current) {
      console.log('[ChatInputArea] cleanup: Stopping media stream tracks.');
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    audioChunksRef.current = [];
    finalTranscriptFromSpeechRecRef.current = '';
    sttErrorRef.current = null;
  }, []);

  useEffect(() => {
    // Cleanup on component unmount
    return () => {
      console.log('[ChatInputArea] Component unmounting, cleaning up resources.');
      cleanupRecordingResources();
    };
  }, [cleanupRecordingResources]);

  // Handler for MediaRecorder's onstop event
  const handleMediaRecorderStop = useCallback(() => {
    console.log('[ChatInputArea] mediaRecorder.onstop triggered.');
    if (audioChunksRef.current.length === 0 && !finalTranscriptFromSpeechRecRef.current.trim()) {
        console.warn('[ChatInputArea] mediaRecorder.onstop: No audio chunks and no transcript. Aborting send.');
        setRecordingState(RecordingState.IDLE);
        setCurrentTextValue(sttErrorRef.current || "[Recording failed or no speech]"); 
        sttErrorRef.current = null; // Reset error
        return;
    }

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    let transcriptToSend = finalTranscriptFromSpeechRecRef.current.trim();

    console.log(`[ChatInputArea] mediaRecorder.onstop - Final transcript from STT: "${transcriptToSend}", Blob size: ${audioBlob.size}`);

    if (!transcriptToSend && sttErrorRef.current) {
        transcriptToSend = sttErrorRef.current; // Send STT error as text if transcript is empty
    } else if (!transcriptToSend && audioBlob.size > 0) {
        transcriptToSend = "[Speech not transcribed]"; // Placeholder if STT yielded nothing but there's audio
    }
    
    if (transcriptToSend || audioBlob.size > 0) {
       onSendMessage(transcriptToSend, audioBlob);
    } else {
       console.log('[ChatInputArea] mediaRecorder.onstop: No transcript and no audio blob content. Not sending message.');
    }
    
    setCurrentTextValue(''); 
    setRecordingState(RecordingState.IDLE);
    finalTranscriptFromSpeechRecRef.current = '';
    audioChunksRef.current = []; // Clear chunks after processing
    sttErrorRef.current = null; // Reset error status
  }, [onSendMessage]);


  const startRecording = useCallback(async () => {
    if (isDisabled) return;
    
    console.log('[ChatInputArea] Attempting to start recording.');
    setRecordingState(RecordingState.REQUESTING_PERMISSION);
    setCurrentTextValue(''); // Clear textarea
    finalTranscriptFromSpeechRecRef.current = '';
    sttErrorRef.current = null;
    
    // Perform cleanup of previous resources *before* attempting to acquire new ones
    cleanupRecordingResources(); 

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      console.log('[ChatInputArea] Microphone permission granted.');
      setRecordingState(RecordingState.RECORDING);
      setCurrentTextValue('Listening...');
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = handleMediaRecorderStop; // Assign the memoized handler

      mediaRecorderRef.current.start();
      console.log('[ChatInputArea] MediaRecorder started.');

      const SpeechRecognitionAPI = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        console.log('[ChatInputArea] SpeechRecognitionAPI found.');
        recognitionRef.current = new SpeechRecognitionAPI();
        recognitionRef.current.continuous = false; // Simpler mode: stop speaking, then result
        recognitionRef.current.interimResults = true; // Still useful for visual feedback
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = '';
          let finalSegment = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalSegment += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          
          if (finalSegment) {
            finalTranscriptFromSpeechRecRef.current = (finalTranscriptFromSpeechRecRef.current + " " + finalSegment).trim();
            console.log('[ChatInputArea] STT Final segment processed, accumulated finalTranscriptRef:', finalTranscriptFromSpeechRecRef.current);
            setCurrentTextValue(finalTranscriptFromSpeechRecRef.current); 
            sttErrorRef.current = null;
          } else if (interimTranscript && recordingState === RecordingState.RECORDING) {
             setCurrentTextValue(finalTranscriptFromSpeechRecRef.current + (finalTranscriptFromSpeechRecRef.current ? " " : "") + interimTranscript + "...");
          }
        };

        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('[ChatInputArea] Speech recognition error:', event.error, event.message);
          sttErrorRef.current = `[STT Error: ${event.error}]`;
          setCurrentTextValue(sttErrorRef.current);
          // Do not stop media recorder here directly, let onend handle it or timeout
        };
        
        recognitionRef.current.onnomatch = () => {
            console.warn('[ChatInputArea] STT NoMatch event. Speech was detected but not recognized.');
            sttErrorRef.current = "[Speech not recognized by STT]";
            setCurrentTextValue(sttErrorRef.current);
        };
        
        recognitionRef.current.onend = () => {
          console.log('[ChatInputArea] Speech recognition service ended. Final transcript: "' + finalTranscriptFromSpeechRecRef.current + '"');
          // If recognition ends, and media recorder is still going, stop it.
          // This ensures mediaRecorder.onstop is called to finalize.
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            console.log('[ChatInputArea] STT ended, stopping media recorder.');
            mediaRecorderRef.current.stop();
          } else if (recordingState === RecordingState.RECORDING && (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive")) {
            // STT ended, but recorder wasn't active or already stopped. This case might need to manually trigger finalization if STT has data.
             console.log('[ChatInputArea] STT ended, recorder not active. Manually calling handleMediaRecorderStop if transcript exists.');
             if (finalTranscriptFromSpeechRecRef.current.trim() || audioChunksRef.current.length > 0) {
                handleMediaRecorderStop(); // Manually call if STT ended and recorder is already stopped
             } else {
                setRecordingState(RecordingState.IDLE);
                setCurrentTextValue(sttErrorRef.current || (finalTranscriptFromSpeechRecRef.current.trim() ? finalTranscriptFromSpeechRecRef.current : "[STT ended: No data]"));
             }
          }
          // setCurrentTextValue will be updated by onresult or onerror. If STT ends with no result, placeholder text is useful.
           if (!finalTranscriptFromSpeechRecRef.current.trim() && recordingState === RecordingState.RECORDING) {
               if (!sttErrorRef.current) sttErrorRef.current = "[STT ended: No transcript]";
               setCurrentTextValue(sttErrorRef.current);
           }
        };
        
        recognitionRef.current.start();
        console.log('[ChatInputArea] Speech recognition started.');
      } else {
        console.warn('[ChatInputArea] Speech recognition not supported by this browser.');
        sttErrorRef.current = "[STT not supported by browser]";
        setCurrentTextValue(sttErrorRef.current);
        // If STT not supported, stop media recorder immediately as no transcript will come.
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        } else {
            setRecordingState(RecordingState.IDLE); // Fallback if recorder didn't even start
        }
      }

    } catch (err) {
      console.error("[ChatInputArea] Error accessing microphone or starting recording:", err);
      let userErrorMessage = "[Error starting mic]";
      if (err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")) {
          userErrorMessage = "[Mic permission denied]";
      }
      sttErrorRef.current = userErrorMessage;
      setCurrentTextValue(userErrorMessage);
      setRecordingState(RecordingState.IDLE);
      cleanupRecordingResources(); // Ensure cleanup on error
    }
  }, [isDisabled, cleanupRecordingResources, handleMediaRecorderStop, recordingState]);

  const stopRecordingAndProcess = useCallback(() => {
    console.log('[ChatInputArea] stopRecordingAndProcess called. Current state:', recordingState);
    if (recordingState !== RecordingState.RECORDING) {
        console.warn('[ChatInputArea] Stop called but not in recording state.');
        // If there's text in the input field from typing, send it
        const trimmedText = currentTextValue.trim();
        if (trimmedText && trimmedText !== "Listening..." && !trimmedText.startsWith("[")) { // Avoid sending status messages
            onSendMessage(trimmedText);
            setCurrentTextValue('');
        }
        setRecordingState(RecordingState.IDLE); // Ensure reset
        return;
    }

    setCurrentTextValue("Processing..."); // Visual feedback

    if (recognitionRef.current) {
      console.log('[ChatInputArea] Stopping speech recognition explicitly.');
      recognitionRef.current.stop(); // This should trigger onresult with isFinal=true then onend.
                                     // onend will then stop mediaRecorder.
    } else if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      // Fallback if recognition wasn't initialized but recorder was
      console.log('[ChatInputArea] Speech recognition not active, stopping media recorder directly.');
      mediaRecorderRef.current.stop();
    } else {
      // Neither recognition nor recorder active, but was in 'RECORDING' state somehow. Reset.
      console.warn('[ChatInputArea] In RECORDING state but no active recognition or recorder to stop.');
      handleMediaRecorderStop(); // Try to process whatever might exist
      setRecordingState(RecordingState.IDLE);
      setCurrentTextValue(''); // Reset text
    }
  }, [recordingState, currentTextValue, onSendMessage, handleMediaRecorderStop]);

  const handleMicButtonClick = () => {
    if (isDisabled && recordingState !== RecordingState.RECORDING) return;

    if (recordingState === RecordingState.RECORDING) {
      stopRecordingAndProcess();
    } else {
      startRecording();
    }
  };

  const handleSendText = () => {
    if (isDisabled) return;

    if (recordingState === RecordingState.RECORDING) {
        stopRecordingAndProcess(); // Finalize recording then send.
    } else {
        const trimmedText = currentTextValue.trim();
        if (trimmedText && trimmedText !== "Listening..." && !trimmedText.startsWith("[")) { // Avoid sending status messages
            onSendMessage(trimmedText);
            setCurrentTextValue('');
            finalTranscriptFromSpeechRecRef.current = '';
            sttErrorRef.current = null;
        }
    }
  };
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendText();
    }
  };

  return (
    <div className="bg-slate-700/70 backdrop-blur-sm p-2.5 md:p-3 border-t border-slate-600/50">
      <div className="flex items-end space-x-1.5">
        <button
          onClick={handleMicButtonClick}
          disabled={isDisabled && recordingState !== RecordingState.RECORDING}
          className={`p-2 rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-700/70
            ${recordingState === RecordingState.RECORDING 
              ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400 animate-pulse' 
              : 'bg-sky-500 hover:bg-sky-600 text-white focus:ring-sky-400'}
            ${isDisabled && recordingState !== RecordingState.RECORDING ? 'opacity-60 cursor-not-allowed' : ''}
          `}
          aria-label={recordingState === RecordingState.RECORDING ? "Stop recording and send" : "Start recording"}
        >
          {recordingState === RecordingState.RECORDING ? <StopCircleIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
        </button>
        <textarea
          rows={1}
          value={currentTextValue}
          onChange={(e) => {
              setCurrentTextValue(e.target.value);
              if (recordingState !== RecordingState.RECORDING) {
                finalTranscriptFromSpeechRecRef.current = ''; // Clear STT transcript if user types
                sttErrorRef.current = null;
              }
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            recordingState === RecordingState.RECORDING && currentTextValue === "Listening..." ? "Listening..." : 
            recordingState === RecordingState.PROCESSING ? "Processing..." :
            "Type or record..."
          }
          className="flex-1 p-2 bg-slate-600/80 border border-slate-500/70 rounded-lg text-slate-100 placeholder-slate-400/80 resize-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition-shadow text-sm min-h-[42px]"
          disabled={isDisabled && recordingState !== RecordingState.RECORDING} 
        />
        {recordingState === RecordingState.RECORDING && <SoundWaveAnimationSmall isActive={true} />}
        <button
          onClick={handleSendText}
          disabled={isDisabled || (!currentTextValue.trim() && recordingState !== RecordingState.RECORDING) || currentTextValue === "Listening..." || currentTextValue === "Processing..."}
          className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-700/70 focus:ring-green-400 disabled:opacity-60 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>
      {(isLoadingAiResponse || isAiSpeakingGlobal) && (
         <p className="text-xs text-sky-300/80 text-center mt-1.5 animate-pulse">
            {isLoadingAiResponse ? `${AI_TUTOR_NAME} is typing...` : `${AI_TUTOR_NAME} is speaking...`}
        </p>
      )}
    </div>
  );
};
    