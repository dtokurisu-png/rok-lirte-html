import test from 'node:test';
import assert from 'node:assert/strict';
import { ARENA, isInsideArena } from '../motor/reglas.js';
import { createAdventureInitialState } from '../motor/estado.js';
import { validEncounterRequest, validStateRequest, validActionRequest, PROTOCOL_VERSION } from '../compartido/protocolo.js';
const sessionId='12345678-1234-4234-8234-123456789abc';
test('cuadricula 9x18 y limites',()=>{
  assert.deepEqual(ARENA,{columns:9,rows:18});
  assert.equal(isInsideArena(17,8),true);
  assert.equal(isInsideArena(18,8),false);
  assert.equal(isInsideArena(0,-1),false);
});
test('protocolo estricto: no permite dano, atributos arbitrarios ni ids invalidos',()=>{
  assert.equal(PROTOCOL_VERSION,2);
  assert.equal(validEncounterRequest({encounterId:'enigma-apprentice'}),true);
  assert.equal(validEncounterRequest({encounterId:'kiara',damage:100}),false);
  assert.equal(validStateRequest({sessionId}),true);
  assert.equal(validActionRequest({sessionId,actionId:'unique-action-001',expectedRevision:0,type:'move',row:15,col:4}),true);
  assert.equal(validActionRequest({sessionId,actionId:'unique-action-001',expectedRevision:0,type:'move',row:15,col:4,damage:100}),false);
  assert.equal(validActionRequest({sessionId,actionId:'unique-action-001',expectedRevision:0,type:'attack',targetId:'kiara'}),true);
  assert.equal(validActionRequest({sessionId,actionId:'unique-action-001',expectedRevision:0,type:'endTurn',side:2}),false);
});
test('los personajes obtienen datos del JSON sin usar DOM',()=>{
  const state=createAdventureInitialState(
    {id:'enigma-apprentice',mode:'adventure',arenaId:'kiara',playerCasterId:'lioren',rivalCasterId:'kasterKiaraWater'},
    {id:'lioren',stats:{life:14,attack:2,range:3,movement:3}},
    {id:'kasterKiaraWater',stats:{life:8,attack:1,range:2,movement:2}}
  );
  assert.equal(state.status,'active');assert.equal(state.casters[0].hp,14);
  assert.equal(state.casters[1].hp,8);assert.equal(state.turn.actionsRemaining,2);
  assert.equal(state.casters[0].row,16);
});
