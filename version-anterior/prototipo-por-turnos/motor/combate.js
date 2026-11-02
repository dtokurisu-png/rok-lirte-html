import { isInsideArena } from './reglas.js';
import { distance, findPath } from './movimiento.js';
export const ACTIONS_PER_TURN = 2;
// Motor puro, sin DOM, animaciones, timers, red ni aleatoriedad.
export function resolveCombatAction(original, actorSide, command) {
  if (!original || original.status !== 'active') return {ok:false,error:'match-not-active'};
  if (actorSide !== original.turn.side) return {ok:false,error:'not-your-turn'};
  if (!Number.isInteger(original.turn.actionsRemaining) || original.turn.actionsRemaining < 1)
    return {ok:false,error:'no-actions'};
  if (!command || typeof command !== 'object') return {ok:false,error:'invalid-action'};
  const state = structuredClone(original);
  const actor = state.casters.find(c => c.side === actorSide && c.hp > 0);
  if (!actor) return {ok:false,error:'actor-unavailable'};
  const events = [];
  if (command.type === 'move') {
    if (!isInsideArena(command.row, command.col)) return {ok:false,error:'out-of-bounds'};
    const path = findPath(state, actor.id, command.row, command.col);
    if (!path || path.length === 0 || path.length > actor.movement)
      return {ok:false,error:'invalid-movement'};
    const from = {row:actor.row,col:actor.col};
    actor.row = command.row;
    actor.col = command.col;
    events.push({type:'unit.moved',actorId:actor.id,from,
      to:{row:actor.row,col:actor.col},path});
  } else if (command.type === 'attack') {
    const target = state.casters.find(c => c.id === command.targetId && c.side !== actorSide && c.hp > 0);
    if (!target) return {ok:false,error:'invalid-target'};
    if (distance(actor,target) > actor.range) return {ok:false,error:'target-out-of-range'};
    const before = target.hp;
    const damage = Math.min(before,actor.damage);
    target.hp = before - damage;
    events.push({type:'unit.attacked',actorId:actor.id,targetId:target.id,
      damage,previousHp:before,hp:target.hp,defeated:target.hp === 0});
    if (target.hp === 0) {
      state.status = 'finished';
      state.winner = actorSide;
      events.push({type:'combat.finished',winner:actorSide,loser:target.side});
    }
  } else if (command.type === 'endTurn') {
    state.turn.actionsRemaining = 0;
  } else return {ok:false,error:'unknown-action'};
  state.revision += 1;
  if (state.status === 'active') {
    if (command.type !== 'endTurn') state.turn.actionsRemaining -= 1;
    if (state.turn.actionsRemaining === 0) {
      state.turn.side = actorSide === 1 ? 2 : 1;
      if (state.turn.side === 1) state.turn.number += 1;
      state.turn.actionsRemaining = ACTIONS_PER_TURN;
      events.push({type:'turn.started',side:state.turn.side,number:state.turn.number,
        actionsRemaining:state.turn.actionsRemaining});
    }
  } else state.turn.actionsRemaining = 0;
  return {ok:true,state,events:events.map((event,index)=>({...event,
    eventId:state.revision+':'+index,revision:state.revision}))};
}
