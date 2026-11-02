import { connectBackend, createAdventureSession } from './network.js';
const $=id=>document.getElementById(id);
const result=$('result'),status=$('statusText'),dot=$('statusDot');
let connection=null, encounter=null;
function message(text){result.textContent=text;}
async function loadData(){
  try{
    const paths=[
      new URL('../../datos/json/encuentros/kiara.json',import.meta.url),
      new URL('../../datos/json/kasters/kiara.json',import.meta.url),
      new URL('../../datos/json/kasters/lioren.json',import.meta.url)
    ];
    const responses=await Promise.all(paths.map(url=>fetch(url)));
    if(responses.some(response=>!response.ok))throw new Error('Definiciones JSON no disponibles.');
    const [e,rival,player]=await Promise.all(responses.map(response=>response.json()));
    if(e.rivalCasterId!==rival.id||e.playerCasterId!==player.id)throw new Error('Los Kasters no coinciden.');
    encounter=e;
    $('playerName').textContent=player.name;
    $('rivalName').textContent=rival.name;
    status.textContent='Definiciones cargadas · Frontend listo';
    dot.classList.add('ok');
    if(connection?.connected)$('create').disabled=false;
  }catch(error){status.textContent='Error al cargar definiciones';message(String(error.message||error));}
}
$('connect').addEventListener('click',async()=>{
  const url=$('serverUrl').value.trim();
  if(!url){message('Especifica la dirección del servidor Node.js cuando esté desplegado.');return;}
  $('connect').disabled=true;$('create').disabled=true;
  if(connection){connection.disconnect();connection=null;}
  try{
    connection=await connectBackend(url);
    $('create').disabled=!encounter;
    message('Backend conectado. Puedes crear una sesión de preparación (sin combate aún).');
    connection.on('disconnect',()=>{$('create').disabled=true;message('Se perdió la conexión con el backend.');});
  }catch(error){message('Conexión fallida: '+String(error.message||error));}
  finally{$('connect').disabled=false;}
});
$('create').addEventListener('click',async()=>{
  $('create').disabled=true;
  try{
    const session=await createAdventureSession(connection,encounter.id);
    message('Sesión creada: '+session.id+' · '+session.status+' · arena '+session.arena.columns+'×'+session.arena.rows+'. El combate llegará en la Etapa 2.');
  }catch(error){message(String(error.message||error));}
  finally{$('create').disabled=!connection?.connected||!encounter;}
});
loadData();
