#!/usr/bin/env python3
from pathlib import Path
import hashlib,re,sys

root=Path(sys.argv[1]).resolve()
web=root/"web"
hv=web/"js/features/hvdev.js"
loader=web/"js/bootstrap-loader.js"
stage=web/"hallvalla-stage.html"
index=web/"index.html"
sw=web/"service-worker.js"

def read(p): return p.read_text(encoding="utf-8")
def write(p,s): p.write_text(s,encoding="utf-8")

s=read(hv)
s=s.replace('const STORAGE_KEY="hallvalla_universal_layout_dev_v3_free_1366";','const STORAGE_KEY="hallvalla_universal_layout_dev_v4_force_1366";')
s=s.replace('const PANEL_KEY="hallvalla_universal_layout_panel_v3_free_1366";','const PANEL_KEY="hallvalla_universal_layout_panel_v4_force_1366";')
s=s.replace('let config={version:3,items:{}};','let config={version:4,items:{}};',1)
s=s.replace('config={version:3,items:{...raw.items}}','config={version:4,items:{...raw.items}}')
s=s.replace('config={version:3,items:{}};writeConfig()','config={version:4,items:{}};writeConfig()')
s=s.replace("version:3,designStage:{width:DESIGN_W,height:DESIGN_H,mode:'fixed'},units:'design-px',editor:'free-drag-v3'","version:4,designStage:{width:DESIGN_W,height:DESIGN_H,mode:'fixed'},units:'design-px',editor:'free-drag-v4-force-important'")

old_capture="""    originalStyles.set(node,{
      translate:node.style.translate||"",
      scale:node.style.scale||"",
      opacity:node.style.opacity||"",
      zIndex:node.style.zIndex||"",
      background:node.style.getPropertyValue('background')||"",
      backgroundPriority:node.style.getPropertyPriority('background')||"",
      border:node.style.getPropertyValue('border')||"",
      borderPriority:node.style.getPropertyPriority('border')||"",
      boxShadow:node.style.getPropertyValue('box-shadow')||"",
      boxShadowPriority:node.style.getPropertyPriority('box-shadow')||"",
      visibility:node.style.visibility||"",
      pointerEvents:node.style.pointerEvents||""
    });"""
new_capture="""    originalStyles.set(node,{
      translate:node.style.getPropertyValue('translate')||"",
      translatePriority:node.style.getPropertyPriority('translate')||"",
      scale:node.style.getPropertyValue('scale')||"",
      scalePriority:node.style.getPropertyPriority('scale')||"",
      opacity:node.style.getPropertyValue('opacity')||"",
      opacityPriority:node.style.getPropertyPriority('opacity')||"",
      zIndex:node.style.getPropertyValue('z-index')||"",
      zIndexPriority:node.style.getPropertyPriority('z-index')||"",
      background:node.style.getPropertyValue('background')||"",
      backgroundPriority:node.style.getPropertyPriority('background')||"",
      border:node.style.getPropertyValue('border')||"",
      borderPriority:node.style.getPropertyPriority('border')||"",
      boxShadow:node.style.getPropertyValue('box-shadow')||"",
      boxShadowPriority:node.style.getPropertyPriority('box-shadow')||"",
      visibility:node.style.getPropertyValue('visibility')||"",
      visibilityPriority:node.style.getPropertyPriority('visibility')||"",
      pointerEvents:node.style.getPropertyValue('pointer-events')||"",
      pointerEventsPriority:node.style.getPropertyPriority('pointer-events')||""
    });"""
if old_capture not in s: raise SystemExit("capture pattern missing")
s=s.replace(old_capture,new_capture,1)

old_restore="""    node.style.translate=o.translate;node.style.scale=o.scale;node.style.opacity=o.opacity;node.style.zIndex=o.zIndex;
    if(o.background)node.style.setProperty('background',o.background,o.backgroundPriority);else node.style.removeProperty('background');
    if(o.border)node.style.setProperty('border',o.border,o.borderPriority);else node.style.removeProperty('border');
    if(o.boxShadow)node.style.setProperty('box-shadow',o.boxShadow,o.boxShadowPriority);else node.style.removeProperty('box-shadow');
    node.style.visibility=o.visibility;node.style.pointerEvents=o.pointerEvents;"""
new_restore="""    if(o.translate)node.style.setProperty('translate',o.translate,o.translatePriority);else node.style.removeProperty('translate');
    if(o.scale)node.style.setProperty('scale',o.scale,o.scalePriority);else node.style.removeProperty('scale');
    if(o.opacity)node.style.setProperty('opacity',o.opacity,o.opacityPriority);else node.style.removeProperty('opacity');
    if(o.zIndex)node.style.setProperty('z-index',o.zIndex,o.zIndexPriority);else node.style.removeProperty('z-index');
    if(o.background)node.style.setProperty('background',o.background,o.backgroundPriority);else node.style.removeProperty('background');
    if(o.border)node.style.setProperty('border',o.border,o.borderPriority);else node.style.removeProperty('border');
    if(o.boxShadow)node.style.setProperty('box-shadow',o.boxShadow,o.boxShadowPriority);else node.style.removeProperty('box-shadow');
    if(o.visibility)node.style.setProperty('visibility',o.visibility,o.visibilityPriority);else node.style.removeProperty('visibility');
    if(o.pointerEvents)node.style.setProperty('pointer-events',o.pointerEvents,o.pointerEventsPriority);else node.style.removeProperty('pointer-events');"""
