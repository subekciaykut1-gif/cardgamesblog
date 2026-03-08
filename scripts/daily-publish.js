#!/usr/bin/env node
/**
 * daily-publish.js
 *
 * Runs at 08:00 UTC and 18:00 UTC each day (via cron, Task Scheduler, or Vercel Cron).
 * Finds the current day's article(s) whose publishedAt time has passed,
 * generates the MDX if not already done, then optionally triggers a deploy webhook.
 *
 * Cron expression (run twice daily):
 *   0 8,18 * * *  node /path/to/scripts/daily-publish.js
 *
 * Environment variables (optional):
 *   DEPLOY_WEBHOOK_URL — POST to this URL after publishing (Vercel/Netlify hook)
 */

const fs      = require("fs");
const path    = require("path");
const { execSync } = require("child_process");
const https   = require("https");

const CALENDAR_PATH = path.join(__dirname, "..", "data", "content-calendar.json");
const ARTICLES_DIR  = path.join(__dirname, "..", "content", "articles");
const DEPLOY_WEBHOOK = process.env.DEPLOY_WEBHOOK_URL || null;
const MAX_RETRIES = 3;

let calendar;
try {
  calendar = JSON.parse(fs.readFileSync(CALENDAR_PATH, "utf-8"));
} catch {
  console.error("❌ Calendar not found. Run generate-schedule.js first.");
  process.exit(1);
}

const now = new Date();
console.log(`\n🕐 Daily publish run at ${now.toISOString()}`);

// Find entries that should be published NOW (time has passed, status = scheduled or generated)
const toPublish = calendar.entries.filter((e) => {
  const pub = new Date(e.publishedAt);
  return pub <= now && (e.status === "scheduled" || e.status === "generated");
});

console.log(`📋 Articles due for publish: ${toPublish.length}`);

let published = 0;

for (const entry of toPublish) {
  const filePath = path.join(ARTICLES_DIR, `${entry.slug}.mdx`);
  const idx = calendar.entries.findIndex((e) => e.slug === entry.slug);

  // Generate if not yet created
  if (!fs.existsSync(filePath)) {
    console.log(`📝 Generating: ${entry.slug}`);
    let generated = false;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        execSync(`node "${path.join(__dirname, "generate-article.js")}" --slug "${entry.slug}"`, {
          stdio: "inherit",
        });
        generated = true;
        break;
      } catch {
        console.warn(`  ⚠️  Attempt ${attempt}/${MAX_RETRIES} failed for ${entry.slug}`);
      }
    }
    if (!generated) {
      console.error(`  ❌ All retries failed for ${entry.slug}. Flagging as failed.`);
      if (idx !== -1) {
        calendar.entries[idx].status = "failed";
        calendar.entries[idx].retries = MAX_RETRIES;
      }
      continue;
    }
  }

  // Mark as published
  if (idx !== -1) {
    calendar.entries[idx].status = "published";
    calendar.entries[idx].publishedActuallyAt = new Date().toISOString();
  }

  console.log(`✅ Published: ${entry.slug}`);
  published++;
}

// Save updated calendar
fs.writeFileSync(CALENDAR_PATH, JSON.stringify(calendar, null, 2));
console.log(`\n📅 Calendar updated. Published this run: ${published}`);

// Trigger deploy webhook if configured
if (published > 0 && DEPLOY_WEBHOOK) {
  console.log(`🚀 Triggering deploy webhook…`);
  const url = new URL(DEPLOY_WEBHOOK);
  const req = https.request(
    { hostname: url.hostname, path: url.pathname + url.search, method: "POST" },
    (res) => console.log(`   Deploy hook responded: ${res.statusCode}`)
  );
  req.on("error", (e) => console.error(`   Deploy hook error: ${e.message}`));
  req.end();
}
