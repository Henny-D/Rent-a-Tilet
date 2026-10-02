import { createFileRoute } from "@tanstack/react-router";
import { Feed } from "@/components/Feed";
import { Header } from "@/components/ui-kit";

export const Route = createFileRoute("/browse")({
  head: () => ({
    meta: [
      { title: "Browse Dresses — Rent a Tilet" },
      { name: "description", content: "Browse Habesha kemis, cocktail, wedding guest and formal dresses to rent across Addis Ababa." },
      { property: "og:title", content: "Browse Dresses — Rent a Tilet" },
      { property: "og:description", content: "Filter by category, neighborhood and price. Rent for 4 days." },
    ],
  }),
  component: () => (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-5 pb-36 pt-8">
        <h1 className="mb-8 font-serif text-4xl text-primary">Browse dresses</h1>
        <Feed eyebrow="All listings" title="Every dress in Addis" />
      </main>
    </>
  ),
});
