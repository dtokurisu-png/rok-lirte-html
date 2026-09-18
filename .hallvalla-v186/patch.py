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

# 1) Universal runtime: dynamic collection cards must be addressed by slot,
# not by card key + nth-of-type. Pagination replaces the cards, not the slots.
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
        v=st.get(key,default)
        try: vals.append(float(v))
        except: pass
    return round(statistics.median(vals),3) if vals else default

for slot,arr in sorted(slot_groups.items()):
    state={
      "x":median_num(arr,"x",0),
      "y":median_num(arr,"y",0),
      "sx":median_num(arr,"sx",100),
      "sy":median_num(arr,"sy",100),
      "opacity":100,
      "z":0,
      "backgroundOff":False,
      "borderOff":False,
      "shadowOff":False,
      "hidden":False,
      "label":f"Colección · slot {slot} estable entre páginas"
    }
    # compact zero/default values but preserve sx/sy because they are intentional
    state={k:v for k,v in state.items() if not (
      (k in ("x","y","z") and v==0) or
      (k=="opacity" and v==100) or
      (k in ("backgroundOff","borderOff","shadowOff","hidden") and v is False)
    )}
    items[f"#deckBuilderPanel #deckCollectionGrid > :nth-child({slot})"]=state

cfg["version"]=5
cfg["editor"]="baked-v2-pagination-stable"
cfg["items"]=items
newcfg=json.dumps(cfg,ensure_ascii=False,separators=(",",":"))
s=s[:m.start(1)]+newcfg+s[m.end(1):]
s=s.replace("Universal Layout Runtime v2","Universal Layout Runtime v3")
wr(RUNTIME,s)

# 2) Forge layout: every time its legacy geometry reapplies after a render,
# immediately reapply the canonical runtime. This removes the race where
# pagination could leave Forge's per-slot inline !important styles on top.
f=rd(FORGE_LAYOUT)
old="""  function applyRuntimeLayout(){
    captureBaselineMetrics();
    for(const key of Object.keys(TARGETS))applyTarget(key);
  }"""
new="""  function applyRuntimeLayout(){
    captureBaselineMetrics();
    for(const key of Object.keys(TARGETS))applyTarget(key);
    // v186: Forge still owns structural width/height, but the approved
    // 1366x636 canonical layout always wins translate/scale afterwards.
    // This must run on every pagination/filter rerender.
    globalThis.hvUniversalLayoutRuntime?.apply?.();
  }"""
if old not in f:
    raise SystemExit("applyRuntimeLayout pattern missing")
f=f.replace(old,new,1)
wr(FORGE_LAYOUT,f)

# 3) Cache-bust all changed modules and build.
runtime_hash=hashlib.sha256(RUNTIME.read_bytes()).hexdigest()[:12]
forge_hash=hashlib.sha256(FORGE_LAYOUT.read_bytes()).hexdigest()[:12]
l=rd(LOADER)
l=re.sub(r'("features/universal-layout-runtime\.js":")[0-9a-f]+(")',lambda x:x.group(1)+runtime_hash+x.group(2),l,count=1)
l=re.sub(r'("features/forge-layout\.js":")[0-9a-f]+(")',lambda x:x.group(1)+forge_hash+x.group(2),l,count=1)
l=re.sub(r'const BUILD = "20260918\.\d+";', 'const BUILD = "20260918.186";', l, count=1)
wr(LOADER,l)
loader_hash=hashlib.sha256(LOADER.read_bytes()).hexdigest()[:12]

st=rd(STAGE)
st=re.sub(r'20260918\.\d+','20260918.186',st)
st=re.sub(r'bootstrap-loader\.js\?h=[0-9a-f]+','bootstrap-loader.js?h='+loader_hash,st,count=1)
st=st.replace('Layout 1366×636 fijado · DEV delta v5','Layout 1366×636 fijo · paginación estable v186')
wr(STAGE,st)

ix=rd(INDEX)
ix=re.sub(r'data-hv-shell="\d+"','data-hv-shell="186"',ix,count=1)
ix=re.sub(r'20260918\.\d+','20260918.186',ix)
ix=re.sub(r"childUrl\.searchParams\.set\('hvshell','\d+'\);","childUrl.searchParams.set('hvshell','186');",ix,count=1)
wr(INDEX,ix)

sv=rd(SW)
sv=re.sub(r'20260918\.\d+','20260918.186',sv)
sv=re.sub(r'hallvalla-runtime-v\d+','hallvalla-runtime-v186',sv,count=1)
wr(SW,sv)

print("v186 pagination fix ready")
print("removed_card_specific_selectors",len(remove))
print("stable_slots",len(slot_groups))
print("runtime_hash",runtime_hash)
print("forge_hash",forge_hash)
print("loader_hash",loader_hash)
