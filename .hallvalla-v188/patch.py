#!/usr/bin/env python3
from pathlib import Path
import hashlib, json, re, sys

ROOT=Path(sys.argv[1]).resolve()
LEGACY=Path(sys.argv[2]).resolve()
WEB=ROOT/"web"
RUNTIME=WEB/"js/features/universal-layout-runtime.js"
FORGE_LAYOUT=WEB/"js/features/forge-layout.js"
HVDEV=WEB/"js/features/hvdev.js"
LOADER=WEB/"js/bootstrap-loader.js"
STAGE=WEB/"hallvalla-stage.html"
INDEX=WEB/"index.html"
SW=WEB/"service-worker.js"
CSS=WEB/"styles.css"

def rd(p): return p.read_text(encoding="utf-8")
def wr(p,s): p.write_text(s,encoding="utf-8")
def sha12(p): return hashlib.sha256(p.read_bytes()).hexdigest()[:12]

before_js_bytes=sum(p.stat().st_size for p in WEB.rglob("*.js"))
before_css_bytes=CSS.stat().st_size
before_js_lines=sum(rd(p).count("\n")+1 for p in WEB.rglob("*.js"))
before_css_lines=rd(CSS).count("\n")+1

# 1) Merge the legacy Forge width/height geometry into the universal runtime.
legacy_text=rd(LEGACY/"web/js/features/forge-layout.js")
lm=re.search(r'const USER_LAYOUT=(\{.*?\});\s*const defaultState=',legacy_text,re.S)
if not lm: raise SystemExit("legacy USER_LAYOUT not found")
legacy_layout=json.loads(lm.group(1))

runtime_text=rd(RUNTIME)
cm=re.search(r'const CANONICAL_CONFIG=(\{.*?\});\n',runtime_text,re.S)
if not cm: raise SystemExit("CANONICAL_CONFIG not found")
cfg=json.loads(cm.group(1))
items=cfg["items"]

for sel in list(items):
    if 'data-draft-index=' in sel or 'data-deck-card-key=' in sel or sel.startswith("#deckBuilderPanel #deckCollectionGrid > :nth-child("):
        items.pop(sel,None)

def add_state(selector,src,label=""):
    if not src:return
    st={}
    x=float(src.get("x",0) or 0); y=float(src.get("y",0) or 0)
    scale=float(src.get("scale",100) or 100)
    width=float(src.get("width",100) or 100); height=float(src.get("height",100) or 100)
    if x:st["x"]=x
    if y:st["y"]=y
    if scale!=100:st["sx"]=scale;st["sy"]=scale
    if width!=100:st["width"]=width
    if height!=100:st["height"]=height
    if label:st["label"]=label
    if st:items[selector]=st

static_map={
 "mainClose":"#deckBuilderPanel #closeDeckBuilderBtn",
 "save":"#deckBuilderPanel #saveDeckBtn",
 "tabsGroup":"#deckBuilderPanel .deckbuilder-leader-tabs",
 "filterGroup":"#deckBuilderPanel #deckFilterGroup",
 "collectionSection":"#deckBuilderPanel .deckbuilder-collection",
 "cards":"#deckBuilderPanel #deckCollectionGrid",
 "pager":"#deckBuilderPanel #deckCollectionPager",
 "prev":"#deckBuilderPanel #deckCollectionPrevBtn",
 "next":"#deckBuilderPanel #deckCollectionNextBtn",
 "deckGroup":"#deckBuilderPanel #deckBuilderDeckPanel",
 "deckCards":"#deckBuilderPanel #currentDeckList",
 "deckExtraCards":"#deckBuilderPanel #deckExtraSlots",
}
for key,selector in static_map.items(): add_state(selector,legacy_layout.get(key),"Forja "+key)

for i in range(1,16):
    add_state("#deckBuilderPanel #deckCollectionGrid > :nth-child(%d)"%i,legacy_layout.get("collectionCard%d"%i),"Coleccion slot %d"%i)
    add_state("#deckBuilderPanel #deckCollectionGrid > :nth-child(%d) .deck-mini-plus"%i,legacy_layout.get("collectionPlus%d"%i),"Coleccion + slot %d"%i)

