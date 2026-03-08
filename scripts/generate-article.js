#!/usr/bin/env node
/**
 * generate-article.js
 *
 * Generates a single MDX article file from a content calendar entry.
 * CONTENT GENERATION: Uses the FREE approach — pre-written, well-structured
 * article templates filled in with topic-specific content. No AI API cost.
 *
 * Usage:
 *   node scripts/generate-article.js --slug cribbage-scoring-rules-explained
 *   node scripts/generate-article.js --id 1
 *   node scripts/generate-article.js --next        # auto-picks next scheduled
 *   node scripts/generate-article.js --dry-run     # prints without writing
 *
 * Output: content/articles/{slug}.mdx
 */

const fs   = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
const args = process.argv.slice(2);

const DRY_RUN = args.includes("--dry-run");
const NEXT_FLAG = args.includes("--next");
const slugArg = args[args.indexOf("--slug") + 1];
const idArg   = args[args.indexOf("--id")   + 1];

// ── Paths ────────────────────────────────────────────────────────────────────

const CALENDAR_PATH  = path.join(__dirname, "..", "data", "content-calendar.json");
const ARTICLES_DIR   = path.join(__dirname, "..", "content", "articles");
const USED_IMAGES_PATH = path.join(__dirname, "..", "data", "used-unsplash-ids.json");

// ── Load calendar ─────────────────────────────────────────────────────────────

let calendar;
try {
  calendar = JSON.parse(fs.readFileSync(CALENDAR_PATH, "utf-8"));
} catch {
  console.error("❌ data/content-calendar.json not found. Run generate-schedule.js first.");
  process.exit(1);
}

// ── Resolve target entry ──────────────────────────────────────────────────────

function findEntry() {
  if (NEXT_FLAG) {
    const now = new Date().toISOString();
    const entry = calendar.entries.find(
      (e) => e.status === "scheduled" && e.publishedAt > now
    );
    if (!entry) { console.error("❌ No upcoming scheduled entries found."); process.exit(1); }
    return entry;
  }
  if (slugArg) {
    const entry = calendar.entries.find((e) => e.slug === slugArg);
    if (!entry) { console.error(`❌ No entry with slug "${slugArg}"`); process.exit(1); }
    return entry;
  }
  if (idArg) {
    const entry = calendar.entries.find((e) => e.id === Number(idArg));
    if (!entry) { console.error(`❌ No entry with id ${idArg}`); process.exit(1); }
    return entry;
  }
  console.error("Usage: node generate-article.js --slug <slug> | --id <n> | --next [--dry-run]");
  process.exit(1);
}

// ── Image helper ─────────────────────────────────────────────────────────────
// Generates a highly relevant, unique image for every single article using Unsplash API

async function getImage(title, category) {
  const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
  const fallback = {
    url: "fallback://cardgameshub",
    alt: `${title} - ${category} card game illustration`
  };

  if (!UNSPLASH_ACCESS_KEY) {
    console.warn("⚠️ UNSPLASH_ACCESS_KEY not found in .env.local, using fallback placeholder image.");
    return fallback;
  }

  let usedIds = [];
  if (fs.existsSync(USED_IMAGES_PATH)) {
    try {
      usedIds = JSON.parse(fs.readFileSync(USED_IMAGES_PATH, "utf-8"));
    } catch (e) {}
  }

  const query = encodeURIComponent(`${category} card game`);
  const api = `https://api.unsplash.com/search/photos?query=${query}&client_id=${UNSPLASH_ACCESS_KEY}&per_page=30`;
  
  try {
    const res = await fetch(api);
    if (!res.ok) throw new Error(`Unsplash API error: ${res.statusText}`);
    const data = await res.json();
    
    // Find first unused image
    const photo = data.results.find(p => !usedIds.includes(p.id));
    if (photo) {
      usedIds.push(photo.id);
      fs.writeFileSync(USED_IMAGES_PATH, JSON.stringify(usedIds, null, 2));
      return {
        url: photo.urls.regular,
        alt: photo.alt_description || `${title} illustration`
      };
    } else {
      console.warn("⚠️ No unique Unsplash images left for query:", query);
    }
  } catch (e) {
    console.warn("⚠️ Unsplash fetch failed, using fallback:", e.message);
  }

  return fallback;
}

