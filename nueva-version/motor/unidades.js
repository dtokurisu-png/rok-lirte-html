export function validateSummonTemplates(catalog) {
  if (!Array.isArray(catalog) || !catalog.length || catalog.length>24) throw Error('Catalogo invalido');
  const seen = new Set();
  for (const c of catalog) {
    if (!c || typeof c.id !== 'string' || !/^[a-z][a-z0-9-]{0,48}$/.test(c.id) || seen.has(c.id))throw Error('ID de invocacion invalido');
    seen.add(c.id);
    if (!['melee','range','distance'].includes(c.combatMode))throw Error('Modo de combate invalido');
    for (const [key,min,max] of [['hp',1,1000],['damage',1,100],['range',1,18],['speed',.1,20],
      ['periodMs',100,30000],['windupMs',0,29000],['projectileSpeed',0,100],['spawnCol',0,8]]) {
      const value=c[key];
      if (typeof value!=='number' || !Number.isFinite(value) || value<min || value>max)
        throw Error('Parametro invalido '+c.id+'.'+key);
    }
    if (c.windupMs>=c.periodMs || (c.combatMode==='melee' && c.projectileSpeed!==0) ||
        (c.combatMode!=='melee' && c.projectileSpeed<=0))throw Error('Ataque invalido '+c.id);
  }
  return true;
}
export const MAX_UNITS_PER_SIDE=5;
export const SUMMON_RECOVERY_MS=1500;
export function createUnit(state,side,template){
  if (state.status!=='active')return {ok:false,error:'combat-finished'};
  if (![1,2].includes(side))return {ok:false,error:'invalid-side'};
  if (!template)return {ok:false,error:'unknown-card'};
  const alive=state.units.filter(u=>u.side===side&&u.hp>0);
  if (alive.length>=MAX_UNITS_PER_SIDE)return {ok:false,error:'summon-capacity'};
  if (state.elapsedMs-state.lastSummonMs[side]<SUMMON_RECOVERY_MS)return {ok:false,error:'summon-recovery'};
  const row=side===1?17:0;
  const options=Array.from({length:9},(_,n)=>n).sort((a,b)=>Math.abs(a-template.spawnCol)-Math.abs(b-template.spawnCol)||a-b);
  const col=options.find(c=>!alive.some(u=>Math.hypot(u.row-row,u.col-c)<.85));
  if (col===undefined)return {ok:false,error:'spawn-blocked'};
  const unit={id:'inv-'+state.nextEntityId++,cardId:template.id,name:template.name,
    side,role:'summon',combatMode:template.combatMode,visualModel:template.visualModel,
    row,col,hp:template.hp,maxHp:template.hp,damage:template.damage,
    range:template.range,speed:template.speed,periodMs:template.periodMs,
    windupMs:template.windupMs,projectileSpeed:template.projectileSpeed,
    stage:'moving',targetId:null,duelId:null,attackReadyAtMs:state.elapsedMs,
    attackReleaseAtMs:null,attackTargetId:null};
  state.units.push(unit);
  state.lastSummonMs[side]=state.elapsedMs;
  return {ok:true,unit};
}
