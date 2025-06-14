import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { UserProfile, ChatMessage } from '../../types';
import { ChatMessageSender } from '../../types';
import { chatWithAI, getGrammarSuggestion } from '../../services/openaiService';
import { calculateGrammarScore } from '../../utils/grammarScore';
import { ChatInputArea } from './ChatInputArea';
import { ChatBubble } from './ChatBubble';
import { PronunciationScoreIndicator } from './PronunciationScoreIndicator';
import { GrammarScoreIndicator } from './GrammarScoreIndicator';
import { AI_TUTOR_NAME } from '../../constants';
import { SpeakerWaveIcon, DocumentTextIcon as GrammarIcon } from '../../components/icons/EditorIcons'; // Using SpeakerWave for AI pronounce, GrammarIcon for grammar check

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
  const [answerLength, setAnswerLength] = useState<number>(() => {
    const stored = localStorage.getItem('tutorAnswerLength');
    return stored ? Number(stored) : 4;
  });

  useEffect(() => {
    localStorage.setItem('tutorAnswerLength', answerLength.toString());
  }, [answerLength]);

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

    getGrammarSuggestion(userTranscript).then(suggestion => {
      const score = calculateGrammarScore(userTranscript, suggestion);
      setMessages(prev => prev.map(m => m.id === newUserMessage.id ? { ...m, grammarSuggestion: suggestion, userGrammarScore: score } : m));
      if (isGrammarCheckEnabled) {
        setCurrentGrammarScore(score);
      }
    }).catch(err => console.error('[ChatPage] Grammar suggestion error:', err));
    setIsLoadingAiResponse(true);
    setCurrentPronunciationScore(null);
    setCurrentGrammarScore(null);

    try {
      const tokenMap = [16, 32, 64, 128, 256, 512, 1024, 2048];
      const baseTokens = tokenMap[Math.min(tokenMap.length, Math.max(1, answerLength)) - 1];
      const { aiTextOutput, pronunciationScore, grammarFeedback } = await chatWithAI(userTranscript, userProfile.phonemeProgress, baseTokens + 20);

      const trimResponse = (text: string, limit: number): string => {
        const words = text.split(/\s+/);
        if (words.length <= limit) return text;
        let cut = limit;
        while (cut < words.length && cut < limit + 20) {
          if (/[.!?]$/.test(words[cut - 1])) break;
          cut++;
        }
        return words.slice(0, cut).join(' ');
      };

      const finalAiText = trimResponse(aiTextOutput, baseTokens);
      
      setMessages(prev => prev.map(msg =>
        msg.id === newUserMessage.id ? {
          ...msg,
          userPronunciationScore: pronunciationScore,
          grammarFeedback: isGrammarCheckEnabled ? grammarFeedback : undefined,
        } : msg
      ));
      setCurrentPronunciationScore(pronunciationScore);
      // currentGrammarScore will be set after grammar suggestion returns

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: ChatMessageSender.AI,
        text: finalAiText,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMessage]);
      
      if (!isAiSpeakingGlobal) {
        playAiFeedbackAudio(finalAiText);
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
  }, [userProfile.phonemeProgress, playAiFeedbackAudio, onError, isAiSpeakingGlobal, isGrammarCheckEnabled, answerLength]);

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

      <div className="px-3 py-2">
        <label htmlFor="answer-length" className="block text-xs text-sky-300 mb-1">Tutor answer length</label>
        <input
          id="answer-length"
          type="range"
          min="1"
          max="8"
          value={answerLength}
          onChange={e => setAnswerLength(Number(e.target.value))}
          className="w-full accent-sky-500"
        />
      </div>

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