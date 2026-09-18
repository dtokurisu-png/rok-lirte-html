#!/usr/bin/env python3
from pathlib import Path
import hashlib, json, re, sys

ROOT=Path(sys.argv[1]).resolve()
USERBASE=Path(sys.argv[2]).resolve()
WEB=ROOT/"web"
RUNTIME=WEB/"js/features/universal-layout-runtime.js"
HVDEV=WEB/"js/features/hvdev.js"
LOADER=WEB/"js/bootstrap-loader.js"
STAGE=WEB/"hallvalla-stage.html"
INDEX=WEB/"index.html"
SW=WEB/"service-worker.js"

def rd(p): return p.read_text(encoding="utf-8")
def wr(p,s): p.write_text(s,encoding="utf-8")
def sha12(p): return hashlib.sha256(p.read_bytes()).hexdigest()[:12]

src=rd(USERBASE/"web/js/features/universal-layout-runtime.js")
m=re.search(r'const CANONICAL_CONFIG=(\{.*?\});\n',src,re.S)
if not m: raise SystemExit("user canonical config not found")
cfg=json.loads(m.group(1))

def stable_selector(sel):
    m=re.search(r'data-deck-card-key=\\"([^"]+)\\"',sel)
    if m:
        return '#deckBuilderPanel #deckCollectionGrid > [data-deck-card-key="%s"]'%m.group(1)
    m=re.search(r'data-draft-index=\\"([^"]+)\\"',sel)
    if m:
        return '#deckBuilderPanel [data-draft-index="%s"]'%m.group(1)
    m=re.search(r'data-beast-tab=\\"([^"]+)\\"',sel)
    if m:
        return '[data-beast-tab="%s"]'%m.group(1)
    m=re.search(r'data-beast-season-seal=\\"([^"]+)\\"',sel)
    if m:
        return '[data-beast-season-seal="%s"]'%m.group(1)
    return sel

normalized={}
origin={}
for sel,state in cfg["items"].items():
    stable=stable_selector(sel)
    if stable in normalized and normalized[stable]!=state:
        raise SystemExit("selector collision: %s <= %s / %s"%(stable,origin[stable],sel))
    normalized[stable]=state
    origin[stable]=sel

cfg["version"]=8
cfg["editor"]="user-json-restored-stable-selectors-v189"
cfg["items"]=normalized

runtime=rd(RUNTIME)
cm=re.search(r'const CANONICAL_CONFIG=(\{.*?\});\n',runtime,re.S)
if not cm: raise SystemExit("current canonical config not found")
runtime=runtime[:cm.start(1)]+json.dumps(cfg,ensure_ascii=False,separators=(",",":"))+runtime[cm.end(1):]
runtime=runtime.replace("Universal Layout Runtime v5","Universal Layout Runtime v6")
wr(RUNTIME,runtime)

dev=rd(HVDEV)
old="    const priority=['data-mine-panel','data-mine-nav','data-action','data-mode','data-view','data-slot-index','data-card-id','data-unit-id','data-adventure-node','data-id','data-key','data-draft-index'];"
new="    const priority=['data-mine-panel','data-mine-nav','data-action','data-mode','data-view','data-slot-index','data-card-id','data-unit-id','data-adventure-node','data-id','data-key','data-draft-index','data-deck-card-key','data-beast-tab','data-beast-season-seal'];"
if old not in dev: raise SystemExit("priority selector list not found")
dev=dev.replace(old,new,1)

pattern=r'''    const parent=node\.parentElement;\n    if\(parent\)\{const same=Array\.from\(parent\.children\)\.filter\(child=>child\.tagName===node\.tagName\);if\(same\.length>1\)part\+=`:nth-of-type\(\$\{same\.indexOf\(node\)\+1\}\)`;\}'''
replacement='''    const parent=node.parentElement;
    /* Stable data identity already identifies the logical element.
       Adding nth-of-type tied it to a page/slot and invalidated adjustments
       after pagination or filtering. */
    if(parent&&!data.length){
      const same=Array.from(parent.children).filter(child=>child.tagName===node.tagName);
      if(same.length>1)part+=`:nth-of-type(${same.indexOf(node)+1})`;
    }'''
