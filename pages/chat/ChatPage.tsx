import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { UserProfile, ChatMessage } from '../../types';
import { ChatMessageSender } from '../../types';
import { chatWithAI } from '../../services/openaiService';
import { ChatInputArea } from './ChatInputArea';
import { ChatBubble } from './ChatBubble';
import { PronunciationScoreIndicator } from './PronunciationScoreIndicator';
import { GrammarScoreIndicator } from './GrammarScoreIndicator';
import { AI_TUTOR_NAME } from '../../constants';
import { SpeakerWaveIcon, DocumentTextIcon as GrammarIcon, XCircleIcon } from '../../components/icons/EditorIcons'; // Using SpeakerWave for AI pronounce, GrammarIcon for grammar check

interface ChatPageProps {
  userProfile: UserProfile;
  playAiFeedbackAudio: (text: string, onEndCallback?: () => void) => void;
  isAiSpeakingGlobal: boolean;
  onError: (message: string | null) => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({ userProfile, playAiFeedbackAudio, isAiSpeakingGlobal, onError }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingAiResponse, setIsLoadingAiResponse] = useState<boolean>(false);
  const [currentPronunciationScore, setCurrentPronunciationScore] = useState<number | null>(null);
  const [currentGrammarScore, setCurrentGrammarScore] = useState<number | null>(null);
  
  const [isAiPronunciationOfUserTextEnabled, setIsAiPronunciationOfUserTextEnabled] = useState<boolean>(false);
  const [isGrammarCheckEnabled, setIsGrammarCheckEnabled] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    // Clear any previous error when chat page loads
    onError(null);
    setMessages([
      {
        id: 'initial-ai-greeting',
        sender: ChatMessageSender.AI,
        text: `Hello ${userProfile.name}! I'm ${AI_TUTOR_NAME}. How can we practice your English today? You can speak or type.`,
        timestamp: Date.now(),
      }
    ]);
  }, [userProfile.name, onError]);

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
    setCurrentGrammarScore(null);

    try {
      const { aiTextOutput, pronunciationScore, grammarScore, grammarFeedback } = await chatWithAI(userTranscript, userProfile.phonemeProgress);
      
      setMessages(prev => prev.map(msg => 
        msg.id === newUserMessage.id ? { 
          ...msg, 
          userPronunciationScore: pronunciationScore,
          userGrammarScore: isGrammarCheckEnabled ? grammarScore : undefined,
          grammarFeedback: isGrammarCheckEnabled ? grammarFeedback : undefined,
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
      onError("Sorry, I encountered an error communicating with the AI. Please try again.");
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
  }, [userProfile.phonemeProgress, playAiFeedbackAudio, onError, isAiSpeakingGlobal, isGrammarCheckEnabled]);

  const toggleButtonBaseStyle = "flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-800/80";
  const activeToggleStyle = "bg-sky-500 text-white hover:bg-sky-400 focus:ring-sky-400 shadow-md";
  const inactiveToggleStyle = "bg-slate-600/70 text-sky-200 hover:bg-slate-500/70 focus:ring-sky-500";

  return (
    <main className="flex flex-col h-full bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
      <header className="bg-slate-800/80 backdrop-blur-sm shadow-md p-3 z-10 sticky top-0">
        <h1 className="text-lg font-semibold text-sky-400 text-center mb-2">Chat with {AI_TUTOR_NAME}</h1>
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => setIsAiPronunciationOfUserTextEnabled(prev => !prev)}
            className={`${toggleButtonBaseStyle} ${isAiPronunciationOfUserTextEnabled ? activeToggleStyle : inactiveToggleStyle}`}
            aria-pressed={isAiPronunciationOfUserTextEnabled}
            title={isAiPronunciationOfUserTextEnabled ? "Disable AI reading your text" : "Enable AI to read your text"}
          >
            <SpeakerWaveIcon className="w-3.5 h-3.5" />
            <span>AI Reads Text</span>
          </button>
          <button
            onClick={() => setIsGrammarCheckEnabled(prev => !prev)}
            className={`${toggleButtonBaseStyle} ${isGrammarCheckEnabled ? activeToggleStyle : inactiveToggleStyle}`}
            aria-pressed={isGrammarCheckEnabled}
            title={isGrammarCheckEnabled ? "Disable Grammar Check" : "Enable Grammar Check"}
          >
            <GrammarIcon className="w-3.5 h-3.5" />
            <span>Grammar Check</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 scroll-smooth">
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

      {(currentPronunciationScore !== null && !isLoadingAiResponse) || (isGrammarCheckEnabled && currentGrammarScore !== null && !isLoadingAiResponse) ? (
        <div className="px-3 pt-1 pb-0.5 flex flex-wrap justify-end items-center gap-2 bg-slate-700/50">
          {currentPronunciationScore !== null && !isLoadingAiResponse && (
            <PronunciationScoreIndicator score={currentPronunciationScore} compact={true} />
          )}
          {isGrammarCheckEnabled && currentGrammarScore !== null && !isLoadingAiResponse && (
            <GrammarScoreIndicator score={currentGrammarScore} compact={true}/>
          )}
        </div>
      ) : null}


      <ChatInputArea
        onSendMessage={handleSendMessage}
        isLoadingAiResponse={isLoadingAiResponse}
        isAiSpeakingGlobal={isAiSpeakingGlobal}
      />
    </main>
  );
};