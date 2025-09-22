# Vercel Demo Web App

This repository contains a tiny example of an npm-powered web application that can be deployed to [Vercel](https://vercel.com). It exposes a static landing page backed by a single serverless API route.

## Project structure

```
.
├── api/hello.js      # Serverless function returning JSON
├── app.js            # Front-end script fetching data from the API route
├── dev-server.js     # Lightweight local development server (no external deps)
├── index.html        # Static landing page
├── package.json      # npm metadata and scripts
├── styles.css        # Styling for the landing page
└── vercel.json       # Minimal Vercel configuration
```

## Getting started locally

This project does not rely on any third-party npm packages, so there is nothing to install. To experiment locally, make sure you have Node.js 18 or newer and run:

```bash
npm install          # Optional: creates a lockfile, no packages are downloaded
npm run dev          # Starts the lightweight dev server on http://localhost:3000
```

Open <http://localhost:3000> in your browser. The page will call the `/api/hello` endpoint which, in this local mode, is handled directly by the dev server.

## Deploying to Vercel

1. Push this repository to your own GitHub (or GitLab/Bitbucket) account.
2. Create a new project in the Vercel dashboard and import the repository.
3. Vercel detects the `index.html` file and serves it as a static asset. The `api/hello.js` file becomes a serverless function available at `/api/hello`.
4. Once the deployment completes, visit the generated URL to see the page and JSON API in action.

> **Tip:** The optional `vercel.json` file rewrites the root path (`/`) to `index.html`, ensuring the static file is served even when the project also contains API routes.

## Customization ideas

- Update the `api/hello.js` function to read data from an external service.
- Replace the static HTML page with a client-side framework of your choice.
- Extend `dev-server.js` to watch files and reload automatically during development.

Have fun experimenting with Vercel deployments! ✨
