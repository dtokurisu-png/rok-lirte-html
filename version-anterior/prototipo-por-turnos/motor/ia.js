import { resolveCombatAction } from './combate.js';
import { distance, findPath } from './movimiento.js';
// IA provisional determinista; se ejecuta exclusivamente en el backend.
export function resolveAdventureBotTurn(initial) {
  let state = initial;
  const events = [];
  for (let steps = 0; steps < 3 && state.status === 'active' && state.turn.side === 2; steps++) {
    const bot = state.casters.find(c => c.side === 2);
    const rival = state.casters.find(c => c.side === 1);
    if (!bot || !rival || bot.hp <= 0 || rival.hp <= 0) break;
    let action;
    if (distance(bot,rival) <= bot.range) {
      action = {type:'attack',targetId:rival.id};
    } else {
      let best = null;
      for (let row = 0; row < state.arena.rows; row++) for (let col = 0; col < state.arena.columns; col++) {
        const path = findPath(state,bot.id,row,col);
        if (!path || !path.length || path.length > bot.movement) continue;
        const next = {row,col};
        const range = distance(next,rival);
        const candidate = {row,col,range,steps:path.length};
        if (range < distance(bot,rival) &&
            (!best || range < best.range || (range === best.range && path.length < best.steps)))
          best = candidate;
      }
      action = best ? {type:'move',row:best.row,col:best.col} : {type:'endTurn'};
    }
    let outcome = resolveCombatAction(state,2,action);
    if (!outcome.ok) outcome = resolveCombatAction(state,2,{type:'endTurn'});
    if (!outcome.ok) throw new Error('La IA no pudo terminar su turno.');
    state = outcome.state;
    events.push(...outcome.events);
  }
  return {state,events};
}
