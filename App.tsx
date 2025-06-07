import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MainPanel } from './components/MainPanel';
import { ChatPage } from './pages/chat/ChatPage'; // New Chat Page
import type { Phoneme, PhonemeAnalysis, PracticePhrase, DailyChallenge, UserProfile, AppView } from './types';
import { mockAnalyzePronunciation, mockGeneratePersonalizedLesson, mockGetDailyChallenge, mockGetUserProfile } from './services/mockAiTutorService';
import { AppView as AppViewEnum } from './types'; // Ensure enum is imported for use
import { TTS_PROVIDER } from './config';
import { synthesizeSpeech } from './services/openAiService';

const App: React.FC = () => {
  const [currentAppView, setCurrentAppView] = useState<AppView>(AppViewEnum.PRACTICE);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentRecording, setCurrentRecording] = useState<Blob | null>(null);
  const [userTranscript, setUserTranscript] = useState<string>('');
  const [analysis, setAnalysis] = useState<PhonemeAnalysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);
  const [personalizedLesson, setPersonalizedLesson] = useState<PracticePhrase[] | null>(null);
  const [isLoadingLesson, setIsLoadingLesson] = useState<boolean>(false);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      console.log('[App] Fetching initial data.');
      try {
        const profile = await mockGetUserProfile();
        setUserProfile(profile);
        console.log('[App] User profile loaded:', profile);
        const challenge = await mockGetDailyChallenge();
        setDailyChallenge(challenge);
        console.log('[App] Daily challenge loaded:', challenge);
      } catch (err) {
        setError('Failed to load initial data.');
        console.error('[App] Error fetching initial data:', err);
      }
    };
    fetchData();
  }, []);

  const handleRecordingComplete = useCallback(async (audioBlob: Blob, transcript: string) => {
    console.log('[App] handleRecordingComplete called. Transcript:', `"${transcript}"`, 'Audio Blob:', audioBlob);
    setCurrentRecording(audioBlob);
    setUserTranscript(transcript);
    setAnalysis(null); 
    setPersonalizedLesson(null); 
    setError(null);
    setIsLoadingAnalysis(true);
    try {
      console.log('[App] Calling mockAnalyzePronunciation...');
      const analysisResult = await mockAnalyzePronunciation(audioBlob, transcript, userProfile?.phonemeProgress || []);
      console.log('[App] Analysis result received:', analysisResult);
      setAnalysis(analysisResult);
      
      if (userProfile && analysisResult.analyzedPhonemes) {
          const updatedPhonemes = [...userProfile.phonemeProgress];
          analysisResult.analyzedPhonemes.forEach(ap => {
              const existingPhoneme = updatedPhonemes.find(p => p.ipa === ap.ipa);
              if (existingPhoneme) {
                  existingPhoneme.attempts +=1;
                  if (ap.isCorrect) existingPhoneme.correctAttempts +=1;
                  existingPhoneme.score = Math.round((existingPhoneme.correctAttempts / existingPhoneme.attempts) * 100);
              } else {
                  updatedPhonemes.push({
                      phoneme: ap.phoneme,
                      ipa: ap.ipa,
                      score: ap.isCorrect ? 100 : 0,
                      attempts: 1,
                      correctAttempts: ap.isCorrect? 1 : 0,
                      lastPractice: new Date().toISOString(),
                  });
              }
          });
          setUserProfile(prev => prev ? {...prev, phonemeProgress: updatedPhonemes} : null);
          console.log('[App] User profile updated with new phoneme progress.');
      }

    } catch (err) {
      setError('Error analyzing pronunciation. Please try again.');
      console.error('[App] Error in handleRecordingComplete during analysis:', err);
    } finally {
      setIsLoadingAnalysis(false);
      console.log('[App] isLoadingAnalysis set to false.');
    }
  }, [userProfile]);

  const handleGenerateLesson = useCallback(async () => {
    if (!userProfile) {
      console.log('[App] handleGenerateLesson called but no user profile.');
      setError("Cannot generate lesson without a user profile.");
      return;
    }
    console.log('[App] handleGenerateLesson called.');
    setIsLoadingLesson(true);
    setPersonalizedLesson(null); 
    setError(null);
    try {
      console.log('[App] Calling mockGeneratePersonalizedLesson...');
      const lesson = await mockGeneratePersonalizedLesson(userProfile.phonemeProgress);
      console.log('[App] Personalized lesson received:', lesson);
      setPersonalizedLesson(lesson);
    } catch (err) {
      setError('Error generating personalized lesson. Please try again.');
      console.error('[App] Error in handleGenerateLesson:', err);
    } finally {
      setIsLoadingLesson(false);
      console.log('[App] isLoadingLesson set to false.');
    }
  }, [userProfile]);
  
  const playAiFeedbackAudio = useCallback(async (text: string, onEndCallback?: () => void) => {
    try {
      setIsAiSpeaking(true);
      if (TTS_PROVIDER === 'openai') {
        const audioBlob = await synthesizeSpeech(text);
        const url = URL.createObjectURL(audioBlob);
        const audio = new Audio(url);
        audio.onended = () => {
          URL.revokeObjectURL(url);
          setIsAiSpeaking(false);
          if (onEndCallback) onEndCallback();
        };
        audio.onerror = (e) => {
          console.error('[App] OpenAI TTS playback error', e);
          setIsAiSpeaking(false);
          if (onEndCallback) onEndCallback();
        };
        audio.play();
      } else if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(v => v.name.includes('Female') && v.lang === 'en-US' && v.localService);
        if (femaleVoice) {
          utterance.voice = femaleVoice;
        } else {
          const englishVoice = voices.find(v => v.lang === 'en-US');
          if (englishVoice) utterance.voice = englishVoice;
        }
        utterance.onend = () => {
          setIsAiSpeaking(false);
          if (onEndCallback) onEndCallback();
        };
        utterance.onerror = (event) => {
          console.error('[App] SpeechSynthesisUtterance.onerror:', event);
          setIsAiSpeaking(false);
          if (onEndCallback) onEndCallback();
        };
        window.speechSynthesis.speak(utterance);
      } else {
        setError('Text-to-speech is not supported in your browser.');
        setIsAiSpeaking(false);
        if (onEndCallback) onEndCallback();
      }
    } catch (err) {
      console.error('[App] playAiFeedbackAudio error', err);
      setIsAiSpeaking(false);
      if (onEndCallback) onEndCallback();
    }
  }, []);

  const handleChangeView = (view: AppView) => {
    setCurrentAppView(view);
    // Reset practice-specific states when switching away from practice
    if (view !== AppViewEnum.PRACTICE) {
        setAnalysis(null);
        setPersonalizedLesson(null);
        setCurrentRecording(null);
        setUserTranscript('');
    }
  };

  return (
    <div className="flex flex-col-reverse md:flex-row min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100">
      <Sidebar
        phonemeProgress={userProfile?.phonemeProgress || []}
        dailyChallenge={dailyChallenge}
        currentView={currentAppView}
        onChangeView={handleChangeView}
      />
      {currentAppView === AppViewEnum.PRACTICE && (
        <MainPanel
          onRecordingComplete={handleRecordingComplete}
          analysis={analysis}
          isLoadingAnalysis={isLoadingAnalysis}
          personalizedLesson={personalizedLesson}
          userTranscript={userTranscript}
          error={error}
          playAiFeedbackAudio={playAiFeedbackAudio}
          isAiSpeaking={isAiSpeaking}
          currentRecording={currentRecording}
          onGenerateLesson={handleGenerateLesson}
          isLoadingLesson={isLoadingLesson}
        />
      )}
      {currentAppView === AppViewEnum.CHAT && userProfile && (
        <ChatPage
          userProfile={userProfile}
          playAiFeedbackAudio={playAiFeedbackAudio}
          isAiSpeakingGlobal={isAiSpeaking} // Pass global speaking state
          onError={setError}
        />
      )}
       {currentAppView === AppViewEnum.CHAT && !userProfile && (
        <div className="flex-1 p-10 flex items-center justify-center">
          <p className="text-xl text-slate-400">Loading user profile to start chat...</p>
        </div>
       )}
    </div>
  );
};

export default App;
