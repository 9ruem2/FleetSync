export function parseCamps(input?: string): string[] {
  if (!input) return [];
  return input.split(',').map(c => c.trim()).filter(Boolean);
}

export function parseRoutes(input?: string): string[] {
  if (!input) return [];
  return input.split(',').map(r => r.trim()).filter(Boolean);
}
