import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createAdventureInitialState,projectAdventureState} from '../motor/estado.js';
import {summon,advanceBattle,TICK_MS} from '../motor/simulacion.js';
import {targetFor,maintainDuels} from '../motor/objetivos.js';
import {validActionRequest,PROTOCOL_VERSION} from '../compartido/protocolo.js';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const encounter=read('../datos/json/encuentros/kiara.json');
const lioren=read('../datos/json/kasters/lioren.json'),kiara=read('../datos/json/kasters/kiara.json');
const catalog=read('../datos/json/invocaciones/prototipos.json').units;
const fresh=()=>createAdventureInitialState(encounter,lioren,kiara,catalog);
function advance(s,n){let state=s,events=[];for(let i=0;i<n;i++){const r=advanceBattle(state,TICK_MS);state=r.state;events.push(...r.events);}return {state,events};}
test('sin turnos: reloj continuo y Kasters de JSON',()=>{
 const s=fresh();assert.equal(s.turn,undefined);assert.equal(s.elapsedMs,0);
 assert.equal(s.casters[0].hp,14);assert.equal(s.casters[1].hp,8);
 const result=advanceBattle(s,100);assert.equal(result.state.elapsedMs,100);assert.equal(s.elapsedMs,0);
});
test('invocar no permite enviar daño, mover, atacar ni terminar turno',()=>{
 const id='12345678-1234-4234-8234-123456789abc';
 const action={sessionId:id,actionId:'summon-test-100',type:'summon',cardId:'archer'};
 assert.equal(PROTOCOL_VERSION,3);
 assert.equal(validActionRequest(action),true);
 assert.equal(validActionRequest({...action,damage:999}),false);
 assert.equal(validActionRequest({...action,type:'attack'}),false);
 assert.equal(validActionRequest({...action,type:'move'}),false);
 assert.equal(validActionRequest({...action,type:'endTurn'}),false);
});
test('invocaciones spawn, enfriamiento de despliegue y cupo',()=>{
 const s=fresh();const first=summon(s,1,'shield');
 assert.equal(first.ok,true);assert.equal(first.state.units[0].row,17);
 assert.equal(first.state.units[0].col,3);
 assert.equal(s.units.length,0);
 assert.equal(summon(first.state,1,'mana').error,'summon-recovery');
 const later=advance(first.state,15).state;
 assert.equal(summon(later,1,'mana').ok,true);
});
test('la IA genera invocaciones por su reloj, sin orden de cliente',()=>{
 const events=advance(fresh(),11).events;
 assert.ok(events.some(e=>e.type==='unit.summoned'&&e.side===2));
});
test('movimiento automático del tester sin orden move',()=>{
 let s=summon(fresh(),1,'melee-vanguard').state;
 const before=s.units[0].row;const res=advance(s,20);
 assert.ok(res.state.units[0].row<before);
 assert.ok(res.events.some(e=>e.type==='unit.moved'));
});
test('duelo melee 1v1: segunda invocación busca caster y no invade la reserva',()=>{
 let s=summon(fresh(),1,'melee-vanguard').state;
 s.bot.nextSummonAtMs=999999; // Aislar el duelo de la IA de despliegue.
 s=advance(s,15).state;
 s=summon(s,2,'melee-vanguard').state;
 const one=s.units.find(u=>u.side===1),enemy=s.units.find(u=>u.side===2);
 // Forzar proximidad: el tester elige el objetivo mas cercano, incluso si es el Kaster.
 enemy.row=one.row-1;enemy.col=one.col;
 assert.equal(targetFor(s,one).id,enemy.id);
 assert.equal(one.duelId,enemy.id);
 const second=summon(s,1,'melee-vanguard');
 assert.equal(second.ok,true);
 const free=second.state.units.find(u=>u.side===1&&u.id!==one.id);
 const next=targetFor(second.state,free);
 assert.equal(next.role,'caster');
 assert.equal(next.side,2);
});
test('un ataque posee preparación individual, no reloj global por turnos',()=>{
 let s=summon(fresh(),1,'melee-vanguard').state;
 const unit=s.units[0];unit.row=2;unit.col=4;
 const r=advance(s,8);
 assert.ok(r.events.some(e=>e.type==='attack.preparing'&&e.unitId===unit.id));
 assert.ok(r.events.some(e=>e.type==='unit.hit'&&e.sourceId===unit.id));
 assert.equal(r.state.casters[1].hp,6);
});
test('distancia crea un proyectil independiente de la animación',()=>{
 let s=summon(fresh(),1,'archer').state;
 s.units[0].row=5;s.units[0].col=4;
 const r=advance(s,10);
 assert.ok(r.events.some(e=>e.type==='projectile.launched'));
 assert.ok(r.events.some(e=>e.type==='projectile.resolved'));
 assert.equal(r.state.casters[1].hp,6);
});
test('los tres modos pueden existir simultáneamente',()=>{
 const s=fresh();
 assert.deepEqual([...new Set(s.summonCatalog.map(u=>u.combatMode))].sort(),['distance','melee','range']);
});
test('victoria producida por el motor sin animación ni input de daño',()=>{
 let s=summon(fresh(),1,'melee-vanguard').state;
 s.casters[1].hp=2;s.units[0].row=2;s.units[0].col=4;
 const r=advance(s,8);
 assert.equal(r.state.status,'finished');assert.equal(r.state.winner,1);
 assert.ok(r.events.some(e=>e.type==='combat.finished'));
});
test('las unidades muertas liberan su duelo',()=>{
 const s=fresh(),a=summon(s,1,'melee-vanguard').state;
 a.bot.nextSummonAtMs=999999;
 let b=advance(a,15).state;
 b=summon(b,2,'melee-vanguard').state;
 const ally=b.units.find(u=>u.side===1),enemy=b.units.find(u=>u.side===2);
 enemy.row=ally.row-1;enemy.col=ally.col;
 targetFor(b,ally);assert.equal(enemy.duelId,ally.id);
 enemy.hp=0;maintainDuels(b);assert.equal(ally.duelId,null);
});
test('la instantánea pública omite reloj y datos privados de temporizadores de unidad',()=>{
 const s=summon(fresh(),1,'archer').state;
 const view=projectAdventureState(s);
 assert.equal(view.units[0].attackTargetId,undefined);
 assert.equal(view.lastSummonMs,undefined);
 assert.equal(view.bot,undefined);
});
