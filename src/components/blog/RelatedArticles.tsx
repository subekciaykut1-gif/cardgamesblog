import ArticleCard from "./ArticleCard";
import type { Article } from "@/lib/blog";

type Props = { articles: Article[] };

export default function RelatedArticles({ articles }: Props) {
  if (!articles.length) return null;
  return (
    <section className="related-articles">
      <h2>Related Articles</h2>
      <div className="related-grid">
        {articles.map((a) => (
          <ArticleCard key={a.slug} article={a} compact />
        ))}
      </div>
    </section>
  );
}
