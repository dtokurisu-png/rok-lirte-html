#!/usr/bin/env python3
from pathlib import Path
import hashlib, re, sys

ROOT=Path(sys.argv[1]).resolve()
WEB=ROOT/"web"
BOOT=WEB/"js/core/boot-config.js"
SETTINGS=WEB/"js/system/settings-events.js"
LOADER=WEB/"js/bootstrap-loader.js"
STAGE=WEB/"hallvalla-stage.html"
INDEX=WEB/"index.html"
SW=WEB/"service-worker.js"
CONFIG=WEB/"js/config/ui-canonical.js"
DEV=WEB/"js/dev/calibrators.js"

def rd(p): return p.read_text(encoding="utf-8")
def wr(p,s): p.parent.mkdir(parents=True,exist_ok=True); p.write_text(s,encoding="utf-8")
def sha12(p): return hashlib.sha256(p.read_bytes()).hexdigest()[:12]

canonical = r'''/* HallValla - UI canonical configuration v193
   ONE source of truth for production and DEV.
   Production always consumes these values.
   ?dev may overlay them temporarily in localStorage, but exported changes
   must be baked back here before they become canonical for every player. */
(()=>{
  "use strict";
  const deepFreeze=value=>{
    if(!value||typeof value!=="object"||Object.isFrozen(value))return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  };
  globalThis.HALLVALLA_UI_CANONICAL=deepFreeze({
    version:1,
    fieldBoard:{rows:9,cols:5,cardScale:80},
    battleVisual:{
      playerLeaderScale:74,
      playerLeaderX:-4,
      playerLeaderY:43,
      enemyLeaderScale:74,
      enemyLeaderX:-5,
      enemyLeaderY:-30,
      handCardScale:56
    },
    battleClock:{
      turn:{x:-427,y:318,scale:100},
      p1:{x:148,y:11,scale:100},
      p2:{x:-159,y:9,scale:100}
    },
    fieldStats:{
      hpUnit:{iconScale:205,iconX:-29,iconY:38,ringScale:220,ringX:0,ringY:0,ringStroke:2.6,numSize:32,numWeight:100,numScaleX:117,numScaleY:110,numX:-0.2,numY:5.2},
      hpLeader:{iconScale:125,iconX:-4,iconY:-32,ringScale:177,ringX:0,ringY:0,ringStroke:0.9,numSize:28,numWeight:100,numScaleX:100,numScaleY:100,numX:0,numY:-2},
      atkUnit:{iconScale:420,iconX:-3,iconY:-1,ringScale:168,ringX:-1,ringY:-3,ringStroke:0.2,numSize:15.8,numWeight:100,numScaleX:46,numScaleY:44,numX:-2.4,numY:2.8},
      atkLeader:{iconScale:125,iconX:-2,iconY:-26,ringScale:76,ringX:4,ringY:-27,ringStroke:0.3,numSize:13.8,numWeight:200,numScaleX:100,numScaleY:100,numX:0,numY:0},
      guardUnit:{iconScale:420,iconX:-2,iconY:-2,ringScale:203,ringX:0,ringY:0,ringStroke:0.2,numSize:6,numWeight:100,numScaleX:95,numScaleY:77,numX:-4.4,numY:-2.8},
      guardLeader:{iconScale:140,iconX:2,iconY:-25,ringScale:82,ringX:2,ringY:-10,ringStroke:0.2,numSize:16.4,numWeight:100,numScaleX:99,numScaleY:102,numX:10.2,numY:-20}
    }
  });
})();
'''
wr(CONFIG,canonical)

boot=rd(BOOT)
old='''const FIELD_BOARD_DEFAULTS=Object.freeze({rows:9,cols:5,cardScale:80});
const FIELD_BOARD_LIMITS=Object.freeze({rows:[4,12],cols:[3,10],cardScale:[45,150]});'''
new='''const HALLVALLA_CANONICAL_UI=globalThis.HALLVALLA_UI_CANONICAL||{};
const FIELD_BOARD_DEFAULTS=Object.freeze({...HALLVALLA_CANONICAL_UI.fieldBoard||{rows:9,cols:5,cardScale:80}});
const FIELD_BOARD_LIMITS=Object.freeze({rows:[4,12],cols:[3,10],cardScale:[45,150]});'''
if old not in boot: raise SystemExit("boot canonical insertion point not found")
boot=boot.replace(old,new,1)
old='''function readFieldBoardPreferences(){
  try{
    const saved=JSON.parse(localStorage.getItem(FIELD_BOARD_TUNER_KEY)||"{}")||{};'''
