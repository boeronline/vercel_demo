# Web Development with Codex

This repository now hosts a single-page, mobile-first marketing site introducing the "Web Development with Codex" offering.
The experience focuses on fluid typography, soft gradients, and accessible content blocks that adapt gracefully from small to
large screens.

## Pages

- `index.html` – Landing page with hero messaging, service highlights, testimonial, and contact form.
- `styles.css` – Custom design system with gradients, card layouts, and responsive breakpoints tailored for handheld devices.
- `api/hello.js` – Example Vercel serverless function (unused by the static site but retained for parity with Vercel defaults).
- `vercel.json` – Minimal configuration file for deploying static assets on Vercel.

## Local development

No build tooling is required. Open `index.html` directly in your browser or serve the folder using any static file server.

To preview with the included Node development server:

```bash
npm install
npm run dev
```

The server listens on port 3000 and reloads whenever files change.

## Design goals

- **Mobile-first** – Typography, spacing, and component structure start with small screens to ensure thumb-friendly navigation.
- **Inclusive** – Semantic HTML, accessible form controls, and legible color contrast are prioritized throughout.
- **Expressive** – Gradients, glassmorphism cards, and refined type pairings evoke a crafted studio brand that spotlights Codex.
- **Guided** – A responsive navigation system adapts from a compact hamburger menu to a wide-screen tab row so visitors can jump directly to each section.

## Deployment

Deploy the repository to any static hosting provider (such as Vercel, Netlify, or GitHub Pages). All assets are static; no
additional configuration is required beyond serving the files.
