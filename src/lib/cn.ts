import { clsx } from 'clsx'
import type { ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Compose conditional classes (vanilla clsx).
 * ponytail: no merging here — use `cn` when class conflicts matter.
 */
export function tx(...inputs: ClassValue[]) {
  return clsx(inputs)
}

/**
 * Compose + merge Tailwind classes, later ones winning.
 * ponytail: default twMerge config. Custom color utilities (bg-primary etc.)
 * aren't in twMerge's scale, so named-color overrides rely on variant ordering —
 * use arbitrary values (bg-[#fff]) for hard overrides.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
