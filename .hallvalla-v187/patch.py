#!/usr/bin/env python3
from pathlib import Path
import hashlib, json, re, statistics, sys

ROOT=Path(sys.argv[1]).resolve()
WEB=ROOT/"web"
RUNTIME=WEB/"js/features/universal-layout-runtime.js"
FORGE_LAYOUT=WEB/"js/features/forge-layout.js"
LOADER=WEB/"js/bootstrap-loader.js"
STAGE=WEB/"hallvalla-stage.html"
INDEX=WEB/"index.html"
SW=WEB/"service-worker.js"

def rd(p): return p.read_text(encoding="utf-8")
def wr(p,s): p.write_text(s,encoding="utf-8")

# ---------------------------------------------------------------------------
# v187: ONE geometry owner.
# universal-layout-runtime.js is the only file allowed to own x/y/scale layout.
# forge-layout.js becomes a tiny lifecycle bridge only.
# ---------------------------------------------------------------------------

# A) Make collection pagination stable by slot rather than by card identity.
s=rd(RUNTIME)
m=re.search(r'const CANONICAL_CONFIG=(\{.*?\});\n',s,re.S)
if not m:
    raise SystemExit("CANONICAL_CONFIG not found")
cfg=json.loads(m.group(1))
items=cfg.get("items",{})

slot_groups={}
remove=[]
for sel,state in list(items.items()):
    if 'data-deck-card-key=' in sel and 'data-draft-index=' not in sel:
        mm=re.search(r':nth-of-type\((\d+)\)',sel)
        if mm:
            slot=int(mm.group(1))
            slot_groups.setdefault(slot,[]).append(state)
            remove.append(sel)

for sel in remove:
    items.pop(sel,None)

def median_num(arr,key,default):
    vals=[]
    for st in arr:
        try: vals.append(float(st.get(key,default)))
        except: pass
    return round(statistics.median(vals),3) if vals else default

for slot,arr in sorted(slot_groups.items()):
    state={
      "x":median_num(arr,"x",0),
      "y":median_num(arr,"y",0),
      "sx":median_num(arr,"sx",100),
      "sy":median_num(arr,"sy",100),
      "label":f"Colección · slot {slot} estable"
    }
    if state["x"]==0: state.pop("x")
    if state["y"]==0: state.pop("y")
    if state["sx"]==100: state.pop("sx")
    if state["sy"]==100: state.pop("sy")
    items[f"#deckBuilderPanel #deckCollectionGrid > :nth-child({slot})"]=state

cfg["version"]=6
cfg["editor"]="baked-v3-single-owner"
cfg["items"]=items

newcfg=json.dumps(cfg,ensure_ascii=False,separators=(",",":"))
s=s[:m.start(1)]+newcfg+s[m.end(1):]
s=s.replace("Universal Layout Runtime v2","Universal Layout Runtime v4")
s=s.replace("Universal Layout Runtime v3","Universal Layout Runtime v4")
wr(RUNTIME,s)

# B) Remove the second geometry engine entirely.
bridge=r'''/* HallValla · Forge layout bridge v187
   IMPORTANT:
   This file NO LONGER owns geometry.
   universal-layout-runtime.js is the single source of truth for X/Y/scale.
   The bridge only reapplies the canonical layout after Forge rerenders.
*/
(()=>{
  "use strict";

  function forgeIsOpen(){
    const panel=document.getElementById("deckBuilderPanel");
    return !!(panel && !panel.classList.contains("hidden"));
  }

  function applyCanonicalForgeLayout(){
    globalThis.hvUniversalLayoutRuntime?.apply?.();
  }

  let scheduled=false;
  function scheduleApply(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      if(forgeIsOpen())applyCanonicalForgeLayout();
    });
  }

  globalThis.__HALLVALLA_APPLY_FORGE_LAYOUT__=applyCanonicalForgeLayout;

  const start=()=>{
    const panel=document.getElementById("deckBuilderPanel");
    if(!panel)return;

    new MutationObserver(scheduleApply).observe(panel,{
      childList:true,
      subtree:true,
      attributes:true,
      attributeFilter:["class"]
    });

    addEventListener("resize",scheduleApply,{passive:true});
    if(forgeIsOpen())scheduleApply();
  };

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",start,{once:true});
  }else{
    start();
  }
})();
'''
wr(FORGE_LAYOUT,bridge)

