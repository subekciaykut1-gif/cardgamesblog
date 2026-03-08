import Link from "next/link";
import type { Article } from "@/lib/blog";
import { format } from "date-fns";

type Props = { article: Article; compact?: boolean };

export default function ArticleCard({ article, compact = false }: Props) {
  return (
    <Link href={`/blog/${article.slug}`} className="article-card" style={{ textDecoration: "none" }}>
      <img
        src={article.featuredImage}
        alt={article.altText}
        className="article-card-image"
        style={{ height: compact ? 140 : 180 }}
        loading="lazy"
      />
      <div className="article-card-body">
        <div className="article-card-meta">
          <span className="category-badge">{article.category}</span>
          <time className="article-date" dateTime={article.publishedAt}>
            {format(new Date(article.publishedAt), "MMM d, yyyy")}
          </time>
          <span className="reading-time">{article.readingTime} min</span>
        </div>
        <h2>{article.title}</h2>
        {!compact && <p className="article-excerpt">{article.excerpt}</p>}
        <span className="read-more">Read more →</span>
      </div>
    </Link>
  );
}
