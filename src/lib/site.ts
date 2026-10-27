import type { Settings } from "./types";

export const SITE_NAME = "Ansh Arte";
export const SITE_TAGLINE = "Handcrafted oxidised brass & German silver jewellery";
export const SITE_DESCRIPTION =
  "Ansh Arte crafts oxidised brass and German silver jewellery: jhumkas, hoops, dangles, studs and rings with an Indian heritage soul. Order easily on WhatsApp and pay by UPI.";

/** Default link-preview picture for WhatsApp, Instagram and Google */
export const OG_IMAGE = { url: "/og.jpg", width: 1200, height: 630, alt: "Ansh Arte handcrafted jewellery" };

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const DEFAULT_SETTINGS: Settings = {
  whatsapp_number: "916238714673",
  upi_id: "airishkrishnan@oksbi",
  upi_name: "Ansh Arte",
  gpay_number: "7736473323",
  shipping_fee: 60,
  free_shipping_above: 999,
  announcement: "Handcrafted oxidised jewellery · Ships across India",
  instagram: "",
  legal_name: "",
  business_address: "",
  support_email: "",
  grievance_officer: "",
  gstin: "",
};

export const formatPrice = (rupees: number) =>
  "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(rupees);

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

/** wa.me link with a pre-filled message. `number` must include the country code. */
export const whatsappLink = (number: string, text: string) =>
  `https://wa.me/${number.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`;

/** Normalises an Indian mobile number to include the 91 country code. */
export const withIndiaCode = (phone: string) => {
  const digits = phone.replace(/[^0-9]/g, "");
  return digits.length === 10 ? "91" + digits : digits;
};

export const upiLink = (s: Settings, amount: number, note: string) => {
  const p = new URLSearchParams({
    pa: s.upi_id,
    pn: s.upi_name,
    am: amount.toFixed(2),
    cu: "INR",
    tn: note,
  });
  return `upi://pay?${p.toString()}`;
};

export const shippingFor = (s: Settings, subtotal: number) =>
  subtotal === 0 || subtotal >= s.free_shipping_above ? 0 : s.shipping_fee;

export const COURIERS: { name: string; url: (n: string) => string }[] = [
  { name: "India Post", url: () => "https://www.indiapost.gov.in/" },
  { name: "DTDC", url: () => "https://www.dtdc.in/tracking.asp" },
  { name: "Delhivery", url: (n) => `https://www.delhivery.com/track/package/${encodeURIComponent(n)}` },
  { name: "Blue Dart", url: (n) => `https://www.bluedart.com/trackdartresult?trackFor=0&trackNo=${encodeURIComponent(n)}` },
  { name: "Shiprocket", url: (n) => `https://shiprocket.co/tracking/${encodeURIComponent(n)}` },
  { name: "Professional Couriers", url: () => "https://www.tpcindia.com/" },
  { name: "Other", url: () => "" },
];
