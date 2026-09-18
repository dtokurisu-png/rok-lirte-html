#!/usr/bin/env python3
from pathlib import Path
import base64, hashlib, json, re, sys, zlib

ROOT=Path(sys.argv[1]).resolve()
WEB=ROOT/"web"
RUNTIME=WEB/"js/features/universal-layout-runtime.js"
HVDEV=WEB/"js/features/hvdev.js"
LOADER=WEB/"js/bootstrap-loader.js"
STAGE=WEB/"hallvalla-stage.html"
INDEX=WEB/"index.html"
SW=WEB/"service-worker.js"
SUMS=ROOT/"REPO_FILE_SHA256SUMS.txt"

CONFIG_B64="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"

cfg=json.loads(zlib.decompress(base64.b64decode(CONFIG_B64)).decode("utf-8"))
assert cfg["designStage"]=={"width":1366,"height":636,"mode":"fixed"}
assert len(cfg["items"])==178

def rd(p): return p.read_text(encoding="utf-8")
def wr(p,s): p.write_text(s,encoding="utf-8")

s=rd(RUNTIME)
s=s.replace("/* HallValla · Universal Layout Runtime v1","/* HallValla · Universal Layout Runtime v2")
s=re.sub(
    r'const CANONICAL_CONFIG=Object\.freeze\(\{version:1,units:"css-px",items:Object\.freeze\(\{\}\)\}\);',
    'const CANONICAL_CONFIG='+json.dumps(cfg,ensure_ascii=False,separators=(",",":"))+';',
    s,count=1
)

capture='''  function captureOriginal(node){
    if(!node||originalStyles.has(node))return;
    originalStyles.set(node,{
      translate:node.style.getPropertyValue("translate")||"",
      translatePriority:node.style.getPropertyPriority("translate")||"",
      scale:node.style.getPropertyValue("scale")||"",
      scalePriority:node.style.getPropertyPriority("scale")||"",
      opacity:node.style.getPropertyValue("opacity")||"",
      opacityPriority:node.style.getPropertyPriority("opacity")||"",
      zIndex:node.style.getPropertyValue("z-index")||"",
      zIndexPriority:node.style.getPropertyPriority("z-index")||"",
      background:node.style.getPropertyValue("background")||"",
      backgroundPriority:node.style.getPropertyPriority("background")||"",
      border:node.style.getPropertyValue("border")||"",
      borderPriority:node.style.getPropertyPriority("border")||"",
      boxShadow:node.style.getPropertyValue("box-shadow")||"",
      boxShadowPriority:node.style.getPropertyPriority("box-shadow")||"",
      visibility:node.style.getPropertyValue("visibility")||"",
      visibilityPriority:node.style.getPropertyPriority("visibility")||"",
      pointerEvents:node.style.getPropertyValue("pointer-events")||"",
      pointerEventsPriority:node.style.getPropertyPriority("pointer-events")||""
    });
  }
'''
s,n=re.subn(r'  function captureOriginal\(node\)\{.*?\n  \}\n(?=  function restoreNode)',capture,s,count=1,flags=re.S)
assert n==1

restore='''  function restoreNode(node){
    const o=originalStyles.get(node); if(!node||!o)return;
    if(o.translate)node.style.setProperty("translate",o.translate,o.translatePriority);else node.style.removeProperty("translate");
    if(o.scale)node.style.setProperty("scale",o.scale,o.scalePriority);else node.style.removeProperty("scale");
    if(o.opacity)node.style.setProperty("opacity",o.opacity,o.opacityPriority);else node.style.removeProperty("opacity");
    if(o.zIndex)node.style.setProperty("z-index",o.zIndex,o.zIndexPriority);else node.style.removeProperty("z-index");
    if(o.background)node.style.setProperty("background",o.background,o.backgroundPriority);else node.style.removeProperty("background");
    if(o.border)node.style.setProperty("border",o.border,o.borderPriority);else node.style.removeProperty("border");
    if(o.boxShadow)node.style.setProperty("box-shadow",o.boxShadow,o.boxShadowPriority);else node.style.removeProperty("box-shadow");
    if(o.visibility)node.style.setProperty("visibility",o.visibility,o.visibilityPriority);else node.style.removeProperty("visibility");
    if(o.pointerEvents)node.style.setProperty("pointer-events",o.pointerEvents,o.pointerEventsPriority);else node.style.removeProperty("pointer-events");
    node.removeAttribute("data-hv-universal-runtime-target");
  }
'''
s,n=re.subn(r'  function restoreNode\(node\)\{.*?\n  \}\n(?=  function isDevNode)',restore,s,count=1,flags=re.S)
assert n==1

