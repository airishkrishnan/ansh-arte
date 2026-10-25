"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <label className="relative flex items-center">
      <span className="sr-only">Sort by</span>
      <select
        value={value}
        onChange={(e) => {
          const p = new URLSearchParams(params.toString());
          if (e.target.value === "new") p.delete("sort");
          else p.set("sort", e.target.value);
          const s = p.toString();
          router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
        }}
        className="cursor-pointer appearance-none bg-transparent pr-5 text-xs font-semibold uppercase tracking-[0.14em] focus:outline-none"
      >
        <option value="new">Newest</option>
        <option value="price-asc">Price ↑</option>
        <option value="price-desc">Price ↓</option>
      </select>
      <span className="pointer-events-none absolute right-0 text-[0.6rem]">▼</span>
    </label>
  );
}
