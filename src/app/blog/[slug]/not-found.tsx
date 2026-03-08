import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container empty-state" style={{ paddingTop: "6rem", paddingBottom: "6rem" }}>
      <h2>Article Not Found</h2>
      <p>
        This article may not be published yet, or the URL might be wrong.
      </p>
      <Link href="/blog" style={{ marginTop: "1.5rem", display: "inline-block" }}>
        ← Back to Blog
      </Link>
    </div>
  );
}
