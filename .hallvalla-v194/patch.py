#!/usr/bin/env python3
from pathlib import Path
import hashlib,re,sys,json

ROOT=Path(sys.argv[1]).resolve()
WEB=ROOT/"web"
BOOT=WEB/"js/core/boot-config.js"
SETTINGS=WEB/"js/system/settings-events.js"
LOADER=WEB/"js/bootstrap-loader.js"
CONFIG=WEB/"js/config/ui-canonical.js"
STAGE=WEB/"hallvalla-stage.html"
INDEX=WEB/"index.html"
SW=WEB/"service-worker.js"

DEV_BOARD=WEB/"js/dev/board-editor.js"
DEV_CLOCK=WEB/"js/dev/battle-clock-editor.js"
DEV_DET=WEB/"js/dev/det-editor.js"
RT_BOARD=WEB/"js/system/board-visual-runtime.js"
RT_CLOCK=WEB/"js/system/battle-clock-runtime.js"
RT_DET=WEB/"js/system/det-runtime.js"

def rd(p): return p.read_text(encoding="utf-8")
def wr(p,s): p.parent.mkdir(parents=True,exist_ok=True); p.write_text(s,encoding="utf-8")
def sha12(p): return hashlib.sha256(p.read_bytes()).hexdigest()[:12]

settings=rd(SETTINGS)

# ---------------------------------------------------------------------------
# Extract contiguous DEV-only sections from settings-events.
# ---------------------------------------------------------------------------
board_marker="   7BOARDCTRL1 · Escala completa de cartas del campo + editor de filas/columnas"
bm=settings.find(board_marker)
if bm<0: raise SystemExit("board marker not found")
board_start=settings.rfind("/*",0,bm)
clock_start=settings.find("const BATTLE_CLOCK_TUNER_DEFAULTS=",bm)
if board_start<0 or clock_start<0: raise SystemExit("board/clock boundaries not found")
board_section=settings[board_start:clock_start]

clock_init="initBattleClockTuner();"
ci=settings.find(clock_init,clock_start)
if ci<0: raise SystemExit("battle clock initializer not found")
clock_end=ci+len(clock_init)
while clock_end<len(settings) and settings[clock_end] in "\r\n ": clock_end+=1
clock_section=settings[clock_start:clock_end]

det_marker="   HallValla · Editor visual avanzado del modal DET"
dm=settings.find(det_marker)
if dm<0: raise SystemExit("DET marker not found")
det_start=settings.rfind("/*",0,dm)
det_tail="/* HOME layout fijado en styles.css; editor temporal retirado. */"
det_end=settings.find(det_tail,det_start)
if det_start<0 or det_end<0: raise SystemExit("DET boundaries not found")
det_section=settings[det_start:det_end]

# Remove later sections first so indices remain valid.
settings=settings[:det_start]+settings[det_end:]
settings=settings[:board_start]+settings[clock_end:]

# Production runtime calls are now owned by dedicated runtime modules.
wr(SETTINGS,settings)

# ---------------------------------------------------------------------------
# DEV board editor. Same canonical/default values; local overlay only in ?dev.
# ---------------------------------------------------------------------------
board_dev='''/* HallValla v194 · DEV board editor
   Loaded only with ?dev. Production receives board geometry from canonical UI. */
(()=>{
"use strict";
if(globalThis.__HALLVALLA_DEV_TOOLS__!==true)return;
'''+board_section+'''
globalThis.__HALLVALLA_DEV_SYNC_FIELD_BOARD__=syncFieldBoardTunerControls;
})();
'''
wr(DEV_BOARD,board_dev)

# ---------------------------------------------------------------------------
# DEV battle clock editor.
# ---------------------------------------------------------------------------
clock_dev='''/* HallValla v194 · DEV battle clock editor
   Loaded only with ?dev. Production receives clock geometry from canonical UI. */
(()=>{
"use strict";
if(globalThis.__HALLVALLA_DEV_TOOLS__!==true)return;
'''+clock_section+'''
globalThis.__HALLVALLA_DEV_SYNC_BATTLE_CLOCK__=syncBattleClockTunerControls;
})();
'''
wr(DEV_CLOCK,clock_dev)

