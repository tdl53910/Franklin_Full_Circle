# Franklin Full Circle

**AI-powered career navigation portal for Franklin College of Arts & Sciences at the University of Georgia.**

Franklin Full Circle generates personalized career dossiers, faculty connections, student organization recommendations, and actionable next steps — all powered by OpenAI and tailored to each student's unique academic profile.

## Features

- **Career Dossier** — AI-generated multi-tier career pathway analysis based on major, skills, interests, and experiences
- **Faculty & Staff Contacts** — Real UGA faculty recommendations with department directory links
- **Student Organizations** — Matched clubs from UGA's Involvement Network
- **Industry News** — Curated headlines relevant to the student's career interests
- **Actionable Next Steps** — Concrete, time-bound action items (this week, this month, this semester)
- **Career Assistant Chat** — Ongoing AI conversation to refine recommendations, add/remove careers, and explore options
- **PDF Export** — Download your dossier as a formatted PDF
- **Drag & Drop Dashboard** — Rearrange panels to your preference

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS (no framework)
- **Backend:** Vercel Serverless Functions (Node.js)
- **AI:** OpenAI GPT-4o-mini via the `openai` SDK
- **Hosting:** Vercel
- **PDF Generation:** jsPDF (CDN)

## Project Structure

```
├── index.html              # Main app page
├── css/styles.css          # All styles
├── js/app.js               # Frontend logic, chat, rendering
├── api/
│   ├── chat.js             # Serverless function — chat endpoint
│   └── generate-dossier.js # Serverless function — dossier generation
├── assets/
│   └── uga-logo.svg        # UGA logo asset
├── package.json            # Dependencies (openai SDK)
├── vercel.json             # Vercel routing & headers config
└── README.md
```

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Vercel CLI](https://vercel.com/cli) (`npm i -g vercel`)
- An [OpenAI API key](https://platform.openai.com/api-keys)

### Local Development

```bash
# Install dependencies
npm install

# Set your API key
export OPENAI_API_KEY="sk-..."

# Run locally with Vercel dev server
vercel dev
```

The app will be available at `http://localhost:3000`.

### Deploy to Vercel

1. Push this repo to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Add the environment variable `OPENAI_API_KEY` in **Settings → Environment Variables**
4. Deploy — Vercel auto-detects the serverless functions in `api/`

## Environment Variables

| Variable         | Required | Description                  |
| ---------------- | -------- | ---------------------------- |
| `OPENAI_API_KEY` | Yes      | Your OpenAI API key          |

## How It Works

1. Student completes a 7-step profile questionnaire (name, year, major, skills, interests, etc.)
2. The app sends the profile to `/api/generate-dossier` which calls GPT-4o-mini with a detailed career advisor prompt
3. The AI returns structured JSON containing career tiers, faculty suggestions, clubs, news, and action items
4. The dashboard renders all panels; data persists in `localStorage`
5. The chat assistant (`/api/chat`) maintains conversation context for ongoing refinement

## License

Built for the University of Georgia's Franklin College of Arts & Sciences.