new='''function readFieldBoardPreferences(){
  if(globalThis.__HALLVALLA_DEV_TOOLS__!==true)return{...FIELD_BOARD_DEFAULTS};
  try{
    const saved=JSON.parse(localStorage.getItem(FIELD_BOARD_TUNER_KEY)||"{}")||{};'''
if old not in boot: raise SystemExit("readFieldBoardPreferences block not found")
boot=boot.replace(old,new,1)
wr(BOOT,boot)

settings=rd(SETTINGS)
start=settings.find("const FIELD_STAT_BADGE_TARGETS={")
end=settings.find("};\nconst FIELD_STAT_CONTROL_DEFS=",start)
if start<0 or end<0: raise SystemExit("field stat targets block not found")
replacement='''const FIELD_STAT_CANONICAL=HALLVALLA_CANONICAL_UI.fieldStats||{};
const FIELD_STAT_BADGE_TARGETS={
  hpUnit:{label:"Vida · unidades", css:"hp-unit", type:"hp", defaults:{...FIELD_STAT_CANONICAL.hpUnit}},
  hpLeader:{label:"Vida · líderes", css:"hp-leader", type:"hp", defaults:{...FIELD_STAT_CANONICAL.hpLeader}},
  atkUnit:{label:"Ataque · unidades", css:"atk-unit", type:"badge", defaults:{...FIELD_STAT_CANONICAL.atkUnit}},
  atkLeader:{label:"Ataque · líderes", css:"atk-leader", type:"badge", defaults:{...FIELD_STAT_CANONICAL.atkLeader}},
  guardUnit:{label:"Guardia · unidades", css:"guard-unit", type:"badge", defaults:{...FIELD_STAT_CANONICAL.guardUnit}},
  guardLeader:{label:"Guardia · líderes", css:"guard-leader", type:"badge", defaults:{...FIELD_STAT_CANONICAL.guardLeader}}
};
'''
settings=settings[:start]+replacement+settings[end+3:]

old_visual='''const BATTLE_VISUAL_SIZE_DEFAULTS=Object.freeze({
  playerLeaderScale:74,
  playerLeaderX:-4,
  playerLeaderY:43,
  enemyLeaderScale:74,
  enemyLeaderX:-5,
  enemyLeaderY:-30,
  handCardScale:56
});'''
if old_visual not in settings: raise SystemExit("battle visual defaults missing")
settings=settings.replace(old_visual,'const BATTLE_VISUAL_SIZE_DEFAULTS=Object.freeze({...HALLVALLA_CANONICAL_UI.battleVisual});',1)

old_clock='''const BATTLE_CLOCK_TUNER_DEFAULTS={
  turn:{x:-427,y:318,scale:100},
  p1:{x:148,y:11,scale:100},
  p2:{x:-159,y:9,scale:100}
};'''
new_clock='''const BATTLE_CLOCK_TUNER_DEFAULTS=Object.freeze({
  turn:Object.freeze({...HALLVALLA_CANONICAL_UI.battleClock.turn}),
  p1:Object.freeze({...HALLVALLA_CANONICAL_UI.battleClock.p1}),
  p2:Object.freeze({...HALLVALLA_CANONICAL_UI.battleClock.p2})
});'''
if old_clock not in settings: raise SystemExit("battle clock defaults missing")
settings=settings.replace(old_clock,new_clock,1)

settings=settings.replace(
'''function loadFieldStatBadgesTunerState(){
  const defaults=cloneFieldStatDefaults();
  try{''',
'''function loadFieldStatBadgesTunerState(){
  const defaults=cloneFieldStatDefaults();
  if(globalThis.__HALLVALLA_DEV_TOOLS__!==true)return defaults;
  try{''',1)
settings=settings.replace(
'''function loadBattleVisualSizeState(){
  try{''',
'''function loadBattleVisualSizeState(){
  if(globalThis.__HALLVALLA_DEV_TOOLS__!==true)return {...BATTLE_VISUAL_SIZE_DEFAULTS};
  try{''',1)
settings=settings.replace(
'''function loadBattleClockTunerState(){
  try{''',
'''function loadBattleClockTunerState(){
  if(globalThis.__HALLVALLA_DEV_TOOLS__!==true)return cloneBattleClockDefaults();
  try{''',1)

settings=settings.replace("  syncFieldStatBadgesTunerControls();\n  if(save)saveFieldStatBadgesTunerState();",
                          "  globalThis.__HALLVALLA_DEV_SYNC_FIELD_STATS__?.();\n  if(save)saveFieldStatBadgesTunerState();",1)
