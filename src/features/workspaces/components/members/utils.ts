/** Extract first two letters of a full name as avatar initials. */
export function getInitials(name: string | undefined): string {
  if (!name) return '?'

  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}
