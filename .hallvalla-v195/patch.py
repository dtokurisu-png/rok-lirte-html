#!/usr/bin/env python3
from pathlib import Path
import hashlib,re,sys

ROOT=Path(sys.argv[1]).resolve()
WEB=ROOT/"web"
PVP=WEB/"js/features/pvp/index.js"
SETTINGS=WEB/"js/system/settings-events.js"
STAGE=WEB/"hallvalla-stage.html"
CSS=WEB/"styles.css"
LOADER=WEB/"js/bootstrap-loader.js"
INDEX=WEB/"index.html"
SW=WEB/"service-worker.js"

def rd(p): return p.read_text(encoding="utf-8")
def wr(p,s): p.write_text(s,encoding="utf-8")
def sha12(p): return hashlib.sha256(p.read_bytes()).hexdigest()[:12]

stage=rd(STAGE)
old='<div id="settingsPanel" class="overlay-panel hidden">\n  <div class="modal-card">\n    <h2>Configuración</h2>'
new='<div id="settingsPanel" class="overlay-panel hidden">\n  <div class="modal-card hv-settings-card" role="dialog" aria-modal="true" aria-labelledby="settingsPanelTitle">\n    <button id="closeSettingsXBtn" class="hv-settings-close-x" type="button" aria-label="Cerrar configuración">×</button>\n    <h2 id="settingsPanelTitle">Configuración</h2>'
if old not in stage: raise SystemExit("settings modal markup anchor missing")
stage=stage.replace(old,new,1)
wr(STAGE,stage)

settings=rd(SETTINGS)
old='''on("settingsBtn","click",()=>{$("settingsPanel").classList.remove("hidden");refreshAiLearningLogStatus();});
on("closeSettingsBtn","click",()=>$("settingsPanel").classList.add("hidden"));'''
new='''function openHomeSettingsPanel(){
  const panel=$("settingsPanel");
  if(!panel)return;
  panel.classList.remove("hidden");
  refreshAiLearningLogStatus();
}
function closeHomeSettingsPanel(){
  $("settingsPanel")?.classList.add("hidden");
}
on("settingsBtn","click",openHomeSettingsPanel);
on("closeSettingsBtn","click",closeHomeSettingsPanel);
on("closeSettingsXBtn","click",closeHomeSettingsPanel);
$("settingsPanel")?.addEventListener("click",event=>{
  if(event.target===$("settingsPanel"))closeHomeSettingsPanel();
});
document.addEventListener("keydown",event=>{
  if(event.key==="Escape"&&!$("settingsPanel")?.classList.contains("hidden"))closeHomeSettingsPanel();
});'''
if old not in settings: raise SystemExit("settings open/close handlers missing")
settings=settings.replace(old,new,1)
wr(SETTINGS,settings)

css=rd(CSS)
settings_css=r'''
/* ============================================================
   v195 · HOME SETTINGS MODAL · VIEWPORT SAFE
   ============================================================ */
#settingsPanel.overlay-panel{
  align-items:center !important;
  justify-content:center !important;
  padding:12px !important;
  overflow:hidden !important;
}
#settingsPanel .hv-settings-card{
  position:relative !important;
  width:min(620px,calc(100vw - 24px)) !important;
  max-width:620px !important;
  max-height:calc(100dvh - 24px) !important;
  overflow-y:auto !important;
  overflow-x:hidden !important;
  overscroll-behavior:contain !important;
  scrollbar-gutter:stable !important;
  box-sizing:border-box !important;
}
#settingsPanel .hv-settings-close-x{
  position:sticky !important;
  top:0 !important;
  z-index:12 !important;
  float:right !important;
  display:grid !important;
  place-items:center !important;
  width:38px !important;
  height:38px !important;
  margin:-4px -4px 4px 10px !important;
  padding:0 !important;
  border:1px solid rgba(255,209,102,.28) !important;
  border-radius:50% !important;
  background:rgba(12,8,5,.94) !important;
  color:#fff0c4 !important;
  box-shadow:0 6px 18px rgba(0,0,0,.42) !important;
  font:900 28px/1 system-ui !important;
  cursor:pointer !important;
}
#settingsPanel #closeSettingsBtn{
  position:sticky !important;
  bottom:0 !important;
  z-index:10 !important;
  margin-top:12px !important;
  min-height:42px !important;
  background:rgba(17,11,6,.96) !important;
}
@media(max-height:680px){
  #settingsPanel .hv-settings-card{
    max-height:calc(100dvh - 12px) !important;
    padding:14px !important;
  }
  #settingsPanel .settings-learning-zone,
  #settingsPanel .settings-controls-zone,
  #settingsPanel .settings-danger-zone{
    margin:8px 0 !important;
    padding:9px !important;
  }
}
'''
css=css.rstrip()+"\n\n"+settings_css.strip()+"\n"
wr(CSS,css)

