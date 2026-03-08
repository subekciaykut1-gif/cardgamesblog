"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Category } from "@/lib/constants";
import { CATEGORIES } from "@/lib/constants";

type Props = {
  /** Map of category → article count */
  counts: Record<string, number>;
};

export default function CategorySidebar({ counts }: Props) {
  const params = useSearchParams();
  const active = params.get("category") ?? "all";

  return (
    <aside className="category-sidebar">
      <h3>Categories</h3>
      <Link
        href="/blog"
        className={`category-link ${active === "all" ? "active" : ""}`}
      >
        All Posts
        <span className="category-count">
          {Object.values(counts).reduce((s, n) => s + n, 0)}
        </span>
      </Link>
      {CATEGORIES.map((cat) => (
        <Link
          key={cat}
          href={`/blog?category=${encodeURIComponent(cat)}`}
          className={`category-link ${active === cat ? "active" : ""}`}
        >
          {cat}
          <span className="category-count">{counts[cat] ?? 0}</span>
        </Link>
      ))}
    </aside>
  );
}