// ── Content templates ─────────────────────────────────────────────────────────
// A rich article template (~1000+ words) structured by category type

function buildCribbageArticle(entry) {
  const t = entry.title;
  return `
Cribbage is one of the most beloved card games of all time. Whether you're just picking up the cards for the first time or looking to sharpen your competitive edge, this guide on **${t}** will give you everything you need.

## What Makes Cribbage Unique?

Unlike many card games, Cribbage combines skill, strategy, and a touch of luck. The scoring system — with its pegging phase and hand counting — creates layers of decision-making that keep experienced players engaged for decades.

If you haven't already, check out the [Cribbage game on CardGamesHub.io](/cribbage) to practice what you learn here and sharpen your skills in real matches.

## Key Concepts to Understand

Before diving deep into ${t.toLowerCase()}, make sure you're comfortable with the basics:

- **The Crib**: Four extra cards dealt during setup that belong to the dealer
- **The Starter Card**: A card cut from the deck that affects all hands
- **Pegging**: Real-time scoring during play
- **Hand Counting**: Scoring after all cards have been played

These four pillars hold up every part of Cribbage strategy and scoring.

## Breaking Down the Topic

When it comes to ${t}, the most important principle is **always think two steps ahead**. Every decision you make now affects both the play phase and the hand-counting phase.

### Step 1: Evaluate Your Opening Hand

Your six-card hand contains a wealth of information. Before discarding, ask yourself:
1. Which two cards should go to the crib?
2. What is my expected hand value without the starter card?
3. What starter cards would dramatically improve my hand?

Players who think through all three questions before discarding consistently outperform those who act on instinct alone.

### Step 2: The Discard Decision

The discard phase is the most strategic moment in Cribbage. When you're the **dealer**, you want to send good cards to your own crib. When you're the **non-dealer (pone)**, you want to send cards that won't help the dealer's crib.

Safe discards for the pone include:
- Kings (hard to form runs with them)
- Unrelated low and high cards (e.g., a 2 and a King)

Risky discards include:
- Pairs (give the dealer an immediate score)
- Connectors like 4-5 or 5-6 (form 15s and runs easily)

### Step 3: Pegging Strategically

The pegging phase is where many beginners leave points on the table. Keep these principles in mind:

- Always try to **"go" safely** to avoid giving your opponent points for 31
- Watch the running total — if it's at 21, your opponent may be setting a trap
- Pairs and three-card runs during pegging add up quickly

### Step 4: Counting Your Hand

Hand counting is systematic once you know the patterns:

| Combination | Points |
|---|---|
| Pair | 2 |
| Three of a kind | 6 |
| Four of a kind | 12 |
| Run of 3 | 3 |
| Run of 4 | 4 |
| Fifteen (sum = 15) | 2 each |
| Flush (4 or 5 cards same suit) | 4 or 5 |
| "His Nobs" (J matching starter) | 1 |

Practice counting hands quickly — speed and accuracy here improves your win rate significantly.

## Common Mistakes to Avoid

Even experienced players fall into these traps:

1. **Over-valuing their crib** when they're the non-dealer
2. **Ignoring the pegging phase** entirely and only focusing on hand scores
3. **Forgetting the starter card** changes everything — always recalculate after the cut
4. **Not tracking the score distance** — if you're behind, you need to play more aggressively

## Advanced Tip: Know the Score Distance

This is often the difference between good and great Cribbage players. Always know:
- Your current score
- Your opponent's current score
- How many points you need to win
- How many points they need to win

This governs **every single decision** you make — discards, pegging, and even when to concede a hand.

## Practice Makes Perfect

The fastest way to improve at Cribbage is repetition. Play online on [CardGamesHub.io](/cribbage) where you can challenge other players or practice against our bots. The bots play fairly and never peek at your cards, giving you a genuine competitive environment.

You can also explore our [Solitaire section](/solitaire) if you want a solo challenge between Cribbage sessions.

## Frequently Asked Questions

**Q: Can I learn Cribbage in one day?**  
Yes! The basic rules can be learned in an afternoon. True mastery takes longer, but you can enjoy the game immediately.

**Q: Is Cribbage a luck or skill game?**  
It's both. Luck determines which cards you receive; skill determines what you do with them. Skilled players win far more consistently over many games.

**Q: Is Cribbage good for the brain?**  
Absolutely. Cribbage exercises mental arithmetic, pattern recognition, and strategic thinking simultaneously.

## Conclusion

Mastering ${t} is a journey that every Cribbage enthusiast finds rewarding. Each decision deepens your understanding of the game, and every session teaches you something new.

Start implementing these tactics in your next game and track your progress over time. Remember — [CardGamesHub.io](/cribbage) is here whenever you want to put these strategies to the test.

*Happy pegging!*
`;
}

