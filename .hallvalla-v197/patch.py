#!/usr/bin/env python3
from pathlib import Path
import hashlib,re,sys

ROOT=Path(sys.argv[1]).resolve()
WEB=ROOT/'web'
PVP=WEB/'js/features/pvp/index.js'
LOADER=WEB/'js/bootstrap-loader.js'
STAGE=WEB/'hallvalla-stage.html'
INDEX=WEB/'index.html'
SW=WEB/'service-worker.js'

def rd(p): return p.read_text(encoding='utf-8')
def wr(p,s): p.write_text(s,encoding='utf-8')
def sha12(p): return hashlib.sha256(p.read_bytes()).hexdigest()[:12]

pvp=rd(PVP)

replacements=[
  ('function getPvpBotPublicName(profile){return `${String(profile?.name||"Guerrero")} · BOT`;}', 'function getPvpBotPublicName(profile){return String(profile?.name||"Guerrero");}'),
  ('setMatchmakingSearchText("PREPARANDO RIVAL BOT...");','setMatchmakingSearchText("BUSCANDO RIVAL...");'),
  ('setMatchmakingSearchText("REINTENTANDO BOT...");','setMatchmakingSearchText("BUSCANDO RIVAL...");'),
  ('setMatchmakingSearchText("BOT NO DISPONIBLE · REINTENTA");','setMatchmakingSearchText("NO SE ENCONTRÓ RIVAL · REINTENTA");'),
  ('setMatchmakingSearchText("RIVAL HUMANO DETECTADO...");','setMatchmakingSearchText("RIVAL ENCONTRADO...");'),
  ('setMatchmakingSearchText("RIVAL BOT ENCONTRADO");','setMatchmakingSearchText("BUSCANDO RIVAL...");'),
  ('setMatchmakingSearchText("BOT NO INICIÓ · REINTENTANDO");','setMatchmakingSearchText("BUSCANDO RIVAL...");'),
  ('setText("pvpRoomMessage","Rival BOT no inició: "+String(error?.message||error)+". Reintentando...");','setText("pvpRoomMessage","No se pudo preparar el rival. Reintentando...");'),
  ('adventureAiStyle:`BOT PvP · ${String(profile.style||"balanced")} · Liga ${String(league?.name||"Piedra")}`,','adventureAiStyle:`Rival PvP · ${String(profile.style||"balanced")} · Liga ${String(league?.name||"Piedra")}`,'),
  ('log:[`PvP de Liga ${String(league?.name||"Piedra")}: ${botName} cubre la plaza mientras no hay otro jugador disponible.`,`El resultado cuenta para tus puntos PvP; el BOT no ocupa puestos del ranking.`].slice(0,18)',
   'log:[`PvP de Liga ${String(league?.name||"Piedra")}: duelo iniciado contra ${botName}.`,`El resultado cuenta para tus puntos PvP.`].slice(0,18)'),
  ('mark(`BOT PvP listo · ${botName} · Liga ${String(league?.name||"Piedra")}.`);','mark(`Rival encontrado · ${botName} · Liga ${String(league?.name||"Piedra")}.`);'),
  ('mark(`Buscando rival de Liga ${randomLeagueSnapshot?.name||"Piedra"}... sala preparada · BOT de respaldo en ${Math.round(PVP_BOT_FALLBACK_MS/1000)} s.`);',
   'mark(`Buscando rival de Liga ${randomLeagueSnapshot?.name||"Piedra"}...`);')
]
for old,new in replacements:
    if old not in pvp:
        raise SystemExit('missing stealth anchor: '+old[:120])
    pvp=pvp.replace(old,new)

# Only reveal a generic rival-found state after the bot room is actually confirmed.
anchor='''      if(!confirm.exists()||confirm.val()?.pvpBotMatch!==true||String(confirm.val()?.playerSlots?.player2Uid||"")!==botUid)throw new Error("Firebase no confirmó el duelo contra BOT.");\n\n      clearRandomMatchTimer();'''
replacement='''      if(!confirm.exists()||confirm.val()?.pvpBotMatch!==true||String(confirm.val()?.playerSlots?.player2Uid||"")!==botUid)throw new Error("Firebase no confirmó el duelo contra BOT.");\n      setMatchmakingSearchText("RIVAL ENCONTRADO");\n\n      clearRandomMatchTimer();'''
if anchor not in pvp: raise SystemExit('confirm rival anchor missing')
pvp=pvp.replace(anchor,replacement,1)

# Player-facing UI strings must not disclose automated opposition.
visible_forbidden=[
    'PREPARANDO RIVAL BOT',
    'REINTENTANDO BOT',
    'BOT NO DISPONIBLE',
    'RIVAL BOT ENCONTRADO',
    'BOT de respaldo',
    'Rival BOT no inició',
    ' · BOT`'
]
for token in visible_forbidden:
    if token in pvp:
        raise SystemExit('player-facing BOT disclosure remains: '+token)

wr(PVP,pvp)

loader=rd(LOADER)
loader=re.sub(r'const BUILD = "[^"]+";','const BUILD = "20260919.197";',loader,count=1)
h=sha12(PVP)
pat=r'("features/pvp/index.js":")[0-9a-f]+(")'
if not re.search(pat,loader): raise SystemExit('pvp hash missing')
loader=re.sub(pat,lambda m:m.group(1)+h+m.group(2),loader,count=1)
wr(LOADER,loader)
loader_hash=sha12(LOADER)

stage=rd(STAGE)
stage=re.sub(r'20260919\.\d+','20260919.197',stage)
stage=re.sub(r'bootstrap-loader\.js\?h=[0-9a-f]+','bootstrap-loader.js?h='+loader_hash,stage,count=1)
wr(STAGE,stage)

idx=rd(INDEX)
idx=re.sub(r'data-hv-shell="\d+"','data-hv-shell="197"',idx,count=1)
idx=re.sub(r'20260919\.\d+','20260919.197',idx)
idx=re.sub(r"childUrl\.searchParams\.set\('hvshell','\d+'\);","childUrl.searchParams.set('hvshell','197');",idx,count=1)
wr(INDEX,idx)

sw=rd(SW)
sw=re.sub(r'20260919\.\d+','20260919.197',sw)
sw=re.sub(r'hallvalla-runtime-v\d+','hallvalla-runtime-v197',sw,count=1)
wr(SW,sw)

doc=ROOT/'docs/PVP_RIVAL_TRANSPARENTE_v197.md'
doc.write_text('''# HallValla v197 - Rival transparente\n\nEl sistema puede usar un rival automatizado cuando no encuentra otro jugador, pero la experiencia normal no lo anuncia.\n\nUI de matchmaking:\n- BUSCANDO RIVAL...\n- RIVAL ENCONTRADO\n\nNo se muestran etiquetas BOT, mensajes de fallback, reintentos BOT ni nombres con sufijo BOT.\nLa identificación interna sigue existiendo únicamente para reglas, resultados, exclusión del ranking y depuración.\n''',encoding='utf-8')

print('v197 stealth ready')
print('pvp',sha12(PVP))
print('loader',loader_hash)
