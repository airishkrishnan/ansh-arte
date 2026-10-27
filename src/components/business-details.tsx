import type { Settings } from "@/lib/types";

export const prettyPhone = (n: string) => n.replace(/^91(\d{5})(\d{5})$/, "+91 $1 $2");

/** Seller details that Indian e-commerce rules ask every online shop to show. */
export function BusinessDetails({ settings: s }: { settings: Settings }) {
  return (
    <ul>
      <li>
        <strong>Seller:</strong> Ansh Arte{s.legal_name && s.legal_name !== "Ansh Arte" ? ` (${s.legal_name})` : ""}
      </li>
      {s.business_address && (
        <li>
          <strong>Address:</strong> {s.business_address}
        </li>
      )}
      <li>
        <strong>Phone and WhatsApp:</strong> {prettyPhone(s.whatsapp_number)}
      </li>
      {s.support_email && (
        <li>
          <strong>Email:</strong> <a href={`mailto:${s.support_email}`}>{s.support_email}</a>
        </li>
      )}
      {s.gstin && (
        <li>
          <strong>GSTIN:</strong> {s.gstin}
        </li>
      )}
    </ul>
  );
}

/** Grievance officer block for the privacy and terms pages. */
export function GrievanceOfficer({ settings: s }: { settings: Settings }) {
  return (
    <>
      <p>
        If you have a complaint about an order, a product or how we handle your data, contact our grievance officer
        {s.grievance_officer ? <>, <strong>{s.grievance_officer}</strong></> : ""}:
      </p>
      <ul>
        <li>WhatsApp or phone: {prettyPhone(s.whatsapp_number)}</li>
        {s.support_email && (
          <li>
            Email: <a href={`mailto:${s.support_email}`}>{s.support_email}</a>
          </li>
        )}
        {s.business_address && <li>Post: {s.business_address}</li>}
      </ul>
      <p>We acknowledge every complaint within 48 hours and resolve it within one month.</p>
    </>
  );
}
