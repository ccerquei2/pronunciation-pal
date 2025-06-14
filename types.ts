
export interface Phoneme {
  phoneme: string; // e.g., "TH"
  ipa: string;     // e.g., /θ/
  score: number;   // 0-100
  attempts: number;
  correctAttempts: number;
  lastPractice: string; // ISO date string
}

export interface AnalyzedPhoneme {
  phoneme: string;
  ipa: string;
  userAttemptDisplay: string; // How user pronounced it, e.g., "f" for /θ/
  correctDisplay: string;     // Correct representation, e.g., "th"
  isCorrect: boolean;
  feedback: string; // e.g., "Your tongue should be between your teeth."
  articulatoryExplanation?: string; // e.g., "Place the tip of your tongue lightly between your upper and lower front teeth..."
}

export interface PhonemeAnalysis {
  overallFeedback: string;
  analyzedPhonemes: AnalyzedPhoneme[];
  correctedTranscript?: string; // AI corrected version of the user's speech
  aiVoiceResponseUrl?: string; // URL to AI-generated audio (not used with browser TTS)
}

export interface PracticePhrase {
  phrase: string;
  tip: string;
  targetPhonemes: string[]; // IPA symbols this phrase focuses on
}

export interface DailyChallenge {
  title: string;
  description: string;
  phraseToPractice: string;
}

export interface UserProfile {
  userId: string;
  name: string;
  nativeLanguage: string; // e.g., "pt-BR"
  phonemeProgress: Phoneme[];
}

// For microphone hook
export enum RecordingState {
  IDLE = 'IDLE',
  REQUESTING_PERMISSION = 'REQUESTING_PERMISSION',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING', // For STT
}

// Web Speech API type declarations
export interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

export type SpeechRecognitionErrorCode =
  | 'no-speech'
  | 'aborted'
  | 'audio-capture'
  | 'network'
  | 'not-allowed'
  | 'service-not-allowed'
  | 'bad-grammar'
  | 'language-not-supported';

export interface SpeechRecognitionErrorEvent extends Event {
  readonly error: SpeechRecognitionErrorCode;
  readonly message: string;
}

export interface SpeechGrammar {
  src: string;
  weight?: number;
}

export interface SpeechGrammarList {
  readonly length: number;
  item(index: number): SpeechGrammar;
  [index: number]: SpeechGrammar;
  addFromString(string: string, weight?: number): void;
  addFromURI(src: string, weight?: number): void;
}
declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition; // For Safari and older Chrome
    }


    interface SpeechRecognition extends EventTarget {
        grammars: SpeechGrammarList;
        lang: string;
        continuous: boolean;
        interimResults: boolean;
        maxAlternatives: number;
        // serviceURI: string; // This property is deprecated

        start(): void;
        stop(): void;
        abort(): void;

        onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
        onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
        onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
        onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
        onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
        onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
        onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
        onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null; // Note: type for 'ev' can be SpeechRecognitionEvent if specific properties are needed.
        onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
        onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
        onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    }
}

// ---- New types for Chat View ----
export enum AppView {
  PRACTICE = 'PRACTICE',
  CHAT = 'CHAT',
}

export enum ChatMessageSender {
  USER = 'USER',
  AI = 'AI',
}

export interface ChatMessage {
  id: string;
  sender: ChatMessageSender;
  text: string; // For AI, this is their response. For User, this is their STT.
  timestamp: number;
  userPronunciationScore?: number; // Optional: score for the user's spoken message
  audioBlob?: Blob; // Optional: user's recorded audio
  userGrammarScore?: number; // Optional: score for the user's grammar
  grammarFeedback?: string; // Optional: feedback on grammar
  grammarSuggestion?: string; // Optional: corrected user sentence
}

export interface MockChatResponse {
  aiTextOutput: string;
  pronunciationScore: number; // For the user's last utterance
  grammarScore: number; // For the user's grammar in the last utterance
  grammarFeedback?: string; // Specific feedback on grammar
}
// ---- End of New types for Chat View ----
