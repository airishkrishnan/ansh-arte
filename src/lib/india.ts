export const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
];

/** City and state for a PIN code (free India Post lookup). Null if not found. */
export async function lookupPin(pin: string): Promise<{ city: string; state: string } | null> {
  if (!/^\d{6}$/.test(pin)) return null;
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
    const data = await res.json();
    const po = data?.[0]?.PostOffice?.[0];
    if (!po) return null;
    return {
      city: String(po.District ?? ""),
      state: STATES.find((s) => s.toLowerCase() === String(po.State).toLowerCase()) ?? "",
    };
  } catch {
    return null;
  }
}
