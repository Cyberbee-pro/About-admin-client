import { Experience, ExperiencePosition, ExperienceTag, ExperienceType } from "@/lib/api/types";

/**
 * Formats a Date object or ISO date string into "dd/mm/yy" display format using UTC methods.
 * Returns placeholder "dd/mm/yy" when missing or invalid.
 */
export function formatDateDisplay(dateInput?: string | Date | null): string {
  if (!dateInput) return "dd/mm/yy";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "dd/mm/yy";

  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yearTwoDigits = String(d.getUTCFullYear()).slice(-2);

  return `${day}/${month}/${yearTwoDigits}`;
}

/**
 * Parses user date input in "dd/mm/yy", "dd/mm/yyyy", or ISO formats into a standardized UTC ISO string.
 * Interprets two-digit years as 20yy (e.g. 24 -> 2024, 99 -> 2099).
 * Validates calendar days and months strictly using UTC to avoid timezone shifts.
 */
export function parseDateInput(input: string): {
  isValid: boolean;
  isoString?: string;
  error?: string;
} {
  const trimmed = input.trim();
  if (!trimmed) {
    return { isValid: false, error: "Date is required" };
  }

  // Check for dd/mm/yy or dd/mm/yyyy
  const slashDashMatch = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2}|\d{4})$/);
  if (slashDashMatch) {
    const day = parseInt(slashDashMatch[1], 10);
    const month = parseInt(slashDashMatch[2], 10);
    let year = parseInt(slashDashMatch[3], 10);

    if (year < 100) {
      year += 2000; // Interpret two-digit year as 20yy
    }

    if (month < 1 || month > 12) {
      return { isValid: false, error: "Month must be between 01 and 12" };
    }

    if (day < 1 || day > 31) {
      return { isValid: false, error: "Day must be between 01 and 31" };
    }

    const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    // Verify calendar round-trip (e.g. Feb 31 would roll over to March in JS)
    if (
      utcDate.getUTCFullYear() !== year ||
      utcDate.getUTCMonth() !== month - 1 ||
      utcDate.getUTCDate() !== day
    ) {
      return { isValid: false, error: "Invalid calendar date (day out of range for month/year)" };
    }

    return { isValid: true, isoString: utcDate.toISOString() };
  }

  // Check for ISO / YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);

    const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    if (
      utcDate.getUTCFullYear() !== year ||
      utcDate.getUTCMonth() !== month - 1 ||
      utcDate.getUTCDate() !== day
    ) {
      return { isValid: false, error: "Invalid calendar date" };
    }

    return { isValid: true, isoString: utcDate.toISOString() };
  }

  return {
    isValid: false,
    error: "Invalid date format. Use dd/mm/yy (e.g. 24/10/25)",
  };
}

/**
 * Determines the row background color of an experience:
 * - lime: The experience has at least one active position (isCurrent === true)
 * - red: The experience has no active positions
 */
export function getExperienceRowColor(exp: Experience): "lime" | "red" {
  const hasCurrent = Boolean(
    exp.positions && exp.positions.some((p) => p.isCurrent === true)
  );
  return hasCurrent ? "lime" : "red";
}

/**
 * Derives the latest position for an experience:
 * 1. Checks for any position with isCurrent === true.
 * 2. If none, picks the position with the latest endDate or startDate.
 */
export function getLatestPosition(exp: Experience): ExperiencePosition | null {
  if (!exp.positions || exp.positions.length === 0) return null;

  const current = exp.positions.find((p) => p.isCurrent === true);
  if (current) return current;

  const sorted = [...exp.positions].sort((a, b) => {
    const aDate = a.endDate ? new Date(a.endDate).getTime() : new Date(a.startDate).getTime();
    const bDate = b.endDate ? new Date(b.endDate).getTime() : new Date(b.startDate).getTime();
    return bDate - aDate;
  });

  return sorted[0];
}

export interface PositionFormState {
  _id?: string;
  position: string;
  description: string;
  startDateInput: string;
  endDateInput: string;
  isCurrent: boolean;
  existingMediaUrls: string[];
  existingCertUrls: string[];
  stagedMediaFiles: File[];
  stagedCertFiles: File[];
}

export interface ExperienceFormValidation {
  isValid: boolean;
  error: string | null;
  invalidField?: string;
  invalidPositionIndex?: number;
}

/**
 * Validates full experience form state before creation or update.
 */
export function validateExperienceForm(data: {
  organization: string;
  tag: ExperienceTag;
  type: ExperienceType;
  hasIcon: boolean; // either staged icon file or existing iconUrl
  positions: PositionFormState[];
}): ExperienceFormValidation {
  const trimmedOrg = data.organization.trim();
  if (!trimmedOrg) {
    return {
      isValid: false,
      error: "Organization is required",
      invalidField: "organization",
    };
  }

  if (!data.hasIcon) {
    return {
      isValid: false,
      error: "Organization icon is required (upload via Icon tab)",
      invalidField: "iconUrl",
    };
  }

  if (!data.positions || data.positions.length === 0) {
    return {
      isValid: false,
      error: "At least one position is required",
      invalidField: "positions",
    };
  }

  for (let i = 0; i < data.positions.length; i++) {
    const pos = data.positions[i];
    const posTitle = pos.position.trim();
    if (!posTitle) {
      return {
        isValid: false,
        error: `Position title is required for position ${i + 1}`,
        invalidField: `position_${i}_title`,
        invalidPositionIndex: i,
      };
    }

    const posDesc = pos.description.trim();
    if (!posDesc) {
      return {
        isValid: false,
        error: `Description is required for position ${i + 1}`,
        invalidField: `position_${i}_description`,
        invalidPositionIndex: i,
      };
    }

    const startParsed = parseDateInput(pos.startDateInput);
    if (!startParsed.isValid || !startParsed.isoString) {
      return {
        isValid: false,
        error: `Invalid start date for position ${i + 1}: ${startParsed.error || "Required"}`,
        invalidField: `position_${i}_startDate`,
        invalidPositionIndex: i,
      };
    }

    if (!pos.isCurrent) {
      const endParsed = parseDateInput(pos.endDateInput);
      if (!endParsed.isValid || !endParsed.isoString) {
        return {
          isValid: false,
          error: `End date is required for position ${i + 1} unless set to present`,
          invalidField: `position_${i}_endDate`,
          invalidPositionIndex: i,
        };
      }

      const startMillis = new Date(startParsed.isoString).getTime();
      const endMillis = new Date(endParsed.isoString).getTime();
      if (endMillis < startMillis) {
        return {
          isValid: false,
          error: `End date cannot be earlier than start date for position ${i + 1}`,
          invalidField: `position_${i}_endDate`,
          invalidPositionIndex: i,
        };
      }
    }
  }

  return { isValid: true, error: null };
}
