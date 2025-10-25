/**
 * Format a price with thousand separators and 2 decimal places
 * @param price - The price as string or number
 * @returns Formatted price string (e.g., "1,234.56")
 */
export function formatPrice(price: string | number): string {
  return parseFloat(String(price)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Format a number with thousand separators (no forced decimals)
 * @param value - The value to format
 * @returns Formatted number string
 */
export function formatNumberWithCommas(value: string | number): string {
  // Remove any existing commas and non-numeric characters except decimal point
  const cleanValue = String(value).replace(/[^\d.]/g, '');
  
  if (!cleanValue) return '';
  
  // Split by decimal point
  const parts = cleanValue.split('.');
  
  // Add commas to the integer part
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // Join back with decimal if exists
  return parts.join('.');
}

/**
 * Remove commas and return a clean number string
 * @param value - The formatted string with commas
 * @returns Clean number string
 */
export function parseFormattedNumber(value: string): string {
  return value.replace(/,/g, '');
}

/**
 * Handle number input - only allow digits and decimal point
 * @param value - Input value
 * @param allowDecimal - Whether to allow decimal points
 * @returns Cleaned numeric string
 */
export function sanitizeNumberInput(value: string, allowDecimal: boolean = false): string {
  if (allowDecimal) {
    // Allow digits and single decimal point
    return value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
  }
  // Only allow digits
  return value.replace(/\D/g, '');
}

/**
 * Handle phone number input - only allow digits
 * @param value - Input value
 * @returns Cleaned phone number string
 */
export function sanitizePhoneInput(value: string): string {
  // Only allow digits
  return value.replace(/\D/g, '');
}

/**
 * Check if a value is different from the original (for preventing duplicate submissions)
 * @param newValue - New value
 * @param originalValue - Original value
 * @returns True if values are different
 */
export function hasValueChanged(newValue: string | number, originalValue: string | number): boolean {
  return String(newValue).trim() !== String(originalValue).trim();
}

/**
 * Validate if a name/text field has meaningful changes
 * @param newValue - New value
 * @param originalValue - Original value
 * @returns True if the value has changed meaningfully
 */
export function hasMeaningfulChange(newValue: string, originalValue: string): boolean {
  const cleanNew = newValue.trim().toLowerCase();
  const cleanOriginal = originalValue.trim().toLowerCase();
  
  return cleanNew !== cleanOriginal && cleanNew.length > 0;
}
