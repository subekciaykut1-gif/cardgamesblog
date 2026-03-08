"use client";

import Link from "next/link";
import type { Article } from "@/lib/blog";
import { format } from "date-fns";
import { useState } from "react";

type Props = { article: Article; compact?: boolean };

export default function ArticleCard({ article, compact = false }: Props) {
  const [imgError, setImgError] = useState(false);
  
  const isFallback = article.featuredImage === "fallback://cardgameshub" || imgError;
  const suits = ['♠', '♥', '♦', '♣'];
  const suit = suits[article.title.length % 4];

  return (
    <Link href={`/blog/${article.slug}`} className="article-card" style={{ textDecoration: "none" }}>
      {isFallback ? (
        <div 
          className="article-card-image"
          style={{ 
            height: compact ? 140 : 180, 
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
            fontSize: '3.5rem',
            opacity: 0.8
          }}
        >
          {suit}
        </div>
      ) : (
        <img
          src={article.featuredImage}
          alt={article.altText}
          className="article-card-image"
          style={{ height: compact ? 140 : 180 }}
          loading="lazy"
          onError={() => setImgError(true)}
        />
      )}
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
