import { createFileRoute, Link } from "@tanstack/react-router";
import { Feed } from "@/components/Feed";
import { Header } from "@/components/ui-kit";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rent a Tilet — Rent Habesha Dresses in Addis Ababa" },
      { name: "description", content: "Rent luxury Habesha kemis and occasion dresses from women near you in Addis Ababa, with escrow protection." },
      { property: "og:title", content: "Rent a Tilet — Rent Habesha Dresses in Addis Ababa" },
      { property: "og:description", content: "Peer-to-peer dress rentals with escrow protection and refundable deposits." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-5 pb-36 pt-10">
        <h1 className="max-w-4xl font-serif text-4xl leading-[1.08] text-primary sm:text-6xl">
          Rent Luxury Habesha Dresses & Occasional Wear in Addis Ababa
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          Discover one-of-a-kind looks from your community, ready for your next beautiful moment.
        </p>
        <div className="mt-10">
          <Feed eyebrow="Curated for you" title="Near Me" limit={8} />
        </div>
        <div className="mt-8 text-right">
          <Link to="/browse" className="font-medium text-primary underline decoration-gold underline-offset-4">View all</Link>
        </div>
      </main>
    </>
  );
}
