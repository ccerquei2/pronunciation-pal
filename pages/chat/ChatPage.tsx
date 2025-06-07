
import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { UserProfile, ChatMessage } from '../../types';
import { ChatMessageSender } from '../../types'; // Changed from import type
import { mockChatResponse } from '../../services/mockAiTutorService';
import { ChatInputArea } from './ChatInputArea';
import { ChatBubble } from './ChatBubble';
import { PronunciationScoreIndicator } from './PronunciationScoreIndicator';
import { GrammarScoreIndicator } from './GrammarScoreIndicator'; // New
import { AI_TUTOR_NAME } from '../../constants';
import { SpeakerWaveIcon, DocumentTextIcon as GrammarIcon } from '../../components/icons/EditorIcons'; // Using SpeakerWave for AI pronounce, GrammarIcon for grammar check

interface ChatPageProps {
  userProfile: UserProfile;
  playAiFeedbackAudio: (text: string, onEndCallback?: () => void) => void;
  isAiSpeakingGlobal: boolean; // Global TTS state from App.tsx
  onError: (message: string | null) => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({ userProfile, playAiFeedbackAudio, isAiSpeakingGlobal, onError }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingAiResponse, setIsLoadingAiResponse] = useState<boolean>(false);
  const [currentPronunciationScore, setCurrentPronunciationScore] = useState<number | null>(null);
  const [currentGrammarScore, setCurrentGrammarScore] = useState<number | null>(null); // New
  
  // New Toggles
  const [isAiPronunciationOfUserTextEnabled, setIsAiPronunciationOfUserTextEnabled] = useState<boolean>(false);
  const [isGrammarCheckEnabled, setIsGrammarCheckEnabled] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    setMessages([
      {
        id: 'initial-ai-greeting',
        sender: ChatMessageSender.AI,
        text: `Hello ${userProfile.name}! I'm ${AI_TUTOR_NAME}, your AI Pronunciation Coach. How can we practice your English today?`,
        timestamp: Date.now(),
      }
    ]);
  }, [userProfile.name]);

  const handleSendMessage = useCallback(async (userTranscript: string, audioBlob?: Blob) => {
    if (!userTranscript.trim() && !audioBlob) return;
    onError(null); 

    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: ChatMessageSender.USER,
      text: userTranscript,
      timestamp: Date.now(),
      audioBlob: audioBlob,
    };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoadingAiResponse(true);
    setCurrentPronunciationScore(null); 
    setCurrentGrammarScore(null); // Reset grammar score display

    try {
      const { aiTextOutput, pronunciationScore, grammarScore, grammarFeedback } = await mockChatResponse(userTranscript, userProfile.phonemeProgress);
      
      setMessages(prev => prev.map(msg => 
        msg.id === newUserMessage.id ? { 
          ...msg, 
          userPronunciationScore: pronunciationScore,
          userGrammarScore: isGrammarCheckEnabled ? grammarScore : undefined, // Only store if enabled
          grammarFeedback: isGrammarCheckEnabled ? grammarFeedback : undefined, // Only store if enabled
        } : msg
      ));
      setCurrentPronunciationScore(pronunciationScore);
      if (isGrammarCheckEnabled) {
        setCurrentGrammarScore(grammarScore);
      }

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: ChatMessageSender.AI,
        text: aiTextOutput,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMessage]);
      
      if (!isAiSpeakingGlobal) {
        playAiFeedbackAudio(aiTextOutput);
      }

    } catch (err) {
      console.error("[ChatPage] Error getting AI response:", err);
      onError("Sorry, I encountered an error. Please try again.");
      const errorAiMessage: ChatMessage = {
        id: `ai-error-${Date.now()}`,
        sender: ChatMessageSender.AI,
        text: "I seem to be having trouble responding right now. Let's try that again in a moment.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorAiMessage]);
    } finally {
      setIsLoadingAiResponse(false);
    }
  }, [userProfile.phonemeProgress, playAiFeedbackAudio, onError, isAiSpeakingGlobal, isGrammarCheckEnabled /* Added */]);

  const toggleButtonBaseStyle = "flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800";
  const activeToggleStyle = "bg-sky-600 text-white hover:bg-sky-500 focus:ring-sky-500";
  const inactiveToggleStyle = "bg-slate-600 text-sky-300 hover:bg-slate-500 focus:ring-sky-400";

  return (
    <main className="flex-1 flex flex-col h-screen bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
      <header className="bg-slate-800/80 backdrop-blur-md shadow-lg p-3 md:p-4 z-10">
        <h1 className="text-xl font-semibold text-sky-400 text-center mb-2">Chat with {AI_TUTOR_NAME}</h1>
        <div className="flex justify-center items-center space-x-2 md:space-x-3">
          <button
            onClick={() => setIsAiPronunciationOfUserTextEnabled(prev => !prev)}
            className={`${toggleButtonBaseStyle} ${isAiPronunciationOfUserTextEnabled ? activeToggleStyle : inactiveToggleStyle}`}
            aria-pressed={isAiPronunciationOfUserTextEnabled}
            title={isAiPronunciationOfUserTextEnabled ? "Disable AI reading your text" : "Enable AI to read your text"}
          >
            <SpeakerWaveIcon className="w-4 h-4" />
            <span>AI Reads Your Text</span>
          </button>
          <button
            onClick={() => setIsGrammarCheckEnabled(prev => !prev)}
            className={`${toggleButtonBaseStyle} ${isGrammarCheckEnabled ? activeToggleStyle : inactiveToggleStyle}`}
            aria-pressed={isGrammarCheckEnabled}
            title={isGrammarCheckEnabled ? "Disable Grammar Check" : "Enable Grammar Check"}
          >
            <GrammarIcon className="w-4 h-4" />
            <span>Grammar Check</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg) => (
          <ChatBubble 
            key={msg.id} 
            message={msg}
            isAiPronunciationOfUserTextEnabled={isAiPronunciationOfUserTextEnabled}
            isGrammarCheckEnabled={isGrammarCheckEnabled}
            playAiFeedbackAudio={playAiFeedbackAudio}
            isAiSpeakingGlobal={isAiSpeakingGlobal}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 md:px-6 mb-2 flex flex-wrap justify-end gap-3">
        {currentPronunciationScore !== null && !isLoadingAiResponse && (
          <PronunciationScoreIndicator score={currentPronunciationScore} />
        )}
        {isGrammarCheckEnabled && currentGrammarScore !== null && !isLoadingAiResponse && (
          <GrammarScoreIndicator score={currentGrammarScore} />
        )}
      </div>

      <ChatInputArea
        onSendMessage={handleSendMessage}
        isLoadingAiResponse={isLoadingAiResponse}
        isAiSpeakingGlobal={isAiSpeakingGlobal}
      />
    </main>
  );
};
