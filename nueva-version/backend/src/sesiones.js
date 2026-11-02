import { randomUUID } from 'node:crypto';
import { createAdventureInitialState } from '../../motor/estado.js';
const sessions = new Map();
const MAX_SESSIONS = 100;
const MAX_AGE_MS = 60 * 60 * 1000;
export function createSession(ownerId, encounter, player, rival) {
  const now = Date.now();
  for (const [id, entry] of sessions)
    if (now - entry.createdAt >= MAX_AGE_MS) sessions.delete(id);
  if (sessions.size >= MAX_SESSIONS) return { ok:false, error:'server-capacity' };
  const state = createAdventureInitialState(encounter, player, rival);
  const id = randomUUID();
  const session = { id, ...state, createdAt: new Date(now).toISOString() };
  sessions.set(id, { ownerId, session, createdAt: now });
  return { ok:true, session };
}
export function releaseSessions(ownerId) {
  for (const [id, entry] of sessions)
    if (entry.ownerId === ownerId) sessions.delete(id);
}