dev,n=re.subn(pattern,replacement,dev,count=1)
if n!=1: raise SystemExit("selectorPart nth block not found")

dev=dev.replace("CONTROL UNIVERSAL LIBRE v5 · 1366×636","CONTROL UNIVERSAL LIBRE v6 · 1366×636")
dev=dev.replace("BASE FIJA v185 · nuevos cambios quedan como delta DEV","BASE FIJA v189 · selectores estables por identidad")
dev=dev.replace("hallvalla_universal_layout_dev_v5_after_bake_1366","hallvalla_universal_layout_dev_v6_stable_identity_1366")
dev=dev.replace("hallvalla_universal_layout_panel_v5_after_bake_1366","hallvalla_universal_layout_panel_v6_stable_identity_1366")
wr(HVDEV,dev)

loader=rd(LOADER)
for rel in ["features/universal-layout-runtime.js","features/hvdev.js"]:
    h=sha12(WEB/"js"/rel)
    loader=re.sub(r'("'+re.escape(rel)+r'":")[0-9a-f]+(")',lambda x:x.group(1)+h+x.group(2),loader,count=1)
loader=re.sub(r'const BUILD = "20260918\.\d+";','const BUILD = "20260918.189";',loader,count=1)
wr(LOADER,loader)
loader_hash=sha12(LOADER)

stage=rd(STAGE)
stage=re.sub(r'20260918\.\d+','20260918.189',stage)
stage=re.sub(r'bootstrap-loader\.js\?h=[0-9a-f]+','bootstrap-loader.js?h='+loader_hash,stage,count=1)
stage=re.sub(r'content="Design Stage fijo 1366×636 · [^"]*"','content="Design Stage fijo 1366×636 · v189 JSON usuario restaurado · selectores estables"',stage,count=1)
wr(STAGE,stage)

idx=rd(INDEX)
idx=re.sub(r'data-hv-shell="\d+"','data-hv-shell="189"',idx,count=1)
idx=re.sub(r'20260918\.\d+','20260918.189',idx)
idx=re.sub(r"childUrl\.searchParams\.set\('hvshell','\d+'\);","childUrl.searchParams.set('hvshell','189');",idx,count=1)
wr(INDEX,idx)

sw=rd(SW)
sw=re.sub(r'20260918\.\d+','20260918.189',sw)
sw=re.sub(r'hallvalla-runtime-v\d+','hallvalla-runtime-v189',sw,count=1)
wr(SW,sw)

(ROOT/"docs/FIX_LAYOUT_v189.md").write_text("""# HallValla v189 - correccion de Layout Universal

Causa confirmada:
- v188 reemplazo parte del JSON calibrado por valores del antiguo forge-layout.
- El control DEV generaba selectores data-deck-card-key + nth-of-type.
- Al paginar o filtrar, nth-of-type cambiaba y el ajuste individual dejaba de coincidir.
- El boton Volver tambien fue sobreescrito por el layout legacy.

Correccion:
- Se restauro el JSON universal exacto del ultimo snapshot calibrado por el usuario.
- Cartas de coleccion: identidad por data-deck-card-key, sin nth-of-type.
- Cartas del mazo: identidad por data-draft-index, sin nth-of-type.
- Beast Master: identidad por data-beast-tab / data-beast-season-seal.
- #closeDeckBuilderBtn vuelve al ajuste exacto del JSON calibrado.
- El control ?dev v6 ya no genera nth-of-type cuando existe un data-* estable.
- Nueva clave localStorage para no cargar selectores defectuosos de v5.
- Se conserva toda la limpieza de auditoria v188.
""",encoding="utf-8")

print("v189 ready")
print("restored_items",len(cfg["items"]))
print("runtime_hash",sha12(RUNTIME))
print("hvdev_hash",sha12(HVDEV))
print("loader_hash",loader_hash)
