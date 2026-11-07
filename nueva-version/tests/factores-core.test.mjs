import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../compartido/factores-core.js',import.meta.url),'utf8');
const core=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
const {createFactorInstance,absorbFactorDamage,factorBlocks,stepFactor,describeFactor,completeFactorAction,reduceFactorDamage}=core;
test('Cariona: mismo escudo, mágico y por puntos de daño',()=>{
 const f=createFactorInstance({factor:'escudo',
  semantic:{category:'magico'},config:{mode:'damage',capacity:2}});
 assert.equal(describeFactor(f).color,'#79E9FF');
 assert.deepEqual(absorbFactorDamage(f,1,{category:'magico'}),{absorbed:1,remaining:0});
 assert.deepEqual(absorbFactorDamage(f,2,{category:'magico'}),{absorbed:1,remaining:1});
 assert.equal(f.state.active,false);
});
test('Astarin: escudo psíquico bloquea efecto negativo por duración',()=>{
 const f=createFactorInstance({factor:'escudo',semantic:{category:'psiquico'},
  config:{mode:'time',duration:10,blocksCategories:['psiquico']}});
 assert.equal(describeFactor(f).color,'#F2CE31');
 assert.equal(factorBlocks(f,{category:'psiquico',negative:true}),true);
 assert.equal(factorBlocks(f,{category:'fisico',negative:true}),false);
 assert.equal(factorBlocks(f,{category:'psiquico',negative:false}),false);
 stepFactor(f,10);assert.equal(f.state.active,false);
 assert.equal(factorBlocks(f,{category:'psiquico',negative:true}),false);
});
test('Sanación periódica: un evento por segundo; no aplica vida en el núcleo',()=>{
 const f=createFactorInstance({factor:'sanacion',semantic:{category:'magico'},
  config:{mode:'time',duration:4,interval:1,potency:1}});
 assert.equal(stepFactor(f,2.2).length,2);
 assert.equal(stepFactor(f,1.8).length,2);
 assert.equal(f.state.active,false);
});
test('Jerarquía y parámetros inválidos se rechazan',()=>{
 assert.throws(()=>createFactorInstance({factor:'inventado',semantic:{category:'fisico'}}));
 assert.throws(()=>createFactorInstance({factor:'escudo',semantic:{category:'nuclear'}}));
 assert.throws(()=>createFactorInstance({factor:'quemadura',semantic:{category:'elemental'},
  config:{mode:'damage'}}));
});

test('El factor conoce sólo seis mecanismos y no necesita tipo de carta',()=>{
 for(const name of ['confusion','escudo','armadura','extraccion','sanacion','control'])
  assert.ok(core.factorProfile(name));
 for(const name of ['quemadura','veneno','evasion'])
  assert.throws(()=>core.factorProfile(name));
 const use=createFactorInstance({factor:'escudo',
  semantic:{category:'psiquico'},
  application:{root:'habilidad',activation:'disparador'},
  config:{mode:'time',duration:10,blocksCategories:['psiquico']}});
 assert.equal(use.semantic.root,undefined);
 assert.equal(use.semantic.activation,undefined);
 assert.equal(use.application.activation,'disparador');
});
test('Escudo psíquico temporal no absorbe daño por defecto',()=>{
 const f=createFactorInstance({factor:'escudo',semantic:{category:'psiquico'},
  config:{mode:'time',duration:10,blocksCategories:['psiquico']}});
 assert.deepEqual(absorbFactorDamage(f,2,{category:'psiquico'}),
  {absorbed:0,remaining:2});
 assert.equal(factorBlocks(f,{category:'psiquico',negative:true}),true);
});
test('Extracción instantánea se emite una sola vez',()=>{
 const f=createFactorInstance({factor:'extraccion',semantic:{category:'elemental'},
  config:{mode:'instant',potency:1}});
 assert.equal(stepFactor(f,0).length,1);
 assert.equal(stepFactor(f,1).length,0);
});
test('Control es un factor separado de Confusión',()=>{
 const c=createFactorInstance({factor:'control',semantic:{category:'psiquico'},
  config:{mode:'time',duration:3,interval:1,potency:1}});
 assert.equal(stepFactor(c,2).length,2);
 const confusion=createFactorInstance({factor:'confusion',
  semantic:{category:'psiquico'},config:{mode:'time',duration:1}});
 assert.equal(stepFactor(confusion,.5).length,0);
});

