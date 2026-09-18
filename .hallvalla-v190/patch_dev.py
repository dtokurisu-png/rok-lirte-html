#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT=Path(sys.argv[1]).resolve()
HVDEV=ROOT/"web/js/features/hvdev.js"
dev=HVDEV.read_text(encoding="utf-8")

dev=dev.replace("hallvalla_universal_layout_dev_v5_after_bake_1366","hallvalla_universal_layout_dev_v7_singledeck_1366")
dev=dev.replace("hallvalla_universal_layout_panel_v5_after_bake_1366","hallvalla_universal_layout_panel_v7_singledeck_1366")
dev=dev.replace("CONTROL UNIVERSAL LIBRE v5 · 1366×636","CONTROL UNIVERSAL LIBRE v7 · 1366×636")
dev=dev.replace("BASE FIJA v185 · nuevos cambios quedan como delta DEV","BASE v190 · MAZO ÚNICO · SELECTORES ESTABLES")

old='''  function normalizePickNode(node){
    if(!node||isDevNode(node))return null;
    if(pickMode==="exact")return node;
    const interactive=node.closest?.('button,a[href],input,select,textarea,[role="button"],[onclick],[tabindex]:not([tabindex="-1"]),[data-action]');
    if(interactive&&!isDevNode(interactive))return interactive;
    return node;
  }'''
new='''  function normalizePickNode(node){
    if(!node||isDevNode(node))return null;
    if(pickMode==="exact")return node;
    const wholeCard=node.closest?.('.deck-mini-card');
    if(wholeCard&&!isDevNode(wholeCard))return wholeCard;
    const interactive=node.closest?.('button,a[href],input,select,textarea,[role="button"],[onclick],[tabindex]:not([tabindex="-1"]),[data-action]');
    if(interactive&&!isDevNode(interactive))return interactive;
    return node;
  }'''
if old not in dev:
    raise SystemExit("normalizePickNode block not found")
dev=dev.replace(old,new,1)

old="    const priority=['data-mine-panel','data-mine-nav','data-action','data-mode','data-view','data-slot-index','data-card-id','data-unit-id','data-adventure-node','data-id','data-key','data-draft-index'];"
new="    const priority=['data-mine-panel','data-mine-nav','data-action','data-mode','data-view','data-slot-index','data-card-id','data-unit-id','data-adventure-node','data-id','data-key','data-draft-index','data-deck-slot','data-deck-card-key','data-beast-tab','data-beast-season-seal'];"
if old not in dev:
    raise SystemExit("stable data priority not found")
dev=dev.replace(old,new,1)

old='''    const parent=node.parentElement;
    if(parent){const same=Array.from(parent.children).filter(child=>child.tagName===node.tagName);if(same.length>1)part+=`:nth-of-type(${same.indexOf(node)+1})`;}'''
new='''    const parent=node.parentElement;
    if(parent&&!data.length){
      const same=Array.from(parent.children).filter(child=>child.tagName===node.tagName);
      if(same.length>1)part+=`:nth-of-type(${same.indexOf(node)+1})`;
    }'''
if old not in dev:
    raise SystemExit("nth selector block not found")
dev=dev.replace(old,new,1)

old="  function onControls(){saveState({x:controlValue('#hvUniversalX'),y:controlValue('#hvUniversalY'),sx:controlValue('#hvUniversalSX'),sy:controlValue('#hvUniversalSY'),opacity:controlValue('#hvUniversalOpacity'),z:controlValue('#hvUniversalZ')});}"
new='''  function onControls(){saveState({x:controlValue('#hvUniversalX'),y:controlValue('#hvUniversalY'),sx:controlValue('#hvUniversalSX'),sy:controlValue('#hvUniversalSY'),opacity:controlValue('#hvUniversalOpacity'),z:controlValue('#hvUniversalZ')});}
  function onUniformScale(){
    const value=clamp(controlValue('#hvUniversalScale'),5,800);
    saveState({sx:value,sy:value});
  }'''
if old not in dev:
    raise SystemExit("onControls not found")
dev=dev.replace(old,new,1)

old="    set('#hvUniversalX',s.x);set('#hvUniversalY',s.y);set('#hvUniversalSX',s.sx);set('#hvUniversalSY',s.sy);set('#hvUniversalOpacity',s.opacity);set('#hvUniversalZ',s.z);"
new="    set('#hvUniversalX',s.x);set('#hvUniversalY',s.y);set('#hvUniversalSX',s.sx);set('#hvUniversalSY',s.sy);set('#hvUniversalScale',Math.round((s.sx+s.sy)/2));set('#hvUniversalOpacity',s.opacity);set('#hvUniversalZ',s.z);"
if old not in dev:
    raise SystemExit("syncPanel values not found")
dev=dev.replace(old,new,1)

old='''        <label>ANCHO VISUAL % <input id="hvUniversalSX" type="number" min="5" max="800" step="1"></label>
        <label>ALTO VISUAL % <input id="hvUniversalSY" type="number" min="5" max="800" step="1"></label>'''
new='''        <label>TAMAÑO GENERAL % <input id="hvUniversalScale" type="number" min="5" max="800" step="1" value="100"></label>
        <label>ESCALA X % <input id="hvUniversalSX" type="number" min="5" max="800" step="1"></label>
        <label>ESCALA Y % <input id="hvUniversalSY" type="number" min="5" max="800" step="1"></label>'''
if old not in dev:
    raise SystemExit("scale input markup not found")
dev=dev.replace(old,new,1)

old="    ['#hvUniversalX','#hvUniversalY','#hvUniversalSX','#hvUniversalSY','#hvUniversalOpacity','#hvUniversalZ'].forEach(id=>$(id,panel).addEventListener('input',onControls));"
new='''    ['#hvUniversalX','#hvUniversalY','#hvUniversalSX','#hvUniversalSY','#hvUniversalOpacity','#hvUniversalZ'].forEach(id=>$(id,panel).addEventListener('input',onControls));
    $('#hvUniversalScale',panel).addEventListener('input',onUniformScale);'''
if old not in dev:
    raise SystemExit("control listeners not found")
dev=dev.replace(old,new,1)

dev=dev.replace(
"return JSON.stringify({version:4,designStage:{width:DESIGN_W,height:DESIGN_H,mode:'fixed'},units:'design-px',editor:'free-drag-v4-force-important',items:config.items},null,2);",
"return JSON.stringify({version:7,designStage:{width:DESIGN_W,height:DESIGN_H,mode:'fixed'},units:'design-px',editor:'single-deck-stable-smart-scale-v190',items:config.items},null,2);"
)

HVDEV.write_text(dev,encoding="utf-8")
print("universal control patched")
