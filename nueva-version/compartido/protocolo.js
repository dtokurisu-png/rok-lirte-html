// Contrato de red: no se permite enviar dano, vida ni posiciones autoritativas.
export const PROTOCOL_VERSION = 3;
export const EVENTS = Object.freeze({
  HELLO:'rok:hello', CREATE_SESSION:'rok:session:create',GET_STATE:'rok:session:state',
  ACTION:'rok:combat:action', SYNC:'rok:combat:sync'
});
const exact=(obj,keys)=>obj && typeof obj==='object' && !Array.isArray(obj) &&
  Object.keys(obj).length===keys.length && keys.every(key=>Object.hasOwn(obj,key));
const uuid = id => typeof id==='string' && /^[a-f0-9]{8}-[a-f0-9-]{27,40}$/i.test(id);
export function validEncounterRequest(payload){
  return Boolean(exact(payload,['encounterId']) && typeof payload.encounterId==='string' &&
    /^[a-z0-9][a-z0-9-]{0,63}$/.test(payload.encounterId));
}
export function validStateRequest(payload){
  return Boolean(exact(payload,['sessionId']) && uuid(payload.sessionId));
}
export function validActionRequest(payload){
  return Boolean(exact(payload,['sessionId','actionId','type','cardId']) &&
    uuid(payload.sessionId) && typeof payload.actionId==='string' &&
    /^[a-zA-Z0-9_-]{8,80}$/.test(payload.actionId) && payload.type==='summon' &&
    typeof payload.cardId==='string' && /^[a-z][a-z0-9-]{0,48}$/.test(payload.cardId));
}
