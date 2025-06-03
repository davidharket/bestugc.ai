# AI Video Ad Generator Platform

This project automates the creation of user-generated video ads using AI. Users can register, create ads from product URLs or from scratch, and generate videos with avatars, voiceovers, and more.

## Features
- OAuth (Google, GitHub, Apple) authentication
- Dashboard for managing and creating ads
- Product scraping and AI summarization (OpenAI GPT-4o)
- Media asset management (images, videos, uploads)
- Video formatting, script generation, and avatar selection
- Voiceover (ElevenLabs), lip sync (Synclabs), and video rendering
- Stripe payments and credit system

## Getting Started

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd <project-directory>
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy `.env.example` to `.env` and fill in your API keys and secrets.

### 4. Set up the database
```bash
npx prisma migrate dev --name init
```

### 5. Run the development server
```bash
npm run dev
```

### 6. Stripe Webhooks
Set up Stripe webhooks to `***REMOVED***/api/webhooks/stripe`.

---

## Tech Stack
- Next.js (React, TypeScript)
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- NextAuth.js
- Stripe
- OpenAI, ElevenLabs, Synclabs
- Cheerio/Playwright (scraping)

---

## License
MIT
