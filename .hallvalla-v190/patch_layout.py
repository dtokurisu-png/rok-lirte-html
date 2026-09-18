#!/usr/bin/env python3
from pathlib import Path
import json,re,sys

ROOT=Path(sys.argv[1]).resolve()
USERBASE=Path(sys.argv[2]).resolve()
WEB=ROOT/"web"
RUNTIME=WEB/"js/features/universal-layout-runtime.js"
STAGE=WEB/"hallvalla-stage.html"
FORGEJS=WEB/"js/parts/13-collection-deck-forge.js"

def rd(p): return p.read_text(encoding="utf-8")
def wr(p,s): p.write_text(s,encoding="utf-8")

src=rd(USERBASE/"web/js/features/universal-layout-runtime.js")
m=re.search(r'const CANONICAL_CONFIG=(\{.*?\});\n',src,re.S)
if not m:
    raise SystemExit("approved user canonical config not found")
user_cfg=json.loads(m.group(1))

items={}
for sel,state in user_cfg.get("items",{}).items():
    if "data-deck-card-key=" in sel: continue
    if "data-draft-index=" in sel: continue
    if "#currentDeckList" in sel: continue
    if "#deckExtraSlots" in sel: continue
    items[sel]=state

if "#closeDeckBuilderBtn" not in items:
    raise SystemExit("approved Back button layout missing")
beast_count=sum(1 for k in items if "beast" in k)
if beast_count < 4:
    raise SystemExit("Beast/event calibrated entries missing")

runtime=rd(RUNTIME)
cm=re.search(r'const CANONICAL_CONFIG=(\{.*?\});\n',runtime,re.S)
if not cm:
    raise SystemExit("current canonical config not found")
new_cfg={
    "version":9,
    "designStage":{"width":1366,"height":636,"mode":"fixed"},
    "units":"design-px",
    "editor":"single-deck-container-uniform-portraits-v190",
    "items":items
}
runtime=runtime[:cm.start(1)]+json.dumps(new_cfg,ensure_ascii=False,separators=(",",":"))+runtime[cm.end(1):]
runtime=runtime.replace("Universal Layout Runtime v5","Universal Layout Runtime v7")
runtime=runtime.replace("Universal Layout Runtime v6","Universal Layout Runtime v7")
wr(RUNTIME,runtime)

stage=rd(STAGE)
old='<div id="currentDeckList" class="current-deck-list"></div>\n        <div id="deckExtraSlots" class="deck-extra-slots" aria-label="Espacios 21 a 30 del mazo"></div>'
new='<div id="currentDeckList" class="current-deck-list" aria-label="Mazo completo de 30 cartas"></div>'
if old not in stage:
    raise SystemExit("two-container deck markup not found")
stage=stage.replace(old,new,1)
wr(STAGE,stage)

js=rd(FORGEJS)
replacements=[
(
'const collectionGrid=$("deckCollectionGrid"),deckList=$("currentDeckList"),extraSlotsEl=$("deckExtraSlots");\n  if(!collectionGrid||!deckList||!extraSlotsEl)return;',
'const collectionGrid=$("deckCollectionGrid"),deckList=$("currentDeckList");\n  if(!collectionGrid||!deckList)return;'
),
(
'  deckList.classList.add("hv-mini-deck");',
'  deckList.classList.add("hv-mini-deck","is-single-30");'
),
(
'''  if(browseOnly){
    deckList.innerHTML="";
    extraSlotsEl.innerHTML="";
    bindDeckBuilderDragAndClick(collectionGrid,deckList,extraSlotsEl);''',
'''  if(browseOnly){
    deckList.innerHTML="";
    bindDeckBuilderDragAndClick(collectionGrid,deckList);'''
),
(
'''  deckList.innerHTML=slotHtml.slice(0,20).join("");
  extraSlotsEl.innerHTML=slotHtml.slice(20,30).join("");
  bindDeckBuilderDragAndClick(collectionGrid,deckList,extraSlotsEl);''',
'''  deckList.innerHTML=slotHtml.slice(0,30).join("");
  bindDeckBuilderDragAndClick(collectionGrid,deckList);'''
),
(
'''  const collectionGrid=$("deckCollectionGrid"),deckList=$("currentDeckList"),extraSlots=$("deckExtraSlots"),materialPanel=$("craftMaterialPanel");
  collectionGrid?.replaceChildren();
  deckList?.replaceChildren();
  extraSlots?.replaceChildren();''',
'''  const collectionGrid=$("deckCollectionGrid"),deckList=$("currentDeckList"),materialPanel=$("craftMaterialPanel");
  collectionGrid?.replaceChildren();
  deckList?.replaceChildren();'''
),
(
'''  setDeckBuilderDropActive($("deckCollectionGrid"),false);
  setDeckBuilderDropActive($("currentDeckList"),false);
  setDeckBuilderDropActive($("deckExtraSlots"),false);''',
'''  setDeckBuilderDropActive($("deckCollectionGrid"),false);
  setDeckBuilderDropActive($("currentDeckList"),false);'''
)
]
for old,new in replacements:
    if old not in js:
        raise SystemExit("Forge JS replacement missing: "+old[:70])
    js=js.replace(old,new,1)

if "deckExtraSlots" in js:
    raise SystemExit("deckExtraSlots still referenced in Forge JS")
wr(FORGEJS,js)

print("layout patched",len(items),"canonical items; beast",beast_count)
