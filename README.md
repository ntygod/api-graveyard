# 🪦 API Graveyard

> In memory of the APIs and services that once shone bright. Leave a flower, remember them.

[🇨🇳 中文版](./README-zh.md)

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Live Demo

👉 [ntygod.github.io/api-graveyard](https://ntygod.github.io/api-graveyard/)

## Features

- 🪦 **Tombstone Cards** — Browse dead APIs with full details
- 🌸 **Leave Flowers** — Pay respects (local + community merged)
- ☠ **Killer Ranking** — See which company killed the most APIs
- ⚠️ **Endangered Watchlist** — APIs still alive but probably not for long
- 📅 **Timeline** — API deaths by year
- 📊 **Statistics** — Charts by company and year
- 📝 **Submit Obituary** — Submit a dead API via form (auto-creates GitHub Issue)
- 🌐 **i18n** — Chinese / English switch
- 🔗 **Deep Links** — Share a specific tombstone via URL hash
- 📱 **Responsive** — Mobile friendly

## Quick Start

Pure static site. No build tools needed.

```bash
git clone https://github.com/ntygod/api-graveyard.git
cd api-graveyard

# Any static server works
npx serve .
# Or use VS Code Live Server
```

## Project Structure

```
api-graveyard/
├── index.html
├── css/style.css
├── js/
│   ├── app.js              # Core logic
│   └── i18n.js             # Language pack (zh/en)
├── data/
│   ├── apis.json            # Dead API data (Chinese)
│   ├── apis-en.json         # Dead API data (English)
│   ├── endangered.json      # Endangered APIs (Chinese)
│   └── endangered-en.json   # Endangered APIs (English)
├── .github/
│   ├── workflows/
│   │   ├── deploy.yml       # Auto deploy to GitHub Pages
│   │   ├── merge-flowers.yml # Merge community flower data
│   │   └── process-obituary.yml # Auto process obituary submissions
│   └── ISSUE_TEMPLATE/
│       ├── obituary.yml     # Obituary submission template
│       └── endangered.yml   # Endangered API report template
├── og-image.svg
├── LICENSE
├── CONTRIBUTING.md
└── README.md
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

### Quick ways to contribute:

1. **Submit a dead API** — Click "Submit an Obituary" on the website, or use the [Issue template](https://github.com/ntygod/api-graveyard/issues/new?template=obituary.yml)
2. **Report an endangered API** — Use the [endangered template](https://github.com/ntygod/api-graveyard/issues/new?template=endangered.yml)
3. **Fix data** — Submit a PR to correct any inaccurate information
4. **Translate** — Help translate API data to more languages

## How Obituary Auto-Processing Works

1. User submits via website form → GitHub Issue created with `obituary` label
2. Maintainer reviews → adds `obituary-approved` label
3. GitHub Actions auto-parses Issue, adds to `apis.json`, deploys, closes Issue

## License

[MIT](./LICENSE)