if old_restore not in s: raise SystemExit("restore pattern missing")
s=s.replace(old_restore,new_restore,1)

pattern=r"""    const o=originalStyles\.get\(node\)\|\|\{\};
    node\.style\.translate=.*?
    if\(state\.hidden\).*?\}\n"""
replacement="""    const o=originalStyles.get(node)||{};
    if(state.x!==0||state.y!==0)node.style.setProperty('translate',state.x+'px '+state.y+'px','important');
    else if(o.translate)node.style.setProperty('translate',o.translate,o.translatePriority);else node.style.removeProperty('translate');
    if(state.sx!==100||state.sy!==100)node.style.setProperty('scale',(state.sx/100)+' '+(state.sy/100),'important');
    else if(o.scale)node.style.setProperty('scale',o.scale,o.scalePriority);else node.style.removeProperty('scale');
    if(state.opacity!==100)node.style.setProperty('opacity',String(state.opacity/100),'important');
    else if(o.opacity)node.style.setProperty('opacity',o.opacity,o.opacityPriority);else node.style.removeProperty('opacity');
    if(state.z!==0)node.style.setProperty('z-index',String(state.z),'important');
    else if(o.zIndex)node.style.setProperty('z-index',o.zIndex,o.zIndexPriority);else node.style.removeProperty('z-index');
    if(state.backgroundOff)node.style.setProperty('background','transparent','important');else if(o.background)node.style.setProperty('background',o.background,o.backgroundPriority);else node.style.removeProperty('background');
    if(state.borderOff)node.style.setProperty('border','0','important');else if(o.border)node.style.setProperty('border',o.border,o.borderPriority);else node.style.removeProperty('border');
    if(state.shadowOff)node.style.setProperty('box-shadow','none','important');else if(o.boxShadow)node.style.setProperty('box-shadow',o.boxShadow,o.boxShadowPriority);else node.style.removeProperty('box-shadow');
    if(state.hidden){node.style.setProperty('visibility','hidden','important');node.style.setProperty('pointer-events','none','important');}
    else{
      if(o.visibility)node.style.setProperty('visibility',o.visibility,o.visibilityPriority);else node.style.removeProperty('visibility');
      if(o.pointerEvents)node.style.setProperty('pointer-events',o.pointerEvents,o.pointerEventsPriority);else node.style.removeProperty('pointer-events');
    }
"""
s2,n=re.subn(pattern,replacement,s,count=1,flags=re.S)
if n!=1: raise SystemExit("applyState pattern missing")
s=s2

s=s.replace("CONTROL UNIVERSAL LIBRE · 1366×636","CONTROL UNIVERSAL LIBRE v4 · 1366×636")
s=s.replace("Selecciona y arrastra directamente · JSON canónico","DEV fuerza reglas !important · JSON canónico")
s=s.replace("MOVER ES LIBRE: arrastra el elemento seleccionado. Si lo sueltas totalmente fuera, queda una franja recuperable.","MOVER ES LIBRE: DEV fuerza posición/tamaño incluso sobre reglas !important del juego.")
write(hv,s)

h=hashlib.sha256(hv.read_bytes()).hexdigest()[:12]
ls=read(loader)
ls=re.sub(r'("features/hvdev\.js":")[0-9a-f]+(")',lambda m:m.group(1)+h+m.group(2),ls,count=1)
ls=ls.replace('const BUILD = "20260918.182";','const BUILD = "20260918.184";')
write(loader,ls)
loader_h=hashlib.sha256(loader.read_bytes()).hexdigest()[:12]

st=read(stage)
st=re.sub(r'bootstrap-loader\.js\?h=[0-9a-f]+','bootstrap-loader.js?h='+loader_h,st,count=1)
st=st.replace('20260918.183','20260918.184')
st=st.replace('DEV universal libre · 20260918.184','DEV universal libre v4 · 20260918.184')
write(stage,st)

ix=read(index)
ix=ix.replace('data-hv-shell="183"','data-hv-shell="184"')
ix=ix.replace('20260918.183','20260918.184')
ix=ix.replace("childUrl.searchParams.set('hvshell','183');","childUrl.searchParams.set('hvshell','184');")
write(index,ix)

sv=read(sw)
sv=sv.replace('20260918.183','20260918.184').replace('20260918.182','20260918.184')
sv=sv.replace('runtime-v183','runtime-v184').replace('runtime-v182','runtime-v184')
write(sw,sv)
print("patched v184",h,loader_h)
