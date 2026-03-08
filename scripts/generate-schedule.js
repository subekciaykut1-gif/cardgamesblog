#!/usr/bin/env node
/**
 * generate-schedule.js
 *
 * Generates data/content-calendar.json with 660 entries (2 per day,
 * March 8 2026 → December 31 2026) with category distribution:
 *   Cribbage:        30%  (~198 articles)
 *   Solitaire:       30%  (~198 articles)
 *   Other Card Games: 20% (~132 articles)
 *   SEO/Evergreen:   20%  (~132 articles)
 *
 * Usage:  node scripts/generate-schedule.js
 * Output: data/content-calendar.json
 */

const fs = require("fs");
const path = require("path");

// ── Topic pools ──────────────────────────────────────────────────────────────

const CRIBBAGE_TOPICS = [
  { title: "How to Play Cribbage for Beginners: A Complete Guide", slug: "how-to-play-cribbage-for-beginners" },
  { title: "Cribbage Scoring Rules Explained — Every Hand Combination", slug: "cribbage-scoring-rules-explained" },
  { title: "Advanced Cribbage Strategy: Counting, Discarding & Pegging", slug: "advanced-cribbage-strategy-counting-discarding-pegging" },
  { title: "Common Cribbage Mistakes and How to Avoid Them", slug: "common-cribbage-mistakes-how-to-avoid" },
  { title: "Cribbage Hand Rankings and Probabilities Explained", slug: "cribbage-hand-rankings-and-probabilities" },
  { title: "Two-Player vs Three-Player vs Four-Player Cribbage: Differences", slug: "two-player-three-player-four-player-cribbage" },
  { title: "The History and Origins of Cribbage", slug: "history-and-origins-of-cribbage" },
  { title: "Cribbage Terminology Glossary: Every Term You Need to Know", slug: "cribbage-terminology-glossary" },
  { title: "How to Win at Cribbage Consistently: Pro Tips", slug: "how-to-win-at-cribbage-consistently" },
  { title: "Cribbage Board Setup and Game Variants Guide", slug: "cribbage-board-setup-and-variants" },
  { title: "Cribbage Pegging Strategy: When to Go Offensive or Defensive", slug: "cribbage-pegging-strategy-offensive-defensive" },
  { title: "Best Cribbage Discards: What to Keep and What to Toss", slug: "best-cribbage-discards-strategy" },
  { title: "Cribbage Probability: What Are the Odds of a 29-Point Hand?", slug: "cribbage-probability-29-point-hand-odds" },
  { title: "Cribbage Etiquette: How to Play Properly and Respectfully", slug: "cribbage-etiquette-how-to-play-properly" },
  { title: "How to Read a Cribbage Board and Track Score", slug: "how-to-read-cribbage-board-track-score" },
  { title: "Cribbage Starter Card Strategy: How to Use the Cut", slug: "cribbage-starter-card-strategy" },
  { title: "Muggins Rule in Cribbage: What It Is and When It Applies", slug: "muggins-rule-in-cribbage-explained" },
  { title: "Cribbage Variants: Lowball, Shotgun, and Cricket Explained", slug: "cribbage-variants-lowball-shotgun-cricket" },
  { title: "Cribbage vs Other Card Games: Why It Stands Apart", slug: "cribbage-vs-other-card-games" },
  { title: "How to Teach Cribbage to Kids and Beginners", slug: "how-to-teach-cribbage-to-kids" },
  { title: "Cribbage Tournament Rules and Formats", slug: "cribbage-tournament-rules-and-formats" },
  { title: "Online Cribbage vs Physical Cribbage: Key Differences", slug: "online-cribbage-vs-physical-cribbage" },
  { title: "The Perfect Cribbage Hand: Is 29 Points Achievable?", slug: "perfect-cribbage-hand-29-points" },
  { title: "Cribbage Defensive Strategy: Protecting Your Lead", slug: "cribbage-defensive-strategy-protecting-lead" },
  { title: "How Points Are Counted in the Cribbage Crib", slug: "how-points-counted-in-cribbage-crib" },
  { title: "Cribbage for One: Solitaire Cribbage Rules", slug: "cribbage-for-one-solitaire-rules" },
  { title: "Famous Cribbage Players and World Records", slug: "famous-cribbage-players-world-records" },
  { title: "Cribbage Hand Analysis: Top 5 Strongest Hands", slug: "cribbage-hand-analysis-strongest-hands" },
  { title: "Speed Cribbage: Rules for Faster-Paced Play", slug: "speed-cribbage-rules-faster-play" },
  { title: "Cribbage Math: How Arithmetic Improves Your Game", slug: "cribbage-math-arithmetic-improves-game" },
  { title: "Cribbage Opening Discards: 10 Expert Moves Explained", slug: "cribbage-opening-discards-expert-moves" },
  { title: "How to Count a Cribbage Hand Without Making Errors", slug: "how-to-count-cribbage-hand-correctly" },
  { title: "Cribbage Card Combinations: Pairs, Runs & Fifteens Explained", slug: "cribbage-card-combinations-pairs-runs-fifteens" },
  { title: "Cribbage Records: Highest Scores and Longest Games", slug: "cribbage-records-highest-scores" },
  { title: "Why Cribbage Is Good for Your Brain", slug: "why-cribbage-is-good-for-your-brain" },
  { title: "Digital Cribbage Apps: The Best Options in 2026", slug: "digital-cribbage-apps-best-2026" },
  { title: "Cribbage House Rules: Variations Across the UK and US", slug: "cribbage-house-rules-uk-us-variations" },
  { title: "How to Improve at Cribbage: Practice Drills for Players", slug: "how-to-improve-at-cribbage-practice-drills" },
  { title: "Cribbage for Seniors: Benefits and How to Get Started", slug: "cribbage-for-seniors-benefits-getting-started" },
  { title: "Cribbage Team Play: Four-Player Partnership Rules", slug: "cribbage-team-play-partnership-rules" },
];

