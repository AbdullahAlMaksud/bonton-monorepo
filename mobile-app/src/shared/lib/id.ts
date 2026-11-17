let counter = 0;

/** Collision-resistant enough for local, offline-first ids (time + counter + random). */
export function createId(prefix = ''): string {
  counter = (counter + 1) % 1_679_616; // 36^4
  const time = Date.now().toString(36);
  const count = counter.toString(36).padStart(4, '0');
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}${time}${count}${random}`;
}