# ---------------------------------------------------------------------------
# Canonical DET values: extend the shared source of truth.
# ---------------------------------------------------------------------------
cfg=rd(CONFIG)
if "directBaked" not in cfg:
    anchor='''    fieldStats:{
'''
    pos=cfg.find(anchor)
    if pos<0: raise SystemExit("canonical config fieldStats anchor missing")
    det_block='''    det:{
      layout:{
        panelX:0,panelY:0,panelWidth:1260,panelHeight:590,panelScale:100,
        pbX:0,pbY:0,pbScale:100,
        progressX:0,progressY:0,progressScale:100
      },
      directBaked:{
        "copies.value":{x:-63.478271484375,y:0.869598388671875},
        "level.value":{x:45.2174072265625,y:1.7391357421875},
        "level.bar":{x:5.21728515625,y:3.478271484375},
        "battlepower.value":{x:23.478271484375,y:4.34783935546875,scale:80},
        "meta.type":{x:33.04345703125,y:-5.21734619140625},
        "meta.rarity":{x:33.9130859375,y:-1.7391357421875},
        "meta.state":{x:34.78271484375,y:0},
        "abilities.list":{x:-64.34808349609375,y:-3.47821044921875,scale:117},
        "ability.1":{x:-18.2608642578125,y:4.347900390625,scale:170},
        "ability.2":{x:-42.608642578125,y:3.47833251953125,scale:170},
        "ability.3":{x:-66.0870361328125,y:3.478271484375,scale:170},
        "ability.4":{x:151.30438232421875,y:-19.130401611328125,scale:170},
        "ability.5":{x:41.7391357421875,y:-20.000030517578125,scale:170},
        "action.play":{x:71.3043212890625,y:-6.08697509765625}
      }
    },
'''
    cfg=cfg[:pos]+det_block+cfg[pos:]
wr(CONFIG,cfg)

# DEV DET editor remains self-contained but reads its base from canonical config.
layout_old='''const HV_DET_LAYOUT_TUNER_DEFAULTS=Object.freeze({
  panelX:0,panelY:0,panelWidth:1260,panelHeight:590,panelScale:100,
  pbX:0,pbY:0,pbScale:100,
  progressX:0,progressY:0,progressScale:100
});'''
layout_new='''const HV_DET_LAYOUT_TUNER_DEFAULTS=Object.freeze({
  ...(globalThis.HALLVALLA_UI_CANONICAL?.det?.layout||{
    panelX:0,panelY:0,panelWidth:1260,panelHeight:590,panelScale:100,
    pbX:0,pbY:0,pbScale:100,
    progressX:0,progressY:0,progressScale:100
  })
});'''
if layout_old not in det_section: raise SystemExit("DET layout defaults block missing")
det_section=det_section.replace(layout_old,layout_new,1)

baked_start=det_section.find("const HV_DET_DIRECT_BAKED_DEFAULTS=Object.freeze({")
baked_end=det_section.find("\n});",baked_start)
if baked_start<0 or baked_end<0: raise SystemExit("DET baked defaults block missing")
baked_end+=4
baked_fallback=det_section[baked_start:baked_end]
replacement='''const HV_DET_DIRECT_BAKED_DEFAULTS=globalThis.HALLVALLA_UI_CANONICAL?.det?.directBaked||'''+baked_fallback.split("=",1)[1]
det_section=det_section[:baked_start]+replacement+det_section[baked_end:]

det_section=det_section.replace(
"applyHvDetLayoutTuner();\nif(HALLVALLA_DEV_TOOLS_ENABLED)ensureHvDetLayoutTuner();",
"applyHvDetLayoutTuner();\nensureHvDetLayoutTuner();",
1
)

det_dev='''/* HallValla v194 · DEV DET editor
   Loaded only with ?dev. Base values come from config/ui-canonical.js. */
(()=>{
"use strict";
if(globalThis.__HALLVALLA_DEV_TOOLS__!==true)return;
'''+det_section+'''
globalThis.hallvallaExportDetCanonicalDraft=()=>{
  const state=getHvDetDirectState();
  return JSON.stringify({
    layout:getHvDetLayoutTuner(),
    directBaked:state.items
  },null,2);
};
})();
'''
wr(DEV_DET,det_dev)