for i in range(1,31):
    base=("#deckBuilderPanel #currentDeckList > :nth-child(%d)"%i) if i<=20 else ("#deckBuilderPanel #deckExtraSlots > :nth-child(%d)"%(i-20))
    add_state(base,legacy_layout.get("deckCard%d"%i),"Mazo slot %d"%i)
    add_state(base+" .deck-mini-remove",legacy_layout.get("deckRemove%d"%i),"Mazo quitar %d"%i)

cfg["version"]=7
cfg["editor"]="baked-v4-single-owner-width-height"
cfg["items"]=items
runtime_text=runtime_text[:cm.start(1)]+json.dumps(cfg,ensure_ascii=False,separators=(",",":"))+runtime_text[cm.end(1):]
runtime_text=runtime_text.replace("Universal Layout Runtime v4","Universal Layout Runtime v5")

runtime_text=runtime_text.replace(
'      sx:clamp(raw.sx||100,20,400), sy:clamp(raw.sy||100,20,400),\n      opacity:',
'      sx:clamp(raw.sx||100,20,400), sy:clamp(raw.sy||100,20,400),\n      width:clamp(raw.width||100,20,400), height:clamp(raw.height||100,20,400),\n      opacity:',1)

needle='''      scalePriority:node.style.getPropertyPriority("scale")||"",
      opacity:'''
repl='''      scalePriority:node.style.getPropertyPriority("scale")||"",
      width:node.style.getPropertyValue("width")||"",
      widthPriority:node.style.getPropertyPriority("width")||"",
      height:node.style.getPropertyValue("height")||"",
      heightPriority:node.style.getPropertyPriority("height")||"",
      minHeight:node.style.getPropertyValue("min-height")||"",
      minHeightPriority:node.style.getPropertyPriority("min-height")||"",
      maxHeight:node.style.getPropertyValue("max-height")||"",
      maxHeightPriority:node.style.getPropertyPriority("max-height")||"",
      transformOrigin:node.style.getPropertyValue("transform-origin")||"",
      transformOriginPriority:node.style.getPropertyPriority("transform-origin")||"",
      opacity:'''
if needle not in runtime_text:raise SystemExit("capture insertion missing")
runtime_text=runtime_text.replace(needle,repl,1)

needle='''    if(o.scale)node.style.setProperty("scale",o.scale,o.scalePriority);else node.style.removeProperty("scale");
    if(o.opacity)'''
repl='''    if(o.scale)node.style.setProperty("scale",o.scale,o.scalePriority);else node.style.removeProperty("scale");
    if(o.width)node.style.setProperty("width",o.width,o.widthPriority);else node.style.removeProperty("width");
    if(o.height)node.style.setProperty("height",o.height,o.heightPriority);else node.style.removeProperty("height");
    if(o.minHeight)node.style.setProperty("min-height",o.minHeight,o.minHeightPriority);else node.style.removeProperty("min-height");
    if(o.maxHeight)node.style.setProperty("max-height",o.maxHeight,o.maxHeightPriority);else node.style.removeProperty("max-height");
    if(o.transformOrigin)node.style.setProperty("transform-origin",o.transformOrigin,o.transformOriginPriority);else node.style.removeProperty("transform-origin");
    if(o.opacity)'''
if needle not in runtime_text:raise SystemExit("restore insertion missing")
runtime_text=runtime_text.replace(needle,repl,1)

needle='''    if(state.sx!==100||state.sy!==100)node.style.setProperty("scale",(state.sx/100)+" "+(state.sy/100),"important");
    else if(original.scale)node.style.setProperty("scale",original.scale,original.scalePriority);else node.style.removeProperty("scale");
    if(state.opacity!==100)'''