const SOLITAIRE_TOPICS = [
  { title: "How to Play Klondike Solitaire: Rules and Strategy", slug: "how-to-play-klondike-solitaire" },
  { title: "Spider Solitaire Rules and Winning Strategy Guide", slug: "spider-solitaire-rules-strategy" },
  { title: "FreeCell Solitaire: Tips and Strategy for Beginners", slug: "freecell-solitaire-tips-beginners" },
  { title: "Pyramid Solitaire Explained: Rules and How to Win", slug: "pyramid-solitaire-rules-how-to-win" },
  { title: "Best Solitaire Variants Ranked: Klondike, Spider, FreeCell & More", slug: "best-solitaire-variants-ranked" },
  { title: "Solitaire Odds: Can Every Game Be Won?", slug: "solitaire-odds-can-every-game-be-won" },
  { title: "Speed Solitaire Challenges: How to Play Faster", slug: "speed-solitaire-challenges" },
  { title: "The History of Solitaire: From Card Tables to Screens", slug: "history-of-solitaire" },
  { title: "How to Improve Your Solitaire Win Rate: Expert Tips", slug: "improve-solitaire-win-rate-tips" },
  { title: "Solitaire on Mobile vs Desktop: Best Experience Guide", slug: "solitaire-mobile-vs-desktop" },
  { title: "Aces Up Solitaire: Rules and Strategy", slug: "aces-up-solitaire-rules-strategy" },
  { title: "Golf Solitaire: How to Play and Win", slug: "golf-solitaire-how-to-play" },
  { title: "Canfield Solitaire: History, Rules, and Tips", slug: "canfield-solitaire-history-rules-tips" },
  { title: "Forty Thieves Solitaire Explained", slug: "forty-thieves-solitaire-explained" },
  { title: "Tri Peaks Solitaire: Beginner Strategy Guide", slug: "tri-peaks-solitaire-strategy" },
  { title: "Solitaire Scoring Systems: How Points Work", slug: "solitaire-scoring-systems" },
  { title: "How to Win Klondike Solitaire Every Time (Almost)", slug: "how-to-win-klondike-solitaire" },
  { title: "Spider Solitaire One-Suit vs Four-Suit: Which Is Harder?", slug: "spider-solitaire-one-suit-vs-four-suit" },
  { title: "FreeCell Solitaire: Is Every Deal Winnable?", slug: "freecell-solitaire-every-deal-winnable" },
  { title: "Solitaire Algorithms: How Computer Versions Are Built", slug: "solitaire-algorithms-computer-versions" },
  { title: "How Microsoft Solitaire Changed Card Gaming Forever", slug: "microsoft-solitaire-changed-card-gaming" },
  { title: "Patience Card Games: The British Family of Solitaire", slug: "patience-card-games-british-solitaire" },
  { title: "Baker's Dozen Solitaire: Rules and Tips", slug: "bakers-dozen-solitaire-rules-tips" },
  { title: "Solitaire for Mental Health: Why It Helps", slug: "solitaire-for-mental-health" },
  { title: "How to Play Two-Deck Solitaire Games", slug: "two-deck-solitaire-games" },
  { title: "Solitaire at 100 WPM: Speed Records and Techniques", slug: "solitaire-speed-records-techniques" },
  { title: "The Easiest Solitaire Games for Absolute Beginners", slug: "easiest-solitaire-games-beginners" },
  { title: "Solitaire Apps Compared: Top 5 Free Options", slug: "solitaire-apps-compared-top-5" },
  { title: "Solitaire Strategy: When to Deal Again vs Replay", slug: "solitaire-strategy-deal-again-replay" },
  { title: "Classic Card Game Patience Variants from Around the World", slug: "patience-variants-around-the-world" },
  { title: "Daily Solitaire Challenges: Why They Boost Engagement", slug: "daily-solitaire-challenges-engagement" },
  { title: "Solitaire World Records: Fastest Completions", slug: "solitaire-world-records-fastest" },
  { title: "How Solitaire Teaches Probability and Planning", slug: "solitaire-teaches-probability-planning" },
  { title: "What to Do When You're Stuck in Solitaire", slug: "what-to-do-stuck-in-solitaire" },
  { title: "Solitaire vs Patience: What's the Difference?", slug: "solitaire-vs-patience-difference" },
  { title: "La Belle Lucie Solitaire: How to Play", slug: "la-belle-lucie-solitaire" },
  { title: "Best Free Online Solitaire Sites in 2026", slug: "best-free-online-solitaire-sites-2026" },
  { title: "Solitaire for Kids: Simple Variants to Start With", slug: "solitaire-for-kids-simple-variants" },
  { title: "Solitaire Tournament Play: Rules and Formats", slug: "solitaire-tournament-play-rules" },
  { title: "How to Play Double Klondike Solitaire", slug: "how-to-play-double-klondike-solitaire" },
];

