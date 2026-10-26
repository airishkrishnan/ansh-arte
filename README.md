# Ansh Arte

Online store for Ansh Arte: handcrafted oxidised brass and German silver jewellery.

Customers browse and order on the website, the order is sent to Ansh Arte on WhatsApp, and they pay by UPI (GPay, PhonePe, Paytm). A phone-friendly admin manages products, photos, orders, courier tracking and settings.

**To put the site live, follow [SETUP.md](SETUP.md).**

## How it is built

| Part | Tool | Cost |
| --- | --- | --- |
| Website | Next.js 16 + Tailwind CSS | Free |
| Hosting | Cloudflare Workers (via OpenNext) | Free |
| Database, photos, admin and customer logins | Supabase | Free |
| Sign-in code emails | Brevo | Free |
| Order notifications | ntfy (or Telegram) | Free |

## Where things are

- `src/app/(store)` storefront pages: home, categories, collections, products, checkout, order and tracking pages, info pages
- `src/app/(store)/account` customer accounts: sign-in, my orders, wishlist, profile and addresses
- `src/app/admin` admin app: orders, products, catalogue, settings
- `src/app/api` order placement and order lookup
- `src/lib` data access, order logic, shared helpers
- `src/components` UI components
- `src/data/catalogue.json` starting categories and collections (`node scripts/generate-seed.mjs` turns it into `supabase/seed.sql`)
- `supabase/schema.sql` database tables, security rules and order functions

Prices and stock are always checked in the database when an order is placed, so a customer cannot change the price in their browser. Orders are only visible to admins, and a customer's order page needs its private link. Signed-in customers see only their own orders, wishlist and addresses (enforced by database security rules).
