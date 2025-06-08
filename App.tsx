
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { BottomNavigationBar } from './components/BottomNavigationBar';
import { ChatPage } from './pages/chat/ChatPage';
import { PracticePage } from './pages/practice/PracticePage';
import type { PhonemeAnalysis, PracticePhrase, DailyChallenge, UserProfile, AppView } from './types';
import { mockAnalyzePronunciation, mockGeneratePersonalizedLesson, mockGetDailyChallenge, mockGetUserProfile } from './services/mockAiTutorService';
import { synthesizeSpeech } from './services/openaiService';
import { AppView as AppViewEnum } from './types';

const App: React.FC = () => {
  const [currentAppView, setCurrentAppView] = useState<AppView>(AppViewEnum.CHAT);
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
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };


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
  
  const playAiFeedbackAudio = useCallback((text: string, onEndCallback?: () => void) => {
    setIsAiSpeaking(true);
    (async () => {
      try {
        const audioBlob = await synthesizeSpeech(text);
        const url = URL.createObjectURL(audioBlob);
        const audio = new Audio(url);
        audio.onended = () => {
          URL.revokeObjectURL(url);
          setIsAiSpeaking(false);
          if (onEndCallback) onEndCallback();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          setIsAiSpeaking(false);
          setError('Could not play AI feedback audio.');
          if (onEndCallback) onEndCallback();
        };
        await audio.play();
      } catch (err) {
        console.error('[App] Error playing AI feedback:', err);
        setError('Failed to generate AI speech.');
        setIsAiSpeaking(false);
        if (onEndCallback) onEndCallback();
      }
    })();
  }, []);


  const handleChangeView = (view: AppView) => {
    setCurrentAppView(view);
    if (view !== AppViewEnum.PRACTICE) {
        setAnalysis(null);
        setPersonalizedLesson(null);
        setCurrentRecording(null);
        setUserTranscript('');
    }
     if (view !== AppViewEnum.CHAT) {
        // Reset chat specific states if any, or simply ensure chat starts fresh if needed
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100">
      <button onClick={handleLogout} className="absolute top-2 right-2 text-sm text-slate-300">Logout</button>
      <div className="flex-1 overflow-y-auto">
        {currentAppView === AppViewEnum.CHAT && userProfile && (
          <ChatPage
            userProfile={userProfile}
            playAiFeedbackAudio={playAiFeedbackAudio}
            isAiSpeakingGlobal={isAiSpeaking}
            onError={setError}
          />
        )}
        {currentAppView === AppViewEnum.CHAT && !userProfile && (
          <div className="flex-1 p-10 flex items-center justify-center h-full">
            <p className="text-xl text-slate-400">Loading user profile to start chat...</p>
          </div>
        )}
        {currentAppView === AppViewEnum.PRACTICE && userProfile && (
          <PracticePage
            userProfile={userProfile}
            dailyChallenge={dailyChallenge}
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
            setError={setError}
          />
        )}
         {currentAppView === AppViewEnum.PRACTICE && !userProfile && (
          <div className="flex-1 p-10 flex items-center justify-center h-full">
            <p className="text-xl text-slate-400">Loading user profile for Practice Mode...</p>
          </div>
         )}
      </div>
      <BottomNavigationBar
        currentView={currentAppView}
        onChangeView={handleChangeView}
      />
    </div>
  );
};

export default App;
