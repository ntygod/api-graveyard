# Contributing to API Graveyard

Thanks for your interest in contributing! Here's how you can help.

## Submit a Dead API

### Option 1: Website Form (Easiest)
1. Go to [ntygod.github.io/api-graveyard](https://ntygod.github.io/api-graveyard/)
2. Click "Submit an Obituary" at the bottom
3. Fill in the form → it auto-creates a GitHub Issue

### Option 2: GitHub Issue Template
1. Go to [New Issue](https://github.com/ntygod/api-graveyard/issues/new?template=obituary.yml)
2. Fill in the template fields
3. Submit

### Option 3: Direct PR
1. Fork the repo
2. Add an entry to `data/apis.json` (Chinese) and `data/apis-en.json` (English):

```json
{
  "id": "unique-id",
  "name": "API Name",
  "born": "2010",
  "died": "2023-06-01",
  "icon": "🔥",
  "cause": "Why it died",
  "lastWords": "Official last statement",
  "epitaph": "One-liner epitaph",
  "killedBy": "Company",
  "dependents": "Who was affected",
  "tags": ["tag1", "tag2"],
  "flowers": 0
}
```

3. Submit a PR

## Report an Endangered API

Use the [Endangered API template](https://github.com/ntygod/api-graveyard/issues/new?template=endangered.yml) or submit a PR to `data/endangered.json` / `data/endangered-en.json`.

## Fix Inaccurate Data

If you spot wrong dates, incorrect descriptions, or other errors — PRs welcome. Please include a source link.

## Translation

Help translate API entries to other languages:
- Copy `data/apis.json` → `data/apis-xx.json`
- Translate `cause`, `epitaph`, `dependents`, and `tags` fields
- Add the language to `js/i18n.js`

## Development

No build tools needed. Just open `index.html` with any static server:

```bash
npx serve .
```

## Code Style

- Pure HTML/CSS/JS, no frameworks
- Keep it simple — no unnecessary abstractions
- Test on both desktop and mobile before submitting
