#!/usr/bin/env python3
from pathlib import Path
import hashlib,re,sys

ROOT=Path(sys.argv[1]).resolve()
WEB=ROOT/'web'
PVP=WEB/'js/features/pvp/index.js'
RT=WEB/'js/realtime/experimental.js'
LOADER=WEB/'js/bootstrap-loader.js'
STAGE=WEB/'hallvalla-stage.html'
INDEX=WEB/'index.html'
SW=WEB/'service-worker.js'
NEWFUNC=Path(__file__).with_name('newfunc.js').read_text(encoding='utf-8').rstrip()+"\n"

def rd(p): return p.read_text(encoding='utf-8')
def wr(p,s): p.write_text(s,encoding='utf-8')
def sha12(p): return hashlib.sha256(p.read_bytes()).hexdigest()[:12]

pvp=rd(PVP)
pvp=pvp.replace('''  let randomMatchSearching=false;\n  let randomMatchTimer=null;\n  let randomOwnCreatedAt=0;''','''  let randomMatchSearching=false;\n  let randomMatchTimer=null;\n  let randomSearchStartedAt=0;\n  let randomOwnCreatedAt=0;''',1)

old='''  function clearPvpBotFallbackTimer(){\n    if(pvpBotFallbackTimer){clearTimeout(pvpBotFallbackTimer);pvpBotFallbackTimer=null;}\n  }\n  function clearRandomMatchTimer(){\n    if(randomMatchTimer){clearInterval(randomMatchTimer);randomMatchTimer=null;}\n    clearPvpBotFallbackTimer();\n  }\n  function schedulePvpBotFallback(delay=PVP_BOT_FALLBACK_MS){\n    clearPvpBotFallbackTimer();\n    if(!randomMatchSearching||activeRole!==1||!activeCode)return;\n    const code=String(activeCode);\n    pvpBotFallbackTimer=setTimeout(async()=>{\n      pvpBotFallbackTimer=null;\n      if(!randomMatchSearching||activeRole!==1||String(activeCode)!==code)return;\n      pvpBotFallbackAttempts++;\n      const started=await startPvpBotFallback({force:true});\n      if(started)return;\n      if(randomMatchSearching&&activeRole===1&&String(activeCode)===code&&pvpBotFallbackAttempts<PVP_BOT_FALLBACK_MAX_ATTEMPTS){\n        setText("pvpRoomMessage","Preparando rival BOT · intento "+String(pvpBotFallbackAttempts+1)+"/"+String(PVP_BOT_FALLBACK_MAX_ATTEMPTS)+"...");\n        schedulePvpBotFallback(PVP_BOT_FALLBACK_RETRY_MS);\n      }\n    },Math.max(250,Number(delay)||PVP_BOT_FALLBACK_MS));\n  }'''
new='''  function setMatchmakingSearchText(message="BUSCANDO RIVAL..."){\n    const strong=$("matchmakingSearchingState")?.querySelector("strong");\n    if(strong)strong.textContent=String(message||"BUSCANDO RIVAL...");\n  }\n  function clearPvpBotFallbackTimer(){\n    if(pvpBotFallbackTimer){clearTimeout(pvpBotFallbackTimer);pvpBotFallbackTimer=null;}\n  }\n  function clearRandomMatchTimer(){\n    if(randomMatchTimer){clearInterval(randomMatchTimer);randomMatchTimer=null;}\n    clearPvpBotFallbackTimer();\n  }\n  function schedulePvpBotFallback(delay=null){\n    clearPvpBotFallbackTimer();\n    if(!randomMatchSearching)return;\n    const elapsed=randomSearchStartedAt?Date.now()-randomSearchStartedAt:0;\n    const wait=delay==null?Math.max(250,PVP_BOT_FALLBACK_MS-elapsed):Math.max(250,Number(delay)||PVP_BOT_FALLBACK_RETRY_MS);\n    pvpBotFallbackTimer=setTimeout(async()=>{\n      pvpBotFallbackTimer=null;\n      if(!randomMatchSearching)return;\n      if(activeRole!==1||!activeCode){schedulePvpBotFallback(600);return;}\n      setMatchmakingSearchText("PREPARANDO RIVAL BOT...");\n      pvpBotFallbackAttempts++;\n      const started=await startPvpBotFallback({force:true});\n      if(started)return;\n      if(randomMatchSearching&&pvpBotFallbackAttempts<PVP_BOT_FALLBACK_MAX_ATTEMPTS){\n        setMatchmakingSearchText("REINTENTANDO BOT...");\n        schedulePvpBotFallback(PVP_BOT_FALLBACK_RETRY_MS);\n      }else if(randomMatchSearching){\n        setMatchmakingSearchText("BOT NO DISPONIBLE · REINTENTA");\n      }\n    },wait);\n  }'''
if old not in pvp: raise SystemExit('fallback timer block missing')
pvp=pvp.replace(old,new,1)

old='''    randomMatchSearching=false;\n    randomOwnCreatedAt=0;\n    pvpBotFallbackAttempts=0;'''
new='''    randomMatchSearching=false;\n    randomSearchStartedAt=0;\n    randomOwnCreatedAt=0;\n    pvpBotFallbackAttempts=0;\n    setMatchmakingSearchText();'''
if old not in pvp: raise SystemExit('stop search state block missing')
pvp=pvp.replace(old,new,1)

old='''    if(randomMatchSearching&&!activeCode){\n      const created=await createMinimalPublicRoom();\n      if(created)await publishOwnRandomQueue();\n    }'''
new='''    if(randomMatchSearching&&!activeCode){\n      const created=await createMinimalPublicRoom();\n      if(created){await publishOwnRandomQueue();schedulePvpBotFallback();}\n    }'''
if old not in pvp: raise SystemExit('failed-join recovery block missing')
pvp=pvp.replace(old,new,1)

