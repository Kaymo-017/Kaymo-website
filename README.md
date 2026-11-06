# BLACKSITE — fictional intelligence dossier generator

A full-stack Node.js + Express + HTML/CSS/JavaScript project. It runs in DEMO mode without an API key and switches to LIVE AI mode when an OpenAI API key is configured.

## Run on your laptop

1. Install Node.js 20 or newer from https://nodejs.org/.
2. Open a terminal in this project folder.
3. Run `npm install`.
4. Copy `.env.example` to a new file named `.env`.
5. For live AI, put your API key after `OPENAI_API_KEY=` in `.env`. Leave it blank to use demo mode.
6. Run `npm start`.
7. Open http://localhost:3000 in your browser.

## Deploy free on Render

1. Create a GitHub account and a new repository. Upload all files in this folder (including the `public` folder); do not upload `.env`.
2. Create a free account at https://render.com/ and connect GitHub.
3. Choose **New → Web Service**, select this repository.
4. Set **Build Command** to `npm install` and **Start Command** to `npm start`.
5. Choose the **Free** instance plan and deploy.
6. In Render's Environment settings, add `OPENAI_API_KEY` and optionally `OPENAI_MODEL` if you want LIVE AI. Without the key it remains usable in DEMO mode.

Render's free web services sleep after 15 minutes without traffic and may take about a minute to wake up. Free services have other limits; see https://render.com/docs/free.

## Important

- The demo mode is fully interactive and does not require a key, but it uses sample dossier templates rather than AI.
- Live AI requires an OpenAI API key and API billing. ChatGPT subscriptions and API billing are separate.
- Never put your API key in frontend files or commit your `.env` file to GitHub.
- This project generates fictional story material only, not real intelligence or operational guidance.
