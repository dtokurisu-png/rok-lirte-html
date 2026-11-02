import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdventureInitialState } from '../motor/estado.js';
import { findPath } from '../motor/movimiento.js';
import { resolveCombatAction } from '../motor/combate.js';
import { resolveAdventureBotTurn } from '../motor/ia.js';
const encounter={id:'enigma-apprentice',mode:'adventure',arenaId:'kiara',playerCasterId:'lioren',rivalCasterId:'kasterKiaraWater'};
const player={id:'lioren',stats:{life:14,attack:2,range:3,movement:3}};
const rival={id:'kasterKiaraWater',stats:{life:8,attack:1,range:2,movement:2}};
const fresh=()=>createAdventureInitialState(encounter,player,rival);
test('movimiento valido, evento y estado anterior inmutable',()=>{
  const old=fresh(),result=resolveCombatAction(old,1,{type:'move',row:13,col:4});
  assert.equal(result.ok,true);
  assert.equal(result.state.casters[0].row,13);
  assert.equal(old.casters[0].row,16);
  assert.equal(result.state.turn.actionsRemaining,1);
  assert.equal(result.events[0].type,'unit.moved');
  assert.equal(result.events[0].path.length,3);
});
test('movimiento fuera de limites, muy lejos y ocupado rechazado',()=>{
  const s=fresh();
  for(const target of [{row:18,col:4},{row:8,col:4},{row:1,col:4}]){
    const o=resolveCombatAction(s,1,{type:'move',...target});
    assert.equal(o.ok,false);
  }
  assert.equal(s.revision,0);
});
test('prohibido atacar fuera de rango, aliado o jugar turno rival',()=>{
  const s=fresh();
  assert.equal(resolveCombatAction(s,1,{type:'attack',targetId:rival.id}).error,'target-out-of-range');
  assert.equal(resolveCombatAction(s,1,{type:'attack',targetId:player.id}).error,'invalid-target');
  assert.equal(resolveCombatAction(s,2,{type:'endTurn'}).error,'not-your-turn');
});
test('ataque determinista y muerte producen victoria solo en motor',()=>{
  const s=fresh();s.casters[0].row=2;s.casters[1].hp=2;
  const o=resolveCombatAction(s,1,{type:'attack',targetId:rival.id});
  assert.equal(o.ok,true);
  assert.equal(o.state.status,'finished');
  assert.equal(o.state.winner,1);
  assert.equal(o.state.casters[1].hp,0);
  assert.deepEqual(o.events.map(e=>e.type),['unit.attacked','combat.finished']);
  assert.equal(resolveCombatAction(o.state,1,{type:'attack',targetId:rival.id}).error,'match-not-active');
});
test('gasto de dos acciones cambia de turno',()=>{
  const one=resolveCombatAction(fresh(),1,{type:'move',row:15,col:4});
  const two=resolveCombatAction(one.state,1,{type:'move',row:14,col:4});
  assert.equal(two.state.turn.side,2);
  assert.equal(two.state.turn.actionsRemaining,2);
  assert.equal(two.events.at(-1).type,'turn.started');
});
test('IA avanza en su turno y devuelve el control al jugador',()=>{
  const state=fresh();state.turn.side=2;
  const bot=resolveAdventureBotTurn(state);
  assert.equal(bot.state.turn.side,1);
  assert.equal(bot.state.turn.number,2);
  assert.ok(bot.state.casters[1].row>1);
  assert.ok(bot.events.some(e=>e.type==='unit.moved'));
});
test('IA ataca cuando esta dentro de alcance',()=>{
  const state=fresh();state.turn.side=2;state.casters[1].row=14;
  const bot=resolveAdventureBotTurn(state);
  assert.equal(bot.state.casters[0].hp,12);
  assert.equal(bot.state.turn.side,1);
  assert.equal(bot.events.filter(e=>e.type==='unit.attacked').length,2);
});
test('no se atraviesa la casilla de un enemigo',()=>{
  const state=fresh();state.casters[1].row=15;state.casters[1].col=4;
  assert.equal(findPath(state,'lioren',15,4),null);
});
