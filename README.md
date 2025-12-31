This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
# Morai Review — Next.js app

This repository is a small Next.js 13+ app (App Router) that collects short reviews/suggestions for "MORAI" with an optional voice message recorded in the browser and stored in MongoDB. It includes a simple serverless API route for storing/fetching reviews.

This README explains how to clone, run locally, configure MongoDB, and deploy to Vercel.

---

## Quick start (clone & run)

Open a PowerShell terminal and run:

```powershell
git clone <repo-url>
cd moraiReview
npm install
cp .env.local.example .env.local # see environment section
npm run dev
```

Then open http://localhost:3000 in your browser.

If you prefer bash/macOS/linux replace the PowerShell commands with the usual `git`, `cp` etc.

---

## Environment variables

Create a `.env.local` in the project root with the following variables:

```text
MONGODB_URI="<your-mongodb-connection-string>"
MONGODB_DB=morai
```

- `MONGODB_URI`: MongoDB connection string (Atlas recommended for production). Example format:
	`mongodb+srv://<user>:<password>@cluster0.example.mongodb.net/?retryWrites=true&w=majority`
- `MONGODB_DB`: (optional) database name; defaults to `morai`.

Important: `.env.local` is included in `.gitignore` by default — do not commit credentials.

Local dev behavior:
- If `MONGODB_URI` is not provided, the API uses an in-memory fallback so you can still test the UI. This is only for development convenience.

---

## How the voice message feature works (short)

- The browser requests microphone access and uses `MediaRecorder` to capture audio.
- The recorded audio is converted to a data URL and included in the POST body when submitting a review.
- The server stores the audio string in MongoDB (or returns/stores to in-memory array when no DB).
- Visitors see an `<audio controls>` player for each review that contains audio.

Note: Storing base64 audio in the DB works but is not ideal long-term — consider uploading to object storage and storing only URLs in the DB (see "Production notes").

---

## Development notes & troubleshooting

- If you see a hydration warning about mismatched HTML between server and client, check that components that use browser-only APIs are marked as Client Components (top of file: `"use client"`) and avoid rendering different element types on server and client (for example: don't put `<div>` inside `<p>`).
- If `framer-motion` or other optional libs are missing, either install them or remove their imports.
- If the app fails to connect to MongoDB, make sure `MONGODB_URI` is correct and that your IP is allowed in Atlas (or use a connection string that permits access from anywhere for testing).

---

## Running in production / Deploy on Vercel

1. Push the repo to GitHub (or a Git provider).
2. On Vercel, import the project.
3. In Vercel project settings, add the Environment Variables from the Environment section (`MONGODB_URI`, `MONGODB_DB`).
4. Deploy. Vercel will build and run the Next.js app. The API route `/api/reviews` will use your MongoDB Atlas connection.

Notes for Vercel:
- Keep audio payloads short to avoid hitting Vercel body-size limits. For production use, upload audio to object storage and store URLs in the DB instead of embedding base64.

---

## Files of interest

- `app/page.tsx` — main page UI and client-side recording logic
- `app/api/reviews/route.ts` — serverless API route (GET/POST)
- `lib/mongodb.ts` — helper for server-side MongoDB connection

---

## Recommended improvements (future work)

- Replace base64 audio storage with S3/Cloudinary upload flow and store URLs.
- Add server-side size checks and rate limiting to avoid abuse.
- Add client-side max recording duration + progress/remaining time.
- Add testing and simple E2E test (Playwright) for basic submit + playback flow.

---

If you want I can implement the S3 upload flow and server-side validation next.
This project stores reviews in MongoDB. For local development create a `.env.local` file in the project root with:

MONGODB_URI="your-mongodb-connection-string"
MONGODB_DB=morai

When deploying to Vercel, add the same environment variables in the Vercel dashboard for your project (Settings → Environment Variables). Do not commit `.env.local` — it's already ignored by `.gitignore`.

Notes:
- The API is located at `/api/reviews` and supports GET (list) and POST (create). POST body: { name, comment, audio? } where `audio` is an optional data URL for recorded audio.
- If `MONGODB_URI` is not provided the API falls back to an in-memory store for local testing only.
