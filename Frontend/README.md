# Nexlas AI — Separated Project

## Main entry
Open `index.html`. It is the main entry point.

## Structure
- `index.html` — NexlasGPT onboarding / career diagnosis
- `pages/` — each dashboard module as a separate webpage
- `css/<page>.css` — each page's complete, self-contained stylesheet (no shared `global.css`)
- `js/<page>.js` — each page's complete, self-contained script (no shared `global.js`)
- `assets/` — images/icons/fonts

There is no `global.js` or `global.css` anymore. Shared logic (app state, the
diagnosis engine, `appData`, the toast, the chat widget, and `localStorage`
persistence) is duplicated inside every page's own `<page>.js` file so each
page can be opened, read, and edited on its own.

## Important
All navigation uses real HTML links, not SPA-only view switching. Project state is stored in `localStorage` so progress can survive moving between pages.
