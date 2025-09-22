# Launch Code Lab

This repository contains a tiny browser game that can be deployed to [Vercel](https://vercel.com)
with zero build tooling. The page runs a "guess the number" challenge entirely on the client and
stores your best scores in `localStorage`.

## Features

- Generates a secret "launch code" between 1 and 100 and guides you with high/low hints.
- Tracks attempts for each round and records the best run, most recent run, and total wins in
  `localStorage`.
- Works without any build step or external dependencies—open `index.html` directly or serve it from a
  static host.

## Project structure

```
.
├── api/hello.js      # Example serverless function (unused by the game but kept for reference)
├── app.js            # Game logic, state management, and localStorage helpers
├── dev-server.js     # Lightweight local development server (no external deps)
├── index.html        # Static game interface
├── package.json      # npm metadata and scripts
├── styles.css        # Styling for the Launch Code Lab theme
└── vercel.json       # Minimal Vercel configuration
```

## Playing locally

The project ships without runtime dependencies. To explore it locally, make sure you have Node.js 18 or
newer and run:

```bash
npm install          # Optional: keeps the lockfile in sync
npm run dev          # Starts the lightweight dev server on http://localhost:3000
```

Then open <http://localhost:3000> in your browser. Every round is stored in `localStorage`, so refreshing
the page will keep your mission records intact.

## Deploying to Vercel

1. Push this repository to your own GitHub (or GitLab/Bitbucket) account.
2. Create a new project in the Vercel dashboard and import the repository.
3. Vercel detects the `index.html` file and serves it as a static asset. The optional `api/hello.js`
   file remains available as a serverless function at `/api/hello` if you want to expand the game later.
4. Once the deployment completes, visit the generated URL to play from anywhere.

Have fun cracking the launch code! 🚀