# ---------------------------------------------------------------------------
# Production-only visual runtimes: no editor UI and no localStorage.
# ---------------------------------------------------------------------------
board_rt='''/* HallValla v194 · production board visual runtime */
(()=>{
"use strict";
const cfg=globalThis.HALLVALLA_UI_CANONICAL?.fieldBoard||{rows:9,cols:5,cardScale:80};
const root=document.documentElement;
root.style.setProperty("--hv-board-rows",String(cfg.rows));
root.style.setProperty("--hv-board-cols",String(cfg.cols));
root.style.setProperty("--hv-field-card-scale",String(Number(cfg.cardScale||80)/100));
globalThis.hallvallaBoardVisualRuntime=Object.freeze({canonical:cfg});
})();
'''
wr(RT_BOARD,board_rt)

clock_rt='''/* HallValla v194 · production battle clock runtime */
(()=>{
"use strict";
const cfg=globalThis.HALLVALLA_UI_CANONICAL?.battleClock||{
  turn:{x:-427,y:318,scale:100},p1:{x:148,y:11,scale:100},p2:{x:-159,y:9,scale:100}
};
const apply=()=>{
  const root=document.documentElement;
  root.style.setProperty("--hv-turn-clock-offset-x",String(cfg.turn.x)+"px");
  root.style.setProperty("--hv-turn-clock-offset-y",String(cfg.turn.y)+"px");
  root.style.setProperty("--hv-turn-clock-scale",String(Number(cfg.turn.scale||100)/100));
  root.style.setProperty("--hv-p1-clock-offset-x",String(cfg.p1.x)+"px");
  root.style.setProperty("--hv-p1-clock-offset-y",String(cfg.p1.y)+"px");
  root.style.setProperty("--hv-p1-clock-scale",String(Number(cfg.p1.scale||100)/100));
  root.style.setProperty("--hv-p2-clock-offset-x",String(cfg.p2.x)+"px");
  root.style.setProperty("--hv-p2-clock-offset-y",String(cfg.p2.y)+"px");
  root.style.setProperty("--hv-p2-clock-scale",String(Number(cfg.p2.scale||100)/100));
};
apply();
globalThis.hallvallaBattleClockRuntime=Object.freeze({canonical:cfg,apply});
})();
'''
wr(RT_CLOCK,clock_rt)

det_rt='''/* HallValla v194 · production DET visual runtime
   No editor code and no browser-local calibration is read here. */
(()=>{
"use strict";
const fallback={
  panelX:0,panelY:0,panelWidth:1260,panelHeight:590,panelScale:100,
  pbX:0,pbY:0,pbScale:100,progressX:0,progressY:0,progressScale:100
};
const cfg=globalThis.HALLVALLA_UI_CANONICAL?.det?.layout||fallback;
const apply=()=>{
  const style=document.documentElement.style;
  style.setProperty("--hv-det-panel-x",String(cfg.panelX)+"px");
  style.setProperty("--hv-det-panel-y",String(cfg.panelY)+"px");
  style.setProperty("--hv-det-panel-width",String(cfg.panelWidth)+"px");
  style.setProperty("--hv-det-panel-height",String(cfg.panelHeight)+"px");
  style.setProperty("--hv-det-panel-scale",String(Number(cfg.panelScale||100)/100));
  style.setProperty("--hv-det-pb-x",String(cfg.pbX)+"px");
  style.setProperty("--hv-det-pb-y",String(cfg.pbY)+"px");
  style.setProperty("--hv-det-pb-scale",String(Number(cfg.pbScale||100)/100));
  style.setProperty("--hv-det-progress-x",String(cfg.progressX)+"px");
  style.setProperty("--hv-det-progress-y",String(cfg.progressY)+"px");
  style.setProperty("--hv-det-progress-scale",String(Number(cfg.progressScale||100)/100));
};
apply();
globalThis.hallvallaDetRuntime=Object.freeze({canonical:cfg,apply});
})();
'''
wr(RT_DET,det_rt)

# boot-config no longer talks directly to a DEV-local lexical function.
boot=rd(BOOT)
boot=boot.replace(
'if(typeof syncFieldBoardTunerControls==="function")syncFieldBoardTunerControls();',
'globalThis.__HALLVALLA_DEV_SYNC_FIELD_BOARD__?.();',
1
)
wr(BOOT,boot)

# ---------------------------------------------------------------------------
# Loader manifest/order.
# ---------------------------------------------------------------------------
loader=rd(LOADER)
loader=re.sub(r'const BUILD = "[^"]+";','const BUILD = "20260919.194";',loader,count=1)

