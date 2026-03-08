const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
require('dotenv').config({ path: path.join(__dirname, "..", ".env.local") });

const ARTICLES_DIR = path.join(__dirname, "..", "content", "articles");
const USED_IMAGES_PATH = path.join(__dirname, "..", "data", "used-unsplash-ids.json");

const CALENDAR_PATH = path.join(__dirname, "..", "data", "content-calendar.json");
const categoryKeywords = {
  "Cribbage": "cribbage,cards",
  "Solitaire": "solitaire,cards",
  "Strategy": "strategy,cards",
  "Rules & How-To": "playing,cards",
  "History": "vintage,cards",
  "Tips & Tricks": "card,game",
  "Card Game News": "cards,game"
};

let calendar = null;
try {
  calendar = JSON.parse(fs.readFileSync(CALENDAR_PATH, "utf-8"));
} catch (e) {}

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

// Reuse prompt and AI logic if needed (simplified here)
async function regenerateBody(entry) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const prompt = `Write a high-quality, ENTIRELY UNIQUE 1000-word SEO article for CardGamesHub.io. Title: ${entry.title.replace(/\s*\(Part\s*\d+\)/gi, '')}. Each sentence must be original.`;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "gpt-4o", messages: [{ role: "user", content: prompt }], temperature: 0.7 })
    });
    const d = await res.json(); return d.choices[0].message.content;
  } catch (e) { return null; }
}

async function fixArticle(file) {
  const filePath = path.join(ARTICLES_DIR, file);
  const rawContent = fs.readFileSync(filePath, 'utf-8');
  
  const parsed = matter(rawContent);
  const data = parsed.data;
  const bodyContent = parsed.content;
  
  // Update excerpt
  const rawParagraphs = bodyContent.split('\n\n').map(p => p.trim()).filter(p => p && !p.startsWith('#') && !p.startsWith('>'));
  let rawExcerpt = rawParagraphs[0] || data.title;
  rawExcerpt = rawExcerpt.replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  const excerpt = rawExcerpt.length > 120 ? rawExcerpt.slice(0, 117) + '...' : rawExcerpt;
  
  data.excerpt = excerpt;
  
  // Title Cleaning
  const oldTitle = data.title;
  data.title = data.title.replace(/\s*\(Part\s*\d+\)/gi, '');
  if (oldTitle !== data.title) {
    console.log(`[${file}] Cleaned title: ${oldTitle} -> ${data.title}`);
  }

  // Image Backfill with LoremFlickr
  const calendarEntry = calendar ? calendar.entries.find(e => e.slug === data.slug) : null;
  const articleId = calendarEntry ? calendarEntry.id : (Math.abs(data.slug.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)) % 1000);
  
  console.log(`[${file}] Applying LoremFlickr image (lock=${articleId})...`);
  data.featuredImage = getImageUrl(data.category, articleId);
  data.altText = `${data.title} - ${data.category} illustration`;
  
  // Meta Cleaning
  if (data.metaTitle) data.metaTitle = data.metaTitle.replace(/\s*\(Part\s*\d+\)/gi, '');
  if (data.metaDescription) data.metaDescription = data.metaDescription.replace(/\s*\(Part\s*\d+\)/gi, '');

  // Body Content Cleaning (remove title suffixes)
  let newBody = bodyContent.replace(/\s*\(Part\s*\d+\)/gi, '');
  
  // Update author globally
  data.author = "Tugrul Subekci";

  // Re-serialize
  // We use our own string template to avoid strange gray-matter output formatting string quotes issues
  const tagsStr = JSON.stringify(data.tags || [data.category.toLowerCase(), "card games", "cardgameshub"]);
  const frontmatter = `---
title: "${data.title.replace(/"/g, '\\"')}"
slug: "${data.slug}"
category: "${data.category}"
publishedAt: "${data.publishedAt}"
author: "${data.author.replace(/"/g, '\\"')}"
excerpt: "${data.excerpt.replace(/"/g, '\\"')}"
featuredImage: "${data.featuredImage}"
altText: "${data.altText.replace(/"/g, '\\"')}"
metaTitle: "${data.metaTitle.replace(/"/g, '\\"')}"
metaDescription: "${data.metaDescription.replace(/"/g, '\\"')}"
tags: ${tagsStr}
---`;

  const newContent = `${frontmatter}\n${newBody}`;
  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`✅ Fixed: ${file}`);
}

async function run() {
  if (!fs.existsSync(ARTICLES_DIR)) return console.log("No articles dir found.");
  const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.mdx'));
  const contents = {}; // Cache for similarity checks

  console.log(`Starting audit of ${files.length} articles...`);

  for (const file of files) {
    await fixArticle(file);
    const filePath = path.join(ARTICLES_DIR, file);
    contents[file] = fs.readFileSync(filePath, 'utf-8');
  }

  // Optimized Audit: Compare each article against only the growing set of "unique" articles
  console.log("🔍 Running optimized similarity audit...");
  const uniqueFiles = [];
  const duplicates = [];

  for (const file of files) {
    const content = contents[file];
    let isDup = false;
    for (const uniqueFile of uniqueFiles) {
      if (calculateSimilarity(content, contents[uniqueFile]) > 0.4) {
        isDup = true;
        duplicates.push(file);
        console.warn(`🚩 Duplicate: ${file} matches ${uniqueFile}.`);
        break;
      }
    }
    if (!isDup) {
      uniqueFiles.push(file);
    }
  }

  if (duplicates.length > 0 && process.env.OPENAI_API_KEY) {
    console.log(`♻️ Regenerating ${duplicates.length} duplicates...`);
    for (const file of duplicates) {
      const filePath = path.join(ARTICLES_DIR, file);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = matter(raw);
      const calendarEntry = calendar ? calendar.entries.find(e => e.slug === parsed.data.slug) : { title: parsed.data.title, category: parsed.data.category };
      
      const newBody = await regenerateBody(calendarEntry);
      if (newBody) {
        const tagsStr = JSON.stringify(parsed.data.tags || [parsed.data.category.toLowerCase(), "card games", "cardgameshub"]);
        const frontmatter = `---
title: "${parsed.data.title.replace(/"/g, '\\"')}"
slug: "${parsed.data.slug}"
category: "${parsed.data.category}"
publishedAt: "${parsed.data.publishedAt}"
author: "Tugrul Subekci"
excerpt: "${parsed.data.excerpt.replace(/"/g, '\\"')}"
featuredImage: "${parsed.data.featuredImage}"
altText: "${parsed.data.altText.replace(/"/g, '\\"')}"
metaTitle: "${parsed.data.metaTitle.replace(/"/g, '\\"')}"
metaDescription: "${parsed.data.metaDescription.replace(/"/g, '\\"')}"
tags: ${tagsStr}
---`;
        fs.writeFileSync(filePath, `${frontmatter}\n${newBody}`, 'utf-8');
        console.log(`✅ Regenerated: ${file}`);
      }
    }
  }

  console.log("All articles audited and fixed.");
}

run();
