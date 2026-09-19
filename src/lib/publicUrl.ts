/**
 * Base address for links sent to patients. Uses NEXT_PUBLIC_APP_URL (the deployed site) when set,
 * so links work on the patient's phone even when the doctor is working on localhost.
 */
export function publicBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  if (configured) return configured;
  return typeof window !== "undefined" ? window.location.origin : "";
}
