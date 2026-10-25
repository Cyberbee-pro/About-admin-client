/**
 * Date and URL utility helpers for Certificates admin module.
 */

/**
 * Formats a date string or Date object into "dd/mm/yyyy" display format.
 * Returns placeholder "dd/mm/yyyy" when missing or invalid.
 */
export function formatCertificateDate(dateInput?: string | Date | null): string {
  if (!dateInput) return "dd/mm/yyyy";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "dd/mm/yyyy";
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Converts a date string or Date object into "YYYY-MM-DD" for HTML5 <input type="date">.
 * Uses UTC getters to prevent timezone-shift day drops.
 */
export function toDateInputValue(dateInput?: string | Date | null): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Validates credential URL: only "http://" and "https://" schemes are allowed.
 * Defends against "javascript:", "data:", "vbscript:", protocol-relative, etc.
 */
export function isValidCredentialUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