const OTHER_TOPICS = [
  { title: "How to Play Rummy: Rules, Scoring, and Strategy", slug: "how-to-play-rummy" },
  { title: "Gin Rummy Rules Explained for Beginners", slug: "gin-rummy-rules-beginners" },
  { title: "Canasta Card Game: How to Play and Win", slug: "canasta-card-game-how-to-play" },
  { title: "Poker Basics: What Every New Player Must Know", slug: "poker-basics-new-players" },
  { title: "Bridge Card Game Strategy for Intermediate Players", slug: "bridge-card-game-strategy" },
  { title: "Hearts Card Game Rules: A Beginner's Guide", slug: "hearts-card-game-rules" },
  { title: "Spades Card Game: Rules and Bidding Strategy", slug: "spades-card-game-bidding-strategy" },
  { title: "War Card Game: Simple Rules for All Ages", slug: "war-card-game-rules" },
  { title: "Snap Card Game: Rules, Tips, and Fun Variations", slug: "snap-card-game-rules-variations" },
  { title: "Go Fish Card Game Guide for Kids and Families", slug: "go-fish-card-game-guide" },
  { title: "Old Maid Card Game: Rules and Variations", slug: "old-maid-card-game-rules" },
  { title: "Blackjack Strategy Guide for New Players", slug: "blackjack-strategy-guide-new-players" },
  { title: "Crazy Eights Rules and Popular Variants", slug: "crazy-eights-rules-variants" },
  { title: "Uno vs Crazy Eights: What Are the Differences?", slug: "uno-vs-crazy-eights-differences" },
  { title: "The 52-Card Deck: Suits, Face Cards, and History", slug: "52-card-deck-suits-face-cards-history" },
  { title: "Card Game Etiquette: How to Be a Good Player", slug: "card-game-etiquette-good-player" },
  { title: "How to Play Texas Hold'em Poker for Beginners", slug: "texas-holdem-poker-beginners" },
  { title: "Five-Card Draw Poker: Rules and Basic Strategy", slug: "five-card-draw-poker-rules" },
  { title: "Pinochle Card Game: Rules and Strategy", slug: "pinochle-card-game-rules-strategy" },
  { title: "Euchre Card Game Explained: North American Classic", slug: "euchre-card-game-explained" },
  { title: "Whist Card Game: The Predecessor of Bridge", slug: "whist-card-game-history" },
  { title: "Baccarat for Beginners: Rules and Odds", slug: "baccarat-for-beginners-rules-odds" },
  { title: "Klaberjass Card Game: Eastern European Classic", slug: "klaberjass-card-game-explained" },
  { title: "Skat Card Game: Germany's Most Popular Card Game", slug: "skat-card-game-germany" },
  { title: "How to Play 500 Rum: Classic American Card Game", slug: "how-to-play-500-rum" },
  { title: "Tunk Card Game: Simple Rules for Beginners", slug: "tunk-card-game-rules" },
  { title: "Cribbage vs Rummy: Which Game Should You Learn First?", slug: "cribbage-vs-rummy-which-to-learn" },
  { title: "Card Games Played Without a Standard Deck", slug: "card-games-without-standard-deck" },
  { title: "Memory Card Game: Rules and Brain Benefits", slug: "memory-card-game-rules-benefits" },
  { title: "Pairs Card Game: The Speed Memory Challenge", slug: "pairs-card-game-speed-memory" },
  { title: "Bluff Card Game (Cheat): How to Play and Win", slug: "bluff-card-game-cheat-how-to-play" },
  { title: "Speed Card Game: Fast Paced Rules and Tips", slug: "speed-card-game-rules-tips" },
];

