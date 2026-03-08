/**
 * harmonize-slugs.js
 *
 * 1. Categorizes articles with same base titles.
 * 2. Assigns unique, descriptive SEO suffixes to each duplicate.
 * 3. Updates the content-calendar.json.
 * 4. Rename old .mdx files to new slugs.
 */

const fs = require('fs');
const path = require('path');

const CALENDAR_PATH = path.join(__dirname, "..", "data", "content-calendar.json");
const ARTICLES_DIR = path.join(__dirname, "..", "content", "articles");

const calendar = JSON.parse(fs.readFileSync(CALENDAR_PATH, 'utf-8'));

const descriptiveSuffixes = [
  "Complete Guide",
  "Expert Strategy",
  "Advanced Tips",
  "Basics & Rules",
  "Mastering the Game",
  "Winning Secrets",
  "Tactical Analysis",
  "Pro Techniques",
  "Key Principles",
  "Comprehensive Review",
  "Insider Secrets",
  "Essential Foundations",
  "Strategic Deep Dive",
  "Professional Insights",
  "Ultimate Checklist",
  "Beginner Fast-Track"
];

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

// Group by base title (without (Part X))
const groups = {};
calendar.entries.forEach(entry => {
  const baseTitle = entry.title.replace(/\s*\(Part\s*\d+\)/gi, '').trim();
  if (!groups[baseTitle]) groups[baseTitle] = [];
  groups[baseTitle].push(entry);
});

console.log(`Processing ${Object.keys(groups).length} unique base titles...`);

const renameMap = {}; // oldSlug -> newSlug

Object.keys(groups).forEach(baseTitle => {
  const group = groups[baseTitle];
  if (group.length === 1) {
    const entry = group[0];
    const oldSlug = entry.slug;
    entry.title = baseTitle;
    entry.slug = slugify(baseTitle);
    if (oldSlug !== entry.slug) renameMap[oldSlug] = entry.slug;
  } else {
    group.forEach((entry, idx) => {
      const oldSlug = entry.slug;
      const suffix = descriptiveSuffixes[idx % descriptiveSuffixes.length];
      const newTitle = `${baseTitle}: ${suffix}`;
      const newSlug = slugify(newTitle);
      
      entry.title = newTitle;
      entry.slug = newSlug;
      renameMap[oldSlug] = newSlug;
    });
  }
});

// Update Calendar
fs.writeFileSync(CALENDAR_PATH, JSON.stringify(calendar, null, 2));
console.log("✅ Updated content-calendar.json");

// Rename MDX files
Object.entries(renameMap).forEach(([oldSlug, newSlug]) => {
  const oldPath = path.join(ARTICLES_DIR, `${oldSlug}.mdx`);
  const newPath = path.join(ARTICLES_DIR, `${newSlug}.mdx`);
  
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
  }
});

console.log(`✅ Renamed ${Object.keys(renameMap).length} files.`);
console.log("\nNext: Run scripts/bulk-regenerate.js to update the contents with new titles.");
