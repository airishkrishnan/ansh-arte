import Script from "next/script";
import { GA_ID } from "@/lib/analytics";

const CF_BEACON = process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN ?? "";

/**
 * Visitor analytics for the store (never the admin). Google Analytics 4 when
 * NEXT_PUBLIC_GA_ID is set, and/or cookie-free Cloudflare Web Analytics when
 * NEXT_PUBLIC_CF_ANALYTICS_TOKEN is set.
 */
export function Analytics() {
  return (
    <>
      {GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}');`}
          </Script>
        </>
      )}
      {CF_BEACON && (
        <Script
          src="https://static.cloudflareinsights.com/beacon.min.js"
          strategy="afterInteractive"
          data-cf-beacon={JSON.stringify({ token: CF_BEACON })}
        />
      )}
    </>
  );
}