const SEO_TOPICS = [
  { title: "Best Free Online Card Games in 2026", slug: "best-free-online-card-games-2026" },
  { title: "How to Teach Card Games to Kids: Complete Parent Guide", slug: "how-to-teach-card-games-kids" },
  { title: "Card Games for Two Players: Best Options", slug: "card-games-for-two-players" },
  { title: "Card Games You Can Play Alone: Top Picks", slug: "card-games-you-can-play-alone" },
  { title: "Card Game Apps vs Browser Games: Which Is Better?", slug: "card-game-apps-vs-browser-games" },
  { title: "How Card Game Ratings and Rankings Work Online", slug: "card-game-ratings-rankings-explained" },
  { title: "Card Game Tournaments: How They Work", slug: "card-game-tournaments-how-they-work" },
  { title: "Famous Card Game World Records", slug: "famous-card-game-world-records" },
  { title: "Card Games for Road Trips: Best Family Picks", slug: "card-games-for-road-trips" },
  { title: "Card Games for Seniors: Mental Fitness Benefits", slug: "card-games-for-seniors-mental-fitness" },
  { title: "How to Get Better at Card Games: Universal Tips", slug: "how-to-get-better-at-card-games" },
  { title: "Card Games in Pop Culture: Movies, TV, and Legends", slug: "card-games-pop-culture-movies-tv" },
  { title: "Free vs Premium Card Games: Is Paying Worth It?", slug: "free-vs-premium-card-games" },
  { title: "Card Game Math: How Numbers Improve Your Play", slug: "card-game-math-numbers-improve-play" },
  { title: "The Psychology of Card Games: Why We Love Them", slug: "psychology-of-card-games" },
  { title: "How to Host a Card Game Night at Home", slug: "how-to-host-card-game-night" },
  { title: "Card Game Gift Guide: Best Gifts for Card Game Lovers", slug: "card-game-gift-guide" },
  { title: "Online Card Games vs Board Games: Pros and Cons", slug: "online-card-games-vs-board-games" },
  { title: "Card Games for Large Groups: Best Options for Parties", slug: "card-games-for-large-groups" },
  { title: "The History of Playing Cards: From Ancient Asia to Today", slug: "history-of-playing-cards" },
  { title: "How to Read Your Opponent in Card Games", slug: "how-to-read-opponent-card-games" },
  { title: "Card Game Strategies That Work Across Multiple Games", slug: "card-game-strategies-universal" },
  { title: "Card Games That Help Kids Learn Math", slug: "card-games-help-kids-learn-math" },
  { title: "Why Playing Card Games Online Is Growing in Popularity", slug: "why-online-card-games-popular" },
  { title: "Card Game Accessibility: Playing with Disabilities", slug: "card-game-accessibility" },
  { title: "Progressive Web Apps for Card Games: What to Know", slug: "pwa-card-games-what-to-know" },
  { title: "Multiplayer Card Games: Best Online Platforms in 2026", slug: "multiplayer-card-games-platforms-2026" },
  { title: "Card Game Streaming: Watch and Learn from the Pros", slug: "card-game-streaming-watch-pros" },
  { title: "Card Game AI: How Computers Learn to Play Cards", slug: "card-game-ai-how-computers-play" },
  { title: "The Ultimate Card Game Glossary: 100+ Terms Defined", slug: "ultimate-card-game-glossary" },
  { title: "Card Games to Play During Holidays", slug: "card-games-to-play-during-holidays" },
  { title: "Card Game Collections: Building a Great Card Library", slug: "card-game-collections-building-library" },
];

// ── Category configurations ──────────────────────────────────────────────────

