// Entrada del escenario de Aventura. La navegación y el VS pertenecen a game.js (R.O.K. Lite).
// Este archivo nunca genera acciones, daños o resultados locales.
import {Arena3D} from './scene/renderer.js';
import {connectBackend,createAdventureSession,listenCombatSync} from './network.js';

const $ = id => document.getElementById(id);
const origin = window.location.origin;
let scene = null, payload = null, socket = null, session = null;
let attempt = 0, configuredBackend = '', warmConnection = null;
const notice = $('arenaNotice'), connectionStatus = $('connectionStatus');
const sceneStatus = $('sceneStatus');
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
  if(!keepPrepared){
    socket?.disconnect();socket=null;warmConnection=null;
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
    socket.on('disconnect',()=>{
      if(key!==attempt)return;
      status('Servidor desconectado');
      inform('Se interrumpió la conexión. La arena conserva la última posición recibida, sin continuar el combate localmente.');
    });
    listenCombatSync(socket,packet=>{
      if(key!==attempt||!session||packet.sessionId!==session.id)return;
      scene.setState(packet.state,packet.events);
      if(packet.state.status==='finished'){
        status('Combate finalizado');
        inform('Resultado recibido del servidor. Recompensas y Spellbooks definitivos aún no están integrados.');
      }
    });
    const newSession=await createAdventureSession(socket,detail.encounterId);
    if(key!==attempt)return;
    session=newSession;
    scene.resetSession();
    scene.setState(session);
    status('Servidor conectado');
    inform('Combate real iniciado en el servidor. La adaptación del Spellbook de R.O.K. aún está pendiente; esta fase comprueba la transición y el escenario.');
  }catch(error){
    if(key!==attempt)return;
    socket?.disconnect();socket=null;
    status('Servidor no disponible');
    inform('Se abrió la arena, pero no fue posible crear la sesión: '+String(error.message||error).slice(0,160)+'. La vista es solamente visual.');
  }
}
function resetView(){
  endSession();
  payload=null;
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
