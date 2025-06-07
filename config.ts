export const STT_PROVIDER = (import.meta.env.VITE_STT_PROVIDER || 'openai') as 'browser' | 'openai';
export const TTS_PROVIDER = (import.meta.env.VITE_TTS_PROVIDER || 'browser') as 'browser' | 'openai';