function buildSolitaireArticle(entry) {
  const t = entry.title;
  return `
Solitaire has entertained millions of players for centuries — from card tables in Parisian salons to smartphone screens on morning commutes. This guide covers everything you need to know about **${t}**.

## Why Solitaire Endures

Solitaire is the ultimate low-friction card game. No opponents, no scheduling, no pressure — just you, the deck, and a puzzle to solve. The satisfaction of completing a game, combined with the unpredictability of each new deal, keeps players returning day after day.

Try out Solitaire right now on [CardGamesHub.io](/solitaire) — our free browser version needs no download and works on any device.

## Understanding the Basics

Most Solitaire variants share a common foundation:

- **A standard 52-card deck** (some variants use two decks)
- **A tableau**: the main playing area with columns of cards
- **A stockpile**: cards you draw from when stuck
- **Foundation piles**: where you build suits from Ace to King to win
- **A waste pile**: cards drawn from the stockpile but not yet played

Mastering the relationship between these zones is the key to winning consistently.

## Exploring ${t}

When approaching ${t}, the fundamentals shift the moment you understand card priority. Here's what separates casual players from consistent winners:

### Principle 1: Expose Hidden Cards First

Your primary goal early in the game is always to **flip face-down cards**. Hidden cards are information gaps — you cannot plan around what you don't know. Prioritize moves that reveal new cards over moves that simply reorganize visible ones.

### Principle 2: Don't Rush to the Foundation

Counterintuitively, sending cards to the foundation piles too early can box you in. Keep key cards in the tableau as long as they serve as movable scaffolding.

### Principle 3: Empty Columns Are Gold

An empty tableau column gives you massive flexibility — it becomes a temporary holding area for card sequences you need to rearrange. Create empty columns strategically, not accidentally.

### Principle 4: Manage the Stockpile Wisely

Many beginners cycle through the stockpile aimlessly. Before drawing, ask yourself: "Do I have any moves available in the tableau?" Exhaust tableau moves first, then draw.

## Common Variants and Their Quirks

| Variant | Difficulty | Key Feature |
|---|---|---|
| Klondike | Medium | Classic 3-draw or 1-draw option |
| FreeCell | Hard (but winnable) | 4 free cells for temporary storage |
| Spider | Very Hard | Two decks, suit-building challenge |
| Pyramid | Medium | Pair cards summing to 13 |
| Tri Peaks | Easy | Three pyramid peaks to clear |

## Winning Strategies

**For Klondike**: Prefer 3-draw mode for a real challenge. Always reveal face-down cards before moving exposed cards between columns.

**For FreeCell**: Almost every deal is theoretically winnable. Use the free cells sparingly — hoarding them gives you maximum flexibility.

**For Spider**: Build complete suit sequences before moving grouped sets. In the 4-suit version, don't mix suits in your builds.

## What Happens When You're Stuck?

Getting stuck is part of Solitaire. Here's your checklist when blocked:
1. Look for any valid move you might have missed
2. Check if you can move a sequence to an empty column
3. Draw from the stockpile
4. If all options are exhausted, start a new game — not every deal is winnable

In Klondike, approximately 79% of games are theoretically winnable, but a large percentage of those require perfect play.

## The Mental Benefits of Solitaire

Research consistently shows that card games like Solitaire improve:
- **Working memory** (tracking card positions)
- **Pattern recognition** (identifying valid moves quickly)
- **Strategic planning** (thinking several moves ahead)
- **Patience and focus** (staying calm when stuck)

These benefits compound over time with regular play.

## Practice Online for Free

The best way to improve at Solitaire is to play frequently. [CardGamesHub.io](/solitaire) offers free Solitaire in the browser — no account needed to start playing. If you enjoy card games beyond Solitaire, check out [Cribbage](/cribbage) for a multiplayer challenge.

## Conclusion

Whether you're playing to relax, to challenge yourself, or to beat your personal best time, ${t} is a deeply satisfying pursuit. Apply the strategies in this guide, track your win rate, and you'll see measurable improvement in a surprisingly short time.

*Good luck, and may the cards be with you!*
`;
}

