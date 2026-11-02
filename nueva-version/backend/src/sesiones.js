import { randomUUID } from 'node:crypto';
import { createAdventureInitialState, projectAdventureState } from '../../motor/estado.js';
import { resolveCombatAction } from '../../motor/combate.js';
import { resolveAdventureBotTurn } from '../../motor/ia.js';
const sessions = new Map();
const MAX_SESSIONS = 100;
const MAX_AGE_MS = 60 * 60 * 1000;
const DEDUPE_LIMIT = 64;
function prune(now = Date.now()) {
  for (const [id, entry] of sessions)
    if (now - entry.createdAt >= MAX_AGE_MS) sessions.delete(id);
}
export function createSession(ownerId, encounter, player, rival) {
  prune();
  if (sessions.size >= MAX_SESSIONS) return {ok:false,error:'server-capacity'};
  const state = createAdventureInitialState(encounter,player,rival);
  const id = randomUUID();
  const now = Date.now();
  sessions.set(id,{ownerId,state,createdAt:now,requests:new Map()});
  return {ok:true,session:{id,...projectAdventureState(state),createdAt:new Date(now).toISOString()}};
}
function authorized(id,ownerId) {
  prune();
  const found = sessions.get(id);
  return found?.ownerId === ownerId ? found : null;
}
export function getSessionState(ownerId, sessionId) {
  const entry = authorized(sessionId,ownerId);
  return entry ? {ok:true,sessionId,state:projectAdventureState(entry.state)} :
    {ok:false,error:'session-not-found'};
}
export function performSessionAction(ownerId,request) {
  const entry = authorized(request.sessionId,ownerId);
  if (!entry) return {ok:false,error:'session-not-found'};
  if (entry.requests.has(request.actionId)) return structuredClone(entry.requests.get(request.actionId));
  if (request.expectedRevision !== entry.state.revision)
    return {ok:false,error:'stale-revision',state:projectAdventureState(entry.state)};
  const output = resolveCombatAction(entry.state,1,request);
  if (!output.ok) return {ok:false,error:output.error,state:projectAdventureState(entry.state)};
  let next = output.state, events = output.events;
  if (next.status === 'active' && next.turn.side === 2) {
    const bot = resolveAdventureBotTurn(next);
    next = bot.state;
    events = [...events,...bot.events];
  }
  entry.state = next;
  const result = {ok:true,sessionId:request.sessionId,state:projectAdventureState(next),events};
  entry.requests.set(request.actionId,result);
  if (entry.requests.size > DEDUPE_LIMIT) entry.requests.delete(entry.requests.keys().next().value);
  return structuredClone(result);
}
export function releaseSessions(ownerId) {
  for (const [id,entry] of sessions) if (entry.ownerId === ownerId) sessions.delete(id);
}
