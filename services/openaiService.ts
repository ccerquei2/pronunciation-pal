import { Phoneme, MockChatResponse } from '../types';

const API_KEY = process.env.OPENAI_API_KEY;

const baseHeaders = {
  Authorization: `Bearer ${API_KEY}`,
};

export async function transcribeAudio(audio: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', audio, 'audio.webm');
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'json');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: baseHeaders,
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`STT failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.text as string;
}

export async function synthesizeSpeech(text: string): Promise<Blob> {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      ...baseHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: 'alloy',
      response_format: 'mp3',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TTS failed: ${res.status} ${text}`);
  }

  const buffer = await res.arrayBuffer();
  return new Blob([buffer], { type: 'audio/mpeg' });
}

export async function chatWithAI(userText: string, _phonemeProgress: Phoneme[], maxTokens = 256): Promise<MockChatResponse> {
  const messages = [
    { role: 'system', content: 'You are a helpful pronunciation coach.' },
    { role: 'user', content: userText },
  ];

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      ...baseHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: maxTokens }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Chat completion failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return {
    aiTextOutput: data.choices[0].message.content as string,
    pronunciationScore: Math.floor(Math.random() * 50) + 50,
    grammarScore: Math.floor(Math.random() * 50) + 50,
  };
}

export async function getGrammarSuggestion(text: string): Promise<string> {
  const messages = [
    { role: 'system', content: 'You correct grammar. Respond only with the corrected sentence.' },
    { role: 'user', content: text },
  ];

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      ...baseHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Grammar suggestion failed: ${res.status} ${t}`);
  }

  const data = await res.json();
  return data.choices[0].message.content as string;
}
