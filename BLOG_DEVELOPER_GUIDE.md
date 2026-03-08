# CardGamesHub.io Blog — Developer Guide

Welcome! This document explains everything you need to know to integrate, run, and extend the CardGamesHub.io Blog module. This is the **authoritative reference** for any developer connecting this to the existing main site.

---

## Table of Contents
1. [Overview](#overview)
2. [Folder Structure](#folder-structure)
3. [How Articles Work](#how-articles-work)
4. [Content Calendar](#content-calendar)
5. [Running Locally](#running-locally)
6. [Automation Scripts](#automation-scripts)
7. [Scheduling Articles](#scheduling-articles)
8. [Manually Reviewing / Editing Articles](#manually-reviewing--editing-articles)
9. [Adding New Categories](#adding-new-categories)
10. [SEO — How It Works](#seo--how-it-works)
11. [Sitemap and RSS](#sitemap-and-rss)
12. [Merging into the Main Repo](#merging-into-the-main-repo)
13. [Environment Variables](#environment-variables)
14. [Deployment Notes](#deployment-notes)
15. [Google Search Console](#google-search-console)
16. [FAQ](#faq)

---

## Overview

This project is a **standalone Next.js 15 blog** designed to drop into the existing CardGamesHub.io codebase. It publishes **2 articles per day** from March 8, 2026 through December 31, 2026 (598 articles total) using a **date-based visibility gate** — the system checks each article's `publishedAt` timestamp at request time and only serves articles whose publish time has passed.

**Tech stack:**
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + custom CSS variables (dark theme matching CardGamesHub)
- **Content format:** MDX (`.mdx` files with YAML frontmatter)
- **Frontmatter parsing:** `gray-matter`
- **Content rendering:** `react-markdown`
- **Date utilities:** `date-fns`
- **Feed:** Built-in RSS route at `/blog/rss.xml`

---

## Folder Structure

```
blog/
├── content/
│   └── articles/           ← All MDX article files live here
│       └── {slug}.mdx
├── data/
│   └── content-calendar.json   ← The master schedule (598 entries)
├── scripts/
│   ├── generate-schedule.js    ← Generates the content calendar
│   ├── generate-article.js     ← Generates a single MDX article
│   ├── bulk-generate.js        ← Batch generates articles
│   ├── daily-publish.js        ← Runs at 08:00 + 18:00 UTC daily
│   └── check-duplicates.js     ← Validates slug/title uniqueness
├── src/
│   ├── app/
│   │   ├── layout.tsx          ← Root layout (header + footer)
│   │   ├── page.tsx            ← Root → redirects to /blog
│   │   ├── sitemap.ts          ← Dynamic XML sitemap
│   │   ├── globals.css         ← All design tokens + component styles
│   │   └── blog/
│   │       ├── page.tsx        ← /blog index (grid + sidebar + pagination)
│   │       ├── rss.xml/
│   │       │   └── route.ts    ← RSS feed at /blog/rss.xml
│   │       └── [slug]/
│   │           ├── page.tsx    ← /blog/{slug} article page
│   │           └── not-found.tsx
│   ├── components/
│   │   └── blog/
│   │       ├── ArticleCard.tsx
│   │       ├── AdBannerSlot.tsx
│   │       ├── BlogFooter.tsx
│   │       ├── BlogHeader.tsx
│   │       ├── CategorySidebar.tsx
│   │       ├── Pagination.tsx
│   │       ├── RelatedArticles.tsx
│   │       └── SocialShare.tsx
│   └── lib/
│       ├── blog.ts             ← Data layer (reads MDX, enforces publish gate)
│       └── seo.ts              ← Metadata / JSON-LD generators
├── .env.example
├── next.config.ts
└── package.json
```

---

## How Articles Work

### File Format

Each article is an `.mdx` file in `content/articles/`:

```mdx
---
title: "How to Play Cribbage for Beginners"
slug: "how-to-play-cribbage-for-beginners"
category: "Cribbage"
publishedAt: "2026-03-08T08:00:00Z"
author: "CardGamesHub Team"
excerpt: "A concise 1–2 sentence summary of the article."
featuredImage: "https://images.unsplash.com/photo-..."
altText: "Descriptive alt text for the featured image"
metaTitle: "50–60 char SEO title"
metaDescription: "150–160 char SEO description with primary keyword"
tags: ["cribbage", "card games", "beginners"]
---

Article body in Markdown. H2 and H3 subheadings supported.
Internal links use relative paths like [Cribbage](/cribbage).
```

### Visibility Gate

**`src/lib/blog.ts`** is the single source of truth. The function `isPublished()` compares `publishedAt` to `new Date()`:

```typescript
function isPublished(publishedAt: string): boolean {
  return new Date(publishedAt).getTime() <= new Date().getTime();
}
```

Any article whose `publishedAt` is in the future is **completely invisible** — it won't appear in the index, related articles, sitemap, or RSS feed. No caching of future articles occurs.

> **Important for static sites (Vercel/Netlify):** Because Next.js can statically cache pages, you need to ensure the site **rebuilds** (or uses ISR/on-demand revalidation) when a new article's publish time arrives. The `daily-publish.js` script handles this by triggering a deploy webhook.

---

## Content Calendar

**`data/content-calendar.json`** is the master schedule. Each entry looks like:

```json
{
  "id": 1,
  "slot": "08:00 UTC",
  "publishedAt": "2026-03-08T08:00:00.000Z",
  "category": "Cribbage",
  "internalCategory": "Cribbage",
  "title": "How to Play Cribbage for Beginners",
  "slug": "how-to-play-cribbage-for-beginners",
  "status": "scheduled",
  "retries": 0,
  "generatedAt": null,
  "notes": ""
}
```

**Status values:**
| Status | Meaning |
|---|---|
| `scheduled` | Not yet generated |
| `generated` | MDX file exists but publish time hasn't arrived |
| `published` | Published and live |
| `failed` | Generation failed after max retries |

**Category distribution (approximate):**
| Category | % | ~Articles |
|---|---|---|
| Cribbage | 30% | 179 |
| Solitaire | 30% | 179 |
| Rules & How-To | 20% | 120 |
| Tips & Tricks | 20% | 120 |

---

## Running Locally

```bash
# 1. Clone the repo
git clone https://github.com/subekciaykut1-gif/cardgamesblog.git

# 2. Install dependencies
npm install

# 3. Copy and configure environment
cp .env.example .env.local
# Edit .env.local — at minimum set NEXT_PUBLIC_SITE_URL

# 4. Generate the content calendar (already done, but to regenerate):
npm run blog:schedule

# 5. Generate some articles for testing
npm run blog:bulk -- --limit 10

# 6. Start the dev server
npm run dev
# → Open http://localhost:3000/blog
```

---

## Automation Scripts

All scripts live in `/scripts/` and can be run via npm:

### Generate the content calendar

```bash
npm run blog:schedule
# Output: data/content-calendar.json (598 entries)
```

Re-run this only if you want to regenerate the schedule. **Warning:** this overwrites the existing calendar.

### Generate a single article

```bash
npm run blog:generate -- --slug cribbage-scoring-rules-explained
npm run blog:generate -- --id 5
npm run blog:generate -- --next          # auto-picks the next scheduled
npm run blog:generate -- --dry-run --next  # preview without writing
```

### Bulk generate articles

```bash
npm run blog:bulk                                          # all scheduled
npm run blog:bulk -- --from 2026-03-08 --to 2026-03-15   # date range
npm run blog:bulk -- --limit 20                           # max 20 articles
npm run blog:bulk -- --dry-run                            # preview mode
```

### Daily publish (runs via cron)

```bash
npm run blog:publish
```

This script:
1. Finds all calendar entries whose `publishedAt` ≤ now with status `scheduled` or `generated`
2. Generates the MDX file if it doesn't exist (up to 3 retries)
3. Marks the entry as `published` in the calendar
4. Optionally POSTs to `DEPLOY_WEBHOOK_URL` to trigger a rebuild

### Check for duplicates

```bash
npm run blog:check
# Exits with code 0 if no duplicates — good to use in CI
```

---

## Scheduling Articles

### Option A: Cron (Linux/macOS server)

Add to crontab (`crontab -e`):

```cron
0 8,18 * * * cd /path/to/blog && node scripts/daily-publish.js >> /var/log/blog-publish.log 2>&1
```

### Option B: Windows Task Scheduler

1. Open Task Scheduler → Create Basic Task
2. Set trigger: Daily, repeat every 12 hours (or two separate 8:00 AM and 6:00 PM tasks)
3. Action: `node C:\path\to\blog\scripts\daily-publish.js`

### Option C: Vercel Cron (vercel.json)

```json
{
  "crons": [
    { "path": "/api/publish", "schedule": "0 8,18 * * *" }
  ]
}
```

Then create `src/app/api/publish/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { execSync } from "child_process";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  execSync("node scripts/daily-publish.js");
  return NextResponse.json({ ok: true });
}
```

### Option D: GitHub Actions

Create `.github/workflows/daily-publish.yml`:

```yaml
name: Daily Blog Publish

on:
  schedule:
    - cron: "0 8,18 * * *"
  workflow_dispatch:

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }
      - run: npm ci
      - run: node scripts/daily-publish.js
        env:
          DEPLOY_WEBHOOK_URL: ${{ secrets.DEPLOY_WEBHOOK_URL }}
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "chore: publish scheduled articles"
```

---

## Manually Reviewing / Editing Articles

### To review an article before it goes live:

1. Find the entry in `data/content-calendar.json`
2. Note the `slug`
3. Open `content/articles/{slug}.mdx`
4. Edit freely — the MDX body is plain Markdown
5. Save — the frontend will pick up changes on next build/request

### To swap a scheduled article:

1. Edit `data/content-calendar.json` — change the `title` and `slug` of the entry
2. Delete the old MDX file if it exists: `content/articles/old-slug.mdx`
3. Run `node scripts/generate-article.js --slug new-slug` to regenerate

### To delay an article:

Change `publishedAt` in both the calendar entry AND the MDX frontmatter:

```json
// calendar entry
"publishedAt": "2026-04-15T08:00:00Z"
```

```yaml
# MDX frontmatter
publishedAt: "2026-04-15T08:00:00Z"
```

> **Note:** The frontmatter in the MDX file is the **authoritative source** — the calendar is a planning/tracking tool.

---

## Adding New Categories

1. Open `src/lib/blog.ts`
2. Add the new category to the `Category` type union and the `CATEGORIES` array
3. Open `scripts/generate-schedule.js`
4. Add a new topic pool and entry to `CATEGORY_CONFIG`
5. Update `CATEGORY_DISPLAY_MAP` to map the internal name to the display name
6. Re-run `npm run blog:schedule`

---

## SEO — How It Works

Every article page automatically generates:

| SEO Element | Source |
|---|---|
| `<title>` | `metaTitle` frontmatter field |
| `<meta name="description">` | `metaDescription` frontmatter field |
| `<link rel="canonical">` | Auto-built: `{SITE_URL}/blog/{slug}` |
| Open Graph tags | Generated by `src/lib/seo.ts` |
| Twitter Card tags | Generated by `src/lib/seo.ts` |
| JSON-LD Article schema | `generateArticleJsonLd()` in `src/lib/seo.ts` |
| Image alt text | `altText` frontmatter field |

**No additional configuration needed** — all SEO is handled server-side via Next.js `generateMetadata()`.

---

## Sitemap and RSS

### Sitemap

- **URL:** `https://cardgameshub.io/sitemap.xml`  
- **Generated by:** `src/app/sitemap.ts`  
- Automatically includes all published articles  
- Only articles whose `publishedAt` ≤ current time are included  

### RSS Feed

- **URL:** `https://cardgameshub.io/blog/rss.xml`  
- **Generated by:** `src/app/blog/rss.xml/route.ts`  
- Returns the 50 most recent articles as valid RSS 2.0 XML  

---

## Merging into the Main Repo

To integrate this blog into the existing CardGamesHub.io Next.js codebase:

### Files to copy:

```bash
# Content and data
cp -r content/ <main-repo>/content/
cp -r data/ <main-repo>/data/
cp -r scripts/ <main-repo>/scripts/

# Source code
cp -r src/app/blog/ <main-repo>/src/app/blog/
cp src/app/sitemap.ts <main-repo>/src/app/sitemap.ts   # MERGE with existing
cp -r src/components/blog/ <main-repo>/src/components/blog/
cp src/lib/blog.ts <main-repo>/src/lib/blog.ts
cp src/lib/seo.ts <main-repo>/src/lib/seo.ts
```

### Files to MERGE (not replace):

- **`src/app/layout.tsx`**: Add `<BlogHeader>` or integrate Blog nav link into existing header
- **`src/app/globals.css`**: Copy the CSS variables block (`:root { ... }`) and component styles
- **`package.json`**: Add the blog dependencies and `blog:*` scripts
- **`next.config.ts`**: Add MDX configuration using `withMDX`

### Add Blog nav link to existing header:

Find the nav links array in the existing header component and add:

```typescript
{ href: "/blog", label: "Blog" }
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical site URL, e.g. `https://cardgameshub.io` |
| `DEPLOY_WEBHOOK_URL` | No | Vercel/Netlify deploy hook — triggered after each publish run |
| `CRON_SECRET` | No | Bearer token for Vercel Cron endpoint security |

---

## Deployment Notes

### Vercel (recommended)

1. Connect the GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Set up Vercel Cron (see [Scheduling](#scheduling-articles))
4. On each cron trigger, the script generates new MDX files, commits them, and the push triggers a new Vercel build

### Self-hosted / VPS

1. Set up a Linux server with Node.js 20+
2. Clone the repo and `npm install`
3. Set up crontab as described in [Scheduling](#scheduling-articles)
4. Use PM2 or similar to ensure the cron runs reliably
5. Run `npm run build && npm run start` for production

---

## Google Search Console

To notify Google of new articles after each publish run:

1. Verify the site in [Google Search Console](https://search.google.com/search-console)
2. Submit the sitemap URL: `https://cardgameshub.io/sitemap.xml`
3. GSC will crawl and index new articles automatically as they appear in the sitemap

For programmatic notification (advanced), use the [Google Indexing API](https://developers.google.com/search/apis/indexing-api/v3/quickstart) and set `GOOGLE_SEARCH_CONSOLE_KEY` in your environment.

---

## FAQ

**Q: Why 598 articles instead of 660?**  
The exact count is determined by the number of days between March 8, 2026 and December 31, 2026 (299 days × 2 = 598). The 660 estimate in the original brief was approximate.

**Q: What happens if article generation fails?**  
The `daily-publish.js` script retries up to 3 times. If all retries fail, the entry is marked `status: "failed"` in the calendar and needs manual attention. Check the calendar for `"failed"` entries regularly.

**Q: Can I use an AI API to generate better article content?**  
Yes! Replace the content template functions in `scripts/generate-article.js` with API calls (OpenAI, Google Gemini, Anthropic, etc.). The MDX frontmatter structure remains the same — just replace the `buildCribbageArticle()`, `buildSolitaireArticle()`, and `buildGeneralArticle()` functions with AI-generated content.

**Q: How do I add a new article manually without the schedule?**  
Create an MDX file in `content/articles/` following the frontmatter format. Set `publishedAt` to any past time to make it immediately visible.

**Q: Why am I seeing no articles on the blog page?**  
The most common cause: all articles have a future `publishedAt`. Run `npm run blog:generate -- --next` to generate the next scheduled article, or create a test article with `publishedAt` set to a past date.

**Q: How do I change the publish times from 8 AM / 6 PM UTC?**  
Edit `generate-schedule.js` — the `hour` variable is set to `8` or `18` based on the slot index. Regenerate the schedule after changing.

---

*Built by Antigravity for CardGamesHub.io — March 2026*
