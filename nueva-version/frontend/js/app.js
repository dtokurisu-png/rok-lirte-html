import {connectBackend,createAdventureSession,summonUnit,fetchCombatState,listenCombatSync} from './network.js';
const $=id=>document.getElementById(id);
let socket=null,encounter=null,session=null,state=null,inflight=false;
const seen=new Set(),nodes=new Map();
const status=$('statusText'),output=$('result'),dot=$('statusDot'),create=$('create'),connect=$('connect');
const stage=document.createElement('section');
stage.className='battle-stage';stage.hidden=true;
stage.innerHTML=`
<div class="stage-header"><div><small>SIMULACION CONTINUA · MOTOR AUTORITATIVO</small>
<h2>Combate automático</h2><p>Invoca unidades. Ellas avanzan, eligen objetivos y combaten solas, sin turnos ni comandos de ataque.</p></div>
<div id="combatSummary" class="combat-summary"></div></div>
<div class="stage-layout">
  <div id="combatBoard" class="continuous-board" aria-label="Mapa táctico de prueba. El escenario 3D llegará después.">
    <div id="combatActors" class="combat-actors"></div>
  </div>
  <aside class="summon-panel">
    <h3>Invocaciones de prueba</h3>
    <p>El despliegue usa un breve tiempo de recuperación, independiente de los relojes de ataque. No hay coste de cartas todavía.</p>
    <div id="summonButtons" class="summon-buttons"></div>
    <p id="summonFeedback" role="status">Sin invocaciones desplegadas.</p>
    <h3>Eventos del servidor</h3>
    <ol id="combatLog" class="combat-log"></ol>
  </aside>
</div>`;
document.querySelector('.layout').appendChild(stage);
const board=$('combatActors'),summary=$('combatSummary'),buttons=$('summonButtons'),feedback=$('summonFeedback'),log=$('combatLog');
const label=event=>{
  if(event.type==='unit.summoned')return (event.side===1?'Aliado':'Rival')+' invoca '+event.cardId;
  if(event.type==='attack.preparing')return event.unitId+' prepara ataque '+event.combatMode;
  if(event.type==='projectile.launched')return event.unitId+' dispara '+event.combatMode;
  if(event.type==='unit.hit')return event.targetId+' recibe '+event.damage+' de daño ('+event.hp+' PV)';
  if(event.type==='unit.defeated')return event.unitId+' derrotado';
  if(event.type==='combat.finished')return event.winner===0?'Empate':('Victoria de '+(event.winner===1?'Lioren':'Kiara'));
  return '';
};
function addEvents(events){
  for(const event of events||[]){
    if(seen.has(event.eventId))continue;
    seen.add(event.eventId);
    if(seen.size>1000)seen.clear();
    const text=label(event);
    if(!text)continue;
    const li=document.createElement('li');
    li.textContent='['+(event.timeMs/1000).toFixed(1)+'s] '+text;
    log.prepend(li);
  }
  while(log.children.length>32)log.lastElementChild.remove();
}
function snapshot(next){
  if(!next||state && next.revision<state.revision)return;
  state=next;stage.hidden=false;
  const ally=state.casters.find(c=>c.side===1),enemy=state.casters.find(c=>c.side===2);
  summary.textContent=state.status==='finished'
    ? (state.winner===0?'Empate':state.winner===1?'Victoria de Lioren':'Victoria de Kiara')
    : ('Tiempo '+(state.elapsedMs/1000).toFixed(1)+'s · Lioren '+ally.hp+'/'+ally.maxHp+
      ' PV · Kiara '+enemy.hp+'/'+enemy.maxHp+' PV');
  const activeIds=new Set();
  for(const unit of [...state.casters,...state.units]){
    const key=unit.id;activeIds.add(key);
    let node=nodes.get(key);
    if(!node){
      node=document.createElement('div');node.className='battle-entity';
      node.textContent=unit.role==='caster'?'K':(unit.combatMode==='melee'?'M':unit.combatMode==='range'?'R':'D');
      node.title=unit.name||unit.cardId||unit.id;
      board.appendChild(node);nodes.set(key,node);
    }
    node.className='battle-entity '+(unit.side===1?'friendly':'hostile')+
      (unit.role==='caster'?' kaster':' invocation')+
      (unit.stage==='preparing'?' preparing':'');
    node.style.left=((unit.col+.5)/9*100)+'%';
    node.style.top=((unit.row+.5)/18*100)+'%';
    node.setAttribute('aria-label',node.title+' · '+unit.hp+' PV');
    node.dataset.life=String(unit.hp);
  }
  for(const [id,node] of nodes)if(!activeIds.has(id)){node.remove();nodes.delete(id);}
  const enabled=socket?.connected&&session&&state.status==='active'&&!inflight;
  buttons.querySelectorAll('button').forEach(btn=>{btn.disabled=!enabled;});
}
function message(text){output.textContent=text;}
function makeSummonButtons(list){
  buttons.replaceChildren();
  for(const card of list){
    const button=document.createElement('button');button.type='button';button.dataset.cardId=card.id;
    const title=document.createElement('strong');title.textContent=card.name;
    const desc=document.createElement('small');desc.textContent=
      ({melee:'Cuerpo a cuerpo',range:'Rango',distance:'Distancia'})[card.combatMode]+
      ' · alcance '+card.range+' · PV '+card.hp+' · daño '+card.damage;
    button.append(title,desc);buttons.appendChild(button);
    button.addEventListener('click',()=>{void summon(card.id);});
  }
}
async function summon(cardId){
  if(!state||!session||inflight)return;
  inflight=true;snapshot(state);
  try{
    const reply=await summonUnit(socket,session.id,cardId);
    if(reply?.ok){
      addEvents(reply.events);snapshot(reply.state);
      feedback.textContent='Invocada: '+cardId+'. El combate avanza automáticamente.';
    }else feedback.textContent='No se pudo invocar: '+(reply?.error||'Error de servidor');
  }catch(err){feedback.textContent='Error de conexion: '+String(err.message||err);}
  finally{inflight=false;snapshot(state);}
}
async function loadData(){
  try{
    const paths=[
      new URL('../../datos/json/encuentros/kiara.json',import.meta.url),
      new URL('../../datos/json/kasters/kiara.json',import.meta.url),
      new URL('../../datos/json/kasters/lioren.json',import.meta.url)
    ];
    const replies=await Promise.all(paths.map(url=>fetch(url)));
    if(replies.some(r=>!r.ok))throw Error('No se pudieron cargar las definiciones');
    const [e,rival,player]=await Promise.all(replies.map(r=>r.json()));
    if(e.rivalCasterId!==rival.id||e.playerCasterId!==player.id)throw Error('Identificadores inconsistentes');
    encounter=e;$('playerName').textContent=player.name;$('rivalName').textContent=rival.name;
    status.textContent='Frontend listo · espera backend online';dot.classList.add('ok');
    if(socket?.connected)create.disabled=false;
  }catch(err){status.textContent='No se pudo cargar el encuentro';message(String(err.message||err));}
}
connect.addEventListener('click',async()=>{
  const url=$('serverUrl').value.trim();
  if(!url){message('Especifica la dirección de un backend desplegado.');return;}
  connect.disabled=true;create.disabled=true;state=null;session=null;
  for(const node of nodes.values())node.remove();nodes.clear();stage.hidden=true;seen.clear();
  socket?.disconnect();socket=null;
  try{
    socket=await connectBackend(url);
    listenCombatSync(socket,packet=>{
      if(!session||packet.sessionId!==session.id)return;
      addEvents(packet.events);snapshot(packet.state);
    });
    socket.on('disconnect',()=>{
      create.disabled=true;buttons.querySelectorAll('button').forEach(b=>b.disabled=true);
      message('Conexion interrumpida. La sesion no puede continuar.');
    });
    create.disabled=!encounter;
    message('Backend conectado. Puedes iniciar el combate continuo.');
  }catch(err){message('Conexion fallida: '+String(err.message||err));}
  finally{connect.disabled=false;}
});
create.addEventListener('click',async()=>{
  create.disabled=true;
  try{
    session=await createAdventureSession(socket,encounter.id);
    seen.clear();log.replaceChildren();makeSummonButtons(session.summonCatalog);
    snapshot(session);feedback.textContent='Elige una invocacion para desplegarla.';
    message('Combate iniciado. El servidor mantiene el reloj; no hay turnos.');
  }catch(err){message('No se pudo iniciar: '+String(err.message||err));}
  finally{create.disabled=!socket?.connected||!encounter;}
});
loadData();