pvp=rd(PVP)
if 'const PVP_BOT_FALLBACK_MS=9000;' not in pvp:
    raise SystemExit("PVP_BOT_FALLBACK_MS anchor missing")
pvp=pvp.replace(
    'const PVP_BOT_FALLBACK_MS=9000;',
    'const PVP_BOT_FALLBACK_MS=7000;\n  const PVP_BOT_FALLBACK_RETRY_MS=2600;\n  const PVP_BOT_FALLBACK_MAX_ATTEMPTS=4;',
    1
)

old='''  let pvpBotFallbackInFlight=false;
  let activePvpBotProfile=null;'''
new='''  let pvpBotFallbackInFlight=false;
  let activePvpBotProfile=null;
  let pvpBotFallbackTimer=null;
  let pvpBotFallbackAttempts=0;'''
if old not in pvp: raise SystemExit("bot state anchor missing")
pvp=pvp.replace(old,new,1)

old='''  function clearRandomMatchTimer(){
    if(randomMatchTimer){clearInterval(randomMatchTimer);randomMatchTimer=null;}
  }'''
new='''  function clearPvpBotFallbackTimer(){
    if(pvpBotFallbackTimer){clearTimeout(pvpBotFallbackTimer);pvpBotFallbackTimer=null;}
  }
  function clearRandomMatchTimer(){
    if(randomMatchTimer){clearInterval(randomMatchTimer);randomMatchTimer=null;}
    clearPvpBotFallbackTimer();
  }
  function schedulePvpBotFallback(delay=PVP_BOT_FALLBACK_MS){
    clearPvpBotFallbackTimer();
    if(!randomMatchSearching||activeRole!==1||!activeCode)return;
    const code=String(activeCode);
    pvpBotFallbackTimer=setTimeout(async()=>{
      pvpBotFallbackTimer=null;
      if(!randomMatchSearching||activeRole!==1||String(activeCode)!==code)return;
      pvpBotFallbackAttempts++;
      const started=await startPvpBotFallback({force:true});
      if(started)return;
      if(randomMatchSearching&&activeRole===1&&String(activeCode)===code&&pvpBotFallbackAttempts<PVP_BOT_FALLBACK_MAX_ATTEMPTS){
        setText("pvpRoomMessage","Preparando rival BOT · intento "+String(pvpBotFallbackAttempts+1)+"/"+String(PVP_BOT_FALLBACK_MAX_ATTEMPTS)+"...");
        schedulePvpBotFallback(PVP_BOT_FALLBACK_RETRY_MS);
      }
    },Math.max(250,Number(delay)||PVP_BOT_FALLBACK_MS));
  }'''
if old not in pvp: raise SystemExit("clearRandomMatchTimer block missing")
pvp=pvp.replace(old,new,1)

old='''  async function stopRandomMatchSearch({removeQueueEntry=true}={}){
    randomMatchSearching=false;
    randomOwnCreatedAt=0;
    clearRandomMatchTimer();'''
new='''  async function stopRandomMatchSearch({removeQueueEntry=true}={}){
    randomMatchSearching=false;
    randomOwnCreatedAt=0;
    pvpBotFallbackAttempts=0;
    clearRandomMatchTimer();'''
if old not in pvp: raise SystemExit("stop random block missing")
pvp=pvp.replace(old,new,1)

