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
const FACTORS=Object.freeze({
 escudo:{focus:'proteccion',modes:['damage','hit','time','charges']},
 armadura:{focus:'proteccion',modes:['damage','hit','time','charges']},
 quemadura:{focus:'danio',modes:['time']},
 veneno:{focus:'danio',modes:['time']},
 evasion:{focus:'proteccion',modes:['charges','time']},
 confusion:{focus:'control',modes:['time']},
 sanacion:{focus:'sanacion',modes:['time','instant']}
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
   ['escudo','armadura','evasion','sanacion'].includes(id)?'defensivo':'ofensivo')),
  focus:norm(semantic.focus||definition.focus)
 };
 for(const [layer,value] of Object.entries(taxonomy))
  if(!FACTOR_LAYERS[layer].includes(value))
   throw Error('Factor: capa '+layer+' inválida: '+value);
 const mode=norm(config.mode||(
  ['quemadura','veneno','confusion'].includes(id)?'time':'damage'));
 if(!definition.modes.includes(mode))throw Error('Factor: consumo incompatible: '+id+'/'+mode);
 const potency=finite(Number(config.potency??1),'potency');
 const duration=finite(Number(config.duration??0),'duration');
 const interval=finite(Number(config.interval??1),'interval',.001);
 const capacity=finite(Number(config.capacity??potency),'capacity');
 const cooldown=finite(Number(config.cooldown??0),'cooldown');
 const normalized={...config,mode,potency,duration,interval,capacity,cooldown,
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
export function stepFactor(instance,dt,{emit=()=>{}}={}){
 finite(dt,'dt');if(!instance?.state?.active)return [];
 const state=instance.state,cfg=instance.config,events=[];
 if(cfg.mode==='time'||cfg.duration>0){
  const activeDt=cfg.duration>0?Math.min(dt,state.remaining):dt;
  state.elapsed+=activeDt;
  if(['quemadura','veneno','sanacion'].includes(instance.factor)){
   while(state.elapsed+1e-9>=cfg.interval){
    state.elapsed-=cfg.interval;state.pulses++;
    events.push({type:instance.factor,category:instance.semantic.category,
     potency:cfg.potency,sourceId:instance.sourceId,targetId:instance.targetId});
   }
  }
  if(cfg.duration>0){state.remaining=Math.max(0,state.remaining-dt);
   if(state.remaining===0)state.active=false;}
 }
 for(const event of events)emit(event);
 return events;
}
