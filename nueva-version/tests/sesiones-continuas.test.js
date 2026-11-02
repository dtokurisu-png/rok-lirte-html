import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSession,getSessionState,performSessionAction,tickSessions,releaseSessions} from '../backend/src/sesiones.js';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const encounter=read('../datos/json/encuentros/kiara.json'),player=read('../datos/json/kasters/lioren.json'),
rival=read('../datos/json/kasters/kiara.json'),catalog=read('../datos/json/invocaciones/prototipos.json').units;
test('sesión aislada: invocar, deduplicar y prohibir órdenes ajenas',()=>{
 const {session}=createSession('owner-1',encounter,player,rival,catalog);
 const action={sessionId:session.id,actionId:'summon-shield-001',type:'summon',cardId:'shield'};
 const r=performSessionAction('owner-1',action);
 assert.equal(r.ok,true);assert.equal(r.state.units.length,1);
 assert.deepEqual(performSessionAction('owner-1',action),r);
 assert.equal(getSessionState('owner-1',session.id).state.units.length,1);
 assert.equal(performSessionAction('intruso',{...action,actionId:'action-other-002'}).error,'session-not-found');
 assert.equal(performSessionAction('owner-1',{...action,actionId:'action-other-002',cardId:'missing'}).error,'unknown-card');
 releaseSessions('owner-1');
 assert.equal(getSessionState('owner-1',session.id).error,'session-not-found');
});
test('tick del servidor avanza la simulación y emite eventos sin turnos',()=>{
 const {session}=createSession('owner-2',encounter,player,rival,catalog);
 performSessionAction('owner-2',{sessionId:session.id,actionId:'summon-shield-002',type:'summon',cardId:'shield'});
 let events=[];
 for(let i=0;i<12;i++)events.push(...tickSessions(100).filter(u=>u.sessionId===session.id).flatMap(x=>x.events));
 const reply=getSessionState('owner-2',session.id);
 assert.equal(reply.state.elapsedMs,1200);assert.equal(reply.state.turn,undefined);
 assert.ok(reply.state.units.length>=2);
 assert.ok(events.some(e=>e.type==='unit.moved'));
 assert.ok(events.some(e=>e.type==='unit.summoned'&&e.side===2));
 releaseSessions('owner-2');
});
