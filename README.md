# Tanishk Tiwari: portfolio (Vite + React Three Fiber + Theatre.js)

Hero → Work → About + proof → Contact. Scenes and their Theatre.js timelines are reused from the Shopify Editions Winter '26 page's public assets
(`scripts/extract.py` downloads them, `scripts/personalize.py` trims `src/content.json` to the four scene blocks and prunes unused assets).

- All copy: `src/portfolio.js` (anything unconfirmed is a `TODO(VERIFY)` comment, not shipped text).
- Work filter chips, case studies, compact rows: `src/Work.jsx`. About + proof: `src/About.jsx`.
- Font: Inter Tight (self-hosted via @fontsource-variable). Respects `prefers-reduced-motion`.
- Resume: put the PDF at `public/resume.pdf`.

Run: `npm install && npm run dev`.

Note: `scripts/data.json` and `scripts/content.shopify.json` (decoded third-party page data) are git-ignored; `extract.py`/`personalize.py` need them locally to regenerate content. The committed `src/content.json` and `public/` are enough to build and run.
