import { createUnit } from './unidades.js';
import { alive, distance, targetFor, validAttackTarget,maintainDuels,releaseDuel } from './objetivos.js';
const STEP_MS=100;
const rnd=x=>Math.round(x*1000)/1000;
function event(state,events,type,data={}){
  events.push({type,...data,timeMs:state.elapsedMs,eventId:++state.eventSerial});
}
export function summon(state,side,cardId){
  if(!state || state.status!=='active')return {ok:false,error:'combat-not-active'};
  const next=structuredClone(state),events=[];
  const template=next.summonCatalog.find(t=>t.id===cardId);
  const result=createUnit(next,side,template);
  if(!result.ok)return result;
  event(next,events,'unit.summoned',{unitId:result.unit.id,cardId,side,
    row:result.unit.row,col:result.unit.col,combatMode:result.unit.combatMode});
  next.revision++;
  return {ok:true,state:next,events};
}
function botSummons(state,events){
  if(state.elapsedMs<state.bot.nextSummonAtMs)return;
  const order=['shield','mana','archer','melee-vanguard'];
  const cardId=order[state.bot.serial%order.length];
  const template=state.summonCatalog.find(t=>t.id===cardId);
  const result=createUnit(state,2,template);
  if(result.ok){
    state.bot.serial++;
    event(state,events,'unit.summoned',{unitId:result.unit.id,cardId,side:2,
      row:result.unit.row,col:result.unit.col,combatMode:result.unit.combatMode});
  }
  state.bot.nextSummonAtMs=state.elapsedMs+5000;
}
function movement(state,events,unit,target,dt){
  const d=distance(unit,target);
  if(d<=unit.range+.01){unit.stage='idle';return;}
  const step=Math.min(unit.speed*dt,d-unit.range);
  const before={row:rnd(unit.row),col:rnd(unit.col)};
  let newRow=unit.row+(target.row-unit.row)*step/d;
  let newCol=unit.col+(target.col-unit.col)*step/d;
  newRow=Math.min(17,Math.max(0,newRow));newCol=Math.min(8,Math.max(0,newCol));
  // No atravesar la casilla fisica de otra invocacion/caster; movimiento autoritativo.
  const occupied=[...state.units,...state.casters].some(u=>u.id!==unit.id&&u.hp>0&&
    Math.hypot(newRow-u.row,newCol-u.col)<.45);
  if(occupied){unit.stage='idle';return;}
  unit.row=rnd(newRow);unit.col=rnd(newCol);unit.stage='moving';
  event(state,events,'unit.moved',{unitId:unit.id,from:before,to:{row:unit.row,col:unit.col}});
}
function finish(state,events){
  const dead=state.casters.filter(c=>c.hp===0);
  if(!dead.length)return;
  state.status='finished';
  state.winner=dead.length===2?0:dead[0].side===1?2:1;
  event(state,events,'combat.finished',{winner:state.winner});
}
function damage(state,events,source,target,amount){
  if(!target||target.hp<=0)return;
  const dealt=Math.min(target.hp,amount);
  target.hp-=dealt;
  event(state,events,'unit.hit',{sourceId:source,targetId:target.id,damage:dealt,hp:target.hp});
  if(target.hp===0){
    if(target.role==='summon')releaseDuel(state,target);
    event(state,events,'unit.defeated',{unitId:target.id,side:target.side,role:target.role});
  }
}
function resolveProjectiles(state,events){
  for(const p of [...state.projectiles]){
    if(p.impactAtMs>state.elapsedMs)continue;
    const target=alive(state,p.targetId);
    // Proyectil confirmado al salir; puede impactar aunque el atacante haya muerto.
    if(target)damage(state,events,p.sourceId,target,p.damage);
    state.projectiles.splice(state.projectiles.indexOf(p),1);
    event(state,events,'projectile.resolved',{projectileId:p.id,targetId:p.targetId});
  }
}
function attacks(state,events,unit){
  if(unit.stage!=='preparing'||state.elapsedMs<unit.attackReleaseAtMs)return;
  const target=alive(state,unit.attackTargetId);
  unit.attackReleaseAtMs=null;unit.attackTargetId=null;unit.stage='idle';
  if(!validAttackTarget(state,unit,target)||distance(unit,target)>unit.range+.1)return;
  if(unit.combatMode==='melee'){
    damage(state,events,unit.id,target,unit.damage);
    return;
  }
  const distanceCells=distance(unit,target);
  const impactAtMs=state.elapsedMs+Math.max(STEP_MS,Math.ceil((distanceCells/unit.projectileSpeed)*1000/STEP_MS)*STEP_MS);
  const projectile={id:'p-'+state.nextEntityId++,side:unit.side,sourceId:unit.id,
    targetId:target.id,combatMode:unit.combatMode,row:rnd(unit.row),col:rnd(unit.col),
    damage:unit.damage,impactAtMs};
  state.projectiles.push(projectile);
  event(state,events,'projectile.launched',{projectileId:projectile.id,unitId:unit.id,targetId:target.id,
    impactAtMs,combatMode:unit.combatMode});
}
function fixedStep(state,events){
  state.elapsedMs+=STEP_MS;state.tickSerial++;
  botSummons(state,events);
  maintainDuels(state);
  for(const unit of state.units.filter(u=>u.hp>0).sort((a,b)=>a.id.localeCompare(b.id))){
    if(state.status!=='active')break;
    if(unit.stage==='preparing'){
      attacks(state,events,unit);
      continue;
    }
    const target=targetFor(state,unit);
    if(!target){unit.stage='idle';continue;}
    unit.targetId=target.id;
    if(!validAttackTarget(state,unit,target)){
      unit.stage='idle';continue;
    }
    if(distance(unit,target)>unit.range+.01){
      movement(state,events,unit,target,STEP_MS/1000);
    }else if(state.elapsedMs>=unit.attackReadyAtMs){
      unit.stage='preparing';unit.attackTargetId=target.id;
      unit.attackReleaseAtMs=state.elapsedMs+unit.windupMs;
      unit.attackReadyAtMs=state.elapsedMs+unit.periodMs;
      event(state,events,'attack.preparing',{unitId:unit.id,targetId:target.id,
        combatMode:unit.combatMode,releaseAtMs:unit.attackReleaseAtMs,nextAtMs:unit.attackReadyAtMs});
    }else unit.stage='idle';
  }
  resolveProjectiles(state,events);
  finish(state,events);
  state.units=state.units.filter(u=>u.hp>0);
}
export function advanceBattle(original,dtMs){
  if(!original||original.status!=='active')return {state:original,events:[]};
  if(!Number.isInteger(dtMs)||dtMs<0||dtMs>2000||dtMs%STEP_MS!==0)
    throw Error('Tick no valido; se esperan multiplos de 100ms');
  if(dtMs===0)return {state:original,events:[]};
  const state=structuredClone(original),events=[];
  for(let i=0;i<dtMs/STEP_MS&&state.status==='active';i++)fixedStep(state,events);
  state.revision++;
  return {state,events};
}
export const TICK_MS=STEP_MS;
