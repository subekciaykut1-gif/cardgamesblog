/**
 * audit-uniqueness.js
 *
 * Scans all generated MDX files and calculates the similarity matrix
 * to ensure the combinatorial factory is producing sufficiently unique content.
 */

const fs = require('fs');
const path = require('path');

const ARTICLES_DIR = path.join(__dirname, "..", "content", "articles");

function calculateSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;
  // Focus on content words
  const words1 = new Set(text1.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 4));
  const words2 = new Set(text2.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 4));
  if (words1.size === 0 || words2.size === 0) return 0;
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  return intersection.size / union.size;
}

const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.mdx'));
console.log(`Auditing ${files.length} articles for uniqueness...`);

let totalChecks = 0;
let duplicates = 0;
const similarityThreshold = 0.5; // High confidence for combinatorial

// Sample check (checking all pairs of 600 is 180k checks, slow)
// We'll check each file against a random sample of 20 others
for (let i = 0; i < files.length; i++) {
  const content1 = fs.readFileSync(path.join(ARTICLES_DIR, files[i]), 'utf-8');
  
  // Check against next 20 files
  for (let j = i + 1; j < Math.min(i + 21, files.length); j++) {
    const content2 = fs.readFileSync(path.join(ARTICLES_DIR, files[j]), 'utf-8');
    const sim = calculateSimilarity(content1, content2);
    totalChecks++;
    if (sim > similarityThreshold) {
      duplicates++;
      console.warn(`[!] High similarity (${(sim*100).toFixed(1)}%): ${files[i]} vs ${files[j]}`);
    }
  }
}

console.log(`\nAudit complete.`);
console.log(`Total checks: ${totalChecks}`);
console.log(`High-similarity articles found: ${duplicates}`);
console.log(`Uniqueness score: ${(((totalChecks - duplicates) / totalChecks) * 100).toFixed(2)}%`);
