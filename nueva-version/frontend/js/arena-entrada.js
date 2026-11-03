// Entrada del escenario de Aventura. La navegación y el VS pertenecen a game.js (R.O.K. Lite).
// Este archivo nunca genera acciones, daños o resultados locales.
import {Arena3D} from './scene/renderer.js';
import {connectBackend,createAdventureSession,summonUnit,listenCombatSync} from './network.js';
import {createSpellbookHUD} from './ui/spellbook-hud.js';

const $ = id => document.getElementById(id);
const origin = window.location.origin;
let scene = null, payload = null, socket = null, session = null;
let attempt = 0, configuredBackend = '', warmConnection = null;
const notice = $('arenaNotice'), connectionStatus = $('connectionStatus');
const sceneStatus = $('sceneStatus');
const spellbookHUD=createSpellbookHUD({mount:$('spellbookHud'),onSummon:async cardId=>{
  if(!socket?.connected||!session?.id)return {ok:false,error:'session-not-active'};
  const result=await summonUnit(socket,session.id,cardId);
  return result;
}});
function status(text) { connectionStatus.textContent = text; }
function inform(text) { notice.textContent = text; }
function parentMessage(type,message) {
  if (window.parent !== window)
    window.parent.postMessage({type,message},origin);
}
async function readConfig(){
  try{
    const response=await fetch(new URL('../config.json',import.meta.url),{cache:'no-store'});
    if(!response.ok)throw Error('Config no disponible');
    const data=await response.json();
    if(typeof data?.backendUrl === 'string')configuredBackend=data.backendUrl.trim();
  }catch(error){configuredBackend='';}
}
const configReady=readConfig();
// Preconexión mientras la presentación VS original está contando 3-2-1.
// No se crea ninguna sesión hasta recibir el payload definitivo de game.js.
async function prepareConnection(){
  await configReady;
  if(!configuredBackend)return null;
  if(socket?.connected)return socket;
  if(!warmConnection){
    warmConnection=connectBackend(configuredBackend).then(ready=>{
      socket=ready;return ready;
    }).catch(()=>{
      warmConnection=null;
      return null;
    });
  }
  return warmConnection;
}
void prepareConnection();
function endSession(keepPrepared=false){
  attempt++;
  session=null;
  spellbookHUD.setSession(false);
  if(!keepPrepared){
    socket?.disconnect();socket=null;warmConnection=null;
    spellbookHUD.setConnection(false);
  }
}
function previewFor(detail){
  return {
    mode:'adventure',status:'preview',revision:0,elapsedMs:0,
    casters:[
      {id:'lioren',name:detail.playerName||'Lioren',side:1,role:'caster',
       row:16,col:4,hp:14,maxHp:14},
      {id:'kasterKiaraWater',name:detail.rivalName||'Kiara',side:2,role:'caster',
       row:1,col:4,hp:8,maxHp:8}
    ],units:[],projectiles:[]
  };
}
function displaySelection(detail){
  $('matchTitle').textContent=(detail.playerName||'Lioren')+'  VS  '+(detail.rivalName||'Kiara');
  $('arenaName').textContent=detail.arenaName||'Arena de Aventura';
  scene.resetSession();
  spellbookHUD.setDeck(detail.playerSpellbookCardIds,detail.playerSpellbookCards);
  spellbookHUD.setSession(false);
  spellbookHUD.setState(null);
  spellbookHUD.setMessage('Se conserva el Spellbook de Aventura. Las cartas pendientes de adaptar aparecen desactivadas.');
  scene.setArenaArt(detail.arenaImage);
  scene.setState(previewFor(detail));
  scene.resetCamera();
  status('Escenario cargado');
  parentMessage('rok:arena:displayed');
}
async function beginBattle(detail){
  endSession(!session);
  payload=detail;
  const key=attempt;
  displaySelection(detail);
  await configReady;
  if(key!==attempt)return;
  if(!configuredBackend){
    status('Vista previa · sin servidor');
    inform('Llegaste a la arena desde el VS original. La escena está lista; todavía no hay backend público para iniciar el combate real.');
    spellbookHUD.setMessage('Vista del mazo original · sin servidor de combate.');
    return;
  }
  if(detail.encounterId!=='enigma-apprentice'){
    status('Encuentro aún no adaptado');
    inform('Escenario seleccionado correctamente. El motor nuevo todavía solo tiene configurado el primer encuentro de Kiara.');
    return;
  }
  status('Conectando servidor…');
  inform('Preparando sesión real de Aventura en el backend…');
  try{
    const activeSocket=await prepareConnection();
    if(!activeSocket)throw Error('No se pudo establecer la conexión con el backend');
    if(key!==attempt)return;
    socket=activeSocket;
    spellbookHUD.setConnection(true);
    socket.on('disconnect',()=>{
      if(key!==attempt)return;
      status('Servidor desconectado');
      spellbookHUD.setConnection(false);
      spellbookHUD.setMessage('Conexión perdida. Las invocaciones quedan bloqueadas.');
      inform('Se interrumpió la conexión. La arena conserva la última posición recibida, sin continuar el combate localmente.');
    });
    listenCombatSync(socket,packet=>{
      if(key!==attempt||!session||packet.sessionId!==session.id)return;
      scene.setState(packet.state,packet.events);
      spellbookHUD.setState(packet.state);
      if(packet.state.status==='finished'){
        status('Combate finalizado');
        inform('Resultado recibido del servidor. Recompensas y Spellbooks definitivos aún no están integrados.');
      }
    });
    const newSession=await createAdventureSession(socket,detail.encounterId,detail.playerSpellbookCardIds);
    if(key!==attempt)return;
    session=newSession;
    spellbookHUD.setSession(true);
    spellbookHUD.setState(session);
    spellbookHUD.setMessage('Puedes invocar las cartas equipadas y adaptadas. Las demás permanecen pendientes.');
    scene.resetSession();
    scene.setState(session);
    status('Servidor conectado');
    inform('Combate real iniciado en el servidor. La adaptación del Spellbook de R.O.K. aún está pendiente; esta fase comprueba la transición y el escenario.');
  }catch(error){
    if(key!==attempt)return;
    socket?.disconnect();socket=null;
    spellbookHUD.setConnection(false);
    spellbookHUD.setMessage('Servidor no disponible. Invocaciones desactivadas.');
    status('Servidor no disponible');
    inform('Se abrió la arena, pero no fue posible crear la sesión: '+String(error.message||error).slice(0,160)+'. La vista es solamente visual.');
  }
}
function resetView(){
  endSession();
  payload=null;
  spellbookHUD.setDeck([]);
  spellbookHUD.setState(null);
  status('Vista previa');
  inform('Selecciona Combatir desde la preparación existente de R.O.K.');
  scene?.resetSession();
  scene?.showPreview();
}
window.addEventListener('message',event=>{
  if(event.origin!==origin||event.source!==window.parent)return;
  const data=event.data;
  if(data?.type==='rok:arena:ping'){parentMessage('rok:arena:ready');return;}
  if(data?.type==='rok:arena:preload'){void prepareConnection();return;}
  if(data?.type==='rok:arena:reset'){resetView();return;}
  if(data?.type==='rok:arena:start' && data.payload && typeof data.payload.encounterId==='string'){
    void beginBattle(data.payload);
  }
});
$('exitArena').addEventListener('click',()=>{
  resetView();
  parentMessage('rok:arena:exit');
});
$('cameraReset').addEventListener('click',()=>scene?.resetCamera());
$('cameraFull').addEventListener('click',()=>scene?.fullCamera());
try{
  scene=new Arena3D({mount:$('sceneMount'),statusElement:sceneStatus});
  status('Arena 3D preparada');
  parentMessage('rok:arena:ready');
}catch(error){
  status('Error al crear la arena');
  inform('No se pudo iniciar Three.js: '+String(error.message||error).slice(0,170));
  parentMessage('rok:arena:loading','Error de escenario 3D. Puedes volver a preparación.');
}
