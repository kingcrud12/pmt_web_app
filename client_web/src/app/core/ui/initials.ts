export function initials(firstName: string, lastName: string): string {
  return ((firstName?.[0] ?? '') + (lastName?.[0] ?? '')).toUpperCase();
}

const PALETTE = ['#14555F', '#B4531F', '#4A3F7A', '#3E6B4C', '#8A6510'];

export function avatarColor(id: string): string {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum = (sum + id.charCodeAt(i)) % 997;
  return PALETTE[sum % PALETTE.length];
}
