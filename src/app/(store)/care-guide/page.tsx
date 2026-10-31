import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";

export const metadata: Metadata = {
  title: "How to care for oxidised jewellery",
  description:
    "Simple steps to keep oxidised brass and German silver jewellery beautiful: storage, cleaning and what to avoid.",
  alternates: { canonical: "/care-guide" },
};

export default function CareGuidePage() {
  return (
    <ProsePage
      eyebrow="Jewellery care"
      title="Care guide"
      path="/care-guide"
      intro="Oxidised jewellery is easy to love and easy to look after. A few small habits keep it looking new for years."
    >
      <h2>Every day</h2>
      <ul>
        <li>Put your jewellery on last, after perfume, hairspray and lotion have dried.</li>
        <li>Take it off before bathing, swimming, workouts or sleeping.</li>
        <li>Wipe gently with a soft, dry cloth after each wear.</li>
      </ul>
      <h2>Storing</h2>
      <ul>
        <li>Keep each piece in its pouch or a zip-lock bag to limit air and moisture.</li>
        <li>Add a silica gel packet to your jewellery box in humid weather.</li>
        <li>Store pieces separately so they do not scratch each other.</li>
      </ul>
      <h2>Cleaning</h2>
      <ul>
        <li>Never use silver polish, chemical dips or ultrasonic cleaners: they remove the oxidised finish.</li>
        <li>For dust, use a soft dry toothbrush. Avoid water and soap.</li>
        <li>Don&apos;t polish the dark areas: the patina is the design.</li>
      </ul>
      <h2>Skin-friendly tips</h2>
      <p>
        German silver (nickel silver alloy) contains nickel and no silver. If your skin is sensitive, patch-test first:
        wear the piece for a few hours and keep the hooks clean and dry. Slight
        darkening over time is natural for oxidised metal and adds to its antique charm.
      </p>
    </ProsePage>
  );
}
