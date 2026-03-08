/**
 * bulk-regenerate.js
 *
 * Runs the generate-article.js logic for every entry in the calendar
 * to ensure all articles are updated with the new variety strategy.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CALENDAR_PATH = path.join(__dirname, "..", "data", "content-calendar.json");
const calendar = JSON.parse(fs.readFileSync(CALENDAR_PATH, 'utf-8'));

console.log(`Starting bulk regeneration of ${calendar.entries.length} articles...`);

calendar.entries.forEach((entry, index) => {
  process.stdout.write(`[${index + 1}/${calendar.entries.length}] Regenerating: ${entry.slug}... `);
  try {
    execSync(`node scripts/generate-article.js --slug ${entry.slug}`, { stdio: 'ignore' });
    console.log('✅');
  } catch (err) {
    console.log('❌ Failed');
  }
});

console.log("\nFinished bulk regeneration!");
