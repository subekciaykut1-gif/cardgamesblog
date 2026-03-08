/**
 * Blog data layer — reads MDX articles from /content/articles/
 *
 * VISIBILITY RULE: An article is visible only when the current UTC time
 * is >= its `publishedAt` frontmatter field. This is the sole "publish gate".
 *
 * This module uses Node.js `fs` — it must ONLY be imported by Server Components,
 * API routes, or other server-side code. Never import from client components.
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Category } from "./constants";
export type { Category } from "./constants";
export { CATEGORIES } from "./constants";

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: Category;
  publishedAt: string; // ISO 8601, e.g. "2026-03-08T08:00:00Z"
  author: string;
  featuredImage: string;
  altText: string;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
  readingTime: number; // minutes (estimated)
  content: string; // raw MDX body
};

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");

// Roughly 200 words per minute
function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function isPublished(publishedAt: string): boolean {
  if (process.env.NODE_ENV === "development") return true;
  const now = new Date().getTime();
  const pub = new Date(publishedAt).getTime();
  return pub <= now;
}

function parseArticleFile(slug: string): Article | null {
  const filePath = path.join(ARTICLES_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  if (!isPublished(data.publishedAt)) return null;

  return {
    slug,
    title: data.title ?? "",
    excerpt: data.excerpt ?? "",
    category: data.category ?? "Card Game News",
    publishedAt: data.publishedAt,
    author: data.author ?? "CardGamesHub Team",
    featuredImage: data.featuredImage ?? "/images/blog/default.jpg",
    altText: data.altText ?? data.title ?? "",
    metaTitle: data.metaTitle ?? data.title ?? "",
    metaDescription: data.metaDescription ?? data.excerpt ?? "",
    tags: data.tags ?? [],
    readingTime: estimateReadingTime(content),
    content,
  };
}

/** Returns all published articles sorted newest-first */
export function getAllArticles(): Article[] {
  if (!fs.existsSync(ARTICLES_DIR)) return [];

  const slugs = fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));

  return slugs
    .map(parseArticleFile)
    .filter((a): a is Article => a !== null)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
}

/** Returns a single published article or null if not found / not yet published */
export function getArticleBySlug(slug: string): Article | null {
  return parseArticleFile(slug);
}

/** Returns published articles for a specific category */
export function getArticlesByCategory(category: Category): Article[] {
  return getAllArticles().filter((a) => a.category === category);
}

/** Paginated articles — pageIndex is 1-based */
export function getPaginatedArticles(
  pageIndex: number,
  perPage = 10,
  category?: Category
): { articles: Article[]; totalPages: number; total: number } {
  const all = category ? getArticlesByCategory(category) : getAllArticles();
  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = (pageIndex - 1) * perPage;
  const articles = all.slice(start, start + perPage);
  return { articles, totalPages, total };
}

/** Returns up to `count` related articles (same category, excluding current slug) */
export function getRelatedArticles(slug: string, count = 3): Article[] {
  const current = getArticleBySlug(slug);
  if (!current) return [];
  return getAllArticles()
    .filter((a) => a.slug !== slug && a.category === current.category)
    .slice(0, count);
}
