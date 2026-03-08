import { notFound } from "next/navigation";
import { getAllArticles, getArticleBySlug, getRelatedArticles } from "@/lib/blog";
import { generateArticleMetadata, generateArticleJsonLd } from "@/lib/seo";
import AdBannerSlot from "@/components/blog/AdBannerSlot";
import RelatedArticles from "@/components/blog/RelatedArticles";
import SocialShare from "@/components/blog/SocialShare";
import { format } from "date-fns";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  return getAllArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return generateArticleMetadata(article);
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) notFound();

  const related = getRelatedArticles(slug, 3);
  const jsonLd = generateArticleJsonLd(article);
  const formattedDate = format(new Date(article.publishedAt), "MMMM d, yyyy");

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      <div className="container">
        <AdBannerSlot position="top" />

        <article className="content-width" style={{ paddingTop: "1.5rem" }}>
          {/* Article Header */}
          <header className="article-header">
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <span className="category-badge">{article.category}</span>
              <span className="reading-time">{article.readingTime} min read</span>
            </div>
            <h1>{article.title}</h1>
            <div className="article-byline">
              <span>By {article.author} &middot; <time dateTime={article.publishedAt}>{formattedDate}</time></span>
            </div>
          </header>

          {/* Featured Image */}
          <img
            src={article.featuredImage}
            alt={article.altText}
            className="article-featured-image"
          />

          {/* Article Body */}
          <div className="article-body">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </div>

          {/* Social Share */}
          <SocialShare slug={article.slug} title={article.title} />
        </article>

        <AdBannerSlot position="bottom" />

        {/* Related Articles */}
        {related.length > 0 && (
          <div className="content-width">
            <RelatedArticles articles={related} />
          </div>
        )}
      </div>
    </>
  );
}
