import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/blog/ThemeToggle";

const NAV_LINKS = [
  { href: "https://cardgameshub.io/", label: "All Games" },
  { href: "/blog", label: "Blog" },
  { href: "https://cardgameshub.io/#about-us", label: "About Us" },
];

export default function BlogHeader() {
  return (
    <header className="site-header">
      <div className="container">
        <Link href="https://cardgameshub.io/" className="site-logo">
          {/* Using the public favicon as logo placeholder — developer should copy icon0.svg from the main repo */}
          <img
            src="https://cardgameshub.io/favicon.ico"
            alt="CardGamesHub logo"
            width={28}
            height={28}
          />
          <span>Card Games Hub</span>
        </Link>

        <nav className="site-nav">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
          <ThemeToggle />
          <Link
            href="https://cardgameshub.io/signIn"
            className="btn-signin"
          >
            Sign In
          </Link>
        </nav>
      </div>
    </header>
  );
}
