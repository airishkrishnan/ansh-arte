export type Material = "oxidised-brass" | "german-silver";

export const MATERIALS: { value: Material; label: string }[] = [
  { value: "oxidised-brass", label: "Oxidised brass" },
  { value: "german-silver", label: "German silver" },
];

export const materialLabel = (m: Material) =>
  MATERIALS.find((x) => x.value === m)?.label ?? m;

export type ProductImage = { url: string; thumb?: string; alt?: string };

export type Category = {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  sort: number;
  visible: boolean;
};

export type Collection = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  tagline: string;
  story: string;
  banner_url: string | null;
  sort: number;
  visible: boolean;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  collection_id: string | null;
  material: Material;
  price: number;
  compare_at_price: number | null;
  stock: number;
  description: string;
  details: string;
  care: string;
  images: ProductImage[];
  visible: boolean;
  featured: boolean;
  sort: number;
  created_at: string;
};

export type Settings = {
  whatsapp_number: string;
  upi_id: string;
  upi_name: string;
  gpay_number: string;
  shipping_fee: number;
  free_shipping_above: number;
  announcement: string;
  instagram: string;
};

export type OrderStatus =
  | "new"
  | "confirmed"
  | "paid"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

export const ORDER_STEPS: { status: OrderStatus; label: string; customer: string }[] = [
  { status: "new", label: "New", customer: "Order received" },
  { status: "confirmed", label: "Confirmed", customer: "Confirmed, awaiting payment" },
  { status: "paid", label: "Paid", customer: "Payment received" },
  { status: "packed", label: "Packed", customer: "Packed with care" },
  { status: "shipped", label: "Shipped", customer: "On its way" },
  { status: "delivered", label: "Delivered", customer: "Delivered" },
];

export const statusLabel = (s: OrderStatus) =>
  s === "cancelled" ? "Cancelled" : (ORDER_STEPS.find((x) => x.status === s)?.label ?? s);

export type OrderItem = {
  product_id: string;
  name: string;
  slug: string;
  price: number;
  qty: number;
  image: string;
  material: Material;
};

export type HistoryEntry = { status: OrderStatus; at: string };

export type Order = {
  id: string;
  number: string;
  access_key: string;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  payment_ref: string;
  courier: string;
  tracking_number: string;
  tracking_url: string;
  admin_notes: string;
  history: HistoryEntry[];
  created_at: string;
  updated_at: string;
};

export type PublicOrder = Pick<
  Order,
  | "number"
  | "customer_name"
  | "phone"
  | "address"
  | "city"
  | "state"
  | "pincode"
  | "items"
  | "subtotal"
  | "shipping"
  | "total"
  | "status"
  | "courier"
  | "tracking_number"
  | "tracking_url"
  | "history"
  | "created_at"
>;

export type Address = {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
};

/** An order as shown in the customer's account. `key` opens its order page. */
export type AccountOrder = Pick<
  Order,
  "number" | "status" | "total" | "items" | "courier" | "tracking_number" | "tracking_url" | "created_at"
> & { key: string };
