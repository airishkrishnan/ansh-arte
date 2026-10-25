import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// No incremental cache: storefront pages read Supabase on each request,
// so admin changes show up instantly and no paid R2 bucket is needed.
export default defineCloudflareConfig({});
