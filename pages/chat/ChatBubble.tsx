import React from 'react';
import { ChatMessage, ChatMessageSender } from '../../types';
import { UserIcon, SparklesIcon as AiIcon } from '../../components/icons/UserAndAiIcons';
import { AudioPlayer } from '../../components/AudioPlayer';
import { PronunciationScoreIndicator } from './PronunciationScoreIndicator';
import { GrammarScoreIndicator } from './GrammarScoreIndicator';
import { SpeakerWaveIcon } from '../../components/icons/FeedbackIcons';

interface ChatBubbleProps {
  message: ChatMessage;
  isAiPronunciationOfUserTextEnabled?: boolean;
  isGrammarCheckEnabled?: boolean;
  playAiFeedbackAudio?: (text: string) => void;
  isAiSpeakingGlobal?: boolean;
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
  
  const isDiagnosticMessage = typeof message.text === 'string' && message.text.startsWith('[') && message.text.endsWith(']');

  const canAiReadUserText = isUser && 
                            isAiPronunciationOfUserTextEnabled &&
                            typeof message.text === 'string' &&
                            message.text.trim() !== '' &&
                            !isDiagnosticMessage &&
                            playAiFeedbackAudio;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
      <div className={`flex items-end max-w-[85%] sm:max-w-[75%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`p-1.5 mx-1.5 self-start rounded-full shadow-md ${isUser ? 'bg-sky-500' : 'bg-slate-600'}`}>
          {isUser ? <UserIcon className="w-4 h-4 text-white" /> : <AiIcon className="w-4 h-4 text-sky-300" />}
        </div>
        <div className={`px-3 py-2 rounded-xl shadow-md ${isUser ? 'bg-sky-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
          <p className="text-sm whitespace-pre-wrap break-words">{message.text || (isUser && message.audioBlob ? "Processing your audio..." : "...")}</p>
          
          {isUser && message.audioBlob && (
            <div className="mt-2 -mx-1"> {/* Negative margin to make player slightly wider if needed */}
              <AudioPlayer audioBlob={message.audioBlob} />
            </div>
          )}

          {canAiReadUserText && (
            <button
              onClick={handlePlayUserTextAsAi}
              disabled={isAiSpeakingGlobal}
              className="mt-1.5 p-1 rounded-md text-sky-100 hover:bg-sky-500/60 disabled:opacity-50 transition-colors flex items-center text-xs"
              title="Hear AI pronounce your text"
            >
              <SpeakerWaveIcon className="w-3 h-3 mr-1" /> AI Reads
            </button>
          )}
          
          <div className={`text-[0.65rem] mt-1.5 ${isUser ? 'text-sky-200 text-right' : 'text-slate-400 text-left'}`}>
            {time}
          </div>

          {(isUser && (typeof message.userPronunciationScore === 'number' || (isGrammarCheckEnabled && typeof message.userGrammarScore === 'number'))) && (
             <div className={`mt-1.5 flex ${isUser ? 'justify-end' : 'justify-start'} items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                {typeof message.userPronunciationScore === 'number' && (
                    <PronunciationScoreIndicator score={message.userPronunciationScore} compact={true} bubble={true} />
                )}
                {isGrammarCheckEnabled && typeof message.userGrammarScore === 'number' && (
                    <GrammarScoreIndicator score={message.userGrammarScore} compact={true} bubble={true}/>
                )}
             </div>
           )}
           {isUser && isGrammarCheckEnabled && message.grammarFeedback && (
            <p className="text-xs text-sky-100/90 italic mt-1.5 bg-black/20 p-1.5 rounded">
              <span className="font-semibold">Tip:</span> {message.grammarFeedback}
            </p>
           )}
        </div>
      </div>
    </div>
  );
};