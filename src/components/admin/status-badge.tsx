import { statusLabel, type OrderStatus } from "@/lib/types";

const STYLES: Record<OrderStatus, string> = {
  new: "bg-brass-deep text-paper",
  confirmed: "bg-brass-soft text-brass-deep",
  paid: "bg-[#dfeadf] text-success",
  packed: "bg-[#dfeadf] text-success",
  shipped: "bg-ink text-paper",
  delivered: "bg-sand text-ink-soft",
  cancelled: "bg-temple/10 text-temple",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-block px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] ${STYLES[status]}`}>
      {statusLabel(status)}
    </span>
  );
}
