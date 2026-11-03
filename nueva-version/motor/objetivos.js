// La reserva 1v1 se aplica a duelos melee. Una invocacion ocupada no
// puede ser capturada por una segunda. Las demas buscan libres o caster.
export function alive(state,id){
  return [...state.units,...state.casters].find(u=>u.id===id&&u.hp>0)||null;
}
export function releaseDuel(state,unit){
  if(!unit?.duelId)return;
  const other=alive(state,unit.duelId);
  if(other?.duelId===unit.id)other.duelId=null;
  unit.duelId=null;
}
export function maintainDuels(state){
  for(const unit of state.units){
    if(!unit.duelId)continue;
    const opponent=alive(state,unit.duelId);
    if(unit.hp<=0||!opponent||opponent.role!=='summon'||
       opponent.duelId!==unit.id || opponent.side===unit.side)releaseDuel(state,unit);
  }
}
export function distance(a,b){return Math.hypot(a.col-b.col,a.row-b.row);}
export function targetFor(state,unit){
  if(unit.hp<=0)return null;
  const previous=alive(state,unit.duelId);
  if(previous?.duelId===unit.id)return previous;
  const caster=state.casters.find(c=>c.side!==unit.side&&c.hp>0);
  if(!caster)return null;
  const available=state.units.filter(e=>e.side!==unit.side&&e.hp>0&&!e.duelId);
  const home=state.casters.find(c=>c.side===unit.side);
  const threats=available.filter(e=>distance(e,home)<=e.range+.25);
  const list=threats.length?threats:[...available,caster];
  list.sort((a,b)=>distance(unit,a)-distance(unit,b)||
    (a.role==='caster'?1:0)-(b.role==='caster'?1:0)||a.id.localeCompare(b.id));
  for(const target of list){
    if(target.role==='summon' && unit.combatMode==='melee'){
      if(unit.duelId||target.duelId)continue;
      unit.duelId=target.id;target.duelId=unit.id;
    }
    return target;
  }
  return caster;
}
export function validAttackTarget(state,unit,target){
  if(!target||target.hp<=0||target.side===unit.side)return false;
  if(target.role==='summon' && target.duelId&&target.duelId!==unit.id)return false;
  if(unit.duelId && unit.duelId!==target.id)return false;
  return true;
}