repl='''    if(state.sx!==100||state.sy!==100)node.style.setProperty("scale",(state.sx/100)+" "+(state.sy/100),"important");
    else if(original.scale)node.style.setProperty("scale",original.scale,original.scalePriority);else node.style.removeProperty("scale");
    if(state.width!==100)node.style.setProperty("width",Math.max(2,node.offsetWidth*state.width/100)+"px","important");
    else if(original.width)node.style.setProperty("width",original.width,original.widthPriority);else node.style.removeProperty("width");
    if(state.height!==100){
      node.style.setProperty("height",Math.max(2,node.offsetHeight*state.height/100)+"px","important");
      node.style.setProperty("min-height","0px","important");
      node.style.setProperty("max-height","none","important");
    }else{
      if(original.height)node.style.setProperty("height",original.height,original.heightPriority);else node.style.removeProperty("height");
      if(original.minHeight)node.style.setProperty("min-height",original.minHeight,original.minHeightPriority);else node.style.removeProperty("min-height");
      if(original.maxHeight)node.style.setProperty("max-height",original.maxHeight,original.maxHeightPriority);else node.style.removeProperty("max-height");
    }
    if(state.width!==100||state.height!==100)node.style.setProperty("transform-origin","center center","important");
    else if(original.transformOrigin)node.style.setProperty("transform-origin",original.transformOrigin,original.transformOriginPriority);else node.style.removeProperty("transform-origin");
    if(state.opacity!==100)'''
if needle not in runtime_text:raise SystemExit("apply insertion missing")
runtime_text=runtime_text.replace(needle,repl,1)
wr(RUNTIME,runtime_text)

wr(FORGE_LAYOUT,'''/* HallValla · Forge lifecycle bridge v188
   universal-layout-runtime.js is the ONLY geometry owner.
*/
(()=>{
  "use strict";
  const panel=()=>document.getElementById("deckBuilderPanel");
  const isOpen=()=>{const p=panel();return !!(p&&!p.classList.contains("hidden"));};
  let frame=0;
  const apply=()=>globalThis.hvUniversalLayoutRuntime?.apply?.();
  const schedule=()=>{if(frame)return;frame=requestAnimationFrame(()=>{frame=0;if(isOpen())apply();});};
  globalThis.__HALLVALLA_APPLY_FORGE_LAYOUT__=apply;
  const start=()=>{
    const p=panel();if(!p)return;
    new MutationObserver(schedule).observe(p,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
    addEventListener("resize",schedule,{passive:true});
    if(isOpen())schedule();
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
''')

# 2) Physically remove confirmed dead functions.
dead_functions={
 "web/js/features/hvdev.js":["defaultState"],
 "web/js/features/pve.js":["countBy"],
 "web/js/parts/03-runtime-clocks.js":["startTurnTimerLoop","isUnitMovePhase","canOpenHandForViewNow"],
 "web/js/parts/05-cards-specials-lore.js":["getPrincipalSlotsForLeaderType","getDeckSizeForPrincipalSlots","isSwordUnitCardLike","isCanonicalFootArcherMovementOne"],
 "web/js/parts/06-decks-units-combat-rules.js":["getStarterComplementTemplate"],
 "web/js/parts/10-board-interactions.js":["handleBattleCancelButton","syncBattleCancelUndoUi"],
 "web/js/parts/11-render-battle-tutorial.js":["getBasicTutorialEnemyUnit","renderDetail","maybeShowBasicTutorialGate"],
 "web/js/parts/13-collection-deck-forge.js":["closeHallvallaPackOdds","normalizePrincipalKeys","setCurrentDeckPrincipal","clearCurrentDeckPrincipal","renderDeckPrincipalSelector"],
 "web/js/parts/15-settings-tuners-events.js":["isChapterOneCompleteForTutorial","startHomeDeckTutorial","hallvallaSystemTutorialEscape","getHallvallaMineWheelCategory","getHallvallaMineShopPuzzleHtml"],
 "web/js/parts/21-realtime-experimental.js":["hallvallaRtMoveUnit"],
}

def find_end(text,start):
    brace=text.find("{",start)
    if brace<0:return None
    depth=0;i=brace;state="code";quote="";esc=False
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
            elif ch=="\x60":state="code"
        else:
            if ch=="/" and nxt=="/":state="line";i+=1
            elif ch=="/" and nxt=="*":state="block";i+=1
            elif ch in ("'",'"'):state="str";quote=ch
            elif ch=="\x60":state="template"
            elif ch=="{":depth+=1
            elif ch=="}":
                depth-=1
                if depth==0:return i+1
        i+=1
    return None