start=pvp.find('  async function startPvpBotFallback({force=false}={}){')
end=pvp.find('  async function scanRandomQueue(){',start)
if start<0 or end<0: raise SystemExit('bot fallback function boundaries missing')
pvp=pvp[:start]+NEWFUNC+pvp[end:]

old='''  async function scanRandomQueue(){\n    if(!randomMatchSearching||busy)return false;\n    const myUid=String(auth?.currentUser?.uid||"");\n    if(!myUid)return false;\n    if(!randomLeagueSnapshot)randomLeagueSnapshot=await resolveMyRandomLeague();\n    const myLeagueKey=String(randomLeagueSnapshot?.key||"stone");\n    renderMatchmakingLeague(randomLeagueSnapshot);\n    let snap;'''
new='''  async function scanRandomQueue(){\n    if(!randomMatchSearching||busy)return false;\n    const myUid=String(auth?.currentUser?.uid||"");\n    if(!myUid)return false;\n    if(!randomLeagueSnapshot)randomLeagueSnapshot=await resolveMyRandomLeague();\n    const myLeagueKey=String(randomLeagueSnapshot?.key||"stone");\n    renderMatchmakingLeague(randomLeagueSnapshot);\n    const searchAge=randomSearchStartedAt?Date.now()-randomSearchStartedAt:0;\n    if(searchAge>=PVP_BOT_FALLBACK_MS&&activeRole===1&&activeCode){\n      setMatchmakingSearchText("PREPARANDO RIVAL BOT...");\n      if(await startPvpBotFallback({force:true}))return true;\n    }\n    let snap;'''
if old not in pvp: raise SystemExit('scan queue block missing')
pvp=pvp.replace(old,new,1)

old='''    randomMatchSearching=true;syncLocalButtons();mark(`Buscando rival de Liga ${randomLeagueSnapshot.name}...`);'''
new='''    randomMatchSearching=true;\n    randomSearchStartedAt=Date.now();\n    pvpBotFallbackAttempts=0;\n    setMatchmakingSearchText("BUSCANDO RIVAL...");\n    syncLocalButtons();mark(`Buscando rival de Liga ${randomLeagueSnapshot.name}...`);'''
if old not in pvp: raise SystemExit('start matchmaking state block missing')
pvp=pvp.replace(old,new,1)
wr(PVP,pvp)

rt=rd(RT)
start=rt.find('function hallvallaRtEnsureStatusNode(){')
end=rt.find('function hallvallaRtUpdateUi(){',start)
if start<0 or end<0: raise SystemExit('RT status function boundaries missing')
rt=rt[:start]+'''function hallvallaRtEnsureStatusNode(){\n  const existing=document.getElementById("hallvallaRtStatus");\n  if(existing)existing.remove();\n  hallvallaRtState.statusNode=null;\n  return null;\n}\n'''+rt[end:]
wr(RT,rt)

loader=rd(LOADER)
loader=re.sub(r'const BUILD = "[^"]+";','const BUILD = "20260919.196";',loader,count=1)
for rel in ['features/pvp/index.js','realtime/experimental.js']:
    h=sha12(WEB/'js'/rel)
    pat=r'("'+re.escape(rel)+r'":")[0-9a-f]+(")'
    if not re.search(pat,loader): raise SystemExit('loader hash missing for '+rel)
    loader=re.sub(pat,lambda m:m.group(1)+h+m.group(2),loader,count=1)
wr(LOADER,loader)
loader_hash=sha12(LOADER)

stage=rd(STAGE)
stage=re.sub(r'20260919\.\d+','20260919.196',stage)
stage=re.sub(r'bootstrap-loader\.js\?h=[0-9a-f]+','bootstrap-loader.js?h='+loader_hash,stage,count=1)
wr(STAGE,stage)

idx=rd(INDEX)
idx=re.sub(r'data-hv-shell="\d+"','data-hv-shell="196"',idx,count=1)
idx=re.sub(r'20260919\.\d+','20260919.196',idx)
idx=re.sub(r"childUrl\.searchParams\.set\('hvshell','\d+'\);","childUrl.searchParams.set('hvshell','196');",idx,count=1)
wr(INDEX,idx)

sw=rd(SW)
sw=re.sub(r'20260919\.\d+','20260919.196',sw)
sw=re.sub(r'hallvalla-runtime-v\d+','hallvalla-runtime-v196',sw,count=1)
wr(SW,sw)

doc=ROOT/'docs/HOTFIX_MATCHMAKING_TR_v196.md'
doc.write_text('''# HallValla v196 - Matchmaking BOT + limpieza HUD TR\n\n- Base: v195 estable.\n- El fallback BOT usa un reloj de búsqueda absoluto; no se reinicia si cambia la sala temporal.\n- Al cumplirse 7 s, el BOT tiene prioridad sobre candidatos de cola obsoletos.\n- El duelo BOT se prepara en una sala Firebase nueva y confirmada antes de cerrar la sala humana de espera.\n- Si la creación falla, la sala de espera original permanece intacta y se reintenta.\n- El estado visible de matchmaking cambia a PREPARANDO/REINTENTANDO para no fallar en silencio.\n- Se elimina el banner superior `TR · MANÁ ... Arsenal ... recarga ...` tanto en PvE como en PvP.\n- No se toca el runtime de relojes/tablero/DET ni el layout universal aprobado.\n''',encoding='utf-8')

print('v196 ready')
print('pvp',sha12(PVP))
print('rt',sha12(RT))
print('loader',loader_hash)