old='"render/field-figures-3d.js",\n  "system/settings-events.js",'
new='"render/field-figures-3d.js",\n  "system/board-visual-runtime.js",\n  "system/battle-clock-runtime.js",\n  "system/det-runtime.js",\n  "system/settings-events.js",'
if old not in loader: raise SystemExit("loader runtime insertion anchor missing")
loader=loader.replace(old,new,1)

old='''  "hvdev": [
    "dev/calibrators.js",
    "dev/universal-layout-editor.js"
  ]'''
new='''  "hvdev": [
    "dev/calibrators.js",
    "dev/board-editor.js",
    "dev/battle-clock-editor.js",
    "dev/det-editor.js",
    "dev/universal-layout-editor.js"
  ]'''
if old not in loader: raise SystemExit("loader hvdev list missing")
loader=loader.replace(old,new,1)

for rel in [
"config/ui-canonical.js","core/boot-config.js",
"system/board-visual-runtime.js","system/battle-clock-runtime.js","system/det-runtime.js",
"system/settings-events.js",
"dev/calibrators.js","dev/board-editor.js","dev/battle-clock-editor.js","dev/det-editor.js",
"dev/universal-layout-editor.js"
]:
    h=sha12(WEB/"js"/rel)
    pat=r'("'+re.escape(rel)+r'":")[0-9a-f]+(")'
    if re.search(pat,loader):
        loader=re.sub(pat,lambda m:m.group(1)+h+m.group(2),loader,count=1)
    else:
        marker='const RESOURCE_HASHES = Object.freeze({'
        if marker not in loader: raise SystemExit("RESOURCE_HASHES marker missing")
        loader=loader.replace(marker,marker+'"'+rel+'":"'+h+'",',1)
wr(LOADER,loader)
loader_hash=sha12(LOADER)

# ---------------------------------------------------------------------------
# Cache/version bump.
# ---------------------------------------------------------------------------
stage=rd(STAGE)
stage=re.sub(r'20260919\.\d+','20260919.194',stage)
stage=re.sub(r'bootstrap-loader\.js\?h=[0-9a-f]+','bootstrap-loader.js?h='+loader_hash,stage,count=1)
wr(STAGE,stage)

idx=rd(INDEX)
idx=re.sub(r'data-hv-shell="\d+"','data-hv-shell="194"',idx,count=1)
idx=re.sub(r'20260919\.\d+','20260919.194',idx)
idx=re.sub(r"childUrl\.searchParams\.set\('hvshell','\d+'\);","childUrl.searchParams.set('hvshell','194');",idx,count=1)
wr(INDEX,idx)

sw=rd(SW)
sw=re.sub(r'20260919\.\d+','20260919.194',sw)
sw=re.sub(r'hallvalla-runtime-v\d+','hallvalla-runtime-v194',sw,count=1)
wr(SW,sw)

# ---------------------------------------------------------------------------
# Documentation.
# ---------------------------------------------------------------------------
doc=ROOT/"docs/AUDITORIA_FASE_DEV_v194.md"
wr(doc,'''# HallValla v194 - Auditoria profunda / DEV fase 2

## Separado de producción
- Editor de tablero -> dev/board-editor.js
- Editor de relojes -> dev/battle-clock-editor.js
- Editor avanzado DET -> dev/det-editor.js

## Runtime normal
- system/board-visual-runtime.js
- system/battle-clock-runtime.js
- system/det-runtime.js

Los tres runtime normales solo consumen config/ui-canonical.js.
No leen localStorage y no contienen controles de edición.

## Canonical
ui-canonical.js ahora también guarda:
- geometría del tablero;
- geometría de relojes;
- layout base DET;
- valores DET directBaked.

## Regla DEV -> PROD
DEV puede usar overlays locales. Un cambio solo se vuelve global al hornearlo
en config/ui-canonical.js y publicar el siguiente build.

## Resultado
settings-events.js deja de ser propietario de tablero, relojes y DET editor.
El siguiente paso de auditoría es dividir el resto por dominio:
misiones/recompensas, mina, pagos y tutoriales.
''')

print("v194 ready")
print("settings_bytes",SETTINGS.stat().st_size)
print("dev_board_bytes",DEV_BOARD.stat().st_size)
print("dev_clock_bytes",DEV_CLOCK.stat().st_size)
print("dev_det_bytes",DEV_DET.stat().st_size)
print("canonical_hash",sha12(CONFIG))
print("loader_hash",loader_hash)