def remove_function(text,name):
    m=re.search(r'(?m)^[ \t]*(?:async[ \t]+)?function[ \t]+'+re.escape(name)+r'[ \t]*\(',text)
    if not m:return text,False
    end=find_end(text,m.start())
    if end is None:raise SystemExit("cannot close "+name)
    while end<len(text) and text[end] in " \t":end+=1
    if end<len(text) and text[end]==";":end+=1
    if end<len(text) and text[end]=="\r":end+=1
    if end<len(text) and text[end]=="\n":end+=1
    return text[:m.start()]+text[end:],True

removed=[]
for rel,names in dead_functions.items():
    p=ROOT/rel;t=rd(p)
    for name in names:
        t,ok=remove_function(t,name)
        if ok:removed.append(name)
    wr(p,t)

p=WEB/"js/parts/10-board-interactions.js";t=rd(p);t=re.sub(r'(?m)^[ \t]*syncBattleCancelUndoUi\(\);[ \t]*\n','',t);wr(p,t)
p=WEB/"js/parts/11-render-battle-tutorial.js";t=rd(p);t=re.sub(r'(?m)^[ \t]*hallvallaRecordRenderDomain\("detail",renderDetail\);[ \t]*\n','',t);wr(p,t)
p=WEB/"js/parts/15-settings-tuners-events.js";t=rd(p);t=re.sub(r'(?m)^[ \t]*maybeShowBasicTutorialGate\(\);[ \t]*\n','',t);wr(p,t)

# Remove obsolete dedicated deck editor from DEV hub.
t=rd(HVDEV)
for name in ["bindForgeShell","openForgeControl","bindDeferredForgeObserver"]:t,_=remove_function(t,name)
t=t.replace('      "hvForgeTunerDone",\n','')
t=t.replace('      {label:"Creación de mazo",action:openForgeControl},\n','')
t=re.sub(r'(?m)^[ \t]*bindDeferredForgeObserver\(\);[ \t]*\n','',t)
wr(HVDEV,t)

loader=rd(LOADER).replace(",#hvForgeDirectTuner","")
wr(LOADER,loader)

# 3) Remove confirmed orphan CSS families.
css=rd(CSS).replace("body:not(.hv-forge-edit-active) ","")
dead=[
 ".hv47-",".deck-principal-","#deckPrincipal",
 ".account-mastery-",".mastery-missions-modal",".mastery-claim-all",".mastery-milestone-",".mastery-ready-",".mastery-claim-one",
 ".mission-section-divider",".tutorial-missions-intro--secondary",
 ".craft-material-panel",".craft-material-summary","#craftMaterialPanel",".craft-material-node",".craft-material-value",".craft-material-label",".craft-mat-",".craft-summary-",".craft-corner-dust",
 ".actions-hud-tuner",
 ".hv-forge-direct-tuner",".hv-forge-tuner-",".hv-forge-tuner-selected","[data-hv-forge-tuner-name]",".hv-forge-dragging","body.hv-forge-edit-active"
]
rule=re.compile(r'([^{}]+)\{([^{}]*)\}',re.S)
removed_css=0
for _ in range(10):
    count=[0]
    def drop(m):
        sel=m.group(1)
        if any(x in sel for x in dead):
            count[0]+=1
            return ""
        return m.group(0)
    new=rule.sub(drop,css)
    removed_css+=count[0]
    if new==css:break
    css=new
css=re.sub(r'@media[^{]+\{\s*\}','',css)
wr(CSS,css)

# 4) Build/cache.
changed=[
 "features/universal-layout-runtime.js","features/forge-layout.js","features/hvdev.js","features/pve.js",
 "parts/03-runtime-clocks.js","parts/05-cards-specials-lore.js","parts/06-decks-units-combat-rules.js",
 "parts/10-board-interactions.js","parts/11-render-battle-tutorial.js","parts/13-collection-deck-forge.js",
 "parts/15-settings-tuners-events.js","parts/21-realtime-experimental.js"
]
loader=rd(LOADER)
for rel in changed:
    h=sha12(WEB/"js"/rel)
    loader=re.sub(r'("'+re.escape(rel)+r'":")[0-9a-f]+(")',lambda m:m.group(1)+h+m.group(2),loader,count=1)
