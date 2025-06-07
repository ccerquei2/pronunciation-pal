const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;

if (!OPENAI_KEY) {
  console.warn('[openAiService] OPENAI API key is not set.');
}

const CHAT_MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';

export async function chatCompletion(messages: {role: 'system' | 'user' | 'assistant'; content: string;}[], model: string = CHAT_MODEL): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages
    })
  });
  if (!res.ok) {
    throw new Error(`OpenAI chat error: ${res.status}`);
  }
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

export async function transcribeAudio(audio: Blob): Promise<string> {
  const form = new FormData();
  form.append('file', audio, 'audio.webm');
  form.append('model', 'whisper-1');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_KEY}`
    },
    body: form
  });
  if (!res.ok) {
    throw new Error(`OpenAI STT error: ${res.status}`);
  }
  const data = await res.json();
  return data.text as string;
}

export async function synthesizeSpeech(text: string, voice: string = 'alloy'): Promise<Blob> {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice
    })
  });
  if (!res.ok) {
    throw new Error(`OpenAI TTS error: ${res.status}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return new Blob([arrayBuffer], { type: 'audio/mpeg' });
}

export const AVAILABLE_MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'];
