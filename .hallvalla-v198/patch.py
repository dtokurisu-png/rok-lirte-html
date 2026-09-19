#!/usr/bin/env python3
from pathlib import Path
import hashlib,re,sys

ROOT=Path(sys.argv[1]).resolve()
WEB=ROOT/"web"
STAGE=WEB/"hallvalla-stage.html"
CSS=WEB/"styles.css"
PVP=WEB/"js/features/pvp/index.js"
LOADER=WEB/"js/bootstrap-loader.js"
INDEX=WEB/"index.html"
SW=WEB/"service-worker.js"

def rd(p): return p.read_text(encoding="utf-8")
def wr(p,s): p.write_text(s,encoding="utf-8")
def sha12(p): return hashlib.sha256(p.read_bytes()).hexdigest()[:12]

stage=rd(STAGE)
old='''    <div id="matchmakingSearchingState" class="hv-match-searching">
      <span class="hv-match-search-spinner" aria-hidden="true"></span>
      <strong>BUSCANDO RIVAL...</strong>
      <span id="matchmakingLeagueLabel" class="hv-match-league-label">LIGA PIEDRA · 0 PTS</span>
    </div>'''
new='''    <div id="matchmakingSearchingState" class="hv-match-searching hv-match-avatar-search" aria-label="Buscando rival">
      <strong class="hv-sr-only">BUSCANDO RIVAL...</strong>

      <div class="hv-match-avatar-medallion hv-match-avatar-self" aria-hidden="true">
        <span class="hv-match-avatar-glow"></span>
        <img id="matchmakingPlayerAvatar" class="hv-match-avatar-img" alt="">
      </div>

      <div class="hv-match-search-core" aria-hidden="true">
        <span class="hv-match-search-ring hv-ring-one"></span>
        <span class="hv-match-search-ring hv-ring-two"></span>
        <span class="hv-match-search-emblem">VS</span>
      </div>

      <div class="hv-match-avatar-medallion hv-match-avatar-rival" aria-hidden="true">
        <span class="hv-match-avatar-glow"></span>
        <img id="matchmakingOpponentAvatar" class="hv-match-avatar-img" alt="">
        <span class="hv-match-avatar-question">?</span>
      </div>

      <span id="matchmakingLeagueLabel" class="hv-match-league-label">LIGA PIEDRA · 0 PTS</span>
    </div>'''
if old not in stage:
    raise SystemExit("matchmaking searching markup anchor missing")
stage=stage.replace(old,new,1)
wr(STAGE,stage)

pvp=rd(PVP)
old='''    const leaderId=side==="opponent"?"matchmakingOpponentLeader":"matchmakingPlayerLeader";
    const leader=$(leaderId);
    let leaderSrc="";
    try{leaderSrc=String(LEADER_PORTRAITS?.[leaderType]||"");}catch(_){ }
    applyShowcaseImage(leader,[leaderSrc]);'''
new='''    const leaderId=side==="opponent"?"matchmakingOpponentLeader":"matchmakingPlayerLeader";
    const avatarId=side==="opponent"?"matchmakingOpponentAvatar":"matchmakingPlayerAvatar";
    const leader=$(leaderId);
    const avatar=$(avatarId);
    let leaderSrc="";
    try{leaderSrc=String(LEADER_PORTRAITS?.[leaderType]||"");}catch(_){ }
    applyShowcaseImage(leader,[leaderSrc]);
    applyShowcaseImage(avatar,[leaderSrc]);'''
if old not in pvp:
    raise SystemExit("renderShowcaseSide leader block missing")
pvp=pvp.replace(old,new,1)

old='''    renderShowcaseSide("opponent",found?opponentShowcase:null);
    hide("matchmakingSearchingState",found);
    hide("matchmakingVsArt",!found);'''
new='''    renderShowcaseSide("opponent",found?opponentShowcase:null);
    const searchState=$("matchmakingSearchingState");
    if(searchState)searchState.classList.toggle("is-rival-found",found);
    hide("matchmakingSearchingState",found);
    hide("matchmakingVsArt",!found);'''
if old not in pvp:
    raise SystemExit("renderRandomMatchmakingUi state block missing")
pvp=pvp.replace(old,new,1)
wr(PVP,pvp)