old='''  async function startPvpBotFallback(){
    if(pvpBotFallbackInFlight||!randomMatchSearching||busy||activeRole!==1||!activeCode)return false;'''
new='''  async function startPvpBotFallback({force=false}={}){
    if(pvpBotFallbackInFlight||!randomMatchSearching||activeRole!==1||!activeCode)return false;
    if(busy&&!force)return false;'''
if old not in pvp: raise SystemExit("startPvpBotFallback signature missing")
pvp=pvp.replace(old,new,1)

old='''    try{
      // Bloquea nuestra propia entrada antes de crear el BOT. Si otro humano ya
      // la reclamó, el BOT no entra y se conserva la prioridad del jugador real.
      const claimAt=Date.now();
      const claim=await withTimeout(runTransaction(ownQueueRef,current=>{'''
new='''    try{
      const existingOwnSnap=await withTimeout(get(ownQueueRef),`Validar cola propia antes del BOT ${code}`,5000);
      const existingOwn=existingOwnSnap.exists()?(existingOwnSnap.val()||{}):null;
      if(existingOwn&&String(existingOwn.claimedBy||"")&&String(existingOwn.claimedBy||"")!==myUid){
        setText("pvpRoomMessage","Rival humano detectado · confirmando emparejamiento...");
        return false;
      }
      if(!existingOwn||String(existingOwn.uid||"")!==myUid||String(existingOwn.leagueKey||"")!==leagueKey){
        const repairedCreatedAt=randomOwnCreatedAt||Date.now()-PVP_BOT_FALLBACK_MS;
        await withTimeout(set(ownQueueRef,{
          uid:myUid,
          code,
          createdAt:repairedCreatedAt,
          name:getProfileNameSafe(1),
          level:getProfileLevelSafe(),
          leagueKey,
          leagueName:String(league?.name||"Piedra"),
          pvpPoints:Number(league?.points||0),
          claimedBy:"",
          claimedAt:0
        }),`Reparar cola propia antes del BOT ${code}`,5000);
      }else if(String(existingOwn.claimedBy||"")===myUid&&Date.now()-Number(existingOwn.claimedAt||0)>8000){
        await withTimeout(update(ownQueueRef,{claimedBy:"",claimedAt:0}),`Liberar claim BOT obsoleto ${code}`,4000);
      }

      // Bloquea nuestra propia entrada antes de crear el BOT. Si otro humano ya
      // la reclamó, el BOT no entra y se conserva la prioridad del jugador real.
      const claimAt=Date.now();
      const claim=await withTimeout(runTransaction(ownQueueRef,current=>{'''
if old not in pvp: raise SystemExit("bot claim prelude missing")
pvp=pvp.replace(old,new,1)

old='''      if(typeof globalThis.hvEnsureFeature==="function")await globalThis.hvEnsureFeature("pve");
      if(typeof adventureEnemyTurn!=="function")throw new Error("La IA táctica no está disponible para el BOT PvP.");
      if(typeof makeLeader!=="function")throw new Error("El motor TR de HallValla no está listo para crear el BOT PvP.");'''
new='''      if(typeof globalThis.hvEnsureFeature==="function")await globalThis.hvEnsureFeature("pve");
      const botAiTurn=(typeof adventureEnemyTurn==="function")?adventureEnemyTurn:globalThis.adventureEnemyTurn;
      const botMakeLeader=(typeof makeLeader==="function")?makeLeader:globalThis.makeLeader;
      if(typeof botAiTurn!=="function")throw new Error("La IA táctica no está disponible para el BOT PvP.");
      if(typeof botMakeLeader!=="function")throw new Error("El motor TR de HallValla no está listo para crear el BOT PvP.");'''
if old not in pvp: raise SystemExit("bot engine availability block missing")
pvp=pvp.replace(old,new,1)

old='''        makeLeader(1,Math.floor(cols/2),rows-1,human.leaderType,human.leaderLevel,human.leaderAbility),
        makeLeader(2,Math.floor(cols/2),0,profile.leaderType,botLevel,botAbility)'''
new='''        botMakeLeader(1,Math.floor(cols/2),rows-1,human.leaderType,human.leaderLevel,human.leaderAbility),
        botMakeLeader(2,Math.floor(cols/2),0,profile.leaderType,botLevel,botAbility)'''