function buildGeneralArticle(entry) {
  const t = entry.title;
  return `
Card games have been bringing people together for centuries, and **${t}** is a topic that every card game enthusiast should explore. Whether you're a beginner or an experienced player, there's always something new to discover.

## Why This Topic Matters

The world of card games is vast and varied. From the strategic depth of [Cribbage](/cribbage) to the meditative quality of [Solitaire](/solitaire), understanding the broader landscape helps you choose the right game for the right moment — and become a better player overall.

## The Foundation: What Card Games Teach Us

Before diving into ${t}, let's establish why card games matter beyond entertainment:

- **Strategic thinking**: Every game requires planning, adaptation, and decision-making under uncertainty
- **Social connection**: Multiplayer card games build communication and friendly competition
- **Mental fitness**: Regular card play improves memory, concentration, and pattern recognition
- **Accessibility**: A standard deck of 52 cards unlocks hundreds of different games

## Deep Dive: ${t}

### Getting Started

The key to mastering any card-related topic is layering knowledge. Start with the fundamentals and build upward. Here's a structured approach:

**Level 1 — Foundation**
Understand the basic mechanics. What are the core rules? What's the objective? How is the winner determined?

**Level 2 — Strategy**
Once you know the rules, focus on strategic play. Which decisions matter most? Where do most beginners leave points/wins on the table?

**Level 3 — Advanced Concepts**
At this level, you're thinking about probability, opponent psychology, and game-state management. This is where good players become great ones.

### Core Principles

Regardless of the specific game or topic, these universal card game principles apply:

1. **Information management**: What do you know, what does your opponent know, and what's hidden?
2. **Probability awareness**: Understanding the likelihood of drawing specific cards changes your decision-making
3. **Patience**: Impulsive play is almost always suboptimal
4. **Adaptability**: The best plan going into a game often needs to change as cards are revealed

### Practical Application

Put these principles into practice by:
- Playing regularly — experience is the best teacher
- Reviewing your decisions after each game, especially losses
- Studying high-level play (many card game communities have guides, forums, and videos)
- Playing against stronger opponents when possible

## Frequently Asked Questions

**Q: How long does it take to get good at card games?**  
Basic competency in most games comes within 10–20 hours of play. True mastery takes much longer, but you'll enjoy the journey.

**Q: Is there one card game I should learn that helps with all others?**  
Cribbage is excellent for this — its combination of arithmetic, probability, and strategic discarding builds skills that transfer broadly. [Try Cribbage on CardGamesHub.io](/cribbage).

**Q: How do I practice when I don't have other players available?**  
Solitaire variants are perfect for solo practice. [CardGamesHub.io's Solitaire](/solitaire) also lets you track your win rate over time.

## Resources and Next Steps

Once you've absorbed this guide, here's what to do next:
1. Pick one game or concept and focus on it for two weeks
2. Play at least one session per day, even if short
3. Review your decisions and look for patterns in your mistakes
4. Expand into related games once you feel confident

## Conclusion

${t} is a rich and rewarding area of study for any card game enthusiast. The strategies, concepts, and insights covered here will serve you well across many different games and situations.

The best move you can make right now? Start playing. [CardGamesHub.io](/) is the perfect place to put these ideas into practice — free, no download required.

*Keep the cards moving!*
`;
}

