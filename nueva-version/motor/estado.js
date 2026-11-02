import { ARENA } from './reglas.js';
// Etapa 1: sesión preparada, SIN simulación ni resultados de combate.
export function createAdventureInitialState(encounter, player, rival) {
  if (!encounter || !player || !rival ||
      encounter.playerCasterId !== player.id || encounter.rivalCasterId !== rival.id)
    throw new Error('Encuentro inconsistente.');
  return {
    mode: 'adventure', status: 'preparing', encounterId: encounter.id,
    arena: { ...ARENA, id: encounter.arenaId }, revision: 0,
    casters: [
      { id: player.id, side: 1, row: 16, col: 4, level: 1 },
      { id: rival.id, side: 2, row: 1, col: 4, level: 1 }
    ]
  };
}
