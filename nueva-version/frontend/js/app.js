import { connectBackend, createAdventureSession, sendCombatAction, fetchCombatState } from './network.js';
const $=id=>document.getElementById(id);
const result=$('result'),status=$('statusText'),dot=$('statusDot');
let connection=null,encounter=null,session=null,state=null,selected=null,busy=false;
const stage=document.createElement('section');
stage.className='battle-stage';
stage.hidden=true;
stage.innerHTML=`
  <div class="stage-header">
    <div><small>ARENA DE PRUEBAS · REGLAS EN EL SERVIDOR</small><h2>Combate lógico 9 × 18</h2>
    <p>Por turno: 2 acciones. Mover y atacar consumen una acción cada una. Esta no es todavía la arena 3D.</p></div>
    <div id="combatSummary" role="status"></div>
  </div>
  <div class="stage-layout">
    <div id="combatBoard" class="combat-board" role="grid" aria-label="Cuadrícula de combate">
    </div>
    <div class="stage-aside">
      <strong>Comandos</strong><p id="combatSelection">Elige una casilla.</p>
      <div class="stage-buttons">
        <button id="combatMove" type="button">Mover a casilla</button>
        <button id="combatAttack" type="button">Atacar objetivo</button>
        <button id="combatEnd" type="button">Terminar turno</button>
        <button id="combatSync" type="button">Sincronizar</button>
      </div>
      <h3>Eventos del servidor</h3><ol id="combatLog" class="combat-log"></ol>
    </div>
  </div>`;
