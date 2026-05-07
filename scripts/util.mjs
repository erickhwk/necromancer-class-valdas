/**
 * Pick the single client that should run a side-effect for a given actor,
 * to avoid duplicate writes when multiple clients have the actor loaded.
 * Prefers the actor's primary online player owner; falls back to active GM.
 */
export function getPrimaryHandlerId(actor) {
  const playerOwners = game.users.filter(
    u => !u.isGM && u.active && actor.testUserPermission(u, "OWNER")
  );
  if (playerOwners.length > 0) {
    return [...playerOwners].sort((a, b) => a.id.localeCompare(b.id))[0].id;
  }
  const activeGMs = game.users.filter(u => u.isGM && u.active);
  return activeGMs.length > 0
    ? [...activeGMs].sort((a, b) => a.id.localeCompare(b.id))[0].id
    : null;
}

/**
 * Pick a single GM client to act on cross-actor side effects that need
 * OWNER-level permission on actors the local user doesn't own.
 * Returns the lowest-id active GM, or null if none online.
 */
export function getPrimaryGmId() {
  const activeGMs = game.users.filter(u => u.isGM && u.active);
  if (activeGMs.length === 0) return null;
  return [...activeGMs].sort((a, b) => a.id.localeCompare(b.id))[0].id;
}

/**
 * Distance in scene units (typically feet) between two tokens.
 * Uses the canvas grid's measurePath when available; falls back to raw
 * pythagorean distance scaled by grid distance.
 */
export function measureDistance(tokenA, tokenB) {
  const a = tokenA?.center ?? { x: tokenA?.x, y: tokenA?.y };
  const b = tokenB?.center ?? { x: tokenB?.x, y: tokenB?.y };
  if (a?.x == null || b?.x == null) return Infinity;
  if (canvas.grid?.measurePath) {
    const result = canvas.grid.measurePath([a, b]);
    return result?.distance ?? 0;
  }
  const size = canvas.grid?.size ?? 100;
  const sceneDist = canvas.scene?.grid?.distance ?? 5;
  const dx = (a.x - b.x) / size;
  const dy = (a.y - b.y) / size;
  return Math.hypot(dx, dy) * sceneDist;
}
