import {connectBackend,createAdventureSession,summonUnit,listenCombatSync} from './network.js';
// UI orchestration: sin ataques ni calculos de reglas de combate.
const $=id=>document.getElementById(id);
let socket=null,encounter=null,session=null,state=null,scene=null,inflight=false;
const seen=new Set();
const status=$('statusText'),output=$('result'),dot=$('statusDot');
const create=$('create'),connect=$('connect');
const stage=document.createElement('section');
stage.className='battle-stage stage-3d';
stage.innerHTML=`
<div class="stage-header">
  <div><small>R.O.K. · ESCENARIO TRIDIMENSIONAL</small>
    <h2>Arena 3D · 9 × 18</h2>
    <p>Gira la cámara, acerca y aleja. El combate solo responde al servidor, sin cálculo local.</p></div>
  <div id="combatSummary" class="combat-summary">Vista previa — sin conexión al motor</div>
</div>
<div class="scene-toolbar" role="group" aria-label="Controles de cámara">
  <button type="button" id="sceneReset">Cámara normal</button>
  <button type="button" id="sceneFull">Arena completa</button>
  <button type="button" id="sceneArcher">Cargar Arquera GLB (31,5 MB)</button>
  <span id="sceneStatus" role="status">Preparando escena tridimensional…</span>
</div>
<div class="stage-layout stage-layout-3d">
  <div class="scene-viewport" id="arena3d" aria-label="Escenario R.O.K. tridimensional de prueba"></div>
  <aside class="summon-panel">
    <h3>Invocaciones</h3>
    <p>Cuando haya servidor, invoca unidades; ellas avanzarán y combatirán solas.
       La cámara y las animaciones no deciden daños ni resultados.</p>
    <div id="summonButtons" class="summon-buttons"></div>
    <p id="summonFeedback" role="status">Aún no hay backend configurado.</p>
    <h3>Eventos lógicos del servidor</h3>
    <ol id="combatLog" class="combat-log"></ol>
  </aside>
</div>`;
document.querySelector('.field').before(stage);
const summary=$('combatSummary'),buttons=$('summonButtons');
const feedback=$('summonFeedback'),log=$('combatLog');
function message(value){output.textContent=value;}
function updateInfo(next){
  state=next;
  const ally=next?.casters?.find(c=>c.side===1);
  const enemy=next?.casters?.find(c=>c.side===2);
  summary.textContent=next?.status==='finished'?
    (next.winner===0?'Empate':next.winner===1?'Victoria de Lioren':'Victoria de Kiara'):
    next?('Reloj '+(next.elapsedMs/1000).toFixed(1)+' s · Lioren '+(ally?.hp??'?')+
      ' PV · Kiara '+(enemy?.hp??'?')+' PV'):'Vista previa — sin conexión al motor';
  const active=socket?.connected&&!!session&&state?.status==='active'&&!inflight;
  buttons.querySelectorAll('button').forEach(button=>{button.disabled=!active;});
}
function label(event){
  switch(event.type){
    case 'unit.summoned':return (event.side===1?'Aliado':'Rival')+' invoca '+event.cardId;
    case 'attack.preparing':return event.unitId+' prepara '+event.combatMode;
    case 'projectile.launched':return event.unitId+' dispara';
    case 'unit.hit':return event.targetId+' recibe '+event.damage+' de daño ('+event.hp+' PV)';
    case 'unit.defeated':return event.unitId+' derrotado';
    case 'combat.finished':return event.winner===0?'Empate':('Victoria de '+(event.winner===1?'Lioren':'Kiara'));
    default:return '';
  }
}
function writeEvents(events=[]){
  for(const event of events){
    if(seen.has(event.eventId))continue;
    seen.add(event.eventId);
    if(seen.size>1400)seen.clear();
    const text=label(event);
    if(!text)continue;
    const li=document.createElement('li');
    li.textContent='['+(event.timeMs/1000).toFixed(1)+'s] '+text;
    log.prepend(li);
  }
  while(log.children.length>28)log.lastElementChild.remove();
}
function updateSnapshot(next,events=[]){
  if(!next||(state&&next.revision<state.revision))return;
  scene?.setState(next,events);
  updateInfo(next);writeEvents(events);
}
function makeSummonButtons(catalog=[]){
  buttons.replaceChildren();
  for(const item of catalog){
    const btn=document.createElement('button');
    btn.type='button';btn.dataset.cardId=item.id;
    const title=document.createElement('strong');title.textContent=item.name;
    const info=document.createElement('small');
    const names={melee:'Cuerpo a cuerpo',range:'Rango',distance:'Distancia'};
    info.textContent=(names[item.combatMode]||item.combatMode)+
      ' · alcance '+item.range+' · PV '+item.hp+' · daño '+item.damage;
    btn.append(title,info);buttons.appendChild(btn);
    btn.addEventListener('click',()=>{void deploy(item.id);});
  }
  updateInfo(state);
}
async function deploy(cardId){
  if(!session||!socket?.connected||inflight)return;
  inflight=true;updateInfo(state);
  try{
    const response=await summonUnit(socket,session.id,cardId);
    if(response?.ok){
      updateSnapshot(response.state,response.events);
      feedback.textContent='Invocada '+cardId+' · La unidad actúa automáticamente.';
    }else feedback.textContent='Orden rechazada: '+(response?.error||'error de servidor');
  }catch(error){feedback.textContent='Conexión: '+String(error.message||error);}
  finally{inflight=false;updateInfo(state);}
}
async function loadEncounter(){
  try{
    const urls=[
      new URL('../../datos/json/encuentros/kiara.json',import.meta.url),
      new URL('../../datos/json/kasters/kiara.json',import.meta.url),
      new URL('../../datos/json/kasters/lioren.json',import.meta.url)
    ];
    const replies=await Promise.all(urls.map(url=>fetch(url)));
    if(replies.some(r=>!r.ok))throw Error('No se pudieron cargar los JSON');
    const [value,rival,player]=await Promise.all(replies.map(r=>r.json()));
    if(value.playerCasterId!==player.id||value.rivalCasterId!==rival.id)throw Error('Kasters inconsistentes');
    encounter=value;
    $('playerName').textContent=player.name;
    $('rivalName').textContent=rival.name;
    status.textContent='Definiciones cargadas · vista previa 3D disponible';
    dot.classList.add('ok');
    if(socket?.connected)create.disabled=false;
  }catch(error){status.textContent='Error de definiciones';message(String(error.message||error));}
}
function initScene(){
  import('./scene/renderer.js').then(({Arena3D})=>{
    scene=new Arena3D({mount:$('arena3d'),statusElement:$('sceneStatus')});
    if(state&&session){scene.resetSession();scene.setState(state,[]);}
    $('sceneReset').addEventListener('click',()=>scene?.resetCamera());
    $('sceneFull').addEventListener('click',()=>scene?.fullCamera());
    $('sceneArcher').addEventListener('click',async()=>{
      const btn=$('sceneArcher');btn.disabled=true;
      await scene.enableArcherModel();btn.textContent='Arquera GLB solicitada';
    });
  }).catch(error=>{
    $('sceneStatus').textContent='WebGL o Three.js no disponible: '+String(error.message||error);
    $('arena3d').classList.add('scene-unavailable');
    $('arena3d').textContent='No se pudo iniciar el renderizador 3D. El motor de combate permanece independiente.';
  });
}
connect.addEventListener('click',async()=>{
  const url=$('serverUrl').value.trim();
  if(!url){message('Necesitamos la dirección del backend desplegado para combatir.');return;}
  connect.disabled=true;create.disabled=true;
  if(socket){socket.disconnect();socket=null;}
  session=null;state=null;seen.clear();log.replaceChildren();
  scene?.resetSession();scene?.showPreview();
  updateInfo(null);
  try{
    socket=await connectBackend(url);
    listenCombatSync(socket,packet=>{
      if(!session||packet.sessionId!==session.id)return;
      updateSnapshot(packet.state,packet.events);
    });
    socket.on('disconnect',()=>{
      create.disabled=true;
      buttons.querySelectorAll('button').forEach(b=>b.disabled=true);
      message('Conexión perdida: la simulación no puede continuar.');
      $('sceneStatus').textContent='Sin servidor · última posición recibida congelada';
    });
    create.disabled=!encounter;
    message('Servidor conectado. Puedes iniciar el combate continuo.');
  }catch(error){message('Conexión fallida: '+String(error.message||error));}
  finally{connect.disabled=false;}
});
create.addEventListener('click',async()=>{
  create.disabled=true;
  try{
    session=await createAdventureSession(socket,encounter.id);
    seen.clear();log.replaceChildren();
    scene?.resetSession();
    updateSnapshot(session,[]);
    makeSummonButtons(session.summonCatalog);
    feedback.textContent='Selecciona una invocación. Las unidades combatirán por sí mismas.';
    message('Combate iniciado. Toda la simulación se ejecuta en el servidor.');
  }catch(error){message('No se pudo iniciar: '+String(error.message||error));}
  finally{create.disabled=!socket?.connected||!encounter;}
});
initScene();void loadEncounter();
