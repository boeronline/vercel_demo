# Synapse Studio

Synapse Studio is a browser-based training deck that delivers bite-sized mental circuits without any
build tooling. Each exercise runs entirely on the client, tracks its own progress, and stores history
in local storage so you can monitor trends over time.

## Exercises

- **Dual N-Back Focus** – Monitor spatial positions and spoken letters simultaneously, marking
  matches from N steps back to build working-memory span.
- **Stroop Focus Lab** – Identify the ink colour of mismatched colour words to strengthen inhibitory
  control and reaction time.
- **Task Switch Circuit** – Alternate between vowel and parity rules to reinforce cognitive
  flexibility while keeping accuracy high under time pressure.

## Progress tracking

- Personal bests, latest results, and lifetime session counts are saved per exercise in
  `localStorage`.
- Every session records a timestamp so the logbook can display recent results alongside a sparkline
  of your last ten attempts.
- A daily calendar keeps track of how many circuits you complete so you can build streaks without
  creating an account or syncing data to a server.

## Project structure

```
.
├── api/hello.js      # Example serverless function (unused by the training deck)
├── app.js            # Exercise framework, progress storage, and UI bindings
├── dev-server.js     # Lightweight dev server for local exploration
├── index.html        # Static dual-screen inspired interface
├── package.json      # npm metadata and scripts
├── styles.css        # Styling for the Synapse Studio theme
└── vercel.json       # Minimal Vercel configuration
```

## Playing locally

The project runs without runtime dependencies. To explore it locally, make sure you have Node.js 18 or
newer and run:

```bash
npm install          # Optional: keeps the lockfile in sync
npm run dev          # Starts the lightweight dev server on http://localhost:3000
```

Then open <http://localhost:3000> in your browser. Every circuit writes its results to local storage,
so refreshing the page preserves your streaks and historical graph.

## Deploying to Vercel

1. Push this repository to your own GitHub (or GitLab/Bitbucket) account.
2. Create a new project in the Vercel dashboard and import the repository.
3. Vercel detects the `index.html` file and serves it as a static asset. The optional `api/hello.js`
   file remains available as a serverless function at `/api/hello` if you want to expand the
   experience later.
4. Once the deployment completes, visit the generated URL to train from anywhere.

Sharpen a little each day and watch the graphs climb. 🧠