css=rd(CSS)
extra=r'''
/* ==========================================================================
   v198 · MATCHMAKING POR AVATARES
   Reemplaza el pill de texto por medallones HallValla.
   ========================================================================== */
.hv-match-searching.hv-match-avatar-search{
  position:absolute !important;
  z-index:5 !important;
  left:50% !important;
  top:58% !important;
  transform:translate(-50%,-50%) !important;
  min-width:0 !important;
  width:26% !important;
  height:18.5% !important;
  padding:0 !important;
  border:0 !important;
  border-radius:0 !important;
  background:transparent !important;
  box-shadow:none !important;
  display:grid !important;
  grid-template-columns:1fr .72fr 1fr !important;
  grid-template-rows:1fr auto !important;
  align-items:center !important;
  justify-items:center !important;
  gap:0 5% !important;
  color:#d8bd84 !important;
  white-space:normal !important;
  pointer-events:none !important;
}

.hv-match-avatar-medallion{
  position:relative !important;
  width:clamp(58px,6.1vw,92px) !important;
  aspect-ratio:1/1 !important;
  border-radius:50% !important;
  display:grid !important;
  place-items:center !important;
  overflow:hidden !important;
  background:
    radial-gradient(circle at 50% 35%,rgba(54,44,31,.96),rgba(8,7,6,.98) 72%) !important;
  border:2px solid rgba(211,174,100,.78) !important;
  box-shadow:
    inset 0 0 0 3px rgba(0,0,0,.48),
    inset 0 0 22px rgba(214,163,65,.16),
    0 8px 22px rgba(0,0,0,.52) !important;
}

.hv-match-avatar-self{
  box-shadow:
    inset 0 0 0 3px rgba(0,0,0,.48),
    0 0 0 2px rgba(74,150,255,.16),
    0 0 22px rgba(43,121,255,.38),
    0 8px 22px rgba(0,0,0,.52) !important;
}

.hv-match-avatar-rival{
  box-shadow:
    inset 0 0 0 3px rgba(0,0,0,.48),
    0 0 0 2px rgba(255,65,65,.13),
    0 0 20px rgba(206,37,37,.28),
    0 8px 22px rgba(0,0,0,.52) !important;
}

.hv-match-avatar-glow{
  position:absolute !important;
  inset:-16% !important;
  border-radius:50% !important;
  border:1px solid rgba(226,184,100,.28) !important;
  animation:hvMatchAvatarPulse 2.2s ease-out infinite !important;
}

.hv-match-avatar-img{
  width:100% !important;
  height:100% !important;
  display:block !important;
  object-fit:cover !important;
  object-position:50% 15% !important;
  border-radius:50% !important;
  filter:contrast(1.03) saturate(.96) !important;
}

.hv-match-avatar-img:not([src]),
.hv-match-avatar-img[src=""]{
  visibility:hidden !important;
}

.hv-match-avatar-question{
  position:absolute !important;
  inset:0 !important;
  display:grid !important;
  place-items:center !important;
  color:#cbb88d !important;
  font:900 clamp(32px,4vw,60px)/1 Georgia,"Times New Roman",serif !important;
  text-shadow:0 3px 8px #000,0 0 14px rgba(190,60,60,.24) !important;
  opacity:.88 !important;
  animation:hvMatchQuestionFloat 2.6s ease-in-out infinite !important;
}

.hv-match-avatar-rival:has(.hv-match-avatar-img[src]:not([src=""])) .hv-match-avatar-question{
  opacity:0 !important;
}

.hv-match-search-core{
  position:relative !important;
  width:clamp(42px,4.7vw,72px) !important;
  aspect-ratio:1/1 !important;
  display:grid !important;
  place-items:center !important;
}

.hv-match-search-ring{
  position:absolute !important;
  inset:7% !important;
  border-radius:50% !important;
  border:1px solid rgba(218,176,92,.72) !important;
  box-shadow:0 0 15px rgba(201,149,56,.24) !important;
  opacity:.72 !important;
  animation:hvMatchRunePulse 2s ease-out infinite !important;
}

.hv-match-search-ring.hv-ring-two{
  inset:-8% !important;
  opacity:.4 !important;
  animation-delay:1s !important;
}

.hv-match-search-emblem{
  position:relative !important;
  z-index:2 !important;
  color:#e6c985 !important;
  font:900 clamp(13px,1.4vw,22px)/1 Georgia,"Times New Roman",serif !important;
  letter-spacing:.08em !important;
  text-shadow:0 2px 6px #000,0 0 10px rgba(223,173,76,.42) !important;
}

.hv-match-avatar-search .hv-match-league-label{
  grid-column:1 / -1 !important;
  align-self:start !important;
  justify-self:center !important;
  margin-top:2px !important;
  padding:4px 10px !important;
  border:1px solid rgba(194,150,70,.26) !important;
  border-radius:999px !important;
  background:rgba(7,6,5,.62) !important;
  color:#d8bd84 !important;
  font:800 clamp(8px,.78vw,11px)/1 Georgia,"Times New Roman",serif !important;
  letter-spacing:.06em !important;
  text-shadow:0 2px 4px #000 !important;
}

@keyframes hvMatchAvatarPulse{
  0%{transform:scale(.72);opacity:0}
  35%{opacity:.58}
  100%{transform:scale(1.22);opacity:0}
}
@keyframes hvMatchRunePulse{
  0%{transform:scale(.68);opacity:0}
  45%{opacity:.72}
  100%{transform:scale(1.25);opacity:0}
}
@keyframes hvMatchQuestionFloat{
  0%,100%{transform:translateY(0) scale(1)}
  50%{transform:translateY(-4px) scale(1.035)}
}

@media(max-width:760px){
  .hv-match-searching.hv-match-avatar-search{
    width:34% !important;
    top:58.5% !important;
  }
}
'''
css=css.rstrip()+"\n\n"+extra.strip()+"\n"
wr(CSS,css)

