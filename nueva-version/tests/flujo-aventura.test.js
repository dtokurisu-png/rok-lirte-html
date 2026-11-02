import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const legacy=source('../../game.js');
const index=source('../../index.html');
const bridge=source('../frontend/js/adventure-bridge.js');
const arena=source('../frontend/arena.html');
const entry=source('../frontend/js/arena-entrada.js');
const renderer=source('../frontend/js/scene/renderer.js');

test('se reciclan las vistas originales y el VS con cuenta 3 2 1',()=>{
  assert.match(legacy,/function startAdventureBattleIntro\(\)/);
  assert.match(legacy,/getAdventureDominantEntries/);
  assert.match(legacy,/let count = 3;/);
  assert.match(legacy,/setTimeout\(\(\) => launchPreparedAdventureBattle\(\), 1050\)/);
  assert.match(legacy,/window\.ROK_ADVENTURE_START_BATTLE\(payload\)/);
  assert.match(legacy,/playerSpellbookCardIds: getAdventureSpellbookCardIds\(\)/);
  assert.match(legacy,/arena: getAdventureBattleArena\(encounter\)/);
  assert.match(index,/<section id="adventureBattleIntro"/);
  const original=index.indexOf('<script src="game.js?');
  const connector=index.indexOf('<script src="nueva-version\/frontend\/js\/adventure-bridge.js?');
  assert.ok(connector>original,'el puente se carga DESPUES del motor anterior');
});
test('la arena 3D no replica las pantallas ni la secuencia de R.O.K. Lite',()=>{
  assert.doesNotMatch(arena,/adventureSpellbookOverlay|adventurePrepareView|adventureBattleIntro/);
  assert.match(arena,/id="sceneMount"/);
  assert.match(arena,/id="exitArena"/);
  assert.match(entry,/config\.json/);
  assert.match(entry,/scene\.setArenaArt\(detail\.arenaImage\)/);
  assert.match(renderer,/setArenaArt\(imageUrl\)/);
});
function simulateBridge(){
  const listeners=new Map(),dom=new Map(),sent=[];
  const classList=()=>({
    states:new Set(),
    add(...names){names.forEach(name=>this.states.add(name));},
    remove(...names){names.forEach(name=>this.states.delete(name));},
    contains(name){return this.states.has(name);}
  });
  function element(tag='div'){
    return {
      tagName:tag.toUpperCase(),style:{},children:[],dataset:{},className:'',
      classList:classList(),attributes:new Map(),isConnected:true,
      appendChild(child){this.children.push(child);},
      setAttribute(name,val){this.attributes.set(name,val);},
      getAttribute(name){return this.attributes.get(name);},
      addEventListener(name,cb){this.listeners??={};this.listeners[name]=cb;},
      focus(){this.focused=true;}
    };
  }
  const intro=element('section');intro.classList.add('active','counting');
  const button=element('button');dom.set('adventureBattleIntro',intro);dom.set('adventureCombatBtn',button);
  const body=element('body');
  const document={
    baseURI:'https://example.com/rok-lirte-html/index.html',
    body,head:element('head'),activeElement:button,
    createElement:element,getElementById:id=>dom.get(id)||null,
    addEventListener:(type,cb)=>listeners.set('document:'+type,cb)
  };
  const window={
    location:{origin:'https://example.com'},setTimeout:()=>1,
    addEventListener:(type,cb)=>listeners.set('window:'+type,cb)
  };
  const ctx=vm.createContext({document,window,URL,clearTimeout:()=>{}});
  vm.runInContext(bridge,ctx);
  const click=listeners.get('document:click');
  click({target:{closest:sel=>sel==='#adventureCombatBtn'?button:null}});
  const overlay=body.children.find(x=>x.id==='rokAdventure3dOverlay');
  // Se creó el iframe para precarga, sin ocultar aún la presentación VS.
  const frame=overlay.children.find(x=>x.tagName==='IFRAME');
  frame.contentWindow={postMessage:(data,origin)=>sent.push({data,origin})};
  listeners.get('window:message')({
    origin:'https://example.com',source:frame.contentWindow,data:{type:'rok:arena:ready'}
  });
  return {document,window,overlay,frame,button,intro,sent,listeners};
}
test('el puente conserva el VS hasta el handoff y transmite la selección real',()=>{
  const x=simulateBridge();
  assert.equal(x.intro.classList.contains('active'),true);
  assert.equal(x.overlay.classList.contains('is-open'),false);
  assert.equal(typeof x.window.ROK_ADVENTURE_START_BATTLE,'function');
  x.window.ROK_ADVENTURE_START_BATTLE({
    mode:'adventure',encounterId:'enigma-apprentice',
    rivalCaster:{label:'Kiara seleccionada'},
    playerCaster:{label:'Lioren elegido'},
    playerSpellbookCardIds:['carta-a','carta-b'],
    arena:{id:'kiara',label:'Arena seleccionada',image:'assets/arena.webp'}
  });
  assert.equal(x.intro.classList.contains('active'),false);
  assert.equal(x.overlay.classList.contains('is-open'),true);
  assert.equal(x.overlay.classList.contains('is-ready'),false);
  x.listeners.get('window:message')({
    origin:'https://example.com',source:x.frame.contentWindow,data:{type:'rok:arena:displayed'}
  });
  assert.equal(x.overlay.classList.contains('is-ready'),true);
  const start=x.sent.find(e=>e.data.type==='rok:arena:start');
  assert.ok(start);
  assert.equal(start.data.payload.playerName,'Lioren elegido');
  assert.equal(start.data.payload.rivalName,'Kiara seleccionada');
  assert.equal(start.data.payload.arenaId,'kiara');
  assert.equal(start.data.payload.arenaImage,'https://example.com/rok-lirte-html/assets/arena.webp');
  assert.equal(start.data.payload.playerSpellbookCardIds.length,2);
});
test('volver cierra el escenario sin resetear el progreso original',()=>{
  const x=simulateBridge();
  x.window.ROK_ADVENTURE_START_BATTLE({
    mode:'adventure',encounterId:'enigma-apprentice',
    playerCaster:{label:'Lioren'},rivalCaster:{label:'Kiara'},
    arena:{image:'assets/arena.webp'}
  });
  x.listeners.get('window:message')({
    origin:'https://example.com',source:x.frame.contentWindow,data:{type:'rok:arena:exit'}
  });
  assert.equal(x.overlay.classList.contains('is-open'),false);
  assert.equal(x.overlay.getAttribute('aria-hidden'),'true');
  assert.ok(x.sent.some(e=>e.data.type==='rok:arena:reset'));
  assert.doesNotMatch(bridge,/localStorage|markAdventureEncounterDefeated|grantVictoryRewards/);
});
test('el receptor filtra mensajes de otros orígenes',()=>{
  const x=simulateBridge();
  x.listeners.get('window:message')({
    origin:'https://other.example',source:x.frame.contentWindow,data:{type:'rok:arena:exit'}
  });
  assert.equal(x.sent.some(e=>e.data.type==='rok:arena:reset'),false);
});
