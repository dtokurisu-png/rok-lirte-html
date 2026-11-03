// Pruebas de arquitectura y contrato sin interfaz ni servidor desplegado.
// Ejecutar desde nueva-version/backend: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {createAdventureInitialState,projectAdventureState} from '../motor/estado.js';
import {advanceBattle,summon,TICK_MS} from '../motor/simulacion.js';
import {createSession,getSessionState,performSessionAction,tickSessions,releaseSessions} from '../backend/src/sesiones.js';
import {validEncounterRequest,validStateRequest,validActionRequest} from '../compartido/protocolo.js';

const json=(path)=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const encounter=json('../datos/json/encuentros/kiara.json');
const player=json('../datos/json/kasters/lioren.json');
const rival=json('../datos/json/kasters/kiara.json');
const catalog=[...json('../datos/json/invocaciones/prototipos.json').units,
 ...json('../datos/json/invocaciones/legado-adaptado.json').units];
const fixture=()=>createAdventureInitialState(encounter,player,rival,catalog);

test('el escenario usa la arena original 9x18 y ambos kasters, sin turnos',()=>{
  const state=fixture();
  assert.equal(state.mode,'adventure');
  assert.equal(state.status,'active');
  assert.equal(state.casters.length,2);
  assert.equal(state.casters[0].id,'lioren');
  assert.equal(state.casters[1].id,'kasterKiaraWater');
  assert.equal(state.arena.columns,9);
  assert.equal(state.arena.rows,18);
});

test('motor continuo: avance de 100ms y proyeccion de solo datos',()=>{
  const before=fixture();
  const {state,events}=advanceBattle(before,TICK_MS);
  assert.equal(state.elapsedMs,100);
  assert.equal(before.elapsedMs,0);
  assert.ok(Array.isArray(events));
  assert.equal(projectAdventureState(state).elapsedMs,100);
  assert.equal(projectAdventureState(state).summonCatalog.length,catalog.length);
});

test('invocacion: resolucion autoritativa con ID de carta reconocido',()=>{
  const before=fixture();
  const result=summon(before,1,'shield');
  assert.equal(result.ok,true);
  assert.equal(result.state.units.length,1);
  assert.equal(result.state.units[0].cardId,'shield');
  assert.equal(result.events[0].type,'unit.summoned');
  assert.equal(before.units.length,0);
  assert.equal(summon(before,1,'id-de-carta-desconocido').ok,false);
});

test('protocolos no aceptan alteraciones autoritativas enviadas por cliente',()=>{
  const id=randomUUID(),actionId=randomUUID();
  assert.equal(validEncounterRequest({encounterId:'enigma-apprentice',playerSpellbookCardIds:['kiaraFaroleraUmbral']}),true);
  assert.equal(validEncounterRequest({encounterId:'enigma-apprentice'}),true);
  assert.equal(validEncounterRequest({encounterId:'enigma-apprentice',hp:500}),false);
  assert.equal(validStateRequest({sessionId:id}),true);
  assert.equal(validActionRequest({sessionId:id,actionId,type:'summon',cardId:'shield'}),true);
  assert.equal(validActionRequest({sessionId:id,actionId,type:'summon',cardId:'shield',damage:999}),false);
  assert.equal(validActionRequest({sessionId:id,actionId,type:'attack',cardId:'shield'}),false);
});

test('las sesiones pertenecen al jugador y rechazan solicitudes ajenas',()=>{
  const owner='test-owner-'+randomUUID();
  const intruder='test-intruder-'+randomUUID();
  try{
    const opened=createSession(owner,encounter,player,rival,catalog,['kiaraFaroleraUmbral']);
    assert.equal(opened.ok,true);
    const id=opened.session.id;
    assert.equal(getSessionState(owner,id).ok,true);
    assert.equal(getSessionState(intruder,id).ok,false);
    assert.equal(performSessionAction(intruder,{
      sessionId:id,actionId:randomUUID(),type:'summon',cardId:'kiaraFaroleraUmbral'
    }).ok,false);
    const actionId=randomUUID();
    const rejected=performSessionAction(owner,{sessionId:id,actionId:randomUUID(),type:'summon',cardId:'shield'});
    assert.equal(rejected.ok,false);
    assert.equal(rejected.error,'card-not-adapted-or-not-equipped');
    const request={sessionId:id,actionId,type:'summon',cardId:'kiaraFaroleraUmbral'};
    const first=performSessionAction(owner,request);
    assert.equal(first.ok,true);
    assert.deepEqual(performSessionAction(owner,request),first);
    assert.equal(getSessionState(owner,id).state.units.length,1);
  }finally{
    releaseSessions(owner);
  }
});

test('el servidor avanza el combate independientemente del renderizador',()=>{
  const owner='test-owner-'+randomUUID();
  try{
    const opened=createSession(owner,encounter,player,rival,catalog);
    assert.equal(opened.ok,true);
    const updates=tickSessions(TICK_MS);
    const own=updates.find(u=>u.sessionId===opened.session.id);
    assert.ok(own);
    assert.equal(own.state.elapsedMs,TICK_MS);
    assert.ok(Array.isArray(own.events));
  }finally{
    releaseSessions(owner);
  }
});
