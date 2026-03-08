import { Suspense } from "react";
import { getAllArticles, getPaginatedArticles, CATEGORIES } from "@/lib/blog";
import { generateBlogIndexMetadata } from "@/lib/seo";
import ArticleCard from "@/components/blog/ArticleCard";
import CategorySidebar from "@/components/blog/CategorySidebar";
import Pagination from "@/components/blog/Pagination";
import AdBannerSlot from "@/components/blog/AdBannerSlot";
import type { Category } from "@/lib/blog";
import type { Metadata } from "next";

const PER_PAGE = 10;

type SearchParams = Promise<{ page?: string; category?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { page } = await searchParams;
  return generateBlogIndexMetadata(Number(page) || 1);
}

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { page, category } = await searchParams;
  const pageIndex = Math.max(1, Number(page) || 1);
  const activeCategory = category as Category | undefined;

  // Build counts per category
  const all = getAllArticles();
  const counts = Object.fromEntries(
    CATEGORIES.map((c) => [c, all.filter((a) => a.category === c).length])
  );

  const { articles, totalPages, total } = getPaginatedArticles(
    pageIndex,
    PER_PAGE,
    activeCategory
  );

  const basePath = activeCategory
    ? `/blog?category=${encodeURIComponent(activeCategory)}`
    : "/blog";

  return (
    <div className="container">
      <AdBannerSlot position="top" />

      <div className="blog-page-header">
        <h1>Card Games Blog</h1>
        <p>
          Tips, strategies & guides for Cribbage, Solitaire, and more.
          {total > 0 && ` ${total} articles published.`}
        </p>
      </div>

      <div className="blog-layout">
        {/* Main content */}
        <div>
          {articles.length === 0 ? (
            <div className="empty-state">
              <h2>No articles yet</h2>
              <p>Check back soon — new articles publish daily!</p>
            </div>
          ) : (
            <div className="article-grid">
              {articles.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          )}

          <Suspense fallback={null}>
            <Pagination
              currentPage={pageIndex}
              totalPages={totalPages}
              basePath={basePath}
            />
          </Suspense>
        </div>

        {/* Sidebar */}
        <Suspense fallback={null}>
          <CategorySidebar counts={counts} />
        </Suspense>
      </div>

      <AdBannerSlot position="bottom" />
    </div>
  );
}
