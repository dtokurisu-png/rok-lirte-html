import { isInsideArena } from './reglas.js';
export function distance(a, b) {
  return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col));
}
// Ruta mas corta en 8 direcciones: los personajes y obstaculos no se atraviesan.
// Se evita cruzar una esquina bloqueada por DOS celdas ortogonales ocupadas.
export function findPath(state, casterId, endRow, endCol) {
  if (!isInsideArena(endRow, endCol)) return null;
  const unit = state.casters.find(c => c.id === casterId && c.hp > 0);
  if (!unit) return null;
  const blocked = new Set(state.casters
    .filter(c => c.hp > 0 && c.id !== casterId)
    .map(c => c.row + ':' + c.col));
  const key = (row, col) => row + ':' + col;
  if (blocked.has(key(endRow, endCol))) return null;
  const start = key(unit.row, unit.col);
  const target = key(endRow, endCol);
  if (start === target) return [];
  const queue = [{ row:unit.row, col:unit.col, path:[] }];
  const visited = new Set([start]);
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const row = current.row + dr, col = current.col + dc;
      const point = key(row, col);
      if (!isInsideArena(row, col) || blocked.has(point) || visited.has(point)) continue;
      if (dr && dc && blocked.has(key(current.row + dr, current.col)) &&
          blocked.has(key(current.row, current.col + dc))) continue;
      const path = [...current.path, {row,col}];
      if (point === target) return path;
      visited.add(point);
      queue.push({row,col,path});
    }
  }
  return null;
}