document.querySelector('.layout').appendChild(stage);
const board=$('combatBoard'),summary=$('combatSummary'),selection=$('combatSelection'),log=$('combatLog');
const move=$('combatMove'),attack=$('combatAttack'),end=$('combatEnd'),sync=$('combatSync');
function message(text){result.textContent=text;}
function eventText(e){
  if(e.type==='unit.moved')return e.actorId+' se mueve a ('+e.to.row+', '+e.to.col+').';
  if(e.type==='unit.attacked')return e.actorId+' inflige '+e.damage+' a '+e.targetId+' (PV '+e.hp+').';
  if(e.type==='turn.started')return 'Turno '+e.number+' · '+(e.side===1?'Lioren':'Kiara')+'.';
  if(e.type==='combat.finished')return 'Combate terminado: gana '+(e.winner===1?'Lioren':'Kiara')+'.';
  return e.type;
}
function addEvents(events){
  for(const e of events||[]){
    const item=document.createElement('li');
    item.textContent=eventText(e);
    log.prepend(item);
  }
  while(log.children.length>25)log.lastElementChild.remove();
}
function renderState(next){
  state=next;
  if(!state){stage.hidden=true;return;}
  stage.hidden=false;
  const ally=state.casters.find(c=>c.side===1),enemy=state.casters.find(c=>c.side===2);
  const playable=state.status==='active'&&state.turn.side===1&&!busy;
  summary.textContent=state.status==='finished'
    ? ('Victoria: '+(state.winner===1?'Lioren':'Kiara')+' · Revisión '+state.revision)
    : ('Turno '+state.turn.number+' · Acciones '+state.turn.actionsRemaining+
      ' · Lioren '+ally.hp+'/'+ally.maxHp+' PV · Kiara '+enemy.hp+'/'+enemy.maxHp+' PV');
  const frag=document.createDocumentFragment();
  for(let row=0;row<state.arena.rows;row++)for(let col=0;col<state.arena.columns;col++){
    const unit=state.casters.find(c=>c.hp>0&&c.row===row&&c.col===col);
    const b=document.createElement('button');
    b.type='button';
    b.className='combat-cell'+(unit?(unit.side===1?' ally':' enemy'):'')+
      (selected&&selected.row===row&&selected.col===col?' selected':'');
    b.dataset.row=String(row);b.dataset.col=String(col);
    b.setAttribute('role','gridcell');
    b.setAttribute('aria-label',unit?
      (unit.side===1?'Lioren':'Kiara')+', fila '+row+', columna '+col:
      'Fila '+row+', columna '+col);
    b.textContent=unit?(unit.side===1?'L':'K'):'';
    b.title='Fila '+row+', columna '+col+(unit?' · '+unit.id:'');
    frag.appendChild(b);
  }
  board.replaceChildren(frag);
  const chosen=selected&&state.casters.find(c=>c.row===selected.row&&c.col===selected.col&&c.hp>0);
  selection.textContent=selected?
    ('Casilla ('+selected.row+', '+selected.col+')'+(chosen?' · '+chosen.id:'')):
    'Elige una casilla en la cuadrícula.';
  move.disabled=!playable||!selected||!!chosen;
  attack.disabled=!playable||!chosen||chosen.side!==2;
  end.disabled=!playable;
  sync.disabled=!connection?.connected||busy;
}
board.addEventListener('click',e=>{
  const button=e.target.closest('button[data-row]');
  if(!button||!state)return;
  selected={row:Number(button.dataset.row),col:Number(button.dataset.col)};
  renderState(state);
});
async function action(command){
  if(!connection||!session||!state||busy)return;
  busy=true;renderState(state);
  try{
    const reply=await sendCombatAction(connection,session.id,state.revision,command);
    if(!reply?.ok){
      if(reply?.state)renderState(reply.state);
      message('El servidor rechazó la acción: '+(reply?.error||'error'));
      return;
    }
    renderState(reply.state);
    addEvents(reply.events);
    message('Acción validada por el backend · Revisión '+reply.state.revision+'.');
  }catch(error){message('Error de comunicación: '+String(error.message||error));}
  finally{busy=false;renderState(state);}
}
move.addEventListener('click',()=>{if(selected)void action({type:'move',row:selected.row,col:selected.col});});
attack.addEventListener('click',()=>{
  if(!selected||!state)return;
  const opponent=state.casters.find(c=>c.side===2&&c.row===selected.row&&c.col===selected.col&&c.hp>0);
  if(opponent)void action({type:'attack',targetId:opponent.id});
});
end.addEventListener('click',()=>void action({type:'endTurn'}));
sync.addEventListener('click',async()=>{
  if(!connection||!session||busy)return;
  try{
    const reply=await fetchCombatState(connection,session.id);
    if(reply.ok){renderState(reply.state);message('Estado sincronizado con el servidor.');}
    else message('No se pudo sincronizar: '+(reply.error||'error'));
  }catch(error){message('Error al sincronizar: '+String(error.message||error));}
});
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
    encounter=e;$('playerName').textContent=player.name;$('rivalName').textContent=rival.name;
    status.textContent='Datos cargados · Motor de combate en el backend';
    dot.classList.add('ok');
    if(connection?.connected)$('create').disabled=false;
  }catch(error){status.textContent='Error al cargar definiciones';message(String(error.message||error));}
}
$('connect').addEventListener('click',async()=>{
  const url=$('serverUrl').value.trim();
  if(!url){message('Especifica la dirección del servidor Node.js desplegado.');return;}
  $('connect').disabled=true;$('create').disabled=true;
  if(connection){connection.disconnect();connection=null;}
  state=null;session=null;renderState(null);
  try{
    connection=await connectBackend(url);
    $('create').disabled=!encounter;
    message('Backend conectado: ya puedes crear un combate de prueba.');
    connection.on('disconnect',()=>{
      $('create').disabled=true;renderState(null);
      message('Se perdió la conexión. La sesión en memoria ya no está disponible.');
    });
  }catch(error){message('Conexión fallida: '+String(error.message||error));}
  finally{$('connect').disabled=false;}
});
$('create').addEventListener('click',async()=>{
  $('create').disabled=true;
  try{
    session=await createAdventureSession(connection,encounter.id);
    selected=null;log.replaceChildren();
    renderState(session);
    message('Partida creada en el backend. Selecciona una casilla y usa los botones.');
  }catch(error){message(String(error.message||error));}
  finally{$('create').disabled=!connection?.connected||!encounter;}
});
loadData();
