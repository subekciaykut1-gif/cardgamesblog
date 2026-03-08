import type { Metadata } from "next";
import type { Article } from "./blog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://cardgameshub.io";
const SITE_NAME = "CardGamesHub.io";
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/og-default.jpg`;

/** Generates Next.js Metadata object for a blog article */
export function generateArticleMetadata(article: Article): Metadata {
  const url = `${SITE_URL}/blog/${article.slug}`;
  const ogImage = article.featuredImage.startsWith("http")
    ? article.featuredImage
    : `${SITE_URL}${article.featuredImage}`;

  return {
    title: article.metaTitle,
    description: article.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: article.metaTitle,
      description: article.metaDescription,
      siteName: SITE_NAME,
      images: [{ url: ogImage, alt: article.altText, width: 1200, height: 630 }],
      publishedTime: article.publishedAt,
      authors: [article.author],
      tags: article.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: article.metaTitle,
      description: article.metaDescription,
      images: [ogImage],
    },
  };
}

/** JSON-LD structured data for an article */
export function generateArticleJsonLd(article: Article): string {
  const url = `${SITE_URL}/blog/${article.slug}`;
  const ogImage = article.featuredImage.startsWith("http")
    ? article.featuredImage
    : `${SITE_URL}${article.featuredImage}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription,
    image: ogImage,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    author: {
      "@type": "Organization",
      name: article.author,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon0.svg`,
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  return JSON.stringify(schema);
}

/** Blog index metadata */
export function generateBlogIndexMetadata(page = 1): Metadata {
  const url = `${SITE_URL}/blog${page > 1 ? `?page=${page}` : ""}`;
  return {
    title: `Card Games Blog — Tips, Strategies & Guides | ${SITE_NAME}`,
    description:
      "Explore expert tips, strategies, history, and how-to guides for Cribbage, Solitaire, and more card games. Updated daily by the CardGamesHub team.",
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `Card Games Blog | ${SITE_NAME}`,
      description:
        "Expert card game guides, tips, and strategies — updated daily.",
      siteName: SITE_NAME,
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630 }],
    },
  };
}