loader=rd(LOADER)
loader=re.sub(r'const BUILD = "[^"]+";','const BUILD = "20260919.198";',loader,count=1)
for rel in ["features/pvp/index.js"]:
    h=sha12(WEB/"js"/rel)
    pat=r'("'+re.escape(rel)+r'":")[0-9a-f]+(")'
    if not re.search(pat,loader):
        raise SystemExit("loader hash missing for "+rel)
    loader=re.sub(pat,lambda m:m.group(1)+h+m.group(2),loader,count=1)
wr(LOADER,loader)
loader_hash=sha12(LOADER)

stage=rd(STAGE)
stage=re.sub(r'20260919\.\d+','20260919.198',stage)
stage=re.sub(r'bootstrap-loader\.js\?h=[0-9a-f]+','bootstrap-loader.js?h='+loader_hash,stage,count=1)
stage=re.sub(r'styles\.css\?h=[0-9a-f]+','styles.css?h='+sha12(CSS),stage,count=1)
wr(STAGE,stage)

idx=rd(INDEX)
idx=re.sub(r'data-hv-shell="\d+"','data-hv-shell="198"',idx,count=1)
idx=re.sub(r'20260919\.\d+','20260919.198',idx)
idx=re.sub(r"childUrl\.searchParams\.set\('hvshell','\d+'\);","childUrl.searchParams.set('hvshell','198');",idx,count=1)
wr(INDEX,idx)

sw=rd(SW)
sw=re.sub(r'20260919\.\d+','20260919.198',sw)
sw=re.sub(r'hallvalla-runtime-v\d+','hallvalla-runtime-v198',sw,count=1)
wr(SW,sw)

doc=ROOT/"docs/MATCHMAKING_AVATAR_v198.md"
wr(doc,'''# HallValla v198 - Matchmaking por avatares

- El pill central de texto fue sustituido por dos medallones.
- Izquierda: retrato del líder actual del jugador.
- Derecha: medallón desconocido con signo de interrogación mientras se busca rival.
- Centro: núcleo/runa animada con VS.
- La liga queda como una etiqueta discreta debajo.
- Cuando aparece rival, el bloque de búsqueda desaparece, se revela el retrato rival
  en el marco grande y continúa la transición VS existente.
- No se añade botón Aceptar: el flujo aleatorio de HallValla sigue siendo automático.
- No se expone si el rival es automatizado.
''')

print("v198 matchmaking avatar ready")
print("pvp",sha12(PVP))
print("css",sha12(CSS))
print("loader",loader_hash)
