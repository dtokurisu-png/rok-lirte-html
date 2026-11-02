import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const renderer=source('../frontend/js/scene/renderer.js');
const arena=source('../frontend/js/scene/arena.js');
const model=source('../frontend/js/scene/modelos.js');
const html=source('../frontend/index.html');
const app=source('../frontend/js/app.js');
test('la vista 3D no contiene reglas de combate ni el simulador del tester',()=>{
  for(const src of [renderer,arena,model,app]){
    assert.doesNotMatch(src,/resolveCombatAction|advanceBattle|updateDuel\s*\(|executeAttackDamage|startRealtimeAutomaticAttack/);
    assert.doesNotMatch(src,/from\s+['"][^'"]*\/motor\//);
  }
});
test('camara y coordenadas compatibles con 9 columnas x 18 filas',()=>{
  assert.match(arena,/BOARD_COLUMNS=9,BOARD_ROWS=18/);
  assert.match(arena,/col-4,0,row-8\.5/);
  assert.match(renderer,/OrbitControls/);
  assert.match(renderer,/resetCamera/);
  assert.match(renderer,/fullCamera/);
});
test('three.js tiene version fija y assets locales con respaldo',()=>{
  assert.match(html,/three@0\.169\.0/);
  assert.match(model,/recursos\/modelos-3d\/farolera\/chiara_idle\.glb/);
  assert.match(model,/loadWithFallback/);
});
test('no se carga la Arquera grande automáticamente',()=>{
  assert.match(renderer,/if\(type==='arquera'&&!this\.qualityArcher\)return;/);
  assert.match(renderer,/async enableArcherModel/);
  assert.match(renderer,/if\(this\.mobile\)/);
});
test('sin servidor hay vista previa visual, no combate local',()=>{
  assert.match(renderer,/showPreview\(\)/);
  assert.match(renderer,/sin combate \(backend no conectado\)/);
  assert.match(app,/import\('\.\/scene\/renderer\.js'\)/);
  assert.match(app,/summonUnit\(/);
});
test('el renderizador recibe eventos del servidor',()=>{
  for(const event of ['unit.summoned','attack.preparing','unit.hit','unit.defeated','projectile.launched']){
    assert.ok(renderer.includes(event));
  }
});
