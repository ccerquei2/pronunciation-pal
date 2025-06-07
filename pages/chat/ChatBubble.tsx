
import React from 'react';
import { ChatMessage, ChatMessageSender } from '../../types';
import { UserIcon, SparklesIcon as AiIcon } from '../../components/icons/UserAndAiIcons';
import { AudioPlayer } from '../../components/AudioPlayer';
import { PronunciationScoreIndicator } from './PronunciationScoreIndicator';
import { GrammarScoreIndicator } from './GrammarScoreIndicator'; // New
import { SpeakerWaveIcon } from '../../components/icons/FeedbackIcons'; // For AI pronounce button

interface ChatBubbleProps {
  message: ChatMessage;
  isAiPronunciationOfUserTextEnabled?: boolean; // New
  isGrammarCheckEnabled?: boolean; // New
  playAiFeedbackAudio?: (text: string) => void; // New
  isAiSpeakingGlobal?: boolean; // New
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  message, 
  isAiPronunciationOfUserTextEnabled,
  isGrammarCheckEnabled,
  playAiFeedbackAudio,
  isAiSpeakingGlobal
}) => {
  const isUser = message.sender === ChatMessageSender.USER;
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handlePlayUserTextAsAi = () => {
    if (playAiFeedbackAudio && typeof message.text === 'string' && message.text.trim() !== '' && !isAiSpeakingGlobal) {
      playAiFeedbackAudio(message.text);
    }
  };
  
  // Check if the message text looks like one of our diagnostic messages (e.g., "[Error]", "[No transcript]", etc.)
  const isDiagnosticMessage = typeof message.text === 'string' && message.text.startsWith('[') && message.text.endsWith(']');

  const canAiReadUserText = isUser && 
                            isAiPronunciationOfUserTextEnabled &&
                            typeof message.text === 'string' &&
                            message.text.trim() !== '' &&
                            !isDiagnosticMessage && // Ensure it's not a diagnostic message
                            playAiFeedbackAudio;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
      <div className={`flex items-end max-w-xs md:max-w-md lg:max-w-lg ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`p-1 mx-2 self-start rounded-full ${isUser ? 'bg-sky-500' : 'bg-slate-600'} shadow`}>
          {isUser ? <UserIcon className="w-5 h-5 text-white" /> : <AiIcon className="w-5 h-5 text-sky-300" />}
        </div>
        <div className={`px-4 py-3 rounded-xl shadow-md ${isUser ? 'bg-sky-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
          <p className="text-sm whitespace-pre-wrap">{message.text || (isUser && message.audioBlob ? "Processing your audio..." : "...")}</p>
          
          {isUser && message.audioBlob && (
            <div className="mt-2">
              <AudioPlayer audioBlob={message.audioBlob} />
            </div>
          )}

          {canAiReadUserText && (
            <button
              onClick={handlePlayUserTextAsAi}
              disabled={isAiSpeakingGlobal}
              className="mt-1.5 p-1 rounded-full text-sky-200 hover:bg-sky-500/50 disabled:opacity-50 transition-colors flex items-center text-xs"
              title="Hear AI pronounce your text"
            >
              <SpeakerWaveIcon className="w-3.5 h-3.5 mr-1" /> AI Reads
            </button>
          )}
          
          <div className={`text-xs mt-1.5 ${isUser ? 'text-sky-200 text-right' : 'text-slate-400 text-left'}`}>
            {time}
          </div>

          <div className="mt-1 flex flex-col items-end space-y-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {isUser && typeof message.userPronunciationScore === 'number' && (
                <PronunciationScoreIndicator score={message.userPronunciationScore} compact={true} />
            )}
            {isUser && isGrammarCheckEnabled && typeof message.userGrammarScore === 'number' && (
                <GrammarScoreIndicator score={message.userGrammarScore} compact={true} />
            )}
          </div>
           {isUser && isGrammarCheckEnabled && message.grammarFeedback && (
            <p className="text-xs text-sky-100 italic mt-1 bg-black/10 p-1 rounded">
              Grammar tip: {message.grammarFeedback}
            </p>
           )}
        </div>
      </div>
    </div>
  );
};
