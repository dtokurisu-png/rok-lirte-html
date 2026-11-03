// HUD de enlace de cartas existentes: ningún daño ni lógica de combate local.
const SUPPORTED = new Map([
  ['kiaraFaroleraUmbral', {name:'Farolera del Umbral',art:'../../assets/kiara/farolera-del-umbral-token.png',note:'Ataque básico adaptado; poder pendiente'}]
]);
const MAX_CARDS = 30;
const validId = value => typeof value === 'string' && /^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(value);
export function createSpellbookHUD({mount,onSummon}) {
  if(!mount)throw Error('Contenedor HUD inexistente');
  let cardIds=[], connected=false, sessionActive=false, busy=false, statusText='Esperando Spellbook';
  let lastState=null;
  const heading=document.createElement('div');
  heading.className='spellbook-heading';
  const label=document.createElement('strong');label.textContent='SPELLBOOK · AVENTURA';
  const count=document.createElement('span');
  heading.append(label,count);
  const cards=document.createElement('div');cards.className='spellbook-hand';
  const note=document.createElement('p');note.className='spellbook-note';note.setAttribute('role','status');
  mount.replaceChildren(heading,cards,note);
  function render() {
    count.textContent=cardIds.length+'/'+MAX_CARDS;
    cards.replaceChildren();
    const copies=new Map();
    for(const id of cardIds)copies.set(id,(copies.get(id)||0)+1);
    if(!copies.size){
      const empty=document.createElement('span');
      empty.className='spellbook-empty';
      empty.textContent='Sin cartas equipadas en el Spellbook original. Configúralo desde la preparación de Aventura cuando esté desbloqueado.';
      cards.append(empty);
    }
    for(const [id,copiesCount] of copies) {
      const item=document.createElement('button');
      item.type='button';item.className='spellbook-action';
      const definition=SUPPORTED.get(id);
      const usable=Boolean(definition && connected && sessionActive && !busy && lastState?.status==='active');
      item.disabled=!usable;
      item.title=!definition?'Carta pendiente de adaptar al motor continuo':
        !connected?'Requiere backend conectado':!sessionActive?'Sin sesión de combate':definition.note;
      if(definition?.art) {
        const art=document.createElement('img');
        art.src=new URL(definition.art,import.meta.url).href;art.alt='';art.loading='lazy';
        item.append(art);
      }
      const name=document.createElement('span');name.textContent=definition?.name||id;item.append(name);
      const extra=document.createElement('small');
      extra.textContent=(copiesCount>1?'×'+copiesCount+' · ':'')+
        (!definition?'Pendiente':!connected?'Sin servidor':!sessionActive?'En espera':'Invocar');
      item.append(extra);
      if(usable)item.addEventListener('click',()=>void sendSummon(id));
      cards.append(item);
    }
    note.textContent=statusText;
  }
  async function sendSummon(id) {
    if(busy||!connected||!sessionActive||!SUPPORTED.has(id))return;
    busy=true;statusText='Solicitando invocación al servidor…';render();
    try{
      const reply=await onSummon(id);
      statusText=reply?.ok?'Invocación aceptada por el servidor':'No se pudo invocar: '+String(reply?.error||'rechazada');
    }catch(error){statusText='Error de conexión al invocar';}
    finally{busy=false;render();}
  }
  render();
  return {
    setDeck(ids) {cardIds=Array.isArray(ids)?ids.filter(validId).slice(0,MAX_CARDS):[];render();},
    setConnection(value) {connected=Boolean(value);if(!connected)sessionActive=false;render();},
    setSession(value) {sessionActive=Boolean(value);render();},
    setState(state) {lastState=state;render();},
    setMessage(value) {statusText=String(value||'').slice(0,180);render();}
  };
}
