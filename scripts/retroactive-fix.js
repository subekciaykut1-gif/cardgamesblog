const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
require('dotenv').config({ path: path.join(__dirname, "..", ".env.local") });

const ARTICLES_DIR = path.join(__dirname, "..", "content", "articles");
const USED_IMAGES_PATH = path.join(__dirname, "..", "data", "used-unsplash-ids.json");

async function getImage(title, category) {
  const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
  const fallback = {
    url: "fallback://cardgameshub",
    alt: `${title} - ${category} card game illustration`
  };

  if (!UNSPLASH_ACCESS_KEY) {
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
    
    const photo = data.results.find(p => !usedIds.includes(p.id));
    if (photo) {
      usedIds.push(photo.id);
      fs.writeFileSync(USED_IMAGES_PATH, JSON.stringify(usedIds, null, 2));
      return {
        url: photo.urls.regular,
        alt: photo.alt_description || `${title} illustration`
      };
    }
  } catch (e) {
    console.warn("Unsplash fetch failed, using fallback:", e.message);
  }
  return fallback;
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
  
  // Check if image is pollinations or legacy/broken and replace with Unsplash or fallback
  if (!data.featuredImage || data.featuredImage.includes('pollinations.ai') || data.featuredImage.includes('source.unsplash.com')) {
    console.log(`[${file}] Fetching unique Unsplash image...`);
    const image = await getImage(data.title, data.category);
    data.featuredImage = image.url;
    data.altText = image.alt;
  }

  // Re-serialize
  // We use our own string template to avoid strange gray-matter output formatting string quotes issues
  const tagsStr = JSON.stringify(data.tags || [data.category.toLowerCase(), "card games", "cardgameshub"]);
  const frontmatter = `---
title: "${data.title.replace(/"/g, '\\"')}"
slug: "${data.slug}"
category: "${data.category}"
publishedAt: "${data.publishedAt}"
author: "CardGamesHub Team"
excerpt: "${data.excerpt.replace(/"/g, '\\"')}"
featuredImage: "${data.featuredImage}"
altText: "${data.altText.replace(/"/g, '\\"')}"
metaTitle: "${data.metaTitle.replace(/"/g, '\\"')}"
metaDescription: "${data.metaDescription.replace(/"/g, '\\"')}"
tags: ${tagsStr}
---`;

  const newContent = `${frontmatter}\n${bodyContent}`;
  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`✅ Fixed: ${file}`);
}

async function run() {
  if (!fs.existsSync(ARTICLES_DIR)) return console.log("No articles dir found.");
  const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.mdx'));
  
  for (const file of files) {
    await fixArticle(file);
  }
  console.log("All existing articles retroactively fixed.");
}

run();