apply='''  function applyStateToNode(node,selector,raw){
    if(!node||isDevNode(node))return;
    captureOriginal(node); touched.add(node);
    const state=normalizeState(raw),original=originalStyles.get(node)||{};
    node.dataset.hvUniversalRuntimeTarget=selector;
    if(state.x!==0||state.y!==0)node.style.setProperty("translate",state.x+"px "+state.y+"px","important");
    else if(original.translate)node.style.setProperty("translate",original.translate,original.translatePriority);else node.style.removeProperty("translate");
    if(state.sx!==100||state.sy!==100)node.style.setProperty("scale",(state.sx/100)+" "+(state.sy/100),"important");
    else if(original.scale)node.style.setProperty("scale",original.scale,original.scalePriority);else node.style.removeProperty("scale");
    if(state.opacity!==100)node.style.setProperty("opacity",String(state.opacity/100),"important");
    else if(original.opacity)node.style.setProperty("opacity",original.opacity,original.opacityPriority);else node.style.removeProperty("opacity");
    if(state.z!==0)node.style.setProperty("z-index",String(state.z),"important");
    else if(original.zIndex)node.style.setProperty("z-index",original.zIndex,original.zIndexPriority);else node.style.removeProperty("z-index");
    if(state.backgroundOff)node.style.setProperty("background","transparent","important");
    else if(original.background)node.style.setProperty("background",original.background,original.backgroundPriority);else node.style.removeProperty("background");
    if(state.borderOff)node.style.setProperty("border","0","important");
    else if(original.border)node.style.setProperty("border",original.border,original.borderPriority);else node.style.removeProperty("border");
    if(state.shadowOff)node.style.setProperty("box-shadow","none","important");
    else if(original.boxShadow)node.style.setProperty("box-shadow",original.boxShadow,original.boxShadowPriority);else node.style.removeProperty("box-shadow");
    if(state.hidden){
      node.style.setProperty("visibility","hidden","important");
      node.style.setProperty("pointer-events","none","important");
    }else{
      if(original.visibility)node.style.setProperty("visibility",original.visibility,original.visibilityPriority);else node.style.removeProperty("visibility");
      if(original.pointerEvents)node.style.setProperty("pointer-events",original.pointerEvents,original.pointerEventsPriority);else node.style.removeProperty("pointer-events");
    }
  }
'''
s,n=re.subn(r'  function applyStateToNode\(node,selector,raw\)\{.*?\n  \}\n(?=  function effectiveItems)',apply,s,count=1,flags=re.S)
assert n==1

s=s.replace("version:1,\n    getCanonical","version:2,\n    getCanonical",1)
wr(RUNTIME,s)

# DEV starts clean on top of the baked production layout, avoiding double transforms.
d=rd(HVDEV)
d=d.replace('hallvalla_universal_layout_dev_v4_force_1366','hallvalla_universal_layout_dev_v5_after_bake_1366')
d=d.replace('hallvalla_universal_layout_panel_v4_force_1366','hallvalla_universal_layout_panel_v5_after_bake_1366')
d=d.replace('CONTROL UNIVERSAL LIBRE v4 · 1366×636','CONTROL UNIVERSAL LIBRE v5 · 1366×636')
d=d.replace('DEV fuerza reglas !important · JSON canónico','BASE FIJA v185 · nuevos cambios quedan como delta DEV')
wr(HVDEV,d)

# Cache-bust changed runtime and editor.
runtime_hash=hashlib.sha256(RUNTIME.read_bytes()).hexdigest()[:12]
dev_hash=hashlib.sha256(HVDEV.read_bytes()).hexdigest()[:12]
l=rd(LOADER)
l=re.sub(r'("features/universal-layout-runtime\.js":")[0-9a-f]+(")',lambda m:m.group(1)+runtime_hash+m.group(2),l,count=1)
l=re.sub(r'("features/hvdev\.js":")[0-9a-f]+(")',lambda m:m.group(1)+dev_hash+m.group(2),l,count=1)
l=l.replace('20260918.184','20260918.185')
wr(LOADER,l)
loader_hash=hashlib.sha256(LOADER.read_bytes()).hexdigest()[:12]

st=rd(STAGE)
st=st.replace('20260918.184','20260918.185')
st=re.sub(r'bootstrap-loader\.js\?h=[0-9a-f]+','bootstrap-loader.js?h='+loader_hash,st,count=1)
st=st.replace('DEV universal libre v4','Layout 1366×636 fijado · DEV delta v5')
wr(STAGE,st)

ix=rd(INDEX)
ix=ix.replace('20260918.184','20260918.185')
ix=ix.replace('data-hv-shell="184"','data-hv-shell="185"')
ix=ix.replace("childUrl.searchParams.set('hvshell','184');","childUrl.searchParams.set('hvshell','185');")
wr(INDEX,ix)

sv=rd(SW)
sv=sv.replace('20260918.184','20260918.185').replace('runtime-v184','runtime-v185')
wr(SW,sv)

# Refresh repository checksum manifest for files changed by this bake.
if SUMS.exists():
    lines=SUMS.read_text(encoding="utf-8").splitlines()
    changed=[
      "web/js/features/universal-layout-runtime.js",
      "web/js/features/hvdev.js",
      "web/js/bootstrap-loader.js",
      "web/hallvalla-stage.html",
      "web/index.html",
      "web/service-worker.js"
    ]
    mapping={}
    for line in lines:
        m=re.match(r'^([0-9a-fA-F]{40,64})\s+\d+\s+(.+)$',line)
        if m:mapping[m.group(2)]=line
    for rel in changed:
        p=ROOT/rel
        sha=hashlib.sha256(p.read_bytes()).hexdigest()
        mapping[rel]=f"{sha} {p.stat().st_size} {rel}"
    ordered=[]
    seen=set()
    for line in lines:
        m=re.match(r'^[0-9a-fA-F]{40,64}\s+\d+\s+(.+)$',line)
        if not m:
            ordered.append(line); continue
        rel=m.group(1)
        if rel in mapping:
            ordered.append(mapping[rel]); seen.add(rel)
    for rel in changed:
        if rel not in seen: ordered.append(mapping[rel])
    SUMS.write_text("\n".join(ordered)+"\n",encoding="utf-8")

print("BAKED_LAYOUT_ITEMS",len(cfg["items"]))
print("RUNTIME_HASH",runtime_hash)
print("DEV_HASH",dev_hash)
print("LOADER_HASH",loader_hash)
