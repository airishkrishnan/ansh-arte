import Link from "next/link";
import type { OrderStatus } from "@/lib/types";

/* Small building blocks shared by the admin screens (Shopify-style cards, pills and round buttons). */

const ICONS = {
  home: "M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z",
  orders: "M3.5 13.5 6 5h12l2.5 8.5V19a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1zM3.5 13.5H8.5l1.2 2.2h4.6l1.2-2.2h5",
  products: "M3.5 12.6V5a1.5 1.5 0 0 1 1.5-1.5h7.6l8 8a1.5 1.5 0 0 1 0 2.1l-7.5 7.5a1.5 1.5 0 0 1-2.1 0zM8.2 8.2h.01",
  customers: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5c.8-3.6 3.7-5.5 7.5-5.5s6.7 1.9 7.5 5.5",
  inbox: "M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9zM10 20a2.2 2.2 0 0 0 4 0",
  catalogue: "M4 4.5h6.5V11H4zM13.5 4.5H20V11h-6.5zM4 13.5h6.5V20H4zM13.5 13.5H20V20h-6.5z",
  settings:
    "M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM19.4 13.5l1.6 1.2-1.8 3.1-1.9-.7a7.6 7.6 0 0 1-2 1.2l-.3 2h-3.6l-.3-2a7.6 7.6 0 0 1-2-1.2l-1.9.7L3 14.7l1.6-1.2a7.7 7.7 0 0 1 0-3L3 9.3l1.8-3.1 1.9.7a7.6 7.6 0 0 1 2-1.2l.3-2h3.6l.3 2a7.6 7.6 0 0 1 2 1.2l1.9-.7L21 9.3l-1.6 1.2a7.7 7.7 0 0 1 0 3z",
  search: "M10.8 18a7.2 7.2 0 1 0 0-14.4 7.2 7.2 0 0 0 0 14.4zM16 16l4.5 4.5",
  menu: "M4 6.5h16M4 12h16M4 17.5h16",
  plus: "M12 5v14M5 12h14",
  plusCircle: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 8v8M8 12h8",
  more: "M5.5 12h.01M12 12h.01M18.5 12h.01",
  back: "M15 5l-7 7 7 7",
  chevron: "M9 6l6 6-6 6",
  down: "M6 9l6 6 6-6",
  close: "M6 6l12 12M18 6 6 18",
  print: "M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M7 14h10v6H7z",
  copy: "M9 4h6a1 1 0 0 1 1 1v1h2a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h2V5a1 1 0 0 1 1-1zM8 6h8",
  phone: "M5 4h3.5l1.5 4-2 1.5a10 10 0 0 0 6.5 6.5L16 14l4 1.5V19a1 1 0 0 1-1 1A15 15 0 0 1 4 5a1 1 0 0 1 1-1z",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  store: "M4 9.5 5.5 4h13L20 9.5M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M5 11.5V20h14v-8.5M10 20v-5h4v5",
  truck: "M3 6h11v10H3zM14 9.5h3.5L21 13v3h-7M7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17.5 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  pin: "M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11zM12 12.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5V12l3 2",
  box: "M12 3.5 20 8v8l-8 4.5L4 16V8zM4 8l8 4.5L20 8M12 12.5v8",
  cash: "M3 7h18v10H3zM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM6 10v.01M18 14v.01",
  star: "m12 4 2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6z",
  alert: "M12 4 21 19.5H3zM12 10v4M12 17h.01",
  sort: "M8 4v16M8 4 4.5 7.5M8 4l3.5 3.5M16 20V4M16 20l-3.5-3.5M16 20l3.5-3.5",
  filter: "M4 6h16M7 12h10M10 18h4",
  whatsapp:
    "M4.5 19.5l1.1-3.9A8 8 0 1 1 8.6 18.6zM9 8.5c0 3.6 2.9 6.5 6.5 6.5l1-1.5-2-1-1 .8a4.3 4.3 0 0 1-2.3-2.3l.8-1-1-2z",
  external: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  logout: "M14 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5M10 16l-4-4 4-4M6 12h10",
  sparkle: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18",
  camera: "M4 8h3l2-2.5h6L17 8h3v11H4zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
  share: "M12 4v11M8 8l4-4 4 4M5 13v6h14v-6",
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

/** A white rounded card, the main surface of every admin screen. */
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[1.75rem] border border-line bg-paper shadow-[0_1px_2px_rgba(33,27,26,0.04)] ${className}`}>{children}</div>;
}

/** A section heading with an optional icon tile and action on the right. */
export function SectionTitle({
  title,
  icon,
  tone = "plain",
  action,
}: {
  title: string;
  icon?: IconName;
  tone?: "plain" | "gold" | "amber" | "green" | "ink" | "red";
  action?: React.ReactNode;
}) {
  const tones = {
    plain: "bg-sand text-ink-soft",
    gold: "bg-[#f1dfa6] text-[#6b4e12]",
    amber: "bg-[#efc9a4] text-[#7a3f12]",
    green: "bg-[#d6e8d6] text-success",
    ink: "bg-ink text-paper",
    red: "bg-temple/15 text-temple",
  };
  return (
    <div className="mb-3 flex items-center justify-between gap-3 px-1">
      <h2 className="flex items-center gap-3 text-lg font-semibold">
        {icon && (
          <span className={`grid size-9 place-items-center rounded-xl ${tones[tone]}`}>
            <Icon name={icon} className="size-[1.1rem]" />
          </span>
        )}
        {title}
      </h2>
      {action}
    </div>
  );
}

/** A round icon button (back, print, more…). Renders a link when given href. */
export function RoundButton({
  icon,
  label,
  href,
  onClick,
  className = "",
}: {
  icon: IconName;
  label: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  const cls = `grid size-11 shrink-0 place-items-center rounded-full border border-line bg-paper text-ink shadow-[0_2px_10px_rgba(33,27,26,0.06)] transition-colors hover:bg-sand ${className}`;
  if (href)
    return (
      <Link href={href} className={cls} aria-label={label} title={label}>
        <Icon name={icon} />
      </Link>
    );
  return (
    <button type="button" onClick={onClick} className={cls} aria-label={label} title={label}>
      <Icon name={icon} />
    </button>
  );
}

/** Two or more round icon buttons joined into one pill, like Shopify's header actions. */
export function ButtonGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center rounded-full border border-line bg-paper p-0.5 shadow-[0_2px_10px_rgba(33,27,26,0.06)] [&>*]:border-0 [&>*]:bg-transparent [&>*]:shadow-none">
      {children}
    </div>
  );
}

/** Text tabs with a soft pill behind the selected one. */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: T; label: string; count?: number }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:px-0" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={value === t.key}
          onClick={() => onChange(t.key)}
          className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[0.95rem] transition-colors ${
            value === t.key ? "bg-sand font-semibold text-ink" : "text-muted hover:text-ink"
          }`}
        >
          {t.label}
          {t.count ? <span className="ml-1.5 text-xs font-semibold text-brass-deep">{t.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

/** Search field in a rounded pill, with optional extra buttons on the right. */
export function SearchPill({
  value,
  onChange,
  placeholder = "Search",
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  children?: React.ReactNode;
}) {
  return (
    <label className="flex h-14 items-center gap-3 rounded-full border border-line bg-paper px-5 shadow-[0_2px_12px_rgba(33,27,26,0.05)] focus-within:border-brass">
      <Icon name="search" className="size-5 shrink-0 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted/70"
      />
      {children}
    </label>
  );
}

type Tone = "gold" | "amber" | "green" | "ink" | "sand" | "red";
const PILL: Record<Tone, string> = {
  gold: "bg-[#f1dfa6] text-[#5e430c]",
  amber: "bg-[#efc9a4] text-[#6e370e]",
  green: "bg-[#d6e8d6] text-[#245631]",
  ink: "bg-ink text-paper",
  sand: "bg-sand text-ink-soft",
  red: "bg-temple/15 text-temple",
};

export function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[0.78rem] font-semibold ${PILL[tone]}`}>{children}</span>;
}

/** Shopify-style payment and delivery pills for an order status. */
export function orderPills(status: OrderStatus): { tone: Tone; label: string }[] {
  if (status === "cancelled") return [{ tone: "red", label: "Cancelled" }];
  const payment = status === "new" || status === "confirmed" ? { tone: "amber" as const, label: "Payment pending" } : { tone: "green" as const, label: "Paid" };
  const delivery =
    status === "new"
      ? { tone: "gold" as const, label: "To confirm" }
      : status === "confirmed" || status === "paid"
        ? { tone: "gold" as const, label: "Unfulfilled" }
        : status === "packed"
          ? { tone: "gold" as const, label: "Packed" }
          : status === "shipped"
            ? { tone: "ink" as const, label: "Shipped" }
            : { tone: "sand" as const, label: "Delivered" };
  return [delivery, payment];
}

export function OrderPills({ status }: { status: OrderStatus }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {orderPills(status).map((p) => (
        <Pill key={p.label} tone={p.tone}>
          {p.label}
        </Pill>
      ))}
    </span>
  );
}

export const dayFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });
export const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" });
export const fullFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

/** "2h ago", "Yesterday" or "24 Oct" */
export function ago(iso: string, now: number) {
  const m = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  if (m < 60 * 24) return `${Math.round(m / 60)}h ago`;
  if (m < 60 * 48) return "Yesterday";
  return dayFmt.format(new Date(iso));
}

/** Customers are grouped by phone number, so the same person counts once. */
export const customerKey = (phone: string) => phone.replace(/\D/g, "").slice(-10);
