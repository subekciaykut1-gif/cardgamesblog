#!/usr/bin/env node
/**
 * check-duplicates.js
 *
 * Validates the content calendar for duplicate slugs and titles.
 * Run this after generate-schedule.js to confirm data integrity.
 *
 * Usage: node scripts/check-duplicates.js
 */

const fs   = require("fs");
const path = require("path");

const CALENDAR_PATH = path.join(__dirname, "..", "data", "content-calendar.json");

let calendar;
try {
  calendar = JSON.parse(fs.readFileSync(CALENDAR_PATH, "utf-8"));
} catch {
  console.error("❌ data/content-calendar.json not found. Run generate-schedule.js first.");
  process.exit(1);
}

const { entries } = calendar;
const slugCounts  = {};
const titleCounts = {};

for (const e of entries) {
  slugCounts[e.slug]   = (slugCounts[e.slug]   || 0) + 1;
  titleCounts[e.title] = (titleCounts[e.title] || 0) + 1;
}

const dupSlugs  = Object.entries(slugCounts).filter(([, n]) => n > 1);
const dupTitles = Object.entries(titleCounts).filter(([, n]) => n > 1);

console.log(`\n📋 Content Calendar Stats`);
console.log(`   Total entries: ${entries.length}`);
console.log(`   Unique slugs:  ${Object.keys(slugCounts).length}`);
console.log(`   Unique titles: ${Object.keys(titleCounts).length}`);

if (dupSlugs.length === 0 && dupTitles.length === 0) {
  console.log("\n✅ No duplicates found — calendar is clean!");
  process.exit(0);
}

if (dupSlugs.length > 0) {
  console.error("\n❌ DUPLICATE SLUGS:");
  dupSlugs.forEach(([slug, count]) => console.error(`   "${slug}" appears ${count} times`));
}

if (dupTitles.length > 0) {
  console.warn("\n⚠️  DUPLICATE TITLES:");
  dupTitles.forEach(([title, count]) => console.warn(`   "${title}" appears ${count} times`));
}

process.exit(1);