settings=settings.replace("  syncBattleVisualSizeControls();\n  if(save)saveBattleVisualSizeState();",
                          "  globalThis.__HALLVALLA_DEV_SYNC_BATTLE_VISUAL__?.();\n  if(save)saveBattleVisualSizeState();",1)

move_names=[
"getCurrentFieldBadgeTarget","setFieldStatBadgesTunerStatus","syncFieldStatBadgesTunerControls",
"updateFieldStatBadgesTunerFromInput","openFieldStatBadgesTuner","closeFieldStatBadgesTuner",
"copyFieldStatBadgesTunerValues","resetCurrentFieldBadge","resetFieldStatBadgesTuner","initFieldStatBadgesTuner",
"syncBattleVisualSizeControls","setBattleVisualSizeStatus","openBattleVisualSizeTuner","closeBattleVisualSizeTuner",
"resetBattleVisualSizeTuner","copyBattleVisualSizeValues","updateBattleVisualSizeValue","initBattleVisualSizeTuner",
"initHvMissionsTunerOptions","getHvMissionsTunerSelection","syncHvMissionsTunerControls",
"updateHvMissionsTunerValue","exportHvMissionsLayoutJson","makeHvMissionsDraggable",
"restoreHvMissionsTunerPositions","initHvMissionsLayoutTuner"
]

def function_span(text,name):
    m=re.search(r'(?m)^[ \t]*(?:async[ \t]+)?function[ \t]+'+re.escape(name)+r'[ \t]*\(',text)
    if not m:return None
    brace=text.find("{",m.start())
    if brace<0:return None
    depth=0;i=brace;state="code";quote="";esc=False;tick=chr(96)
    while i<len(text):
        ch=text[i];nxt=text[i+1] if i+1<len(text) else ""
        if state=="line":
            if ch=="\n":state="code"
        elif state=="block":
            if ch=="*" and nxt=="/":state="code";i+=1
        elif state=="str":
            if esc:esc=False
            elif ch=="\\":esc=True
            elif ch==quote:state="code"
        elif state=="template":
            if esc:esc=False
            elif ch=="\\":esc=True
            elif ch==tick:state="code"
        else:
            if ch=="/" and nxt=="/":state="line";i+=1
            elif ch=="/" and nxt=="*":state="block";i+=1
            elif ch in ("'",'"'):state="str";quote=ch
            elif ch==tick:state="template"
            elif ch=="{":depth+=1
            elif ch=="}":
                depth-=1
                if depth==0:
                    end=i+1
                    while end<len(text) and text[end] in " \t":end+=1
                    if end<len(text) and text[end]==";":end+=1
                    if end<len(text) and text[end]=="\r":end+=1
                    if end<len(text) and text[end]=="\n":end+=1
                    return (m.start(),end,text[m.start():end])
        i+=1
    return None

for old,new in [
("initFieldStatBadgesTuner();","applyFieldStatBadgesTunerState(false);"),
("initBattleVisualSizeTuner();","applyBattleVisualSizeState(false);"),
("initHvMissionsLayoutTuner();","")
]:
    if old not in settings: raise SystemExit("initializer missing: "+old)
    settings=settings.replace(old,new,1)

spans=[]
for name in move_names:
    span=function_span(settings,name)
    if not span: raise SystemExit("DEV function missing: "+name)
    spans.append((span[0],span[1],name,span[2]))
spans.sort()

for _,_,name,_ in spans:
    external=[]
    for p in WEB.rglob("*.js"):
        if p==SETTINGS or p==DEV:continue
        t=rd(p)
        if re.search(r'(?<![\w$])'+re.escape(name)+r'(?![\w$])',t):
            if name=="syncFieldBoardTunerControls" and p==BOOT:continue
            external.append(str(p.relative_to(WEB)))
    if external:
        raise SystemExit("Cannot DEV-only "+name+"; production references: "+str(external))

moved_source=[]
for start,end,name,source in reversed(spans):
    moved_source.append((start,name,source))
    settings=settings[:start]+settings[end:]
moved_source.sort()

