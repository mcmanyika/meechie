export function createId(prefix: string) {
  const bytes = crypto.randomUUID().replaceAll("-", "").slice(0, 10);
  return `${prefix}_${bytes}`;
}

export function stamp(now = new Date().toISOString()) {
  return { createdAt: now, updatedAt: now };
}
