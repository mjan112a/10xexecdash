import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as currency with $ sign and commas
 * @param value The number to format
 * @returns Formatted currency string
 */
export function formatCurrency(value: number): string {
  // Handle negative values by wrapping them in parentheses
  if (value < 0) {
    return `($${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })})`;
  }
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Format a number as percentage with % sign
 * @param value The number to format
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number): string {
  if (value >= -1 && value <= 1 && value !== 0) {
    value = value * 100;
  }
  return `${value.toFixed(1)}%`;
}
