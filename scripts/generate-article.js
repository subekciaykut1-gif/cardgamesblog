#!/usr/bin/env node
/**
 * generate-article.js
 *
 * Generates a single MDX article file from a content calendar entry.
 * Uses a Template-based factory with combinatorial shuffling to ensure
 * high uniqueness without an AI API key.
 */

const fs   = require("fs");
const matter = require('gray-matter');
const contentLibrary = require('./content-library');
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

// ── Load calendar ─────────────────────────────────────────────────────────────

let calendar;
try {
  calendar = JSON.parse(fs.readFileSync(CALENDAR_PATH, "utf-8"));
} catch {
  console.error("❌ data/content-calendar.json not found.");
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
  process.exit(1);
}

const categoryKeywords = {
  "Cribbage": "cribbage,cards",
  "Solitaire": "solitaire,cards",
  "Strategy": "strategy,cards",
  "Rules & How-To": "playing,cards",
  "History": "vintage,cards",
  "Tips & Tricks": "card,game",
  "Card Game News": "cards,game"
};

function getImageUrl(category, id) {
  const kw = categoryKeywords[category] || "cards,game";
  return `https://loremflickr.com/800/450/${kw}?lock=${id}`;
}

function calculateSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;
  const words1 = new Set(text1.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(text2.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 3));
  if (words1.size === 0 || words2.size === 0) return 0;
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  return intersection.size / union.size;
}

async function generateWithAI(entry) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const prompt = `Write a 1000+ word unique article about ${entry.title}. Category: ${entry.category}. Professional tone.`;
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "gpt-4o", messages: [{ role: "user", content: prompt }], temperature: 0.7 })
    });
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (e) {
    return null;
  }
}

function parseSpintax(text) {
  return text.replace(/\{([^{}]+)\}/g, (match, choices) => {
    const list = choices.split('|');
    return list[Math.floor(Math.random() * list.length)];
  });
}

function generateFromTemplates(entry) {
  const category = contentLibrary[entry.category] ? entry.category : "General";
  const lib = contentLibrary[category];
  const title = entry.title.replace(/\s*\(Part\s*\d+\)/gi, '');

  // Deterministic but unique selection based on slug
  const seed = entry.slug.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const getIndex = (arr, offset = 0) => (seed + offset) % arr.length;

  let intro = lib.intros[getIndex(lib.intros)].replace(/\${title}/g, title);
  intro = parseSpintax(intro);
  
  // Shuffle and sample sections (e.g., pick 4 from the pool)
  const shuffledSections = [...lib.sections].sort(() => Math.random() - 0.5);
  const sampledSections = shuffledSections.slice(0, 4);
  
  const bodySections = sampledSections.map(s => {
    const content = parseSpintax(s.content.replace(/\${title}/g, title));
    return `## ${s.h2}\n\n${content}`;
  }).join('\n\n');

  // Dynamic Tips
  const tip1 = parseSpintax(lib.tips[getIndex(lib.tips, 1)]);
  const tip2 = parseSpintax(lib.tips[getIndex(lib.tips, 2)]);
  const tip3 = parseSpintax(lib.tips[getIndex(lib.tips, 3)]);

  const conclusion = `## Conclusion\n\n${title} is a journey that every enthusiast finds rewarding. Each decision deepens your understanding of the game, and every session teaches you something new.\n\nStart implementing these tactics in your next game and track your progress over time. Remember — [CardGamesHub.io](/) is here whenever you want to put these strategies to the test.`;

  return `${intro}\n\n${bodySections}\n\n## Expert Tips for Success\n\n* ${tip1}\n* ${tip2}\n* ${tip3}\n\n${conclusion}`;
}

async function buildMdx(entry) {
  const imageUrl = getImageUrl(entry.category, entry.id);
  const cleanTitle = entry.title.replace(/\s*\(Part\s*\d+\)/gi, '');
  const altText = `${cleanTitle} - ${entry.category} illustration`;
  const metaTitle = cleanTitle.length > 60 ? cleanTitle.slice(0, 57) + "..." : cleanTitle;
  
  let bodyContent = "";
  if (process.env.OPENAI_API_KEY) {
    bodyContent = await generateWithAI(entry);
  }
  
  if (!bodyContent) {
    bodyContent = generateFromTemplates(entry);
  }

  const rawParagraphs = bodyContent.split('\n\n').map(p => p.trim()).filter(p => p && !p.startsWith('#') && !p.startsWith('>'));
  let rawExcerpt = rawParagraphs[0] || entry.title;
  rawExcerpt = rawExcerpt.replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  const excerpt = rawExcerpt.length > 120 ? rawExcerpt.slice(0, 117) + '...' : rawExcerpt;

  const metaDesc = `${cleanTitle} — Expert strategy guide. ${excerpt.slice(0, 80)}`.slice(0, 160);

  const tags = [entry.category.toLowerCase(), "card games", "cardgameshub"];

  const frontmatter = `---
title: "${cleanTitle.replace(/"/g, '\\"')}"
slug: "${entry.slug}"
category: "${entry.category}"
publishedAt: "${entry.publishedAt}"
author: "Tugrul Subekci"
excerpt: "${excerpt.replace(/"/g, '\\"')}"
featuredImage: "${imageUrl}"
altText: "${altText.replace(/"/g, '\\"')}"
metaTitle: "${metaTitle.replace(/"/g, '\\"')}"
metaDescription: "${metaDesc.replace(/"/g, '\\"')}"
tags: ${JSON.stringify(tags)}
---`;

  return `${frontmatter}\n\n${bodyContent}`;
}

async function run() {
  const entry = findEntry();
  console.log(`📝 Generating article: "${entry.title}" [${entry.slug}]`);

  const mdx = await buildMdx(entry);
  
  if (DRY_RUN) {
    console.log("\n── DRY RUN — output preview ──────────────────────────────\n");
    console.log(mdx.slice(0, 1000) + "\n…[truncated]");
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