# C) Build/hash bump.
runtime_hash=hashlib.sha256(RUNTIME.read_bytes()).hexdigest()[:12]
forge_hash=hashlib.sha256(FORGE_LAYOUT.read_bytes()).hexdigest()[:12]

l=rd(LOADER)
l=re.sub(r'("features/universal-layout-runtime\.js":")[0-9a-f]+(")',lambda x:x.group(1)+runtime_hash+x.group(2),l,count=1)
l=re.sub(r'("features/forge-layout\.js":")[0-9a-f]+(")',lambda x:x.group(1)+forge_hash+x.group(2),l,count=1)
l=re.sub(r'const BUILD = "20260918\.\d+";', 'const BUILD = "20260918.187";', l, count=1)
wr(LOADER,l)
loader_hash=hashlib.sha256(LOADER.read_bytes()).hexdigest()[:12]

st=rd(STAGE)
st=re.sub(r'20260918\.\d+','20260918.187',st)
st=re.sub(r'bootstrap-loader\.js\?h=[0-9a-f]+','bootstrap-loader.js?h='+loader_hash,st,count=1)
st=re.sub(r'content="Design Stage fijo 1366×636 · [^"]*"',
          'content="Design Stage fijo 1366×636 · Layout único v187"',st,count=1)
wr(STAGE,st)

ix=rd(INDEX)
ix=re.sub(r'data-hv-shell="\d+"','data-hv-shell="187"',ix,count=1)
ix=re.sub(r'20260918\.\d+','20260918.187',ix)
ix=re.sub(r"childUrl\.searchParams\.set\('hvshell','\d+'\);","childUrl.searchParams.set('hvshell','187');",ix,count=1)
wr(INDEX,ix)

sv=rd(SW)
sv=re.sub(r'20260918\.\d+','20260918.187',sv)
sv=re.sub(r'hallvalla-runtime-v\d+','hallvalla-runtime-v187',sv,count=1)
wr(SW,sv)

# D) README explaining exactly where the files live and what changed.
readme=ROOT/"LEEME_v187_LAYOUT_UNICO.txt"
readme.write_text("""HallValla v187 · REPO COMPLETO
================================

Plano lógico oficial: 1366×636

CAMBIO ESTRUCTURAL
------------------
Antes existían dos motores de geometría para la Forja:
1) web/js/features/forge-layout.js
2) web/js/features/universal-layout-runtime.js

Eso provocaba que al paginar, filtrar o reconstruir cartas un motor volviera a
imponer posiciones distintas.

En v187:
- universal-layout-runtime.js es el ÚNICO dueño de X/Y/escala.
- forge-layout.js YA NO contiene USER_LAYOUT, translate, scale, width/height ni
  ningún segundo sistema de coordenadas.
- forge-layout.js solo observa que la Forja se rerenderice y pide al runtime
  universal que reaplique el layout canónico.
- la colección usa 15 slots físicos estables entre páginas.
- el mazo sigue teniendo 30 slots: 1–20 en currentDeckList y 21–30 en deckExtraSlots.

CÓMO USAR ESTE ZIP
------------------
Este ZIP es el repositorio COMPLETO. No es un parche.

1. Descomprime HallValla_REPO_COMPLETO_v187.
2. En tu PC abre:
   Documentos\\GitHub\\Hallvalla
3. REEMPLAZA el contenido de esa carpeta por el contenido de
   HallValla_REPO_COMPLETO_v187.
4. NO copies archivos sueltos a mano.
5. Haz commit/push normalmente desde GitHub Desktop.
6. Espera a que GitHub Pages publique.
7. Prueba:
   https://elberlord.github.io/Hallvalla/
8. Fuerza recarga con Ctrl+F5.

Para seguir acomodando con el Control Universal:
https://elberlord.github.io/Hallvalla/?dev

La versión normal NO muestra ningún letrero de 1366×636.
""",encoding="utf-8")

print("v187 complete repo patch ready")
print("removed dynamic card-specific selectors:",len(remove))
print("stable collection slots:",len(slot_groups))
print("runtime hash:",runtime_hash)
print("forge bridge hash:",forge_hash)
print("loader hash:",loader_hash)
