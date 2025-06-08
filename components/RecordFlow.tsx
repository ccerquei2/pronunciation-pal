
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MicrophoneIcon, StopCircleIcon } from './icons/EditorIcons';
import { RecordingState, SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from '../types';

interface RecordFlowProps {
  onRecordingComplete: (audioBlob: Blob, transcript: string) => void;
  disabled?: boolean;
}

const SoundWaveAnimation: React.FC<{isActive: boolean}> = ({ isActive }) => {
  return (
    <div className="flex items-center justify-center h-10 w-full my-2">
      <div className="flex space-x-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`w-1.5 rounded-full transition-all duration-300 ${
              isActive 
                ? 'bg-sky-400 h-6 animate-pulse'
                : 'bg-slate-600 h-2'
            }`}
            style={{ animationDelay: isActive ? `${i * 100}ms` : undefined }}
          />
        ))}
      </div>
    </div>
  );
};


export const RecordFlow: React.FC<RecordFlowProps> = ({ onRecordingComplete, disabled }) => {
  const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.IDLE);
  const [statusMessage, setStatusMessage] = useState<string>('Click the microphone to start recording.');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const finalTranscriptRef = useRef<string>('');

  const cleanupRisorse = useCallback(() => {
    console.log('[RecordFlow] cleanupRisorse called.');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log('[RecordFlow] Stopping active media recorder.');
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    
    if (recognitionRef.current) {
      console.log('[RecordFlow] Aborting speech recognition.');
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    
    if (streamRef.current) {
      console.log('[RecordFlow] Stopping media stream tracks.');
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    audioChunksRef.current = [];
    finalTranscriptRef.current = '';
  }, []);

  useEffect(() => {
    return () => {
      console.log('[RecordFlow] Component unmounting, cleaning up resources.');
      cleanupRisorse();
    };
  }, [cleanupRisorse]);

  const startRecording = useCallback(async () => {
    if (disabled) {
      console.log('[RecordFlow] Start recording called but disabled.');
      return;
    }
    
    console.log('[RecordFlow] Attempting to start recording.');
    setRecordingState(RecordingState.REQUESTING_PERMISSION);
    setStatusMessage('Requesting microphone permission...');
    
    cleanupRisorse(); 

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      console.log('[RecordFlow] Microphone permission granted.');

      setRecordingState(RecordingState.RECORDING);
      setStatusMessage('Recording... Click stop when done.');
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = []; 

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        console.log('[RecordFlow] mediaRecorder.onstop triggered.');
        // This is an important state. If it gets stuck here, this is the message the user sees.
        setRecordingState(RecordingState.PROCESSING); 
        setStatusMessage('Processing audio...');

        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Stop media stream tracks now that recorder is stopped
          if (streamRef.current) { // streamRef might have been cleared by cleanupRisorse if stop was called twice
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null; 
          }
          
          const transcriptToUse = finalTranscriptRef.current.trim();
          console.log('[RecordFlow] Final transcript in onstop:', `"${transcriptToUse}"`);
          
          if (typeof onRecordingComplete === 'function') {
            onRecordingComplete(audioBlob, transcriptToUse);
          } else {
            console.error("[RecordFlow] onRecordingComplete is not a function!");
          }
          
          // CRITICAL: Update state AFTER onRecordingComplete is CALLED (it's async, but RecordFlow updates its own state)
          setRecordingState(RecordingState.IDLE); 
          if (transcriptToUse) {
            setStatusMessage('Analysis complete. Record again?');
            console.log('[RecordFlow] State set to IDLE, status: Analysis complete.');
          } else {
            setStatusMessage('Could not get transcript. Audio saved. Record again?');
            console.log('[RecordFlow] State set to IDLE, status: Could not get transcript (transcript was empty).');
          }
        } catch (error) {
          console.error("[RecordFlow] Error in mediaRecorder.onstop's try block:", error);
          setRecordingState(RecordingState.IDLE); // Ensure reset to IDLE on error
          setStatusMessage('Error processing audio. Please try again.');
        }
      };

      mediaRecorderRef.current.start();
      console.log('[RecordFlow] MediaRecorder started.');

      const SpeechRecognitionAPI = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        console.log('[RecordFlow] SpeechRecognitionAPI found.');
        recognitionRef.current = new SpeechRecognitionAPI();
        recognitionRef.current.continuous = true; 
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        finalTranscriptRef.current = ''; 

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
            finalTranscriptRef.current = (finalTranscriptRef.current + ' ' + finalSegment).trim();
            console.log('[RecordFlow] Speech API onresult (final):', finalTranscriptRef.current);
          }
          // if (interimTranscript && recordingState === RecordingState.RECORDING) {
          //   setStatusMessage(`Listening: ${interimTranscript}...`);
          // }
        };

        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('[RecordFlow] Speech recognition error:', event.error, event.message);
          setStatusMessage(`Speech error: ${event.error}. Try again.`);
          // Don't cleanup or change state here, let mediaRecorder.onstop handle the finalization
          // as it will likely get an empty transcript.
        };
        
        recognitionRef.current.onend = () => {
          console.log('[RecordFlow] Speech recognition service ended.');
          // This can be called after recognition.stop() or if it times out.
          // If mediaRecorder is still recording and recognition ends, the user might need to click stop.
          // Current design relies on explicit stop click.
        };

        recognitionRef.current.start();
        console.log('[RecordFlow] Speech recognition started.');
      } else {
        console.warn('[RecordFlow] Speech recognition not supported by this browser.');
        setStatusMessage('Speech recognition not supported.');
        // No speech rec, so transcript will be empty. mediaRecorder.onstop will handle this.
      }

    } catch (err) {
      console.error("[RecordFlow] Error accessing microphone or starting recording:", err);
      // Check if it's a DOMException for permission denial
      if (err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")) {
          setRecordingState(RecordingState.PERMISSION_DENIED);
          setStatusMessage('Microphone access denied. Please check permissions.');
      } else {
          setRecordingState(RecordingState.IDLE); // Or a generic error state
          setStatusMessage('Error starting recording. Please try again.');
      }
      cleanupRisorse();
    }
  }, [onRecordingComplete, disabled, cleanupRisorse]);

  const stopRecording = useCallback(() => {
    console.log('[RecordFlow] stopRecording called. Current state:', recordingState);
    if (recognitionRef.current) {
      console.log('[RecordFlow] Stopping speech recognition.');
      recognitionRef.current.stop(); // This should trigger onresult with isFinal=true if there's pending audio
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      console.log('[RecordFlow] Stopping media recorder.');
      mediaRecorderRef.current.stop(); // Triggers mediaRecorder.onstop
    } else {
      console.warn('[RecordFlow] Stop called but mediaRecorder not recording or not initialized.');
      // If already stopped or not started, ensure state is sensible.
      if (recordingState === RecordingState.RECORDING || recordingState === RecordingState.PROCESSING) {
         setRecordingState(RecordingState.IDLE);
         setStatusMessage('Recording stopped. Click to start again.');
      }
    }
  }, [recordingState]); // Removed cleanupRisorse from dependencies, it's called internally

  const handleMicButtonClick = () => {
    if (disabled) return;
    if (recordingState === RecordingState.RECORDING) {
      stopRecording();
    } else if (recordingState === RecordingState.IDLE || recordingState === RecordingState.PERMISSION_DENIED) {
      startRecording();
    }
    // Do nothing if REQUESTING_PERMISSION or PROCESSING
  };

  return (
    <div className="bg-slate-700/50 p-6 rounded-xl shadow-xl flex flex-col items-center space-y-4 transition-all duration-300 ease-in-out">
      <button
        onClick={handleMicButtonClick}
        disabled={disabled || recordingState === RecordingState.REQUESTING_PERMISSION || recordingState === RecordingState.PROCESSING}
        className={`relative flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-opacity-50
          ${recordingState === RecordingState.RECORDING ? 'bg-red-500 hover:bg-red-600 focus:ring-red-400 animate-pulse' : 'bg-sky-500 hover:bg-sky-600 focus:ring-sky-400'}
          ${(disabled || recordingState === RecordingState.REQUESTING_PERMISSION || recordingState === RecordingState.PROCESSING) ? 'opacity-60 cursor-not-allowed' : ''}
        `}
        aria-label={recordingState === RecordingState.RECORDING ? "Stop recording" : "Start recording"}
        aria-live="polite"
      >
        {recordingState === RecordingState.RECORDING ? (
          <StopCircleIcon className="w-12 h-12 text-white" />
        ) : (
          <MicrophoneIcon className="w-12 h-12 text-white" />
        )}
      </button>
      <SoundWaveAnimation isActive={recordingState === RecordingState.RECORDING} />
      <p className="text-sm text-slate-300 h-5 min-h-[1.25rem]" aria-live="assertive">{statusMessage}</p>
      
      {(recordingState === RecordingState.IDLE || recordingState === RecordingState.PERMISSION_DENIED) && !disabled && (
        <p className="text-xs text-slate-400 mt-2">
            Tip: Speak clearly after pressing the microphone. Ensure permissions are granted.
        </p>
      )}
       {recordingState === RecordingState.PERMISSION_DENIED && (
         <p className="text-xs text-red-400 mt-1">Microphone permission was denied. Please enable it in your browser settings and try again.</p>
       )}
    </div>
  );
};
