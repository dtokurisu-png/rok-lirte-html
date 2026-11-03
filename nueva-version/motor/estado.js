import { ARENA } from './reglas.js';
import { validateSummonTemplates } from './unidades.js';
const numbers = (v, min, max) => Number.isFinite(v) && v >= min && v <= max;
function caster(def, side) {
  if (!def?.id || !numbers(Number(def?.stats?.life),1,10000)) throw Error('Kaster sin vida valida');
  const hp = Number(def.stats.life);
  return {id:def.id,side,role:'caster',name:def.name,row:side===1?16:1,
    col:4,hp,maxHp:hp};
}
export function createAdventureInitialState(encounter, player, rival, catalog) {
  if (encounter?.mode !== 'adventure' || encounter?.playerCasterId !== player?.id ||
      encounter?.rivalCasterId !== rival?.id || !encounter?.arenaId) throw Error('Encuentro invalido');
  validateSummonTemplates(catalog);
  return {
    mode:'adventure', ruleset:'continuous-prototype-v1',status:'active',
    encounterId:encounter.id,arena:{...ARENA,id:encounter.arenaId},
    elapsedMs:0,tickSerial:0,revision:0,winner:null,
    casters:[caster(player,1),caster(rival,2)],units:[],projectiles:[],
    summonCatalog:catalog.map(({id,name,combatMode,hp,damage,range,speed,periodMs,windupMs,projectileSpeed,spawnCol,visualModel})=>
      ({id,name,combatMode,hp,damage,range,speed,periodMs,windupMs,projectileSpeed,spawnCol,visualModel})),
    nextEntityId:1,lastSummonMs:{1:-10000,2:-10000},
    bot:{nextSummonAtMs:1000,serial:0},eventSerial:0
  };
}
export function projectAdventureState(state) {
  const {mode,ruleset,status,encounterId,arena,elapsedMs,tickSerial,revision,winner,casters,units,projectiles,summonCatalog}=state;
  return {mode,ruleset,status,encounterId,arena:{...arena},elapsedMs,tickSerial,revision,winner,
    casters:casters.map(c=>({...c})),units:units.map(({id,cardId,name,side,combatMode,row,col,hp,maxHp,
      range,damage,stage,targetId,duelId,attackReadyAtMs,attackReleaseAtMs,visualModel})=>
      ({id,cardId,name,side,combatMode,row,col,hp,maxHp,range,damage,stage,targetId,duelId,attackReadyAtMs,attackReleaseAtMs,visualModel})),
    projectiles:projectiles.map(({id,sourceId,targetId,side,row,col,impactAtMs,combatMode})=>
      ({id,sourceId,targetId,side,row,col,impactAtMs,combatMode})),
    summonCatalog:summonCatalog.map(({id,name,combatMode,range,hp,damage,visualModel})=>({id,name,combatMode,range,hp,damage,visualModel}))
  };
}
