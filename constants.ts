import type { Phoneme } from './types';

export const COMMON_PHONEMES_FOR_PT_BR_SPEAKERS: Omit<Phoneme, 'score' | 'attempts' | 'correctAttempts' | 'lastPractice'>[] = [
  { phoneme: "TH (voiceless)", ipa: "/θ/" }, // as in 'think'
  { phoneme: "TH (voiced)", ipa: "/ð/" },   // as in 'this'
  { phoneme: "H", ipa: "/h/" },             // as in 'house'
  { phoneme: "R ( শুরুতে)", ipa: "/r/" },      // as in 'red' (often different from English R)
  { phoneme: "L (final)", ipa: "/l/" },       // as in 'feel' (often vocalized like 'w' or 'u')
  { phoneme: "Short I", ipa: "/ɪ/" },       // as in 'sit' (vs. long E /i:/ in 'seat')
  { phoneme: "Long E", ipa: "/iː/" },        // as in 'seat'
  { phoneme: "Schwa", ipa: "/ə/" },         // as in 'about'
  { phoneme: "AE (ash)", ipa: "/æ/" },      // as in 'cat'
  { phoneme: "ED (past tense)", ipa: "/t/, /d/, /ɪd/" }, // e.g., walked, played, wanted
];

export const APP_NAME = "Pronunciation Pal";

export const AI_TUTOR_NAME = "Alex"; // Your AI Pronunciation Coach. Used in Practice and Chat.

export const DEFAULT_USER_PROFILE_ID = "default_user_001";
