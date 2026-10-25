import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/prose-page";

export const metadata: Metadata = {
  title: "Our craft",
  description:
    "The story of Ansh Arte: handcrafted oxidised brass and German silver jewellery rooted in Indian craft traditions. Learn the difference between brass and German silver.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <ProsePage
      eyebrow="Our story"
      title="Our craft"
      path="/about"
      intro="Ansh Arte celebrates the quiet beauty of oxidised metal: pieces that carry the warmth of Indian craft into everyday life."
    >
      <p>
        Every Ansh Arte piece begins with a motif we love: a temple bell, a peacock feather, a mandala, a crescent
        moon. Artisans shape the metal, engrave the detail and oxidise it by hand so every line stands out. No two
        pieces are ever exactly alike, and that is the point.
      </p>
      <h2 id="materials">Oxidised brass vs German silver</h2>
      <p>
        <strong>Oxidised brass</strong> is an alloy of copper and zinc with a warm, golden undertone. Oxidising darkens
        the surface so engravings and filigree come alive. It feels rich and festive, perfect with silks and
        ethnic wear.
      </p>
      <p>
        <strong>German silver</strong> contains no actual silver. It is an alloy of copper, nickel and zinc with a
        cool, silvery colour. It is lightweight, strong and affordable, and takes on a beautiful antique look when
        oxidised. It pairs as easily with denim as with a saree.
      </p>
      <h2>Made to be worn</h2>
      <ul>
        <li>Lightweight designs you can wear all day</li>
        <li>Finished by hand, checked piece by piece before it ships</li>
        <li>Packed in a protective pouch to keep the finish beautiful</li>
      </ul>
      <p>
        <Link href="/care-guide" className="text-brass-deep underline underline-offset-4">
          Read how to care for your jewellery
        </Link>
      </p>
    </ProsePage>
  );
}
