#!/usr/bin/env python3
from pathlib import Path
import re,sys

ROOT=Path(sys.argv[1]).resolve()
CSS=ROOT/"web/styles.css"
css=CSS.read_text(encoding="utf-8")

leaf=re.compile(r'([^{}]+)\{([^{}]*)\}',re.S)
removed=0
for _ in range(12):
    changed=[0]
    def drop(m):
        head=m.group(1)
        if "#deckExtraSlots" in head or ".deck-extra-slots" in head or "#currentDeckList" in head:
            changed[0]+=1
            return ""
        return m.group(0)
    nxt=leaf.sub(drop,css)
    removed+=changed[0]
    if nxt==css:
        break
    css=nxt

css=re.sub(r'/\*\s*Slots 21–30:.*?\*/','',css,flags=re.S)

canonical=r'''
/* ==========================================================================
   FORGE-V190 · MAZO ÚNICO 30 + PORTRAITS UNIFORMES
   currentDeckList es el único contenedor físico del mazo.
   ========================================================================== */
#deckBuilderPanel.hv-forge-collection-v2 #currentDeckList.current-deck-list.hv-mini-deck{
  position:absolute !important;
  z-index:130 !important;
  left:5.7% !important;
  right:5.4% !important;
  top:7.2% !important;
  bottom:2.8% !important;
  width:auto !important;
  height:auto !important;
  min-height:0 !important;
  padding:0 !important;
  margin:0 !important;
  display:grid !important;
  grid-template-columns:repeat(5,minmax(0,1fr)) !important;
  grid-template-rows:repeat(6,minmax(0,1fr)) !important;
  grid-auto-rows:minmax(0,1fr) !important;
  gap:2.0% 2.15% !important;
  overflow:visible !important;
  align-items:center !important;
  justify-items:center !important;
  isolation:isolate !important;
  visibility:visible !important;
  opacity:1 !important;
  pointer-events:auto !important;
}

#deckBuilderPanel.hv-forge-collection-v2 #currentDeckList > .deck-mini-card,
#deckBuilderPanel.hv-forge-collection-v2 #currentDeckList > .deck-empty-slot{
  position:relative !important;
  width:84% !important;
  height:92% !important;
  min-width:0 !important;
  min-height:0 !important;
  margin:0 !important;
  padding:0 !important;
  justify-self:center !important;
  align-self:center !important;
  overflow:visible !important;
  border:0 !important;
  border-radius:0 !important;
  background:transparent !important;
  box-shadow:none !important;
  visibility:visible !important;
  opacity:1 !important;
}

#deckBuilderPanel.hv-forge-collection-v2 #currentDeckList > .deck-empty-slot span{
  display:none !important;
}

#deckBuilderPanel.hv-forge-collection-v2 #currentDeckList .deck-mini-card.in-deck{
  display:block !important;
  z-index:140 !important;
  filter:none !important;
}

/* Portrait uniforme: mismo marco y ocupación para todas las cartas. */
#deckBuilderPanel.hv-forge-collection-v2 #currentDeckList .deck-mini-art,
#deckBuilderPanel.hv-forge-collection-v2 #deckCollectionGrid .deck-mini-art{
  position:absolute !important;
  inset:0 !important;
  width:100% !important;
  height:100% !important;
  overflow:hidden !important;
  border:0 !important;
  background:transparent !important;
}

#deckBuilderPanel.hv-forge-collection-v2 #currentDeckList .deck-mini-art img,
#deckBuilderPanel.hv-forge-collection-v2 #deckCollectionGrid .deck-mini-art img{
  display:block !important;
  width:100% !important;
  height:100% !important;
  min-width:100% !important;
  min-height:100% !important;
  max-width:none !important;
  max-height:none !important;
  object-fit:cover !important;
  object-position:center center !important;
  visibility:visible !important;
  opacity:1 !important;
}

#deckBuilderPanel.hv-forge-collection-v2 #currentDeckList .deck-mini-card.card-type-unit .deck-mini-art img,
#deckBuilderPanel.hv-forge-collection-v2 #deckCollectionGrid .deck-mini-card.card-type-unit .deck-mini-art img{
  object-position:center 18% !important;
}

/* Colección: las 15 celdas usan también una caja uniforme. */
#deckBuilderPanel.hv-forge-collection-v2 #deckCollectionGrid.deck-card-grid.hv-mini-gallery.is-paged > .deck-mini-card{
  width:84% !important;
  height:92% !important;
  min-width:0 !important;
  min-height:0 !important;
  justify-self:center !important;
  align-self:center !important;
}
'''

css=css.rstrip()+"\n\n"+canonical.strip()+"\n"
CSS.write_text(css,encoding="utf-8")
print("css patched; old deck-specific rules removed:",removed)
