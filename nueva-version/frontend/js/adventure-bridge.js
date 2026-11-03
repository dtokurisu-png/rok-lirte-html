/* Conector minimo a R.O.K. Lite. No modifica sus vistas, reglas ni modales.
   El viejo flujo entrega el payload original al terminar el VS 3-2-1. */
(function () {
  'use strict';
  const TARGET = new URL('nueva-version/frontend/arena.html', document.baseURI);
  const ORIGIN = window.location.origin;
  let overlay = null, frame = null, loading = null, frameReady = false;
  let waiting = null, prepared = false, errorTimer = null;
  let priorFocus = null, priorOverflow = '';
  const intro = () => document.getElementById('adventureBattleIntro');
  const closeIntro = () => {
    const node = intro();
    if (!node) return;
    node.classList.remove('active', 'counting', 'combat-ready');
    node.setAttribute('aria-hidden', 'true');
  };
  const send = (type, payload) => {
    if (!frameReady || !frame?.contentWindow) return false;
    frame.contentWindow.postMessage({type, payload}, ORIGIN);
    return true;
  };
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = new URL('nueva-version/frontend/css/adventure-bridge.css', document.baseURI).href;
  document.head.appendChild(style);
  function ensureFrame() {
    if (frame) return;
    overlay = document.createElement('section');
    overlay.id = 'rokAdventure3dOverlay';
    overlay.setAttribute('aria-label', 'Arena de Aventura R.O.K.');
    overlay.setAttribute('aria-hidden', 'true');
    const loadingBox = document.createElement('div');
    loadingBox.className = 'rok-adventure-transfer';
    loading = document.createElement('p');
    loading.textContent = 'Preparando escenario tridimensional…';
    loadingBox.appendChild(loading);
    const back = document.createElement('button');
    back.type = 'button';
    back.textContent = 'Volver a preparación';
    back.addEventListener('click', exitArena);
    loadingBox.appendChild(back);
    overlay.appendChild(loadingBox);
    frame = document.createElement('iframe');
    frame.title = 'Arena tridimensional de R.O.K. Aventura';
    frame.id = 'rokAdventure3dFrame';
    frame.setAttribute('allow', 'fullscreen');
    frame.setAttribute('loading', 'eager');
    frame.addEventListener('load', () => send('rok:arena:ping'));
    frame.addEventListener('error', () => {
      if (loading) loading.textContent = 'No se pudo abrir el escenario 3D.';
    });
    overlay.appendChild(frame);
    document.body.appendChild(overlay);
    frame.src = TARGET.href;
  }
  function preload() {
    if (!prepared) {
      prepared = true;
      ensureFrame();
    }
    send('rok:arena:preload');
  }
  function enterArena() {
    ensureFrame();
    priorFocus = document.activeElement;
    priorOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeIntro();
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    if (loading) loading.textContent = 'Preparando el escenario seleccionado…';
    if (errorTimer) clearTimeout(errorTimer);
    errorTimer = window.setTimeout(() => {
      if (!frameReady && loading)
        loading.textContent = 'La carga está tardando. Puedes volver a la preparación.';
    }, 12000);
    if (frameReady && waiting) {
      send('rok:arena:start', waiting);
    }
  }
  function exitArena() {
    if (errorTimer) {clearTimeout(errorTimer);errorTimer = null;}
    if (!overlay) return;
    overlay.classList.remove('is-open', 'is-ready');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = priorOverflow;
    closeIntro();
    send('rok:arena:reset');
    waiting = null;
    if (priorFocus?.isConnected && typeof priorFocus.focus === 'function') priorFocus.focus();
    else document.getElementById('adventureCombatBtn')?.focus();
  }
  function translatePayload(payload) {
    if (!payload || payload.mode !== 'adventure' || typeof payload.encounterId !== 'string') return null;
    const safe = value => String(value || '').slice(0, 140);
    let arenaImage = '';
    try {
      const url = new URL(payload.arena?.image || 'assets/images/arenas/backgrounds/arena.webp', document.baseURI);
      if (url.origin === ORIGIN && /^https?:$/.test(url.protocol)) arenaImage = url.href;
    } catch (_) {}
    const chosen=Array.isArray(payload.playerSpellbookCardIds) ?
      payload.playerSpellbookCardIds.filter(id=>typeof id==='string').slice(0,30) : [];
    // CARD_LIBRARY pertenece al juego original, ya cargado antes de este script.
    // Se usan sus fichas solo para el HUD; nunca como reglas autoritativas.
    const cardLibrary=typeof CARD_LIBRARY!=='undefined' ? CARD_LIBRARY : {};
    const cards=chosen.map(id=>{
      const card=cardLibrary[id];
      const rawImage=card?.tokenImage||card?.artImage||'';
      let image='';
      try{
        if(rawImage){
          const url=new URL(rawImage,document.baseURI);
          if(url.origin===ORIGIN && /^https?:$/.test(url.protocol))image=url.href;
        }
      }catch(_){}
      return {id:safe(id),name:safe(card?.shortName||card?.name||id),image,
        type:safe(card?.type||'')};
    });
    return {
      playerSpellbookCards:cards,
      encounterId: safe(payload.encounterId),
      playerName: safe(payload.playerCaster?.label || 'Lioren'),
      rivalName: safe(payload.rivalCaster?.label || 'Kiara'),
      arenaName: safe(payload.arena?.label || ''),
      arenaId: safe(payload.arena?.id || ''),
      arenaImage,
      // Las listas se conservan como datos de entrada; aún NO habilitan cartas en el motor nuevo.
      playerSpellbookCardIds: Array.isArray(payload.playerSpellbookCardIds) ?
        payload.playerSpellbookCardIds.filter(id => typeof id === 'string').slice(0,30) : []
    };
  }
  window.addEventListener('message', event => {
    if (event.origin !== ORIGIN || event.source !== frame?.contentWindow) return;
    if (event.data?.type === 'rok:arena:ready') {
      frameReady = true;
      send('rok:arena:preload');
      if (errorTimer) {clearTimeout(errorTimer);errorTimer = null;}
      if (waiting && overlay?.classList.contains('is-open')) {
        send('rok:arena:start', waiting);
      }
    } else if (event.data?.type === 'rok:arena:displayed') {
      // Esperar al escenario y a los Kasters seleccionados, sin mostrar el preview generico.
      if (waiting && overlay?.classList.contains('is-open')) overlay.classList.add('is-ready');
    } else if (event.data?.type === 'rok:arena:exit') {
      exitArena();
    } else if (event.data?.type === 'rok:arena:loading') {
      if (loading) loading.textContent = String(event.data.message || 'Preparando escenario…').slice(0,180);
    }
  });
  // Captura de precarga: no interrumpe ni reemplaza el listener original de Combatir.
  document.addEventListener('click', event => {
    if (event.target?.closest?.('#adventureCombatBtn')) preload();
  }, true);
  // Punto de entrada real que ya invoca game.js DESPUES del VS y 3-2-1.
  window.ROK_ADVENTURE_START_BATTLE = function (legacyPayload) {
    const detail = translatePayload(legacyPayload);
    if (!detail) return;
    waiting = detail;
    enterArena();
  };
}());
