import test from 'node:test';
import assert from 'node:assert/strict';
import { ARENA, isInsideArena } from '../motor/reglas.js';
import { createAdventureInitialState } from '../motor/estado.js';
import { validEncounterRequest, PROTOCOL_VERSION } from '../compartido/protocolo.js';
test('arena logica 9x18',()=>assert.deepEqual(ARENA,{columns:9,rows:18}));
test('limites de coordenadas',()=>{assert.equal(isInsideArena(17,8),true);assert.equal(isInsideArena(18,8),false);assert.equal(isInsideArena(0,-1),false);});
test('validacion de peticiones',()=>{assert.equal(validEncounterRequest({encounterId:'enigma-apprentice'}),true);assert.equal(validEncounterRequest({encounterId:'kiara',damage:100}),false);assert.equal(PROTOCOL_VERSION,1);});
test('estado preparatorio sin DOM',()=>{
  const state=createAdventureInitialState({id:'enigma-apprentice',arenaId:'kiara',playerCasterId:'lioren',rivalCasterId:'kasterKiaraWater'},{id:'lioren'},{id:'kasterKiaraWater'});
  assert.equal(state.status,'preparing');assert.equal(state.casters[0].row,16);assert.equal(state.casters[1].row,1);
});