const CATEGORY_CONFIG = [
  { name: "Cribbage",          pool: CRIBBAGE_TOPICS,  weight: 30 },
  { name: "Solitaire",         pool: SOLITAIRE_TOPICS, weight: 30 },
  { name: "Other Card Games",  pool: OTHER_TOPICS,     weight: 20 },
  { name: "SEO/Evergreen",     pool: SEO_TOPICS,       weight: 20 },
];

// Map internal category names to display categories
const CATEGORY_DISPLAY_MAP = {
  "Cribbage": "Cribbage",
  "Solitaire": "Solitaire",
  "Other Card Games": "Rules & How-To",
  "SEO/Evergreen": "Tips & Tricks",
};

// ── Date helpers ─────────────────────────────────────────────────────────────

function formatDate(date, hour) {
  const d = new Date(date);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}

function daysBetween(start, end) {
  const ONE_DAY = 86400000;
  return Math.round((end - start) / ONE_DAY);
}

// ── Main ─────────────────────────────────────────────────────────────────────

function generateSchedule() {
  const START = new Date("2026-03-08T00:00:00Z");
  const END   = new Date("2026-12-31T00:00:00Z");
  const total = (daysBetween(START, END) + 1) * 2; // 2 per day

  console.log(`Generating ${total} article slots…`);

  // Build an ordered topic sequence respecting weights
  // Interleave categories proportionally by de-queuing round-robin by weight
  const queues = CATEGORY_CONFIG.map((c) => ({
    ...c,
    items: [...c.pool].sort(() => 0.5 - Math.random()), // shuffle
    index: 0,
  }));

  // Weighted round-robin: produce category array of length `total`
  const categorySequence = [];
  const perRound = CATEGORY_CONFIG.reduce((s, c) => s + c.weight, 0); // 100
  while (categorySequence.length < total) {
    for (const q of queues) {
      const count = Math.round((q.weight / perRound) * 2); // 2 slots per day
      for (let i = 0; i < count && categorySequence.length < total; i++) {
        categorySequence.push(q);
      }
    }
  }

  // Shuffle slightly to avoid rigid category blocks while keeping distribution
  categorySequence.sort(() => (Math.random() > 0.7 ? 1 : -1));

  const usedSlugs = new Set();
  const entries = [];
  let dayOffset = 0;

  for (let i = 0; i < total; i++) {
    const slot = i % 2 === 0 ? 0 : 1; // 0=AM, 1=PM
    if (slot === 0) dayOffset = Math.floor(i / 2);

    const date = new Date(START);
    date.setUTCDate(date.getUTCDate() + dayOffset);
    const hour = slot === 0 ? 8 : 18;
    const publishedAt = formatDate(date, hour);

    const catQueue = categorySequence[i];
    // Round-robin through the pool, extending if needed
    const poolItem = catQueue.items[catQueue.index % catQueue.items.length];
    catQueue.index++;

    // Ensure unique slug by appending a counter if needed
    let slug = poolItem.slug;
    let suffix = 2;
    while (usedSlugs.has(slug)) {
      slug = `${poolItem.slug}-${suffix++}`;
    }
    usedSlugs.add(slug);

    let title = poolItem.title;
    if (suffix > 2) {
      title = `${poolItem.title} (Part ${suffix - 1})`;
    }

    entries.push({
      id: i + 1,
      slot: slot === 0 ? "08:00 UTC" : "18:00 UTC",
      publishedAt,
      category: CATEGORY_DISPLAY_MAP[catQueue.name] || catQueue.name,
      internalCategory: catQueue.name,
      title,
      slug,
      status: "scheduled", // scheduled | draft | published | failed
      retries: 0,
      generatedAt: null,
      notes: "",
    });
  }

  // Ensure exactly 2 articles per day
  const output = {
    generated: new Date().toISOString(),
    totalArticles: entries.length,
    schedule: {
      start: START.toISOString(),
      end: new Date("2026-12-31T23:59:59Z").toISOString(),
      articlesPerDay: 2,
      publishTimes: ["08:00 UTC", "18:00 UTC"],
    },
    categoryDistribution: Object.fromEntries(
      CATEGORY_CONFIG.map((c) => [c.name, `${c.weight}%`])
    ),
    entries,
  };

  const outDir  = path.join(__dirname, "..", "data");
  const outPath = path.join(outDir, "content-calendar.json");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log(`✅ Content calendar written to ${outPath}`);
  console.log(`   Total entries: ${entries.length}`);
  console.log(`   Date range: ${entries[0].publishedAt} → ${entries[entries.length - 1].publishedAt}`);
}

generateSchedule();
