export type SearchItem = {
  slug: string;
  name: string;
  price: number;
  image: string | null;
  /** Collection, style and metal, shown under the name */
  meta: string;
  /** Lower-case text the query is matched against */
  text: string;
};

/** Every word of the query must appear somewhere in the item ("silver jhumka", "brass ring"). */
export function searchItems<T extends { text: string; name: string }>(items: T[], query: string) {
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/s$/, ""))
    .filter(Boolean);
  if (!words.length) return [];
  return items
    .filter((i) => words.every((w) => i.text.includes(w)))
    .sort((a, b) => Number(b.name.toLowerCase().includes(words[0])) - Number(a.name.toLowerCase().includes(words[0])));
}
