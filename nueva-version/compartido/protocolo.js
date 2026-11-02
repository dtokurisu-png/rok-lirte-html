// Único código compartido con el navegador: contrato; no reglas de combate.
export const PROTOCOL_VERSION = 1;
export const EVENTS = Object.freeze({ HELLO: 'rok:hello', CREATE_SESSION: 'rok:session:create' });
export function validEncounterRequest(payload) {
  return Boolean(payload && typeof payload === 'object' && !Array.isArray(payload) &&
    Object.keys(payload).length === 1 && typeof payload.encounterId === 'string' &&
    /^[a-z0-9][a-z0-9-]{0,63}$/.test(payload.encounterId));
}
