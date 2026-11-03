// Motor lógico independiente: no importar DOM, Three.js, Firebase ni vistas.
export const ARENA = Object.freeze({ columns: 9, rows: 18 });
export function isInsideArena(row, col) {
  return Number.isInteger(row) && Number.isInteger(col) &&
    row >= 0 && row < ARENA.rows && col >= 0 && col < ARENA.columns;
}
