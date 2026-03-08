import Link from "next/link";

type Props = {
  currentPage: number;
  totalPages: number;
  basePath: string; // e.g. "/blog" or "/blog?category=Cribbage"
};

function pageUrl(base: string, page: number) {
  const url = new URL(base, "http://x");
  url.searchParams.set("page", String(page));
  return `${url.pathname}?${url.searchParams.toString()}`;
}

export default function Pagination({ currentPage, totalPages, basePath }: Props) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  // Show at most 7 page buttons, collapsing middle pages with ellipsis
  const WINDOW = 2;
  const visible = pages.filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= WINDOW
  );

  return (
    <nav className="pagination" aria-label="Pagination">
      <Link
        href={pageUrl(basePath, currentPage - 1)}
        className={`page-btn ${currentPage === 1 ? "pointer-events-none opacity-30" : ""}`}
        aria-label="Previous page"
        aria-disabled={currentPage === 1}
      >
        ←
      </Link>

      {visible.map((p, idx) => {
        const prev = visible[idx - 1];
        const showEllipsis = prev !== undefined && p - prev > 1;
        return (
          <span key={p} style={{ display: "contents" }}>
            {showEllipsis && (
              <span className="page-btn" style={{ cursor: "default", opacity: 0.4 }}>
                …
              </span>
            )}
            <Link
              href={pageUrl(basePath, p)}
              className={`page-btn ${p === currentPage ? "active" : ""}`}
              aria-current={p === currentPage ? "page" : undefined}
            >
              {p}
            </Link>
          </span>
        );
      })}

      <Link
        href={pageUrl(basePath, currentPage + 1)}
        className={`page-btn ${currentPage === totalPages ? "pointer-events-none opacity-30" : ""}`}
        aria-label="Next page"
        aria-disabled={currentPage === totalPages}
      >
        →
      </Link>
    </nav>
  );
}
