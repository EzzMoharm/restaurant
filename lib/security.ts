/**
 * Security & Input Filtering Utility for BiteFlow
 * Prevents HTML/XSS injection, and ensures input values are fully compatible
 * with their respective field types.
 */

/**
 * Strips HTML tags, script elements, and dangerous protocols to prevent XSS injection.
 */
export function sanitizeText(val: string): string {
    if (!val) return "";
    return val
        .replace(/<[^>]*>/g, "") // Strip HTML tags
        .replace(/javascript:/gi, "") // Strip javascript protocol
        .trim();
}

/**
 * Escapes characters for safe database storage and HTML rendering.
 */
export function escapeHtml(val: string): string {
    if (!val) return "";
    return val
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .replace(/\//g, "&#x2F;");
}

/**
 * Sanitizes alphanumeric codes (e.g., Coupon Codes).
 * Leaves only uppercase letters, numbers, and dashes.
 */
export function sanitizeCode(val: string): string {
    if (!val) return "";
    return val
        .toUpperCase()
        .replace(/[^A-Z0-9_-]/g, "")
        .trim();
}

/**
 * Sanitizes numeric positive decimal input strings (e.g., Price, Discount Value, Min Order Amount).
 * Allows only digits and one decimal point.
 */
export function sanitizeDecimal(val: string): string {
    if (!val) return "";
    // Remove all characters except digits and decimal point
    let cleaned = val.replace(/[^0-9.]/g, "");
    // Ensure only one decimal point exists
    const parts = cleaned.split(".");
    if (parts.length > 2) {
        cleaned = parts[0] + "." + parts.slice(1).join("");
    }
    return cleaned;
}

/**
 * Sanitizes numeric positive integer input strings (e.g., Max Uses, Quantity).
 * Allows only digits.
 */
export function sanitizeInteger(val: string): string {
    if (!val) return "";
    return val.replace(/[^0-9]/g, "");
}

/**
 * Sanitizes phone numbers.
 * Allows digits, plus, minus, spaces, and parentheses.
 */
export function sanitizePhone(val: string): string {
    if (!val) return "";
    return val.replace(/[^0-9+\s()-]/g, "");
}

/**
 * Sanitizes email addresses.
 * Converts to lowercase and removes invalid characters.
 */
export function sanitizeEmail(val: string): string {
    if (!val) return "";
    return val
        .toLowerCase()
        .replace(/[^a-z0-9@._-]/g, "")
        .trim();
}

/**
 * Sanitizes and validates URL strings (e.g., Image URLs).
 * Prevents javascript: protocols and strips whitespace.
 */
export function sanitizeUrl(val: string): string {
    if (!val) return "";
    const cleaned = val.trim();
    // Block javascript protocol
    if (/^javascript:/i.test(cleaned)) {
        return "";
    }
    return cleaned;
}
