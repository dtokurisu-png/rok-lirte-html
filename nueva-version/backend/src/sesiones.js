import {randomUUID} from 'node:crypto';
import {createAdventureInitialState,projectAdventureState} from '../../motor/estado.js';
import {advanceBattle,summon,TICK_MS} from '../../motor/simulacion.js';
const sessions=new Map();
const MAX_SESSIONS=100,MAX_AGE_MS=60*60*1000,DEDUPE_LIMIT=64;
function prune(now=Date.now()){
  for(const [id,entry] of sessions)
    if(now-entry.createdAt>=MAX_AGE_MS)sessions.delete(id);
}
export function createSession(ownerId,encounter,player,rival,catalog){
  prune();
  if(sessions.size>=MAX_SESSIONS)return {ok:false,error:'server-capacity'};
  const state=createAdventureInitialState(encounter,player,rival,catalog);
  const id=randomUUID(),now=Date.now();
  sessions.set(id,{ownerId,state,createdAt:now,requests:new Map()});
  return {ok:true,session:{id,...projectAdventureState(state),createdAt:new Date(now).toISOString()}};
}
function authorized(ownerId,sessionId){
  prune();
  const entry=sessions.get(sessionId);
  return entry?.ownerId===ownerId?entry:null;
}
export function getSessionState(ownerId,sessionId){
  const entry=authorized(ownerId,sessionId);
  return entry?{ok:true,sessionId,state:projectAdventureState(entry.state)}:
    {ok:false,error:'session-not-found'};
}
export function performSessionAction(ownerId,request){
  const entry=authorized(ownerId,request.sessionId);
  if(!entry)return {ok:false,error:'session-not-found'};
  if(entry.requests.has(request.actionId))return structuredClone(entry.requests.get(request.actionId));
  const answer=summon(entry.state,1,request.cardId);
  if(!answer.ok)return {ok:false,error:answer.error};
  entry.state=answer.state;
  const result={ok:true,sessionId:request.sessionId,state:projectAdventureState(answer.state),events:answer.events};
  entry.requests.set(request.actionId,result);
  if(entry.requests.size>DEDUPE_LIMIT)entry.requests.delete(entry.requests.keys().next().value);
  return structuredClone(result);
}
export function tickSessions(dtMs=TICK_MS){
  prune();
  const updates=[];
  for(const [sessionId,entry] of sessions){
    if(entry.state.status!=='active')continue;
    const update=advanceBattle(entry.state,dtMs);
    if(update.state===entry.state)continue;
    entry.state=update.state;
    updates.push({sessionId,ownerId:entry.ownerId,
      state:projectAdventureState(update.state),events:update.events});
  }
  return updates;
}
export function releaseSessions(ownerId){
  for(const [id,entry] of sessions)
    if(entry.ownerId===ownerId)sessions.delete(id);
}