loader=re.sub(r'const BUILD = "20260918\.\d+";','const BUILD = "20260918.188";',loader,count=1)
wr(LOADER,loader)
loader_hash=sha12(LOADER)

stage=rd(STAGE)
stage=re.sub(r'20260918\.\d+','20260918.188',stage)
stage=re.sub(r'bootstrap-loader\.js\?h=[0-9a-f]+','bootstrap-loader.js?h='+loader_hash,stage,count=1)
stage=re.sub(r'styles\.css\?h=[0-9a-f]+','styles.css?h='+sha12(CSS),stage,count=1)
stage=re.sub(r'content="Design Stage fijo 1366×636 · [^"]*"','content="Design Stage fijo 1366×636 · v188 audit clean · layout unico"',stage,count=1)
wr(STAGE,stage)

idx=rd(INDEX)
idx=re.sub(r'data-hv-shell="\d+"','data-hv-shell="188"',idx,count=1)
idx=re.sub(r'20260918\.\d+','20260918.188',idx)
idx=re.sub(r"childUrl\.searchParams\.set\('hvshell','\d+'\);","childUrl.searchParams.set('hvshell','188');",idx,count=1)
wr(INDEX,idx)

sw=rd(SW)
sw=re.sub(r'20260918\.\d+','20260918.188',sw)
sw=re.sub(r'hallvalla-runtime-v\d+','hallvalla-runtime-v188',sw,count=1)
wr(SW,sw)

after_js_bytes=sum(p.stat().st_size for p in WEB.rglob("*.js"))
after_css_bytes=CSS.stat().st_size
after_js_lines=sum(rd(p).count("\n")+1 for p in WEB.rglob("*.js"))
after_css_lines=rd(CSS).count("\n")+1

(ROOT/"docs/AUDITORIA_FRONTEND_v188.md").write_text("""# HallValla - Auditoria frontend v188

Plano logico: 1366x636.

## Cambios aplicados
- Universal Layout Runtime es el unico dueno de geometria de la Forja.
- forge-layout.js es solo un bridge de rerender.
- Se migraron width y height que se habian perdido en v187.
- Coleccion: 15 slots estables entre paginas.
- Mazo: 30 slots estables.
- Codigo muerto confirmado fue borrado fisicamente, no comentado ni encerrado en if(false).

## Resultado de limpieza
- Funciones JS borradas: %d
- Reglas CSS huerfanas borradas: %d
- JS antes: %d bytes / %d lineas
- JS despues: %d bytes / %d lineas
- CSS antes: %d bytes / %d lineas
- CSS despues: %d bytes / %d lineas
- Reduccion JS+CSS: %d bytes

## Funciones eliminadas
%s

## Familias CSS eliminadas
- Mina antigua hv47
- UI antigua de Personajes Principales del constructor
- Maestrias antiguas previas a hv-mastery
- Panel antiguo de materiales/crafteo que ya no se renderiza
- actions-hud-tuner
- editor dedicado viejo de Creacion de mazo

## Retenido a proposito
- Migraciones y compatibilidad Firebase/localStorage
- battle-layout.js, porque sigue activo en combate
- event splash, porque esta dormido/deshabilitado pero no es inequívocamente basura
- herramientas DEV que aun tienen consumidores reales
"""%(len(removed),removed_css,before_js_bytes,before_js_lines,after_js_bytes,after_js_lines,before_css_bytes,before_css_lines,after_css_bytes,after_css_lines,(before_js_bytes+before_css_bytes)-(after_js_bytes+after_css_bytes),"\n".join("- "+x for x in removed)),encoding="utf-8")

print("v188 ready")
print("functions_removed",len(removed))
print("css_rules_removed",removed_css)
print("bytes_removed",(before_js_bytes+before_css_bytes)-(after_js_bytes+after_css_bytes))
