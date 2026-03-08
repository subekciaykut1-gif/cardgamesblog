const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
require('dotenv').config({ path: path.join(__dirname, "..", ".env.local") });

const ARTICLES_DIR = path.join(__dirname, "..", "content", "articles");
const USED_IMAGES_PATH = path.join(__dirname, "..", "data", "used-unsplash-ids.json");

function getImageUrl(slug) {
  return `https://picsum.photos/seed/${slug}/800/450`;
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
  
  // Replace everything with Picsum URLs for consistency
  console.log(`[${file}] Applying Picsum image...`);
  data.featuredImage = getImageUrl(data.slug);
  data.altText = `${data.title} - ${data.category} illustration`;
  
  // Update author globally
  data.author = "Tugrul Subekci";
  if (data.metaDescription && data.metaDescription.includes("CardGamesHub Team")) {
    data.metaDescription = data.metaDescription.replace("CardGamesHub Team", "Tugrul Subekci");
  }

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
