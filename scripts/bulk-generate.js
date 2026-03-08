#!/usr/bin/env node
/**
 * bulk-generate.js
 *
 * Generates multiple MDX articles from the content calendar in batch.
 *
 * Usage:
 *   node scripts/bulk-generate.js                          # all scheduled
 *   node scripts/bulk-generate.js --from 2026-03-08        # from date onward
 *   node scripts/bulk-generate.js --to 2026-04-01          # up to date
 *   node scripts/bulk-generate.js --from 2026-03-08 --to 2026-03-31
 *   node scripts/bulk-generate.js --limit 20               # max articles
 *   node scripts/bulk-generate.js --dry-run                # no file writes
 */

const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");

function getArg(flag) {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
}

const FROM  = getArg("--from");
const TO    = getArg("--to");
const LIMIT = getArg("--limit") ? Number(getArg("--limit")) : Infinity;

const CALENDAR_PATH = path.join(__dirname, "..", "data", "content-calendar.json");

let calendar;
try {
  calendar = JSON.parse(fs.readFileSync(CALENDAR_PATH, "utf-8"));
} catch {
  console.error("❌ data/content-calendar.json not found. Run generate-schedule.js first.");
  process.exit(1);
}

let entries = calendar.entries.filter((e) => e.status === "scheduled");

if (FROM) entries = entries.filter((e) => e.publishedAt >= FROM);
if (TO)   entries = entries.filter((e) => e.publishedAt <= TO + "T23:59:59Z");
entries = entries.slice(0, LIMIT);

console.log(`\n📋 Articles to generate: ${entries.length}`);
if (DRY_RUN) console.log("   [DRY-RUN mode — no files will be written]\n");

let success = 0, failed = 0;

for (const entry of entries) {
  try {
    const dryFlag = DRY_RUN ? " --dry-run" : "";
    execSync(`node "${path.join(__dirname, "generate-article.js")}" --slug "${entry.slug}"${dryFlag}`, {
      stdio: "inherit",
    });
    success++;
  } catch (err) {
    console.error(`❌ Failed: ${entry.slug} — ${err.message}`);
    failed++;
  }
}

console.log(`\n✅ Done. Generated: ${success} | Failed: ${failed}`);
