
import type { Phoneme, PhonemeAnalysis, PracticePhrase, DailyChallenge, UserProfile, AnalyzedPhoneme, MockChatResponse } from '../types';
import { COMMON_PHONEMES_FOR_PT_BR_SPEAKERS, DEFAULT_USER_PROFILE_ID } from '../constants';

// Simulate API call latency
const mockApiCall = <T,>(data: T, delay: number = 700): Promise<T> => {
  return new Promise(resolve => setTimeout(() => resolve(data), delay));
};

const defaultUserProfile: UserProfile = {
  userId: DEFAULT_USER_PROFILE_ID,
  name: "Learner",
  nativeLanguage: "pt-BR",
  phonemeProgress: COMMON_PHONEMES_FOR_PT_BR_SPEAKERS.map(p => ({
    ...p,
    score: Math.floor(Math.random() * 50) + 20, // Initial scores between 20-70
    attempts: Math.floor(Math.random() * 5) + 1,
    correctAttempts: Math.floor(Math.random() * 2),
    lastPractice: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7).toISOString(), // within last week
  })),
};

export const mockGetUserProfile = async (): Promise<UserProfile> => {
  // In a real app, this would fetch from a database
  return mockApiCall(defaultUserProfile, 300);
};


const ptBrPronunciationTips: Record<string, { userAttempt: string, correct: string, feedback: string, articulatory: string }> = {
  "/θ/": { userAttempt: "f", correct: "th", feedback: "Try to place your tongue gently between your teeth, like in 'think'. Many Brazilians use an /f/ or /s/ sound.", articulatory: "Place the tip of your tongue lightly between your upper and lower front teeth. Blow air gently through the small opening. It's a soft, breathy sound, not voiced." },
  "/ð/": { userAttempt: "d", correct: "th", feedback: "Similar to /θ/, but voiced. Feel the vibration in your throat. Common in words like 'this', 'that'.", articulatory: "Same tongue position as /θ/ (between teeth), but this time, vibrate your vocal cords as you push air out. It should feel like a buzzing sound." },
  "/h/": { userAttempt: "[silent]", correct: "h", feedback: "Ensure you aspirate the /h/ sound at the beginning of words like 'house' or 'happy'. It's often silent in Portuguese.", articulatory: "Open your mouth slightly and exhale a puff of air, as if you're fogging up a mirror. There's no vocal cord vibration. It's a breathy sound." },
  "/r/": { userAttempt: "R (tap)", correct: "R (retroflex)", feedback: "The English /r/ is different from the Portuguese 'R'. Try curling your tongue back slightly, like in 'red'.", articulatory: "Curl the tip of your tongue upwards and slightly backwards in your mouth, without touching the roof. The sides of your tongue might touch your upper molars. Produce the sound with voicing." },
  "/l/": { userAttempt: "u/w", correct: "l", feedback: "For 'L' at the end of words like 'feel', make sure your tongue touches the ridge behind your upper teeth.", articulatory: "Touch the tip of your tongue to the alveolar ridge (the bumpy part just behind your upper front teeth). The air should flow around the sides of your tongue. Ensure it's not like the 'u' sound in Portuguese 'mal'." },
  "/ɪ/": { userAttempt: "ee", correct: "i", feedback: "The short 'i' in 'sit' is more relaxed than the 'ee' in 'seat'. Keep your mouth slightly less tense.", articulatory: "Your tongue is high and front in your mouth, but slightly lower and more relaxed than for /iː/ (ee). Your lips are not as spread." },
  "/æ/": { userAttempt: "eh", correct: "a", feedback: "The 'a' in 'cat' requires a wider mouth opening than Portuguese 'é'.", articulatory: "Open your jaw wide, and spread your lips slightly. Your tongue should be low and flat in your mouth. Think of the sound a sheep makes, 'baa'."}
};