test('Confusión no expira por tiempo: termina al resolver el ataque obligado',()=>{
 const f=createFactorInstance({factor:'confusion',semantic:{category:'psiquico'},
  application:{root:'habilidad',activation:'disparador'},
  config:{mode:'action',radius:6}});
 stepFactor(f,20);
 assert.equal(f.state.active,true);
 assert.equal(completeFactorAction(f,{result:'attack-resolved'}),true);
 assert.equal(f.state.active,false);
 assert.equal(f.state.resolution,'attack-resolved');
 assert.equal(completeFactorAction(f),false);
});

test('Escudo mágico puede bloquear tipos de ataque configurados por la carta',()=>{
 const f=createFactorInstance({factor:'escudo',
  semantic:{category:'magico'},
  config:{mode:'hit',capacity:3,
   protectsCategories:['fisico','magico','elemental','psiquico']}});
 for(const cat of ['fisico','magico','elemental']){
  assert.deepEqual(absorbFactorDamage(f,5,{category:cat}),
   {absorbed:5,remaining:0});
 }
 assert.equal(f.state.capacity,0);
 assert.equal(f.state.active,false);
});
test('Escudo psíquico se agota después de 10 segundos de vida activa',()=>{
 const f=createFactorInstance({factor:'escudo',
  semantic:{category:'psiquico'},
  config:{mode:'time',duration:10,blocksCategories:['psiquico']}});
 assert.equal(factorBlocks(f,{negative:true,category:'psiquico'}),true);
 stepFactor(f,7);assert.equal(f.state.remaining,3);
 stepFactor(f,3);assert.equal(f.state.remaining,0);
 assert.equal(factorBlocks(f,{negative:true,category:'psiquico'}),false);
});

test('Armadura base y Roble se acumulan sin consumirse por daño',()=>{
 const mk=(category,potency)=>createFactorInstance({
  factor:'armadura',semantic:{category},
  config:{mode:'flat',potency,protectsCategories:[category]}
 });
 const base=mk('fisico',1),oakPhysical=mk('fisico',2),oakMagical=mk('magico',1);
 assert.deepEqual(reduceFactorDamage([base],4,{category:'fisico'}),
  {reduced:1,remaining:3});
 assert.deepEqual(reduceFactorDamage([base,oakPhysical,oakMagical],4,{category:'fisico'}),
  {reduced:3,remaining:1});
 assert.deepEqual(reduceFactorDamage([base,oakPhysical,oakMagical],4,{category:'magico'}),
  {reduced:1,remaining:3});
 assert.deepEqual(reduceFactorDamage([base,oakPhysical,oakMagical],1,{category:'fisico'}),
  {reduced:1,remaining:0});
 assert.equal(base.state.active,true);
 assert.equal(oakPhysical.state.active,true);
 assert.deepEqual(reduceFactorDamage([base],4,{category:'magico'}),
  {reduced:0,remaining:4});
 assert.deepEqual(reduceFactorDamage([],4,{category:'fisico'}),
  {reduced:0,remaining:4});
});

test('Extracción usa un evento por operación, sin duplicar recursos',()=>{
 for(const [operation,potency] of [['unlock',1],['recharge',.25]]){
  const factor=createFactorInstance({factor:'extraccion',
   semantic:{category:'elemental'},
   application:{root:'factor',activation:'disparador'},
   config:{mode:'instant',potency,resourceOperation:operation},
   sourceId:'test',targetId:'ally'});
  const events=stepFactor(factor,0);
  assert.equal(events.length,1);
  assert.equal(events[0].resourceOperation,operation);
  assert.equal(events[0].potency,potency);
  assert.equal(stepFactor(factor,3).length,0);
 }
});
test('Extracción admite eventos periódicos solo cuando la carta los define',()=>{
 const f=createFactorInstance({factor:'extraccion',
  semantic:{category:'elemental'},config:{mode:'time',
   interval:3,potency:.25,resourceOperation:'recharge'}});
 assert.equal(stepFactor(f,2).length,0);
 assert.equal(stepFactor(f,1).length,1);
 assert.equal(stepFactor(f,6).length,2);
});
