// Contrato publico compartido. Nunca importar reglas, estado interno ni DOM aqui.
export const PROTOCOL_VERSION = 2;
export const EVENTS = Object.freeze({
  HELLO: 'rok:hello',
  CREATE_SESSION: 'rok:session:create',
  GET_STATE: 'rok:session:state',
  ACTION: 'rok:combat:action'
});
const own = (v, keys) => v && typeof v === 'object' && !Array.isArray(v) &&
  Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v, k));
const uuid = v => typeof v === 'string' &&
  /^[a-f0-9]{8}-[a-f0-9-]{27,40}$/i.test(v);
export function validEncounterRequest(payload) {
  return Boolean(own(payload, ['encounterId']) &&
    typeof payload.encounterId === 'string' &&
    /^[a-z0-9][a-z0-9-]{0,63}$/.test(payload.encounterId));
}
export function validStateRequest(payload) {
  return Boolean(own(payload, ['sessionId']) && uuid(payload.sessionId));
}
export function validActionRequest(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  const { sessionId, actionId, expectedRevision, type } = payload;
  if (!uuid(sessionId) || typeof actionId !== 'string' ||
      !/^[a-zA-Z0-9_-]{8,80}$/.test(actionId) ||
      !Number.isSafeInteger(expectedRevision) ||
      expectedRevision < 0 || expectedRevision > 1000000000) return false;
  if (type === 'move') return Boolean(own(payload, ['sessionId','actionId','expectedRevision','type','row','col']) &&
    Number.isInteger(payload.row) && Number.isInteger(payload.col));
  if (type === 'attack') return Boolean(own(payload, ['sessionId','actionId','expectedRevision','type','targetId']) &&
    typeof payload.targetId === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(payload.targetId));
  if (type === 'endTurn') return Boolean(own(payload, ['sessionId','actionId','expectedRevision','type']));
  return false;
}
