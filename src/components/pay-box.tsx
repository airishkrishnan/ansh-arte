"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

export function PayBox({
  upiLink,
  upiId,
  gpayNumber,
  amount,
}: {
  upiLink: string;
  upiId: string;
  gpayNumber: string;
  amount: string;
}) {
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    QRCode.toDataURL(upiLink, { margin: 1, width: 360, color: { dark: "#211b1a", light: "#fbf7f4" } })
      .then(setQr)
      .catch(() => {});
  }, [upiLink]);

  const copy = async (v: string) => {
    try {
      await navigator.clipboard.writeText(v);
      setCopied(v);
      setTimeout(() => setCopied(""), 1800);
    } catch {}
  };

  return (
    <div className="space-y-5">
      <a href={upiLink} className="btn btn-primary w-full md:hidden">
        Pay {amount} with UPI app
      </a>
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        {qr && (
          // eslint-disable-next-line @next/next/no-img-element -- generated QR code
          <img src={qr} alt="UPI payment QR code" className="size-44 border border-line bg-paper p-2" />
        )}
        <div className="w-full space-y-3 text-sm">
          <p className="text-ink-soft">Scan with GPay, PhonePe, Paytm or any UPI app. The amount and order number are filled in.</p>
          <div className="flex items-center justify-between gap-3 border border-line bg-paper px-3 py-2">
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.16em] text-muted">UPI ID</p>
              <p className="font-semibold">{upiId}</p>
            </div>
            <button type="button" onClick={() => copy(upiId)} className="text-xs font-semibold uppercase tracking-[0.14em] text-brass-deep">
              {copied === upiId ? "Copied" : "Copy"}
            </button>
          </div>
          {gpayNumber && (
            <div className="flex items-center justify-between gap-3 border border-line bg-paper px-3 py-2">
              <div>
                <p className="text-[0.72rem] uppercase tracking-[0.16em] text-muted">GPay number</p>
                <p className="font-semibold">{gpayNumber}</p>
              </div>
              <button type="button" onClick={() => copy(gpayNumber)} className="text-xs font-semibold uppercase tracking-[0.14em] text-brass-deep">
                {copied === gpayNumber ? "Copied" : "Copy"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
