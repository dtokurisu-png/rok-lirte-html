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
  const keys=payload && typeof payload==='object' && !Array.isArray(payload) && Object.keys(payload);
  const legacyPrototype=keys && keys.length===1 && keys[0]==='encounterId';
  const shape=keys && keys.length===2 && keys.includes('encounterId') &&
    keys.includes('playerSpellbookCardIds');
  const ids=payload?.playerSpellbookCardIds;
  return Boolean((shape||legacyPrototype) && typeof payload.encounterId==='string' &&
    /^[a-z0-9][a-z0-9-]{0,63}$/.test(payload.encounterId) &&
    (legacyPrototype || (Array.isArray(ids) && ids.length<=30 &&
    ids.every(id=>typeof id==='string' && /^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(id)))));
}
export function validStateRequest(payload){
  return Boolean(exact(payload,['sessionId']) && uuid(payload.sessionId));
}
export function validActionRequest(payload){
  return Boolean(exact(payload,['sessionId','actionId','type','cardId']) &&
    uuid(payload.sessionId) && typeof payload.actionId==='string' &&
    /^[a-zA-Z0-9_-]{8,80}$/.test(payload.actionId) && payload.type==='summon' &&
    typeof payload.cardId==='string' && /^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(payload.cardId));
}