export const mockAnalyzePronunciation = async (
  _audioBlob: Blob,
  transcript: string,
  currentProgress: Phoneme[]
): Promise<PhonemeAnalysis> => {
  const analyzedPhonemes: AnalyzedPhoneme[] = [];
  let overallFeedback = "Good effort! ";
  // const words = transcript.toLowerCase().split(/\s+/); // not used yet

  const phonemesToTarget = currentProgress.sort((a,b) => a.score - b.score).slice(0,2); // Focus on 2 worst
  
  if (transcript.includes("think") || transcript.includes("three") || transcript.includes("mouth") || phonemesToTarget.find(p => p.ipa === "/θ/")) {
     if (Math.random() > 0.3) { 
        const tip = ptBrPronunciationTips["/θ/"];
        analyzedPhonemes.push({ phoneme: "TH (voiceless)", ipa: "/θ/", userAttemptDisplay: tip.userAttempt, correctDisplay: tip.correct, isCorrect: false, feedback: tip.feedback, articulatoryExplanation: tip.articulatory });
        overallFeedback += "Let's work on the /θ/ sound. ";
     } else {
        analyzedPhonemes.push({ phoneme: "TH (voiceless)", ipa: "/θ/", userAttemptDisplay: "th", correctDisplay: "th", isCorrect: true, feedback: "Great /θ/ sound!" });
     }
  }
  if (transcript.includes("house") || transcript.includes("happy") || phonemesToTarget.find(p => p.ipa === "/h/")) {
    if (Math.random() > 0.4) {
        const tip = ptBrPronunciationTips["/h/"];
        analyzedPhonemes.push({ phoneme: "H", ipa: "/h/", userAttemptDisplay: tip.userAttempt, correctDisplay: tip.correct, isCorrect: false, feedback: tip.feedback, articulatoryExplanation: tip.articulatory });
        overallFeedback += "Remember to pronounce the /h/ at the start of words. ";
    } else {
         analyzedPhonemes.push({ phoneme: "H", ipa: "/h/", userAttemptDisplay: "h", correctDisplay: "h", isCorrect: true, feedback: "Excellent /h/ sound!" });
    }
  }
  if (transcript.includes("red") || transcript.includes("right") || phonemesToTarget.find(p => p.ipa === "/r/")) {
    if (Math.random() > 0.5) {
        const tip = ptBrPronunciationTips["/r/"];
        analyzedPhonemes.push({ phoneme: "R", ipa: "/r/", userAttemptDisplay: tip.userAttempt, correctDisplay: tip.correct, isCorrect: false, feedback: tip.feedback, articulatoryExplanation: tip.articulatory });
        overallFeedback += "The English /r/ can be tricky. ";
    }
  }
  
  if (analyzedPhonemes.length === 0 && transcript.length > 0) {
    overallFeedback = "Excellent pronunciation on this one! Keep it up!";
     const randomCorrectPhoneme = COMMON_PHONEMES_FOR_PT_BR_SPEAKERS[Math.floor(Math.random() * COMMON_PHONEMES_FOR_PT_BR_SPEAKERS.length)];
     analyzedPhonemes.push({ 
         phoneme: randomCorrectPhoneme.phoneme, 
         ipa: randomCorrectPhoneme.ipa, 
         userAttemptDisplay: randomCorrectPhoneme.ipa.replace(/\//g, ''),
         correctDisplay: randomCorrectPhoneme.ipa.replace(/\//g, ''),
         isCorrect: true, 
         feedback: "Sounded good!" 
     });
  } else if (transcript.length === 0) {
    overallFeedback = "It seems I didn't catch what you said. Could you try speaking a bit louder and clearer?";
  }

  return mockApiCall({
    overallFeedback: overallFeedback.trim(),
    analyzedPhonemes,
    correctedTranscript: transcript ? `This is a corrected version of: "${transcript}" (mocked).` : undefined,
  }, 1500);
};

export const mockGeneratePersonalizedLesson = async (phonemeProgress: Phoneme[]): Promise<PracticePhrase[]> => {
  const weakPhonemes = phonemeProgress.filter(p => p.score < 60).sort((a, b) => a.score - b.score);
  const phrases: PracticePhrase[] = [];

  if (weakPhonemes.length === 0) {
    phrases.push({ 
        phrase: "Everything seems to be going well! Try 'She sells seashells by the seashore.' for a general challenge.", 
        tip: "Focus on clear articulation of each sound.",
        targetPhonemes: ["/s/", "/ʃ/"] 
    });
  } else {
    const target1 = weakPhonemes[0];
    if (target1) {
      if (target1.ipa === "/θ/") {
        phrases.push({ phrase: "The thirty-three thieves thought that they thrilled the throne.", tip: "Focus on the /θ/ (th) sound. Keep your tongue between your teeth.", targetPhonemes: ["/θ/"] });
      } else if (target1.ipa === "/h/") {
        phrases.push({ phrase: "Harry the hungry horse hurried home.", tip: "Make sure to aspirate the /h/ sound clearly.", targetPhonemes: ["/h/"] });
      } else if (target1.ipa === "/r/") {
        phrases.push({ phrase: "Richard runs races around the green grass.", tip: "Practice the English /r/ sound, different from Portuguese 'R'.", targetPhonemes: ["/r/"] });
      } else {
         phrases.push({ phrase: `Let's practice a phrase with ${target1.phoneme} (${target1.ipa}).`, tip: `Focus on the ${target1.ipa} sound. ${ptBrPronunciationTips[target1.ipa]?.feedback || ''}`, targetPhonemes: [target1.ipa] });
      }
    }

    const target2 = weakPhonemes[1] || phonemeProgress.sort((a,b) => b.score - a.score)[0]; 
     if (target2) {
      if (target2.ipa === "/l/" && target2.ipa !== target1?.ipa) {
        phrases.push({ phrase: "Lily likes to look at the lovely lake.", tip: "Practice the clear /l/ sound, especially at the end of words.", targetPhonemes: ["/l/"] });
      } else if (target2.ipa === "/ɪ/" && target2.ipa !== target1?.ipa) {
        phrases.push({ phrase: "This is a big ship, not a sheep.", tip: "Distinguish between the short /ɪ/ (ship) and long /iː/ (sheep).", targetPhonemes: ["/ɪ/", "/iː/"] });
      } else if (phrases.length < 2 && target2.ipa !== target1?.ipa) { // Ensure different phoneme if possible
         phrases.push({ phrase: `Another phrase for ${target2.phoneme} (${target2.ipa}) practice.`, tip: `Remember the tips for ${target2.ipa}. ${ptBrPronunciationTips[target2.ipa]?.feedback || ''}`, targetPhonemes: [target2.ipa] });
      }
    }
  }
  
  if (phrases.length < 3) {
      phrases.push({ phrase: "Practice makes perfect! Try: 'How are you today?'", tip: "Focus on smooth transitions between words and natural intonation.", targetPhonemes: []});
  }
  
  return mockApiCall(phrases.slice(0,3), 1000);
};

export const mockGetDailyChallenge = async (): Promise<DailyChallenge> => {
  const challenges: DailyChallenge[] = [
    { title: "Master the TH Sound", description: "The /θ/ sound (as in 'think') is tricky. Let's practice!", phraseToPractice: "I think three thoughts." },
    { title: "H Aspirate Hero", description: "Don't forget to pronounce your H's!", phraseToPractice: "Harry has a huge house." },
    { title: "R Rolling Right", description: "Practice the English R sound.", phraseToPractice: "Really rare red radios." },
    { title: "Final L Focus", description: "Make your L's clear at the end of words.", phraseToPractice: "Paul will call Phil." },
    { title: "Short I vs. Long E", description: "Differentiate 'ship' from 'sheep'.", phraseToPractice: "Did he leave this list here?" },
  ];
  return mockApiCall(challenges[Math.floor(Math.random() * challenges.length)], 400);
};

// New Mock AI Chat Response Function
export const mockChatResponse = async (
  userText: string,
  phonemeProgress: Phoneme[]
): Promise<MockChatResponse> => {
  let aiTextOutput = "";
  // Simulate a pronunciation score based on text length and some randomness
  const pronunciationScore = Math.min(95, Math.max(30, userText.length * 3 + Math.floor(Math.random() * 50)));
  
  // Simulate a grammar score
  let grammarScore = Math.min(98, Math.max(40, userText.length * 2 + Math.floor(Math.random() * 60)));
  let grammarFeedback = "";

  if (userText.length < 5 && userText.length > 0) { // Penalize very short inputs for grammar
    grammarScore = Math.max(20, Math.min(grammarScore, 45));
    grammarFeedback = "Your sentence is quite short. Try to elaborate a bit more for better grammar practice.";
  } else if (grammarScore < 50) {
    grammarFeedback = "There might be a few areas to improve in your sentence structure. Keep practicing!";
  } else if (grammarScore < 75) {
    grammarFeedback = "Good sentence structure! A few minor points could make it even better.";
  } else {
    grammarFeedback = "Excellent grammar and sentence construction!";
  }


  const weakPhonemes = phonemeProgress.filter(p => p.score < 60).sort((a, b) => a.score - b.score);

  if (userText.toLowerCase().includes("hello") || userText.toLowerCase().includes("hi")) {
    aiTextOutput = "Hello there! I'm your AI Pronunciation Coach. How can I help you practice today?";
  } else if (weakPhonemes.length > 0 && Math.random() < 0.4) {
    const targetPhoneme = weakPhonemes[0];
    aiTextOutput = `I noticed you're working on the ${targetPhoneme.phoneme} (${targetPhoneme.ipa}) sound. Would you like to try a sentence focusing on that? For example, "${ptBrPronunciationTips[targetPhoneme.ipa]?.correct || 'that sound'} is important."`;
     if (targetPhoneme.ipa === "/θ/") {
        aiTextOutput = `I see the /θ/ sound is one we can practice! How about trying this sentence: "I think thank you is a thoughtful phrase."? Listen closely to my pronunciation.`;
    } else if (targetPhoneme.ipa === "/r/") {
        aiTextOutput = `The English /r/ is a good one to focus on. Try saying: "Red roses are rarely cheap." How did that feel?`;
    }
  } else if (userText.length > 15) {
    aiTextOutput = "That's an interesting sentence! Let's break it down. ";
    if (pronunciationScore < 60) {
      aiTextOutput += "I noticed a few areas we could refine for pronunciation. Keep focusing on clear articulation. ";
    } else if (pronunciationScore < 85) {
      aiTextOutput += "That was quite good pronunciation! Just a few minor points to polish. ";
    } else {
      aiTextOutput += "Excellent work on that one! Your pronunciation was very clear. ";
    }
  } else if (userText.length > 0) {
    aiTextOutput = "Okay, I heard you. Can you try saying something a bit longer? Perhaps tell me about your day or ask me a question.";
  } else {
    aiTextOutput = "I didn't quite catch that. Could you please speak a bit louder and clearer?";
    grammarScore = 0; // No text, no grammar score
    grammarFeedback = "No text was provided to assess grammar.";
  }

  // Add a generic follow-up
  if (Math.random() > 0.6 && !userText.toLowerCase().includes("hello")) {
      aiTextOutput += " What would you like to try next?";
  }

  return mockApiCall({
    aiTextOutput: aiTextOutput.trim(),
    pronunciationScore,
    grammarScore,
    grammarFeedback,
  }, Math.random() * 800 + 500); // Simulate network delay
};
