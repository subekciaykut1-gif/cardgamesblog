#!/Char/Entry node
/**
 * generate-schedule.js
 *
 * Generates data/content-calendar.json with 598 entries (2 per day,
 * March 8 2026 → December 31 2026) with balanced distribution across ALL categories.
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

const STRATEGY_TOPICS = [
  { title: "Universal Card Game Strategies for Competitive Play", slug: "universal-card-game-strategies" },
  { title: "Probability and Odds: How to Win More Games", slug: "probability-and-odds-winning-strategies" },
  { title: "Risk Management in Multi-Player Card Games", slug: "risk-management-card-games" },
  { title: "The Art of the Bluff: When to Deceive Your Opponents", slug: "art-of-the-bluff-strategy" },
  { title: "Strategic Discarding: Making the Tough Choices", slug: "strategic-discarding-guide" },
  { title: "End-Game Tactics: How to Close Out a Close Match", slug: "end-game-tactics-winning" },
];

const OTHER_TOPICS = [
  { title: "How to Play Rummy: Rules, Scoring, and Strategy", slug: "how-to-play-rummy" },
  { title: "Gin Rummy Rules Explained for Beginners", slug: "gin-rummy-rules-beginners" },
  { title: "Canasta Card Game: How to Play and Win", slug: "canasta-card-game-how-to-play" },
  { title: "Poker Basics: What Every New Player Must Know", slug: "poker-basics-new-players" },
  { title: "Bridge Card Game Strategy for Intermediate Players", slug: "bridge-card-game-strategy" },
  { title: "Hearts Card Game Rules: A Beginner's Guide", slug: "hearts-card-game-rules" },
  { title: "Spades Card Game: Rules and Bidding Strategy", slug: "spades-card-game-bidding-strategy" },
];

const HISTORY_TOPICS = [
  { title: "The Evolution of Playing Cards: From Woodblocks to Digital", slug: "evolution-of-playing-cards" },
  { title: "Medieval Card Games: What People Played Centuries Ago", slug: "medieval-card-games-history" },
  { title: "How Card Games Traveled the Silk Road", slug: "card-games-silk-road-history" },
  { title: "The Story Behind the Joker: History of the Wild Card", slug: "history-of-the-joker-card" },
  { title: "Victorian Era Card Games and Social Etiquette", slug: "victorian-era-card-games" },
];

const TIP_TOPICS = [
  { title: "Daily Habits that Make You a Better Card Player", slug: "daily-habits-better-card-player" },
  { title: "How to Handle a Losing Streak with Grace", slug: "handling-losing-streaks-tips" },
  { title: "The Best Card Game Apps for Brain Training", slug: "best-card-game-apps-brain-training" },
  { title: "How to Organize Your Own Local Card Tournament", slug: "how-to-organize-card-tournament" },
  { title: "Choosing the Right Card Deck for Your Collection", slug: "choosing-right-card-deck" },
];

const NEWS_TOPICS = [
  { title: "Card Game Trends to Watch in 2026", slug: "card-game-trends-2026" },
  { title: "New Digital Interface for Classic Solitaire Released", slug: "new-digital-solitaire-interface" },
  { title: "The Return of Local Cribbage Clubs: A 2026 Revival", slug: "cribbage-clubs-revival-2026" },
  { title: "Innovative Card Game Mechanics Sweeping the Web", slug: "innovative-card-game-mechanics" },
  { title: "Major Card Game Championship Results for 2026", slug: "card-game-championship-results-2026" },
];

// ── Category configurations ──────────────────────────────────────────────────

const CATEGORY_CONFIG = [
  { name: "Cribbage",          pool: CRIBBAGE_TOPICS,  weight: 25 },
  { name: "Solitaire",         pool: SOLITAIRE_TOPICS, weight: 25 },
  { name: "Strategy",          pool: STRATEGY_TOPICS,  weight: 10 },
  { name: "Rules & How-To",    pool: OTHER_TOPICS,     weight: 10 },
  { name: "History",           pool: HISTORY_TOPICS,   weight: 10 },
  { name: "Tips & Tricks",     pool: TIP_TOPICS,       weight: 10 },
  { name: "Card Game News",    pool: NEWS_TOPICS,      weight: 10 },
];

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
  const total = 598; // Keeping the same total as previously generated

  console.log(`Generating ${total} article slots…`);

  const queues = CATEGORY_CONFIG.map((c) => ({
    ...c,
    items: [...c.pool].sort(() => 0.5 - Math.random()),
    index: 0,
  }));

  // Build a sequence that FAIRLY distributes weights
  const categorySequence = [];
  while (categorySequence.length < total) {
    for (const q of queues) {
      // Calculate how many should be in this pool so far vs total
      const targetCount = Math.floor((q.weight / 100) * total);
      const currentCount = categorySequence.filter(c => c.name === q.name).length;
      
      if (currentCount < targetCount) {
        categorySequence.push(q);
      }
    }
    // Safety break if we get stuck (shouldn't happen with 100 sum)
    if (categorySequence.length === total) break;
    // Fill remaining with random pool if needed
    if (categorySequence.length > 0 && categorySequence.length < total && !queues.some(q => categorySequence.filter(c => c.name === q.name).length < Math.floor((q.weight / 100) * total))) {
        categorySequence.push(queues[Math.floor(Math.random() * queues.length)]);
    }
  }

  // Shuffle sequence
  categorySequence.sort(() => Math.random() - 0.5);

  const usedSlugs = new Set();
  const entries = [];
  let dayOffset = 0;

  for (let i = 0; i < total; i++) {
    const slot = i % 2 === 0 ? 0 : 1; 
    if (slot === 0) dayOffset = Math.floor(i / 2);

    const date = new Date(START);
    date.setUTCDate(date.getUTCDate() + dayOffset);
    const hour = slot === 0 ? 8 : 18;
    const publishedAt = formatDate(date, hour);

    const catQueue = categorySequence[i];
    const poolItem = catQueue.items[catQueue.index % catQueue.items.length];
    catQueue.index++;

    let slug = poolItem.slug;
    let suffix = 2;
    while (usedSlugs.has(slug)) {
      slug = `${poolItem.slug}-${suffix++}`;
    }
    usedSlugs.add(slug);

    let title = poolItem.title;
    // Note: Suffix removal is handled by harmonize-slugs.js later, 
    // but we need unique titles here to prevent collisions.
    if (suffix > 2) {
      title = `${poolItem.title} (Part ${suffix - 1})`;
    }

    entries.push({
      id: i + 1,
      slot: slot === 0 ? "08:00 UTC" : "18:00 UTC",
      publishedAt,
      category: catQueue.name,
      title,
      slug,
      status: "scheduled",
      retries: 0,
      generatedAt: null,
      notes: "",
    });
  }

  const output = {
    generated: new Date().toISOString(),
    totalArticles: entries.length,
    schedule: {
      start: START.toISOString(),
      end: entries[entries.length-1].publishedAt,
      articlesPerDay: 2,
      publishTimes: ["08:00 UTC", "18:00 UTC"],
    },
    categoryDistribution: Object.fromEntries(
      CATEGORY_CONFIG.map((c) => [c.name, `${c.weight}%`])
    ),
    entries,
  };

  const outPath = path.join(__dirname, "..", "data", "content-calendar.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log(`✅ Content calendar updated with balanced categories.`);
}

generateSchedule();
