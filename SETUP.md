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

6. Leave **Authentication → Sign In / Providers → Allow new users to sign up** turned **on**, so customers can create accounts. Only emails in the `admins` table can open `/admin`, so customers can never get in there.
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

## 4. Customer accounts (sign in with an email code or Google)

Customers can create an account to see all their orders, keep a wishlist and save addresses. Ordering as a guest still works. Allow about 30 minutes.

**A. Update the database (2 minutes).** In Supabase, open **SQL Editor → New query**, paste all of [`supabase/schema.sql`](supabase/schema.sql) again and press **Run**. It is safe to run again: it only adds what is new and keeps your products and orders.

**B. Tell Supabase your site address.** **Authentication → URL Configuration**:
- **Site URL**: your site address, for example `https://ansh-arte.anshartee.workers.dev`
- **Redirect URLs → Add URL**: the same address followed by `/**` (for example `https://ansh-arte.anshartee.workers.dev/**`)

**C. Send sign-in emails for free with Brevo (10 minutes).** Supabase's own email only sends a couple of emails an hour, which is just for testing.
1. Sign up at [brevo.com](https://www.brevo.com) (free: 300 emails a day).
2. In Brevo, open **Senders, domains & dedicated IPs → Senders → Add a sender** and verify the email you want customers to see (for example your business Gmail).
3. Open **SMTP & API → SMTP** and click **Generate a new SMTP key**. Keep the page open.
4. In Supabase, open **Authentication → Emails → SMTP Settings**, turn on **Enable custom SMTP** and fill in:
   - Sender email: the email you verified in step 2. Sender name: `Ansh Arte`
   - Host: `smtp-relay.brevo.com`, Port: `587`
   - Username: the **Login** shown on Brevo's SMTP page. Password: the SMTP key.
5. In Supabase, open **Authentication → Rate Limits** and set **emails per hour** to `100`.

**D. Put the 6-digit code in the emails.** In Supabase, open **Authentication → Emails → Templates**. In **both** the **Magic Link** and the **Confirm signup** templates, set the subject to `Your Ansh Arte sign-in code` and replace the message with:

```html
<h2>Your Ansh Arte sign-in code</h2>
<p>Enter this code on the website:</p>
<p style="font-size:28px;letter-spacing:6px"><strong>{{ .Token }}</strong></p>
<p>Or <a href="{{ .ConfirmationURL }}">tap here to sign in</a> on this phone.</p>
<p>If you didn't ask for this, you can ignore this email.</p>
```

Now try it: open your site, tap the person icon at the top, enter your email and type the code you receive.

**E. Add "Continue with Google" (optional, free, 15 minutes).**
1. Open [console.cloud.google.com](https://console.cloud.google.com), create a project called `Ansh Arte`.
2. **APIs & Services → OAuth consent screen**: choose **External**, app name `Ansh Arte`, your email as support and developer contact. Save. Then **Publish app**.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**: type **Web application**. Under **Authorized redirect URIs** add `https://<your-project>.supabase.co/auth/v1/callback` (Supabase shows this exact address on its Google page in the next step). Create, then copy the **Client ID** and **Client secret**.
4. In Supabase, **Authentication → Sign In / Providers → Google**: turn it on, paste the Client ID and secret, save.
5. In Cloudflare, add the build variable `NEXT_PUBLIC_GOOGLE_SIGNIN` with the value `on` and redeploy. The Google button appears on the sign-in page.

**Good to know.** A customer's earlier guest orders appear in their account when they used the same email at checkout. Customers can delete their account themselves from **Profile & addresses**; their orders stay in your admin.

## 5. Keep the free database awake

Free Supabase projects pause after 7 days with no visits. In GitHub, open the repo → **Settings → Secrets and variables → Actions → Variables** and add `SITE_URL` with your site address. A small daily job then visits the store so it never pauses.

## 6. Your own domain (optional, about ₹800–1,000 a year)

Buy a domain (for example `anshharte.com` or `anshharte.in`) from any registrar, or Cloudflare Registrar for `.com`. In Cloudflare, add it under the Worker's **Settings → Domains & Routes → Add custom domain**, then change `NEXT_PUBLIC_SITE_URL` (both places) and `SITE_URL` to the new address and redeploy.

## 7. Get found on Google (free)

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
