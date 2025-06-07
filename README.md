# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and set `VITE_OPENAI_API_KEY` to your OpenAI key.
   You can also adjust `VITE_OPENAI_MODEL`, `VITE_STT_PROVIDER`, and `VITE_TTS_PROVIDER`.
3. Run the app:
   `npm run dev`
