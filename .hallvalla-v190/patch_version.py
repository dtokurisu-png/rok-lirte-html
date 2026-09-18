#!/usr/bin/env python3
from pathlib import Path
import hashlib,re,sys

ROOT=Path(sys.argv[1]).resolve()
WEB=ROOT/"web"
LOADER=WEB/"js/bootstrap-loader.js"
STAGE=WEB/"hallvalla-stage.html"
INDEX=WEB/"index.html"
SW=WEB/"service-worker.js"
CSS=WEB/"styles.css"

def rd(p): return p.read_text(encoding="utf-8")
def wr(p,s): p.write_text(s,encoding="utf-8")
def sha12(p): return hashlib.sha256(p.read_bytes()).hexdigest()[:12]

loader=rd(LOADER)
for rel in ["features/universal-layout-runtime.js","features/hvdev.js","parts/13-collection-deck-forge.js"]:
    h=sha12(WEB/"js"/rel)
    loader=re.sub(r'("'+re.escape(rel)+r'":")[0-9a-f]+(")',lambda m:m.group(1)+h+m.group(2),loader,count=1)
loader=re.sub(r'const BUILD = "20260918\.\d+";','const BUILD = "20260918.190";',loader,count=1)
wr(LOADER,loader)
loader_hash=sha12(LOADER)

stage=rd(STAGE)
stage=re.sub(r'20260918\.\d+','20260918.190',stage)
stage=re.sub(r'bootstrap-loader\.js\?h=[0-9a-f]+','bootstrap-loader.js?h='+loader_hash,stage,count=1)
stage=re.sub(r'styles\.css\?h=[0-9a-f]+','styles.css?h='+sha12(CSS),stage,count=1)
stage=re.sub(r'content="Design Stage fijo 1366×636 · [^"]*"','content="Design Stage fijo 1366×636 · v190 mazo unico 30 · portraits uniformes"',stage,count=1)
wr(STAGE,stage)

idx=rd(INDEX)
idx=re.sub(r'data-hv-shell="\d+"','data-hv-shell="190"',idx,count=1)
idx=re.sub(r'20260918\.\d+','20260918.190',idx)
idx=re.sub(r"childUrl\.searchParams\.set\('hvshell','\d+'\);","childUrl.searchParams.set('hvshell','190');",idx,count=1)
wr(INDEX,idx)

sw=rd(SW)
sw=re.sub(r'20260918\.\d+','20260918.190',sw)
sw=re.sub(r'hallvalla-runtime-v\d+','hallvalla-runtime-v190',sw,count=1)
wr(SW,sw)

(ROOT/"docs/FIX_FORGE_v190.md").write_text("""# HallValla v190 - Forja simplificada

- Un solo contenedor de mazo: currentDeckList.
- 30 slots en una cuadricula 5x6.
- deckExtraSlots eliminado del HTML, JS, CSS y runtime.
- Portraits de cartas uniformes dentro de Coleccion y Mazo.
- SMART selecciona la carta completa.
- Nuevo TAMANO GENERAL % escala X/Y a la vez.
- ESCALA X / ESCALA Y siguen disponibles.
- Selectores data-* estables ya no reciben nth-of-type.
- Boton Volver y Beast Master/evento se preservan.
- Offsets por carta capturados por el control defectuoso anterior no se bakean.
""",encoding="utf-8")

print("version/cache updated",loader_hash)