dev_header='''/* HallValla - DEV calibrators v193
   NEVER loaded by normal production.
   Edits the same runtime state and canonical defaults used by production. */
(()=>{
"use strict";
if(globalThis.__HALLVALLA_DEV_TOOLS__!==true)return;

'''
dev_body="\n".join(source.rstrip() for _,_,source in moved_source)
dev_footer='''
globalThis.__HALLVALLA_DEV_SYNC_FIELD_STATS__=syncFieldStatBadgesTunerControls;
globalThis.__HALLVALLA_DEV_SYNC_BATTLE_VISUAL__=syncBattleVisualSizeControls;
initFieldStatBadgesTuner();
initBattleVisualSizeTuner();
initHvMissionsLayoutTuner();

globalThis.hallvallaExportCanonicalUiDraft=()=>{
  const draft={
    version:1,
    fieldBoard:{rows:ROWS,cols:COLS,cardScale:fieldBoardTunerState.cardScale},
    battleVisual:{...battleVisualSizeState},
    battleClock:JSON.parse(JSON.stringify(battleClockTunerState)),
    fieldStats:JSON.parse(JSON.stringify(fieldStatBadgesTunerState))
  };
  return JSON.stringify(draft,null,2);
};
})();
'''
wr(DEV,dev_header+dev_body+dev_footer)
wr(SETTINGS,settings)

loader=rd(LOADER)
loader=re.sub(r'const BUILD = "[^"]+";','const BUILD = "20260919.193";',loader,count=1)
core_anchor='const CORE_PARTS = [\n  "core/boot-config.js",'
if core_anchor not in loader: raise SystemExit("CORE_PARTS anchor missing")
loader=loader.replace(core_anchor,'const CORE_PARTS = [\n  "config/ui-canonical.js",\n  "core/boot-config.js",',1)
hvdev_old='''  "hvdev": [
    "dev/universal-layout-editor.js"
  ]'''
hvdev_new='''  "hvdev": [
    "dev/calibrators.js",
    "dev/universal-layout-editor.js"
  ]'''
if hvdev_old not in loader: raise SystemExit("hvdev bundle anchor missing")
loader=loader.replace(hvdev_old,hvdev_new,1)

for rel in ["config/ui-canonical.js","core/boot-config.js","system/settings-events.js","dev/calibrators.js","dev/universal-layout-editor.js"]:
    h=sha12(WEB/"js"/rel)
    pattern=r'("'+re.escape(rel)+r'":")[0-9a-f]+(")'
    if re.search(pattern,loader):
        loader=re.sub(pattern,lambda m:m.group(1)+h+m.group(2),loader,count=1)
    else:
        marker='const RESOURCE_HASHES = Object.freeze({'
        loader=loader.replace(marker,marker+'"'+rel+'":"'+h+'",',1)
wr(LOADER,loader)
loader_hash=sha12(LOADER)

stage=rd(STAGE)
stage=re.sub(r'2026091[89]\.\d+','20260919.193',stage)
stage=re.sub(r'bootstrap-loader\.js\?h=[0-9a-f]+','bootstrap-loader.js?h='+loader_hash,stage,count=1)
wr(STAGE,stage)

idx=rd(INDEX)
idx=re.sub(r'data-hv-shell="\d+"','data-hv-shell="193"',idx,count=1)
idx=re.sub(r'2026091[89]\.\d+','20260919.193',idx)
idx=re.sub(r"childUrl\.searchParams\.set\('hvshell','\d+'\);","childUrl.searchParams.set('hvshell','193');",idx,count=1)
wr(INDEX,idx)

sw=rd(SW)
sw=re.sub(r'2026091[89]\.\d+','20260919.193',sw)
sw=re.sub(r'hallvalla-runtime-v\d+','hallvalla-runtime-v193',sw,count=1)
wr(SW,sw)

doc=ROOT/"docs/AUDITORIA_FASE_DEV_v193.md"
wr(doc,'''# HallValla v193 - Auditoria profunda / Fase DEV

- config/ui-canonical.js es la fuente compartida de valores visuales.
- Produccion y ?dev arrancan desde los mismos valores.
- Produccion ya no consume calibraciones visuales privadas de localStorage.
- ?dev conserva localStorage solo como overlay temporal.
- Field Stats, lideres/mano y editor visual de Misiones
  salieron de system/settings-events.js y viven en dev/calibrators.js.
- dev/calibrators.js solo se carga con ?dev.
- hallvallaExportCanonicalUiDraft() exporta un borrador con formato canonico.
- Tablero, relojes y DET avanzado quedan para las siguientes fases porque aun mezclan runtime y editor.

Flujo: canonical -> PROD y DEV -> overlay DEV -> export -> aprobacion -> canonical.
''')

print("v193 phase DEV ready")
print("moved_dev_functions",len(spans))
print("settings_bytes",SETTINGS.stat().st_size)
print("dev_calibrators_bytes",DEV.stat().st_size)
print("canonical_hash",sha12(CONFIG))
print("loader_hash",loader_hash)
