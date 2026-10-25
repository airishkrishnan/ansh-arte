# Ansh Arte: going live

Everything here is on free plans. Allow about 45 minutes the first time. Do the steps in order.

## 1. Supabase (database, photos, admin login)

1. Sign up at [supabase.com](https://supabase.com) and create a **new project**.
   - Name: `ansh-arte`. Region: **Mumbai** (closest to your customers).
   - Save the database password somewhere safe.
2. Open **SQL Editor → New query**. Paste all of [`supabase/schema.sql`](supabase/schema.sql) and press **Run**.
3. Open a new query, paste all of [`supabase/seed.sql`](supabase/seed.sql) and press **Run**. This adds Earrings (Hoops, Jhumkas, Dangles, Studs), Rings and all your collections.
4. Create your admin login: **Authentication → Users → Add user → Create new user**. Enter your email and a strong password, and tick **Auto confirm user**.
5. Make that login an admin. In **SQL Editor**, run (with your email):

   ```sql
   insert into admins (email) values ('your-email@example.com');
   ```

6. Stop strangers from creating accounts: **Authentication → Sign In / Providers**, turn off **Allow new users to sign up**.
7. Copy your keys from **Project Settings → API** (or **API Keys**):
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Publishable key** (or the older **anon public** key) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

   Never use the secret / service role key anywhere in this project.

## 2. Order notifications on your phone (ntfy)

1. Install **ntfy** from the Play Store or App Store.
2. Make up a private topic name that nobody could guess, for example `ansh-arte-orders-7f3k9q2m`.
3. In the app, tap **+** and subscribe to that topic name.
4. Keep the name for the next step (`NTFY_TOPIC`). Every new order now pings your phone; tapping the notification opens the order in your admin.

## 3. Cloudflare (hosting the website)

1. Sign up at [cloudflare.com](https://dash.cloudflare.com/sign-up).
2. Go to **Workers & Pages → Create → Import a repository**, connect GitHub and choose `ansh-arte`.
3. Build settings:
   - Build command: `npx opennextjs-cloudflare build`
   - Deploy command: `npx opennextjs-cloudflare deploy`
4. Add **build variables** (needed while building):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (your site address, for example `https://ansh-arte.<your-name>.workers.dev`, no slash at the end)
5. Deploy. After the first deploy, open the Worker's **Settings → Variables and Secrets** and add the same three values again, plus `NTFY_TOPIC` as a **secret**. Redeploy once.
6. Open your site. Then open `/admin` on your phone, sign in, and use the browser menu → **Add to Home screen** so the admin opens like an app.

Every time new code is merged into `main` on GitHub, Cloudflare rebuilds the site automatically.

## 4. Keep the free database awake

Free Supabase projects pause after 7 days with no visits. In GitHub, open the repo → **Settings → Secrets and variables → Actions → Variables** and add `SITE_URL` with your site address. A small daily job then visits the store so it never pauses.

## 5. Your own domain (optional, about ₹800–1,000 a year)

Buy a domain (for example `anshharte.com` or `anshharte.in`) from any registrar, or Cloudflare Registrar for `.com`. In Cloudflare, add it under the Worker's **Settings → Domains & Routes → Add custom domain**, then change `NEXT_PUBLIC_SITE_URL` (both places) and `SITE_URL` to the new address and redeploy.

## 6. Get found on Google (free)

1. [Google Search Console](https://search.google.com/search-console): add your site, verify it, and submit `https://your-site/sitemap.xml`.
2. [Google Business Profile](https://business.google.com): create a profile for Ansh Arte with your WhatsApp number and website.
3. [Google Merchant Center](https://merchants.google.com): add your site for free product listings in the Google Shopping tab. Product pages already include the price, stock and photo data Google needs.

## Daily use

- **Add a product:** Admin → Products → **+ Add**. Take or choose photos, pick category, collection and material, set price and stock, save.
- **New order:** you get a notification and the customer's WhatsApp message. Open the order → **Confirm order** → **Send update on WhatsApp** (the message includes the UPI payment link).
- **Payment received:** **Mark as paid** (stock goes down automatically) → **Mark as packed** → choose courier, type the tracking number → **Mark as shipped** → **Send update on WhatsApp**.
- **Settings:** change the WhatsApp number, UPI ID, shipping fee, free-shipping amount and the announcement bar any time.

## Running it on a computer (for developers)

```bash
npm install
cp .env.example .env.local   # fill in your Supabase keys
npm run dev                  # http://localhost:3000
```

Without Supabase keys the store shows sample products so the design can be reviewed. `npm run preview` runs the real Cloudflare build locally.