// ── Build MDX frontmatter + body ──────────────────────────────────────────────

async function buildMdx(entry) {
  const image = await getImage(entry.title, entry.category);
  const metaTitle = entry.title.length > 60
    ? entry.title.slice(0, 57) + "..."
    : entry.title;
  const metaDesc = `${entry.title} — Expert guide by CardGamesHub Team. Tips, strategies and everything card game enthusiasts need to know.`.slice(0, 160);

  let bodyContent;
  if (entry.internalCategory === "Cribbage") {
    bodyContent = buildCribbageArticle(entry);
  } else if (entry.internalCategory === "Solitaire") {
    bodyContent = buildSolitaireArticle(entry);
  } else {
    bodyContent = buildGeneralArticle(entry);
  }

  const rawParagraphs = bodyContent.split('\n\n').map(p => p.trim()).filter(p => p && !p.startsWith('#') && !p.startsWith('>'));
  let rawExcerpt = rawParagraphs[0] || entry.title;
  rawExcerpt = rawExcerpt.replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  const excerpt = rawExcerpt.length > 120 ? rawExcerpt.slice(0, 117) + '...' : rawExcerpt;

  const tags = [entry.category.toLowerCase(), "card games", "cardgameshub"];

  const frontmatter = `---
title: "${entry.title.replace(/"/g, '\\"')}"
slug: "${entry.slug}"
category: "${entry.category}"
publishedAt: "${entry.publishedAt}"
author: "CardGamesHub Team"
excerpt: "${excerpt.replace(/"/g, '\\"')}"
featuredImage: "${image.url}"
altText: "${image.alt.replace(/"/g, '\\"')}"
metaTitle: "${metaTitle.replace(/"/g, '\\"')}"
metaDescription: "${metaDesc.replace(/"/g, '\\"')}"
tags: ${JSON.stringify(tags)}
---`;

  return `${frontmatter}\n${bodyContent}`;
}

// ── Write / show result ───────────────────────────────────────────────────────

async function run() {
  const entry = findEntry();
  console.log(`📝 Generating article: "${entry.title}" [${entry.slug}]`);

  const mdx = await buildMdx(entry);

  if (DRY_RUN) {
    console.log("\n── DRY RUN — output preview ──────────────────────────────\n");
    console.log(mdx.slice(0, 1500) + "\n…[truncated]");
    return;
  }

  fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  const outPath = path.join(ARTICLES_DIR, `${entry.slug}.mdx`);
  fs.writeFileSync(outPath, mdx, "utf-8");
  console.log(`✅ Written to ${outPath}`);

  // Update calendar status
  const idx = calendar.entries.findIndex((e) => e.slug === entry.slug);
  if (idx !== -1) {
    calendar.entries[idx].status      = "generated";
    calendar.entries[idx].generatedAt = new Date().toISOString();
    fs.writeFileSync(CALENDAR_PATH, JSON.stringify(calendar, null, 2));
    console.log(`📅 Calendar entry #${entry.id} marked as "generated"`);
  }
}

run();
