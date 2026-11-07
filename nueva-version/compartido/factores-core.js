/* R.O.K. — factor engine, independent of cards and renderers.
 * Historic card-description chain (Lite v8.32–v8.39):
 * root -> activation -> category -> orientation -> focus.
 * Root (Factor/Power/Ability) and activation (Passive/Active/Trigger/PDA)
 * belong to the CARD APPLICATION, never to a factor definition.
 * A factor defines mechanics; each card/ability supplies nature, use and
 * visual configuration. Not yet a replacement for legacy game.js.
 */
export const LEGACY_SEMANTIC_LAYERS=Object.freeze({
 roots:['factor','poder','habilidad'],
 activation:['pasiva','activa','disparador','pda']
});
export const FACTOR_LAYERS=Object.freeze({
 category:['fisico','magico','elemental','psiquico','virtual','estrategico'],
 orientation:['ofensivo','defensivo','tactico'],
 focus:['proteccion','danio','control','sanacion','movilidad','iniciativa','saqueo']
});
export const FACTOR_COLORS=Object.freeze({
 fisico:'#FFFFFF',magico:'#79E9FF',psiquico:'#F2CE31',
 elemental:'#00FFE4',virtual:'#A455C8',estrategico:'#D7A803'
});
// Add new factors ONLY when a card requires them; this is the current set.
const FACTORS=Object.freeze({
 confusion:{focus:'control',modes:['time']},
 escudo:{focus:'proteccion',modes:['damage','hit','time','charges']},
 armadura:{focus:'proteccion',modes:['damage','hit','time','charges']},
 extraccion:{focus:'saqueo',modes:['instant','time']},
 sanacion:{focus:'sanacion',modes:['instant','time']},
 control:{focus:'control',modes:['instant','time']}
});
const finite=(v,name,min=0)=>{if(!Number.isFinite(v)||v<min)throw Error('Factor: '+name+' inválido');return v;};
const norm=(s)=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function factorDefinition(id){return FACTORS[norm(id)]||null;}
export function describeFactor(instance){
 const {factor,semantic,application,config}=instance;
 return {factor,semantic:{...semantic},application:{...application},
  config:{...config},color:FACTOR_COLORS[semantic.category]};
}
export function createFactorInstance({
 factor,semantic={},application={},config={},sourceId=null,targetId=null
}){
 const id=norm(factor),definition=FACTORsGet(id);
 // A factor has only nature, orientation and focus. The invocation/card
 // defines whether it is passive, active, triggered or attached to damage.
 const origin={
  root:norm(application.root??semantic.root??'factor'),
  activation:norm(application.activation??semantic.activation??'pasiva')
 };
 for(const [key,value] of Object.entries(origin))
  if(!LEGACY_SEMANTIC_LAYERS[key==='root'?'roots':'activation'].includes(value))
   throw Error('Aplicación: '+key+' inválida: '+value);
 const taxonomy={
  category:norm(semantic.category),
  orientation:norm(semantic.orientation||(
   ['escudo','armadura','sanacion'].includes(id)?'defensivo':'ofensivo')),
  focus:norm(semantic.focus||definition.focus)
 };
 for(const [layer,value] of Object.entries(taxonomy))
  if(!FACTOR_LAYERS[layer].includes(value))
   throw Error('Factor: capa '+layer+' inválida: '+value);
 const mode=norm(config.mode||(
  ['confusion','control'].includes(id)?'time':
  ['sanacion','extraccion'].includes(id)?'instant':'damage'));
 if(!definition.modes.includes(mode))throw Error('Factor: consumo incompatible: '+id+'/'+mode);
 const potency=finite(Number(config.potency??1),'potency');
 const duration=finite(Number(config.duration??0),'duration');
 const interval=finite(Number(config.interval??1),'interval',.001);
 const capacity=finite(Number(config.capacity??potency),'capacity');
 const cooldown=finite(Number(config.cooldown??0),'cooldown');
 if(!Number.isFinite(Number(config.radius??0))||Number(config.radius??0)<0)
  throw Error('Factor: radio inválido');
 const normalized={...config,mode,potency,duration,interval,capacity,cooldown,
  radius:Number(config.radius??0),
  blocksCategories:(config.blocksCategories||[]).map(norm)};
 for(const cat of normalized.blocksCategories)
  if(!FACTOR_LAYERS.category.includes(cat))throw Error('Categoría bloqueada desconocida: '+cat);
 const state={remaining:duration,capacity,elapsed:0,pulses:0,active:true};
 return {factor:id,semantic:taxonomy,application:origin,config:normalized,
  sourceId,targetId,state};
}
function FACTORsGet(id){const value=FACTORs[id];if(!value)throw Error('Factor desconocido: '+id);return value;}
const FACTORs=FACTORS;
export function factorBlocks(instance,event){
 if(!instance?.state?.active)return false;
 const blocked=instance.config.blocksCategories||[];
 return blocked.includes(norm(event?.category))&&event?.negative===true;
}
export function absorbFactorDamage(instance,damage,{category=null}={}){
 const amount=finite(Number(damage),'damage');
 if(!instance?.state?.active||!['escudo','armadura'].includes(instance.factor))
  return {absorbed:0,remaining:amount};
 if(instance.semantic.category!==norm(category))return {absorbed:0,remaining:amount};
 if(instance.config.mode==='time')return {absorbed:amount,remaining:0};
 if(instance.config.mode==='hit'){
  instance.state.capacity=Math.max(0,instance.state.capacity-1);
  if(instance.state.capacity<=0)instance.state.active=false;
  return {absorbed:amount,remaining:0};
 }
 const absorbed=Math.min(amount,instance.state.capacity);
 instance.state.capacity-=absorbed;
 if(instance.state.capacity<=0)instance.state.active=false;
 return {absorbed,remaining:amount-absorbed};
}
// Consumers decide recipients (team, radius, eligibility) and apply the
// emitted event to the authoritative game state; no Three.js dependency.
export function stepFactor(instance,dt,{emit=()=>{}}={}){
 finite(dt,'dt');if(!instance?.state?.active)return [];
 const state=instance.state,cfg=instance.config,events=[];
 const activeDt=cfg.duration>0?Math.min(dt,state.remaining):dt;
 const periodic=['sanacion','extraccion','control'].includes(instance.factor);
 if(cfg.mode==='instant'){
  if(state.pulses===0){
   state.pulses=1;
   events.push({type:instance.factor,category:instance.semantic.category,
    potency:cfg.potency,radius:cfg.radius,sourceId:instance.sourceId,
    targetId:instance.targetId,negative:instance.factor==='control'});
   state.active=false;
  }
 }else if(cfg.mode==='time'){
  state.elapsed+=activeDt;
  if(periodic){
   // One event per complete configured interval, including large frame dt.
   while(state.elapsed+1e-9>=cfg.interval){
    state.elapsed-=cfg.interval;state.pulses++;
    events.push({type:instance.factor,category:instance.semantic.category,
     potency:cfg.potency,radius:cfg.radius,sourceId:instance.sourceId,
     targetId:instance.targetId,negative:instance.factor==='control'});
   }
  }
  if(cfg.duration>0){
   state.remaining=Math.max(0,state.remaining-dt);
   if(state.remaining<=1e-9){state.remaining=0;state.active=false;}
  }
 }
 for(const event of events)emit(event);
 return events;
}
// Retained separate state event for the existing fixed-outcome Telepate
// confusion. No attack reroll, movement redirection or double damage.
export function applyFactorStatus(instance,target){
 if(!instance?.state?.active||!target)return false;
 if(instance.factor!=='confusion'&&instance.factor!=='control')return false;
 if(instance.config.mode!=='time')return false;
 target.rokFactorStatuses??={};
 target.rokFactorStatuses[instance.factor]={
  category:instance.semantic.category,
  negative:true,
  remaining:instance.state.remaining,
  sourceId:instance.sourceId
 };
 return true;
}
export function factorProfile(factor){
 const name=norm(factor),definition=FACTORsGet(name);
 return Object.freeze({id:name,focus:definition.focus,
  supportedModes:[...definition.modes],
  configurable:['category','orientation','potency','duration',
   'interval','capacity','radius','blocksCategories','animation','activation']
 });
}
