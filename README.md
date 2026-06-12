# Zer0 — Waitlist Site

Static site. No build step, no dependencies. Deploy the folder as-is.

## Run locally

Open `index.html` in a browser, or serve it:

```bash
npx serve website
```

## Deploy — GitHub Pages (one command)

From the repo root:

```powershell
.\deploy-site.ps1
```

This pushes **only** `website/` to a `gh-pages` branch — the app code never
goes live. Run it again whenever you change the site; it updates in place.

One-time setup:

1. Create an empty repo on github.com
2. `git remote add origin https://github.com/<you>/<repo>.git`
3. `.\deploy-site.ps1`
4. On GitHub: **Settings → Pages → Source: Deploy from a branch → `gh-pages` / (root)**

Site lives at `https://<you>.github.io/<repo>/`.

**Custom domain:** put the domain in `website/CNAME` (one line, e.g.
`zer0.example.com`), redeploy, then add it under Settings → Pages → Custom
domain.

Other static hosts also work (Netlify drop, `vercel website`, Cloudflare
Pages with output dir `website`).

## Hook up the waitlist (2 minutes)

Submissions are NOT stored until you set an endpoint.

1. Create a free form at [formspree.io](https://formspree.io) (or Basin/Getform).
2. Copy the endpoint URL, e.g. `https://formspree.io/f/abcdwxyz`.
3. Open `js/main.js`, first line of config:

```js
const WAITLIST_ENDPOINT = 'https://formspree.io/f/abcdwxyz';
```

Done — emails land in your Formspree dashboard / inbox.

## Structure

```
website/
├── index.html      # single page
├── css/style.css   # dark theme, matches the app palette
├── js/main.js      # scroll reveals, QR mockup pattern, waitlist form
└── assets/
    ├── logo.svg        # brand mark (mono — inherits currentColor)
    └── logo-tile.svg   # app-icon tile (blue squircle + white mark)
```

## Logo

The mark is a QR finder eye that reads as a "0" — QR-native + zero fees in one
shape. Mono-color, geometric, legible at 16px. `logo.svg` inherits
`currentColor` so it works on any background; `logo-tile.svg` is the app-icon /
social variant.