if old not in pvp: raise SystemExit("bot makeLeader calls missing")
pvp=pvp.replace(old,new,1)

old='''      console.error(`[HallValla][${STEP}] Fallback BOT PvP falló:`,error);
      globalThis.hideHallvallaPreBattleVs?.();'''
new='''      console.error(`[HallValla][${STEP}] Fallback BOT PvP falló:`,error);
      setText("pvpRoomMessage","Rival BOT no inició: "+String(error?.message||error)+". Reintentando...");
      globalThis.hideHallvallaPreBattleVs?.();'''
if old not in pvp: raise SystemExit("bot catch block missing")
pvp=pvp.replace(old,new,1)

old='''      await publishOwnRandomQueue();
      mark(`Buscando rival de Liga ${randomLeagueSnapshot?.name||"Piedra"}... sala preparada.`);
      randomMatchTimer=setInterval(()=>{void scanRandomQueue();},1800);'''
new='''      await publishOwnRandomQueue();
      pvpBotFallbackAttempts=0;
      schedulePvpBotFallback();
      mark(`Buscando rival de Liga ${randomLeagueSnapshot?.name||"Piedra"}... sala preparada · BOT de respaldo en ${Math.round(PVP_BOT_FALLBACK_MS/1000)} s.`);
      randomMatchTimer=setInterval(()=>{void scanRandomQueue();},1800);'''
if old not in pvp: raise SystemExit("publish queue block missing")
pvp=pvp.replace(old,new,1)
wr(PVP,pvp)

loader=rd(LOADER)
loader=re.sub(r'const BUILD = "[^"]+";','const BUILD = "20260919.195";',loader,count=1)
for rel in ["features/pvp/index.js","system/settings-events.js"]:
    h=sha12(WEB/"js"/rel)
    pat=r'("'+re.escape(rel)+r'":")[0-9a-f]+(")'
    if not re.search(pat,loader): raise SystemExit("loader hash missing for "+rel)
    loader=re.sub(pat,lambda m:m.group(1)+h+m.group(2),loader,count=1)
wr(LOADER,loader)
loader_hash=sha12(LOADER)

stage=rd(STAGE)
stage=re.sub(r'20260919\.\d+','20260919.195',stage)
stage=re.sub(r'bootstrap-loader\.js\?h=[0-9a-f]+','bootstrap-loader.js?h='+loader_hash,stage,count=1)
stage=re.sub(r'styles\.css\?h=[0-9a-f]+','styles.css?h='+sha12(CSS),stage,count=1)
wr(STAGE,stage)

idx=rd(INDEX)
idx=re.sub(r'data-hv-shell="\d+"','data-hv-shell="195"',idx,count=1)
idx=re.sub(r'20260919\.\d+','20260919.195',idx)
idx=re.sub(r"childUrl\.searchParams\.set\('hvshell','\d+'\);","childUrl.searchParams.set('hvshell','195');",idx,count=1)
wr(INDEX,idx)

sw=rd(SW)
sw=re.sub(r'20260919\.\d+','20260919.195',sw)
sw=re.sub(r'hallvalla-runtime-v\d+','hallvalla-runtime-v195',sw,count=1)
wr(SW,sw)

doc=ROOT/"docs/HOTFIX_RECUPERACION_v195.md"
wr(doc,'''# HallValla v195 - Recuperación antes de continuar auditoría

Base: v193 probada por el usuario.

La extracción v194 se descarta como base por regresiones funcionales.
v195 conserva completo el runtime v193 de relojes/tablero/DET.

Correcciones:
- PvP BOT: temporizador independiente del polling, reparación de cola y reintentos.
- Error BOT visible en la sala si algo falla.
- Configuración Home: X visible, scroll interno, ESC/backdrop y botón inferior sticky.

La auditoría profunda continúa solamente después de validar esta recuperación.
''')

print("v195 recovery ready")
print("pvp_hash",sha12(PVP))
print("settings_hash",sha12(SETTINGS))
print("css_hash",sha12(CSS))
print("loader_hash",loader_hash)
