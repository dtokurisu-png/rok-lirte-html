import { ARENA, isInsideArena } from './reglas.js';

function readStats(definition) {
  const stats = definition?.stats || {};
  const get = (key, min, max) => {
    const number = Number(stats[key]);
    if (!Number.isInteger(number) || number < min || number > max)
      throw new Error('Estadistica invalida: ' + definition?.id + '.' + key);
    return number;
  };
  return {
    maxHp: get('life', 1, 10000),
    damage: get('attack', 1, 1000),
    range: get('range', 1, 18),
    movement: get('movement', 1, 18)
  };
}
export function createAdventureInitialState(encounter, player, rival) {
  if (!encounter || !player || !rival ||
      encounter.mode !== 'adventure' || encounter.playerCasterId !== player.id ||
      encounter.rivalCasterId !== rival.id || !encounter.id || !encounter.arenaId)
    throw new Error('Encuentro inconsistente.');
  const playerStats = readStats(player), rivalStats = readStats(rival);
  const spawn = [
    { id: player.id, side: 1, row: 16, col: 4, ...playerStats },
    { id: rival.id, side: 2, row: 1, col: 4, ...rivalStats }
  ];
  if (spawn.some(unit => !isInsideArena(unit.row, unit.col))) throw new Error('Posicion inicial invalida');
  return {
    mode: 'adventure', status: 'active', encounterId: encounter.id,
    ruleset: 'rok-next-prototype-v1',
    arena: { ...ARENA, id: encounter.arenaId },
    revision: 0, turn: { side: 1, number: 1, actionsRemaining: 2 },
    winner: null,
    casters: spawn.map(unit => ({ ...unit, hp: unit.maxHp }))
  };
}
// Vista publica explicita: el cliente nunca obtiene las colecciones privadas de sesiones.
export function projectAdventureState(state) {
  return {
    mode: state.mode, status: state.status, encounterId: state.encounterId,
    ruleset: state.ruleset, arena: { ...state.arena },
    revision: state.revision, turn: { ...state.turn }, winner: state.winner,
    casters: state.casters.map(unit => ({ ...unit }))
  };
}
