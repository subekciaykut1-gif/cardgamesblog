import { redirect } from "next/navigation";

// Root "/" redirects to /blog
export default function HomePage() {
  redirect("/blog");
}
