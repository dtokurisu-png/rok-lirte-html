/* Rock HTML Base Prototype
   Base modular: data -> state -> render -> input -> phase flow.
*/

const PHASES = [
  { id: 'extraction', label: 'Extracción' },
  { id: 'casting', label: 'Kasteo' },
  { id: 'resolution', label: 'Resolución' },
];

const PHASE_INDICATORS = [
  { id: 'extraction', label: 'Extracción' },
  { id: 'casting', label: 'Kasteo' },
  { id: 'resolution', label: 'Resolución' },
  { id: 'wait', label: 'Espera' },
];

const CARD_KEYS = ['1','2','3','4','5','6','7','8','9','/','*','-'];
const CASTER_DIRS = {
  '7': { dr: -1, dc: -1 }, '8': { dr: -1, dc: 0 }, '9': { dr: -1, dc: 1 },
  '4': { dr: 0, dc: -1 },                         '6': { dr: 0, dc: 1 },
  '1': { dr: 1, dc: -1 },  '2': { dr: 1, dc: 0 },  '3': { dr: 1, dc: 1 },
};

const TEST_INVOCATION_MOVE_SPEED = 3;
const TEST_CASTER_MOVE_SPEED = 2;
const TEST_RESTORE_PHASES = 2;
const GAME_VERSION = 'v5.0';
const PATCH_NOTES = [
  'Agregado botón CSS para refrescar style.css sin reiniciar la partida.',
  'El refresco cambia el href del stylesheet con cache-buster, no toca el estado del juego.',
  'Se mantienen controles CSS para badges de Guardianes, daño y vida.',
];

const ELEMENTS = [
  { id: 'oscuridad', label: 'Oscuridad', color: '#9b4dff' },
  { id: 'fuego', label: 'Fuego', color: '#ff5a1f' },
];

const EXTRACTION_DEFS = [
  { id: 'x1', count: 1, deckCopies: 25, artImage: 'assets/element-x1.png', bgImage: 'assets/element-card-bg.png', skinImage: 'assets/card-skin-darkness.png' },
  { id: 'x2', count: 2, deckCopies: 5, artImage: 'assets/element-x2.png', bgImage: 'assets/element-card-bg.png', skinImage: 'assets/card-skin-darkness.png' },
  { id: 'x3', count: 3, deckCopies: 3, artImage: 'assets/element-x3.png', bgImage: 'assets/element-card-bg.png', skinImage: 'assets/card-skin-darkness.png' },
  { id: 'x4', count: 4, deckCopies: 1, artImage: 'assets/element-x4.png', bgImage: 'assets/element-card-bg.png', skinImage: 'assets/card-skin-darkness.png' },
];

const ELEMENT_EXTRACTION_ASSETS = {
  oscuridad: {
    bgImage: 'assets/element-card-bg.png',
    skinImage: 'assets/card-skin-darkness.png',
    arts: {
      x1: 'assets/element-x1.png',
      x2: 'assets/element-x2.png',
      x3: 'assets/element-x3.png',
      x4: 'assets/element-x4.png',
    },
  },
  fuego: {
    bgImage: 'assets/element-card-bg-fire.png',
    skinImage: 'assets/card-skin-darkness.png',
    arts: {
      x1: 'assets/element-fire-x1.png',
      x2: 'assets/element-fire-x2.png',
      x3: 'assets/element-fire-x3.png',
      x4: 'assets/element-fire-x4.png',
    },
  },
};

const CARD_LIBRARY = {
  naitoSutoka: {
    id: 'naitoSutoka',
    name: 'Naito Sutoka',
    type: 'invocation',
    cost: { oscuridad: 2 },
    castPhases: 2,
    tokenImage: 'assets/invocation-token.png',
    artImage: 'assets/invocation-art.png',
    bgImage: 'assets/card-bg-darkness.jpg',
    skinImage: 'assets/card-skin-darkness.png',
    stats: { atk: 3, def: 2, damage: 1, life: 3, mov: TEST_INVOCATION_MOVE_SPEED, restore: TEST_RESTORE_PHASES },
    attackProfile: { type: 'melee', label: 'Cuerpo a cuerpo', range: 1, damage: 1 },
    movementType: 'frontalSostenido',
  },
};

const LOCAL_PLAYER_ID = 1;

function localPlayer() { return state.players[LOCAL_PLAYER_ID]; }

function getPlayerElement(playerId) {
  const player = state.players[playerId];
  const elementId = player?.elementId || 'oscuridad';
  return ELEMENTS.find(el => el.id === elementId) || ELEMENTS[0];
}

function getPlayerElementColor(playerId) {
  const element = getPlayerElement(playerId);
  return element?.color || '#9b4dff';
}


function buildExtractionCardDef(playerId, baseId) {
  const element = getPlayerElement(playerId);
  const baseDef = EXTRACTION_DEFS.find(item => item.id === baseId) || EXTRACTION_DEFS[0];
  const assetSet = ELEMENT_EXTRACTION_ASSETS[element.id] || ELEMENT_EXTRACTION_ASSETS.oscuridad;
  return {
    ...baseDef,
    artImage: assetSet.arts[baseDef.id] || baseDef.artImage,
    bgImage: assetSet.bgImage || baseDef.bgImage,
    skinImage: assetSet.skinImage || baseDef.skinImage,
    elementId: element.id,
    elementLabel: element.label,
    elementColor: element.color,
    sourceType: 'element',
  };
}

const state = {
  activePlayer: 1,
  phaseIndex: 0,
  activeTab: 0,
  selectedCardSlot: null,
  pendingCard: null,
  pendingPlacement: null,
  infoCard: null,
  selectedMover: null,
  selectedTarget: null,
  pendingCasterDefense: null,
  extractedThisPhase: false,
  extractionAnimating: false,
  aiThinking: false,
  aiEnabled: true,
  players: {
    1: {
      life: 30,
      elementId: 'oscuridad',
      resources: [],
      elementDeck: [],
      elementDiscard: [],
      caster: { id: 'p1Caster', row: 13, col: 4, atk: 4, def: 2, life: 30, maxLife: 30, movesLeft: 0, state: 'ready' },
      guardians: [
        { id: 'p1GuardianL', row: 13, col: 2, resistance: 5, active: true },
        { id: 'p1GuardianR', row: 13, col: 6, resistance: 5, active: true },
      ],
      handTabs: [
        ['naitoSutoka', 'naitoSutoka', 'naitoSutoka', null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null, null, null],
      ],
      castQueue: [],
      units: [],
      spawnMarkers: [],
    },
    2: {
      life: 30,
      elementId: 'fuego',
      resources: [],
      elementDeck: [],
      elementDiscard: [],
      caster: { id: 'p2Caster', row: 4, col: 4, atk: 4, def: 2, life: 30, maxLife: 30, movesLeft: 0, state: 'ready' },
      guardians: [
        { id: 'p2GuardianL', row: 4, col: 2, resistance: 5, active: true },
        { id: 'p2GuardianR', row: 4, col: 6, resistance: 5, active: true },
      ],
      handTabs: [['naitoSutoka', 'naitoSutoka', 'naitoSutoka', null, null, null, null, null, null, null, null, null], [], []],
      castQueue: [],
      units: [],
      spawnMarkers: [],
    },
  },
};

const els = {};

function init() {
  cacheEls();
  buildPhaseBoxes();
  buildGrid();
  bindEvents();
  initializeElementDecks();
  buildFountainFx();
  enterPhase(true, true);
  renderAll();
  const introTransitions = [
    { text: 'INICIA EL COMBATE', playerId: 1, duration: 1150 },
    { text: 'EXTRACCIÓN', playerId: 1, duration: 900 },
  ];
  queueTransitions(introTransitions);
  schedulePhaseStartActions(sumTransitionDurations(introTransitions) - 120);
}

function cacheEls() {
  els.phaseBoxes = document.getElementById('phaseBoxes');
  els.turnBanner = document.getElementById('turnBanner');
  els.nextPhaseBtn = document.getElementById('nextPhaseBtn');
  els.enemyGrid = document.getElementById('enemyGrid');
  els.allyGrid = document.getElementById('allyGrid');
  els.spawnMarkersLayer = document.getElementById('spawnMarkersLayer');
  els.moveOptionsLayer = document.getElementById('moveOptionsLayer');
  els.board = document.getElementById('board');
  els.boardContent = document.getElementById('boardContent');
  els.unitsLayer = document.getElementById('unitsLayer');
  els.extractionFxLayer = document.getElementById('extractionFxLayer');
  els.cardGrid = document.getElementById('cardGrid');
  els.resourceBar = document.getElementById('resourceBar');
  els.castQueue = document.getElementById('castQueue');
  els.systemLog = document.getElementById('systemLog');
  els.transitionOverlay = document.getElementById('transitionOverlay');
  els.transitionText = document.getElementById('transitionText');
  els.p1Life = document.getElementById('p1Life');
  els.p1ElementCount = document.getElementById('p1ElementCount');
  els.casterAtk = document.getElementById('casterAtk');
  els.casterDef = document.getElementById('casterDef');
  els.casterCast = document.getElementById('casterCast');
  els.casterState = document.getElementById('casterState');
  els.cardInfoOverlay = document.getElementById('cardInfoOverlay');
  els.cardInfoPreview = document.getElementById('cardInfoPreview');
  els.cardInfoName = document.getElementById('cardInfoName');
  els.cardInfoType = document.getElementById('cardInfoType');
  els.cardInfoDamage = document.getElementById('cardInfoDamage');
  els.cardInfoLife = document.getElementById('cardInfoLife');
  els.cardInfoDefense = document.getElementById('cardInfoDefense');
  els.cardInfoAttackType = document.getElementById('cardInfoAttackType');
  els.cardInfoRange = document.getElementById('cardInfoRange');
  els.cardInfoMoveType = document.getElementById('cardInfoMoveType');
  els.cardInfoBiotype = document.getElementById('cardInfoBiotype');
  els.cardInfoMove = document.getElementById('cardInfoMove');
  els.cardInfoCastTime = document.getElementById('cardInfoCastTime');
  els.cardInfoRestoreTime = document.getElementById('cardInfoRestoreTime');
  els.cardInfoKastBtn = document.getElementById('cardInfoKastBtn');
  els.cardInfoCloseBtn = document.getElementById('cardInfoCloseBtn');
  els.infoChip = document.getElementById('infoChip');
  els.cssRefreshBtn = document.getElementById('cssRefreshBtn');
  els.mainStylesheet = document.getElementById('mainStylesheet');
  els.patchInfoOverlay = document.getElementById('patchInfoOverlay');
  els.patchInfoCloseBtn = document.getElementById('patchInfoCloseBtn');
  els.patchInfoTitle = document.getElementById('patchInfoTitle');
  els.patchInfoBody = document.getElementById('patchInfoBody');
}

function buildPhaseBoxes() {
  els.phaseBoxes.innerHTML = '';
  PHASE_INDICATORS.forEach((phase, index) => {
    const box = document.createElement('div');
    box.className = 'phase-box';
    box.dataset.index = String(index);
    box.dataset.phaseId = phase.id;
    box.textContent = phase.label;
    els.phaseBoxes.appendChild(box);
  });
}

function buildGrid() {
  els.enemyGrid.innerHTML = '';
  els.allyGrid.innerHTML = '';
  for (let row = 0; row < 18; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = document.createElement('button');
      cell.className = `cell ${row >= 9 ? 'ally' : 'enemy'}`;
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      const label = coordLabel(row, col);
      cell.title = label;
      cell.dataset.label = label;
      const labelSpan = document.createElement('span');
      labelSpan.className = 'cell-label';
      labelSpan.textContent = label;
      cell.appendChild(labelSpan);
      cell.addEventListener('click', () => handleCellClick(row, col));
      if (row >= 9) els.allyGrid.appendChild(cell);
      else els.enemyGrid.appendChild(cell);
    }
  }
}

function bindEvents() {
  els.nextPhaseBtn.addEventListener('click', nextPhase);
  document.querySelectorAll('.deck-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeTab = Number(btn.dataset.tab);
      state.selectedCardSlot = null;
      state.pendingCard = null;
      state.pendingPlacement = null;
      state.selectedMover = null;
      renderAll();
    });
  });
  document.addEventListener('keydown', handleKeyDown);
  if (els.cardInfoKastBtn) els.cardInfoKastBtn.addEventListener('click', startKastFromInfo);
  if (els.cardInfoCloseBtn) els.cardInfoCloseBtn.addEventListener('click', closeCardInfo);
  if (els.infoChip) els.infoChip.addEventListener('click', openPatchInfo);
  if (els.cssRefreshBtn) els.cssRefreshBtn.addEventListener('click', refreshCssOnly);
  if (els.patchInfoCloseBtn) els.patchInfoCloseBtn.addEventListener('click', closePatchInfo);
  if (els.patchInfoOverlay) els.patchInfoOverlay.addEventListener('click', (event) => { if (event.target === els.patchInfoOverlay) closePatchInfo(); });
  bindBoardZoomAndPan();
}

function refreshCssOnly() {
  const link = els.mainStylesheet || document.querySelector('link[rel=\"stylesheet\"][href*=\"style.css\"]');
  if (!link) return;
  const baseHref = 'style.css';
  link.setAttribute('href', `${baseHref}?cssRefresh=${Date.now()}`);
  if (els.cssRefreshBtn) {
    els.cssRefreshBtn.classList.add('flash');
    els.cssRefreshBtn.textContent = 'OK';
    setTimeout(() => {
      els.cssRefreshBtn.classList.remove('flash');
      els.cssRefreshBtn.textContent = 'CSS';
    }, 550);
  }
  log('CSS refrescado sin reiniciar la partida.');
}

function openPatchInfo() {
  if (!els.patchInfoOverlay) return;
  if (els.patchInfoTitle) els.patchInfoTitle.textContent = `Rok ${GAME_VERSION}`;
  if (els.patchInfoBody) {
    els.patchInfoBody.innerHTML = `
      <p><strong>Versión:</strong> ${GAME_VERSION}</p>
      <p><strong>Estado:</strong> prototipo HTML de combate, extracción, kasteo y movimiento.</p>
      <h3>Este parche corrige:</h3>
      <ul>${PATCH_NOTES.map(note => `<li>${note}</li>`).join('')}</ul>
      <h3>Reglas de prueba activas:</h3>
      <ul>
        <li>Kaster e invocación tienen MOV ${TEST_INVOCATION_MOVE_SPEED} temporal.</li>
        <li>Ambos jugadores tienen 3 Naito Sutoka.</li>
        <li>J1 usa Oscuridad y J2 usa Fuego genérico.</li>
        <li>Extracción automática avanza a Kasteo cuando solo salen elementos.</li>
        <li>J2 tiene IA básica: kastea, se mueve y termina sus fases solo.</li>
      </ul>`;
  }
  els.patchInfoOverlay.classList.add('open');
  els.patchInfoOverlay.setAttribute('aria-hidden', 'false');
}

function closePatchInfo() {
  if (!els.patchInfoOverlay) return;
  els.patchInfoOverlay.classList.remove('open');
  els.patchInfoOverlay.setAttribute('aria-hidden', 'true');
}

function currentPhase() { return PHASES[state.phaseIndex]; }
function currentPlayer() { return state.players[state.activePlayer]; }

function getPlayerGridRow(playerId, localRow) {
  return playerId === 1 ? 8 + localRow : localRow - 1;
}

function isCasterInOwnSide(playerId) {
  const caster = state.players[playerId].caster;
  return playerId === 1 ? caster.row >= 9 : caster.row <= 8;
}

function isCasterInEnemySide(playerId) { return !isCasterInOwnSide(playerId); }

function getEnemyRiskRow(playerId) { return playerId === 1 ? 0 : 17; }

function getOwnerColor(playerId) { return getPlayerElementColor(playerId); }

function movementLabel(type) {
  const labels = {
    frontalSostenido: 'Frontal sostenida',
    complete: 'Completa',
  };
  return labels[type] || type || '-';
}

function getAttackProfile(card) {
  const profile = card?.attackProfile || {};
  return {
    type: profile.type || 'melee',
    label: profile.label || (profile.type === 'longRange' ? 'Distancia' : profile.type === 'tacticalRange' ? 'Rango' : 'Cuerpo a cuerpo'),
    range: Number(profile.range ?? 1),
    damage: Number(profile.damage ?? card?.stats?.damage ?? card?.stats?.atk ?? 1),
  };
}

function ringDistance(aRow, aCol, bRow, bCol) {
  return Math.max(Math.abs(aRow - bRow), Math.abs(aCol - bCol));
}

function getEnemyPlayerId(playerId) { return playerId === 1 ? 2 : 1; }

function getUnitById(playerId, unitId) {
  return state.players[playerId]?.units.find(u => u.id === unitId) || null;
}

function getSourceUnitFromSelection() {
  const sel = state.selectedMover;
  if (!sel || sel.type !== 'invocation') return null;
  const unit = getUnitById(sel.playerId, sel.unitId);
  if (!unit || unit.status === 'restoring') return null;
  return { playerId: sel.playerId, unit, card: CARD_LIBRARY[unit.cardId] };
}

function buildTarget(type, playerId, data = {}) {
  let row = data.row;
  let col = data.col;
  if (type === 'caster') { row = state.players[playerId].caster.row; col = state.players[playerId].caster.col; }
  if (type === 'guardian') { const g = state.players[playerId].guardians.find(item => item.id === data.guardianId); row = g?.row; col = g?.col; }
  if (type === 'invocation') { const u = getUnitById(playerId, data.unitId); row = u?.row; col = u?.col; }
  return { type, playerId, row, col, ...data };
}

function canSelectTarget(source, target) {
  if (!source || !target) return false;
  if (source.playerId === target.playerId) return false;
  const profile = getAttackProfile(source.card);
  const dist = ringDistance(source.unit.row, source.unit.col, target.row, target.col);
  return dist >= 1 && dist <= profile.range;
}

function unitKey(playerId, unitId) { return `${playerId}:${unitId}`; }

function isUnitEngaged(unit) {
  return Boolean(unit?.engagedWith);
}

function areUnitsMutuallyEngaged(aPlayerId, aUnit, bPlayerId, bUnit) {
  return aUnit?.engagedWith?.playerId === bPlayerId &&
    aUnit?.engagedWith?.unitId === bUnit?.id &&
    bUnit?.engagedWith?.playerId === aPlayerId &&
    bUnit?.engagedWith?.unitId === aUnit?.id;
}

function clearUnitEngagement(playerId, unitId) {
  const unit = getUnitById(playerId, unitId);
  if (!unit) return;
  const other = unit.engagedWith;
  unit.engagedWith = null;
  if (other) {
    const otherUnit = getUnitById(other.playerId, other.unitId);
    if (otherUnit?.engagedWith?.playerId === playerId && otherUnit?.engagedWith?.unitId === unitId) {
      otherUnit.engagedWith = null;
    }
  }
}

function showFloatingTextAt(row, col, text, className = 'floating-combat') {
  const pos = cellCenter(row, col);
  const div = document.createElement('div');
  div.className = className;
  div.textContent = String(text);
  div.style.left = `${pos.x}%`;
  div.style.top = `${pos.y}%`;
  els.boardContent.appendChild(div);
  setTimeout(() => div.remove(), 980);
}

function canUnitDamageUnit(sourcePlayerId, sourceUnit, targetPlayerId, targetUnit) {
  if (!sourceUnit || !targetUnit || sourceUnit.status === 'restoring' || targetUnit.status === 'restoring') return false;
  const sourceCard = CARD_LIBRARY[sourceUnit.cardId];
  const profile = getAttackProfile(sourceCard);
  const dist = ringDistance(sourceUnit.row, sourceUnit.col, targetUnit.row, targetUnit.col);
  return dist >= 1 && dist <= profile.range;
}

function openInfoForTarget(target) {
  if (!target) return;
  if (target.type === 'caster') openKasterInfo(target.playerId);
  else if (target.type === 'guardian') openGuardianInfo(target.playerId, target.guardianId);
  else if (target.type === 'invocation') {
    const unit = getUnitById(target.playerId, target.unitId);
    damageInvocationUnit(target.playerId, unit, amount, `${CARD_LIBRARY[source.unit.cardId]?.name || 'Invocación'} ataca`);
  }
}

function clearCombatMenus() {
  state.selectedTarget = null;
  document.querySelectorAll('.combat-target-menu, .combat-action-menu, .caster-defense-menu').forEach(node => node.remove());
}

function showTargetMenu(target) {
  clearCombatMenus();
  const source = getSourceUnitFromSelection();
  if (!source || !canSelectTarget(source, target)) {
    openInfoForTarget(target);
    return;
  }
  const pos = cellCenter(target.row, target.col);
  const menu = document.createElement('div');
  menu.className = 'combat-target-menu';
  menu.style.left = `${pos.x}%`;
  menu.style.top = `${pos.y}%`;
  menu.innerHTML = `<button type="button" data-action="info">Info</button><button type="button" data-action="combat">Combatir</button>`;
  menu.querySelector('[data-action="info"]').addEventListener('click', (event) => { event.stopPropagation(); openInfoForTarget(target); });
  menu.querySelector('[data-action="combat"]').addEventListener('click', (event) => { event.stopPropagation(); selectCombatTarget(target); });
  els.boardContent.appendChild(menu);
}

function selectCombatTarget(target) {
  const source = getSourceUnitFromSelection();
  if (!source || !canSelectTarget(source, target)) {
    log('Ese objetivo no puede ser seleccionado por esta invocación.');
    clearCombatMenus();
    return;
  }
  state.selectedTarget = target;
  document.querySelectorAll('.combat-target-menu').forEach(node => node.remove());
  showCombatActionMenu(source, target);
  log(`${CARD_LIBRARY[source.unit.cardId]?.name || 'Invocación'} prepara combate contra objetivo en ${coordLabel(target.row, target.col)}.`);
}

function showCombatActionMenu(source, target) {
  document.querySelectorAll('.combat-action-menu').forEach(node => node.remove());
  const pos = cellCenter(source.unit.row, source.unit.col);
  const menu = document.createElement('div');
  menu.className = 'combat-action-menu';
  menu.style.left = `${pos.x}%`;
  menu.style.top = `${pos.y}%`;
  menu.innerHTML = `<button type="button" data-action="damage">Combatir</button><button type="button" data-action="cancel">Cancelar</button>`;
  menu.querySelector('[data-action="damage"]').addEventListener('click', (event) => { event.stopPropagation(); executeSelectedDamage(); });
  menu.querySelector('[data-action="cancel"]').addEventListener('click', (event) => { event.stopPropagation(); clearCombatMenus(); });
  els.boardContent.appendChild(menu);
}

async function executeSelectedDamage() {
  const source = getSourceUnitFromSelection();
  const target = state.selectedTarget;
  if (!source || !target || !canSelectTarget(source, target)) {
    log('No hay un objetivo válido para dañar.');
    clearCombatMenus();
    return false;
  }
  const profile = getAttackProfile(source.card);
  await executeAttackDamage(source, target, profile.damage);
  source.unit.movesLeft = 0;
  if (target.type === 'caster' && getUnitById(source.playerId, source.unit.id)) restoreInvocation(source.playerId, source.unit, 'ataque al Kaster');
  clearCombatMenus();
  renderAll();
  return true;
}

async function executeAttackDamage(source, target, amount) {
  if (target.type === 'invocation') {
    await enterInvocationCombat(source, target);
    return;
  }
  if (target.type === 'caster' && target.playerId === LOCAL_PLAYER_ID && source.playerId !== LOCAL_PLAYER_ID) {
    await handleIncomingCasterAttack(source, target, amount);
    return;
  }
  applyDamageToTarget(source, target, amount);
}

async function enterInvocationCombat(source, target) {
  const attacker = getUnitById(source.playerId, source.unit.id);
  const defender = getUnitById(target.playerId, target.unitId);
  if (!attacker || !defender || attacker.status === 'restoring' || defender.status === 'restoring') return;

  attacker.engagedWith = { playerId: target.playerId, unitId: defender.id };
  defender.engagedWith = { playerId: source.playerId, unitId: attacker.id };
  attacker.movesLeft = 0;
  defender.movesLeft = 0;

  showFloatingTextAt(attacker.row, attacker.col, 'COMBATIENDO');
  showFloatingTextAt(defender.row, defender.col, 'COMBATIENDO');
  log(`${CARD_LIBRARY[attacker.cardId]?.name || 'Invocación'} entra en combate con ${CARD_LIBRARY[defender.cardId]?.name || 'invocación enemiga'}.`);
  await sleep(280);
  await resolveCombatPair(source.playerId, attacker.id, target.playerId, defender.id, state.activePlayer);
}

async function resolveCombatPair(playerA, unitAId, playerB, unitBId, firstPlayerId = state.activePlayer) {
  let firstId = firstPlayerId;
  let secondId = firstId === playerA ? playerB : playerA;
  let firstUnitId = firstId === playerA ? unitAId : unitBId;
  let secondUnitId = firstId === playerA ? unitBId : unitAId;

  const first = getUnitById(firstId, firstUnitId);
  const second = getUnitById(secondId, secondUnitId);
  if (!first || !second || first.status === 'restoring' || second.status === 'restoring') return;
  if (!areUnitsMutuallyEngaged(firstId, first, secondId, second)) return;

  if (canUnitDamageUnit(firstId, first, secondId, second)) {
    const card = CARD_LIBRARY[first.cardId];
    const dmg = getAttackProfile(card).damage;
    damageInvocationUnit(secondId, second, dmg, 'combate sostenido');
    await sleep(320);
  }

  const stillFirst = getUnitById(firstId, firstUnitId);
  const stillSecond = getUnitById(secondId, secondUnitId);
  if (stillFirst && stillSecond && areUnitsMutuallyEngaged(firstId, stillFirst, secondId, stillSecond) && canUnitDamageUnit(secondId, stillSecond, firstId, stillFirst)) {
    const card = CARD_LIBRARY[stillSecond.cardId];
    const dmg = getAttackProfile(card).damage;
    damageInvocationUnit(firstId, stillFirst, dmg, 'respuesta de combate sostenido');
    await sleep(320);
  }
}

function canCasterReact(playerId) {
  return (state.players[playerId].castQueue?.length ?? 0) === 0;
}

function showCasterDefenseMenu(defenderId, source, amount) {
  clearCombatMenus();
  return new Promise(resolve => {
    const caster = state.players[defenderId].caster;
    const pos = cellCenter(caster.row, caster.col);
    const menu = document.createElement('div');
    menu.className = 'caster-defense-menu';
    menu.style.left = `${pos.x}%`;
    menu.style.top = `${pos.y}%`;
    menu.innerHTML = `
      <button type="button" data-action="defend">Defender</button>
      <button type="button" data-action="counter">Contraatacar</button>
    `;
    const finish = (choice) => {
      state.pendingCasterDefense = null;
      menu.remove();
      resolve(choice);
    };
    state.pendingCasterDefense = { defenderId, attackerPlayerId: source.playerId, attackerUnitId: source.unit.id, amount, resolve: finish };
    menu.querySelector('[data-action="defend"]').addEventListener('click', event => { event.stopPropagation(); finish('defend'); });
    menu.querySelector('[data-action="counter"]').addEventListener('click', event => { event.stopPropagation(); finish('counter'); });
    els.boardContent.appendChild(menu);
    log('Tu Kaster está siendo atacado: elige Defender o Contraatacar.');
  });
}

async function handleIncomingCasterAttack(source, target, amount) {
  const defenderId = target.playerId;
  const caster = state.players[defenderId].caster;
  if (!canCasterReact(defenderId)) {
    applyDamageToCaster(defenderId, amount, 'Kaster kasteando: no puede defender ni contraatacar');
    return;
  }
  const choice = await showCasterDefenseMenu(defenderId, source, amount);
  if (choice === 'defend') {
    const reduced = Math.max(0, amount - (caster.def ?? 0));
    if (reduced > 0) applyDamageToCaster(defenderId, reduced, 'Kaster se defiende');
    else {
      showFloatingDamageAt(caster.row, caster.col, 'BLOQ');
      log(`Kaster J${defenderId} bloquea el daño con DEF ${caster.def ?? 0}.`);
    }
    return;
  }
  if (choice === 'counter') {
    applyDamageToCaster(defenderId, amount, 'Kaster contraataca y recibe el golpe');
    const attacker = getUnitById(source.playerId, source.unit.id);
    if (attacker) damageInvocationUnit(source.playerId, attacker, caster.atk ?? 0, 'contraataque del Kaster');
    return;
  }
  applyDamageToCaster(defenderId, amount, 'Kaster no reaccionó');
}

function damageInvocationUnit(playerId, unit, amount, reason = 'daño') {
  if (!unit || unit.status === 'restoring') return;
  const card = CARD_LIBRARY[unit.cardId];
  unit.hp = Math.max(0, (unit.hp ?? card?.stats?.life ?? 1) - amount);
  showFloatingDamageAt(unit.row, unit.col, amount);
  log(`${card?.name || 'Invocación'} J${playerId} recibe ${amount} daño por ${reason}. VIDA ${unit.hp}.`);
  if (unit.hp <= 0) { clearUnitEngagement(playerId, unit.id); returnInvocationToSpellbook(playerId, unit, reason); }
}

function applyDamageToTarget(source, target, amount) {
  if (target.type === 'caster') {
    applyDamageToCaster(target.playerId, amount, `${CARD_LIBRARY[source.unit.cardId]?.name || 'Invocación'} ataca`);
    return;
  }
  if (target.type === 'guardian') {
    const guardian = state.players[target.playerId].guardians.find(g => g.id === target.guardianId);
    if (!guardian || guardian.active === false) return;
    guardian.resistance = Math.max(0, (guardian.resistance ?? 5) - amount);
    showFloatingDamageAt(guardian.row, guardian.col, amount);
    log(`Guardián J${target.playerId} recibe ${amount} daño. RES ${guardian.resistance}.`);
    if (guardian.resistance <= 0) {
      guardian.active = false;
      log(`Guardián J${target.playerId} queda desactivado.`);
    }
    return;
  }
  if (target.type === 'invocation') {
    const unit = getUnitById(target.playerId, target.unitId);
    if (!unit || unit.status === 'restoring') return;
    unit.hp = Math.max(0, (unit.hp ?? CARD_LIBRARY[unit.cardId]?.stats?.life ?? 1) - amount);
    showFloatingDamageAt(unit.row, unit.col, amount);
    log(`${CARD_LIBRARY[unit.cardId]?.name || 'Invocación'} J${target.playerId} recibe ${amount} daño. VIDA ${unit.hp}.`);
    if (unit.hp <= 0) returnInvocationToSpellbook(target.playerId, unit, 'derrota');
  }
}


function getCellViewportCenter(row, col) {
  const boardRect = els.boardContent.getBoundingClientRect();
  const pos = cellCenter(row, col);
  return {
    x: boardRect.left + (pos.x / 100) * boardRect.width,
    y: boardRect.top + (pos.y / 100) * boardRect.height,
  };
}

function getSpellbookSlotCenter(tab, slot) {
  const fallback = els.cardGrid?.getBoundingClientRect?.() || { left: 80, top: 80, width: 120, height: 120 };
  if (tab === state.activeTab) {
    const slotEl = els.cardGrid?.querySelectorAll('.card-slot')?.[slot];
    if (slotEl) {
      const r = slotEl.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
  }
  return { x: fallback.left + fallback.width / 2, y: fallback.top + fallback.height / 2 };
}

function animateReturnInvocationToSpellbook(playerId, unit, tab, slot) {
  const card = CARD_LIBRARY[unit.cardId];
  if (!card) return;
  const from = getCellViewportCenter(unit.row, unit.col);
  const to = playerId === LOCAL_PLAYER_ID ? getSpellbookSlotCenter(tab, slot) : getCellViewportCenter(unit.row, unit.col - 1);
  const flyer = document.createElement('div');
  flyer.className = 'return-to-spellbook-token traveling';
  flyer.style.left = `${from.x}px`;
  flyer.style.top = `${from.y}px`;
  flyer.style.width = '54px';
  flyer.style.height = '70px';
  flyer.style.setProperty('--return-x', `${to.x - from.x}px`);
  flyer.style.setProperty('--return-y', `${to.y - from.y}px`);
  flyer.style.setProperty('--return-color', getPlayerElementColor(playerId));
  flyer.innerHTML = `<img src="${card.tokenImage}" alt="${card.name}">`;
  document.body.appendChild(flyer);
  setTimeout(() => flyer.remove(), 820);
}

function animateRestoreInvocationToSpawn(playerId, unit, marker) {
  const card = CARD_LIBRARY[unit.cardId];
  if (!card || !marker) return;
  const from = getCellViewportCenter(unit.row, unit.col);
  const to = getCellViewportCenter(marker.row, marker.col);
  const flyer = document.createElement('div');
  flyer.className = 'restore-travel-token traveling';
  flyer.style.left = `${from.x}px`;
  flyer.style.top = `${from.y}px`;
  flyer.style.width = '54px';
  flyer.style.height = '70px';
  flyer.style.setProperty('--restore-x', `${to.x - from.x}px`);
  flyer.style.setProperty('--restore-y', `${to.y - from.y}px`);
  flyer.style.setProperty('--restore-fly-color', getPlayerElementColor(playerId));
  flyer.innerHTML = `<img src="${card.tokenImage}" alt="${card.name}">`;
  document.body.appendChild(flyer);
  setTimeout(() => flyer.remove(), 820);
}

function returnInvocationToSpellbook(playerId, unit, reason = 'derrota') {
  clearUnitEngagement(playerId, unit.id);
  const player = state.players[playerId];
  const card = CARD_LIBRARY[unit.cardId];
  const marker = player.spawnMarkers.find(m => m.id === unit.spawnId);
  const tab = marker?.originTab ?? unit.originTab ?? 0;
  const slot = marker?.originSlot ?? unit.originSlot ?? player.handTabs[tab]?.findIndex(v => !v) ?? 0;
  animateReturnInvocationToSpellbook(playerId, unit, tab, slot);
  if (!player.handTabs[tab]) player.handTabs[tab] = [];
  if (player.handTabs[tab][slot]) {
    const freeSlot = player.handTabs[tab].findIndex(v => !v);
    player.handTabs[tab][freeSlot >= 0 ? freeSlot : slot] = unit.cardId;
  } else {
    player.handTabs[tab][slot] = unit.cardId;
  }
  player.units = player.units.filter(u => u.id !== unit.id);
  player.spawnMarkers = player.spawnMarkers.filter(m => m.id !== unit.spawnId);
  showFloatingDamageAt(unit.row, unit.col, 'KO');
  log(`${card?.name || 'Invocación'} vuelve al Spellbook por ${reason}.`);
}

function getTargetsInRangeForUnit(playerId, unit) {
  const card = CARD_LIBRARY[unit.cardId];
  const source = { playerId, unit, card };
  const enemyId = getEnemyPlayerId(playerId);
  const enemy = state.players[enemyId];
  const targets = [];
  targets.push(buildTarget('caster', enemyId));
  enemy.guardians.filter(g => g.active !== false).forEach(g => targets.push(buildTarget('guardian', enemyId, { guardianId: g.id })));
  enemy.units.filter(u => u.status !== 'restoring').forEach(u => targets.push(buildTarget('invocation', enemyId, { unitId: u.id })));
  return targets.filter(t => canSelectTarget(source, t));
}

async function aiTryAttackWithUnit(playerId, unit) {
  if (!unit || unit.status === 'restoring') return false;
  const card = CARD_LIBRARY[unit.cardId];
  const source = { playerId, unit, card };
  const targets = getTargetsInRangeForUnit(playerId, unit);
  if (!targets.length) return false;
  const priority = { caster: 0, invocation: 1, guardian: 2 };
  const target = targets.sort((a, b) => (priority[a.type] ?? 9) - (priority[b.type] ?? 9))[0];
  const profile = getAttackProfile(card);
  await executeAttackDamage(source, target, profile.damage);
  unit.movesLeft = 0;
  if (target.type === 'caster' && getUnitById(playerId, unit.id)) restoreInvocation(playerId, unit, 'ataque al Kaster');
  log(`IA J${playerId}: ${card?.name || 'Invocación'} daña objetivo ${target.type}.`);
  renderAll();
  return true;
}


function getMandatoryMovementBlocker(playerId) {
  if (currentPhase().id !== 'resolution') return null;
  const player = state.players[playerId];
  if (!player) return null;

  // Regla v4.7: el movimiento obligatorio solo aplica a invocaciones.
  // El Kaster puede moverse, pero no bloquea el cierre de Resolución.
  for (const unit of player.units) {
    if (!unit || unit.status === 'restoring' || isUnitEngaged(unit) || (unit.movesLeft ?? 0) <= 0) continue;
    if (getInvocationMoveOptions(playerId, unit).length) {
      return { type: 'invocation', label: CARD_LIBRARY[unit.cardId]?.name || 'Invocación' };
    }
  }
  return null;
}

function nextPhase(force = false) {
  if (typeof force !== 'boolean') force = false;
  if (state.extractionAnimating || state.aiThinking) return;
  if (!force && state.aiEnabled && state.activePlayer !== LOCAL_PLAYER_ID) {
    log('El rival está controlando su turno.');
    return;
  }

  const blocker = !force ? getMandatoryMovementBlocker(state.activePlayer) : null;
  if (blocker) {
    log(`${blocker.label} todavía puede moverse. El movimiento es obligatorio antes de terminar Resolución.`);
    return;
  }

  const oldPhase = currentPhase().id;
  const oldPlayer = state.activePlayer;

  if (oldPhase === 'casting') {
    clearPendingCast();
    closeCardInfo();
  }

  state.phaseIndex++;
  let changedPlayer = false;
  if (state.phaseIndex >= PHASES.length) {
    state.phaseIndex = 0;
    state.activePlayer = state.activePlayer === 1 ? 2 : 1;
    changedPlayer = true;
    resetBoardViewToPanoramic();
  }

  enterPhase(false, true);
  renderAll();

  if (changedPlayer) {
    const items = [
      { text: 'TERMINA EL TURNO', playerId: oldPlayer, duration: 950 },
      { text: `JUGADOR ${state.activePlayer}`, playerId: state.activePlayer, duration: 900 },
      { text: 'EXTRACCIÓN', playerId: state.activePlayer, duration: 900 },
    ];
    queueTransitions(items);
    schedulePhaseStartActions(sumTransitionDurations(items) - 120);
  } else {
    const phase = currentPhase();
    const items = [{ text: phase.label.toUpperCase(), playerId: state.activePlayer, duration: 860 }];
    queueTransitions(items);
    schedulePhaseStartActions(sumTransitionDurations(items) - 120);
  }
}

function enterPhase(initial, suppressTransition = false) {
  const phase = currentPhase();
  state.extractedThisPhase = false;
  clearPendingCast();
  state.selectedMover = null;
  tickCastQueues();
  tickRestorationCounters();
  applyCasterEnemySideDamage();

  if (phase.id === 'resolution') {
    prepareResolutionMoves(state.activePlayer);
    scheduleSustainedCombatResolution(state.activePlayer);
  }

  const label = phase.label.toUpperCase();
  log(`Jugador ${state.activePlayer}: ${label}`);
  if (!initial && !suppressTransition) showTransition(label, 860, state.activePlayer);
}


function scheduleSustainedCombatResolution(playerId) {
  clearTimeout(scheduleSustainedCombatResolution.timer);
  scheduleSustainedCombatResolution.timer = setTimeout(() => resolveSustainedCombatsForPlayer(playerId), 620);
}

async function resolveSustainedCombatsForPlayer(playerId) {
  if (currentPhase().id !== 'resolution' || state.activePlayer !== playerId) return;
  const player = state.players[playerId];
  const handled = new Set();
  for (const unit of [...player.units]) {
    if (!unit?.engagedWith || unit.status === 'restoring') continue;
    const other = getUnitById(unit.engagedWith.playerId, unit.engagedWith.unitId);
    if (!other || other.status === 'restoring') { unit.engagedWith = null; continue; }
    const key = [unitKey(playerId, unit.id), unitKey(unit.engagedWith.playerId, other.id)].sort().join('|');
    if (handled.has(key)) continue;
    handled.add(key);
    showFloatingTextAt(unit.row, unit.col, 'COMBATIENDO');
    showFloatingTextAt(other.row, other.col, 'COMBATIENDO');
    await sleep(240);
    await resolveCombatPair(playerId, unit.id, unit.engagedWith.playerId, other.id, playerId);
  }
  renderAll();
}

function tickRestorationCounters() {
  for (const playerId of [1, 2]) {
    const player = state.players[playerId];
    player.units.forEach(unit => {
      if (unit.status !== 'restoring') return;
      unit.restoreRemaining = Math.max(0, (unit.restoreRemaining ?? 0) - 1);
      if (unit.restoreRemaining <= 0) {
        unit.status = 'active';
        unit.movesLeft = 0;
        log(`${CARD_LIBRARY[unit.cardId]?.name || 'Invocación'} terminó su restauración.`);
      }
    });
  }
}

function applyCasterEnemySideDamage() {
  for (const playerId of [1, 2]) {
    if (!isCasterInEnemySide(playerId)) continue;
    applyDamageToCaster(playerId, 1, 'Kaster en zona enemiga');
  }
}

function tickCastQueues() {
  for (const playerId of [1, 2]) {
    const player = state.players[playerId];
    const ready = [];
    player.castQueue.forEach(item => {
      item.remaining -= 1;
      if (item.remaining <= 0) ready.push(item);
    });
    player.castQueue = player.castQueue.filter(item => item.remaining > 0);
    ready.forEach(item => launchCastTravel(playerId, item));
  }
}

function resolveCast(playerId, item) {
  const card = CARD_LIBRARY[item.cardId];
  if (!card) return;
  if (card.type === 'invocation') {
    state.players[playerId].units.push({
      id: `unit_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      cardId: card.id,
      row: item.row,
      col: item.col,
      owner: playerId,
      hp: card.stats.life ?? 3,
      maxHp: card.stats.life ?? 3,
      atk: card.stats.atk,
      def: card.stats.def,
      damage: card.attackProfile?.damage ?? card.stats.damage ?? 0,
      mov: card.stats.mov ?? TEST_INVOCATION_MOVE_SPEED,
      restoreTime: card.stats.restore ?? TEST_RESTORE_PHASES,
      restoreRemaining: 0,
      status: 'active',
      spawnId: item.spawnId,
      originTab: item.originTab ?? 0,
      originSlot: item.originSlot ?? 0,
      movesLeft: currentPhase().id === 'resolution' && state.activePlayer === playerId ? (card.stats.mov ?? TEST_INVOCATION_MOVE_SPEED) : 0,
    });
    log(`${card.name} entra a la arena en ${coordLabel(item.row, item.col)}.`);
  }
}

function launchCastTravel(playerId, item) {
  const card = CARD_LIBRARY[item.cardId];
  if (!card) return;

  const queueEl = document.querySelector(`.cast-item[data-spawn-id="${item.spawnId}"][data-player-id="${playerId}"]`);
  const imgEl = queueEl ? queueEl.querySelector('img') : null;
  const boardRect = els.boardContent.getBoundingClientRect();
  const pos = cellCenter(item.row, item.col);
  const destX = boardRect.left + (pos.x / 100) * boardRect.width;
  const destY = boardRect.top + (pos.y / 100) * boardRect.height;

  if (!imgEl) {
    resolveCast(playerId, item);
    renderAll();
    return;
  }

  const fromRect = imgEl.getBoundingClientRect();
  const flyer = document.createElement('div');
  flyer.className = 'cast-travel-token';
  flyer.innerHTML = `<img src="${card.tokenImage}" alt="${card.name}">`;
  document.body.appendChild(flyer);

  const startW = fromRect.width;
  const startH = fromRect.height;
  const finalW = Math.max(34, Math.min(startW * 0.68, boardRect.width * 0.10));
  const finalH = Math.max(40, Math.min(startH * 0.68, boardRect.height * 0.14));

  flyer.style.left = `${fromRect.left + fromRect.width / 2}px`;
  flyer.style.top = `${fromRect.top + fromRect.height / 2}px`;
  flyer.style.width = `${startW}px`;
  flyer.style.height = `${startH}px`;
  flyer.style.setProperty('--travel-x', `${destX - (fromRect.left + fromRect.width / 2)}px`);
  flyer.style.setProperty('--travel-y', `${destY - (fromRect.top + fromRect.height / 2)}px`);
  flyer.style.setProperty('--travel-scale-x', String(finalW / startW));
  flyer.style.setProperty('--travel-scale-y', String(finalH / startH));

  requestAnimationFrame(() => flyer.classList.add('traveling'));

  setTimeout(() => {
    flyer.remove();
    resolveCast(playerId, item);
    renderAll();
  }, 720);
}

function extractElements(playerId, amount) {
  const player = state.players[playerId];
  const element = getPlayerElement(playerId);
  for (let i = 0; i < amount; i++) {
    player.resources.push({ ...element, uid: `orb_${Date.now()}_${i}_${Math.random()}` });
  }
  log(`Jugador ${playerId} extrae ${amount} elemento${amount > 1 ? 's' : ''} de ${element.label.toLowerCase()}.`);
}

function initializeElementDecks() {
  for (const playerId of [1, 2]) reshuffleElementDeck(playerId);
}

function buildElementDeckList() {
  const deck = [];
  EXTRACTION_DEFS.forEach(def => {
    for (let i = 0; i < def.deckCopies; i++) deck.push(def.id);
  });
  return deck;
}

function shuffleArray(items) {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function reshuffleElementDeck(playerId) {
  const player = state.players[playerId];
  player.elementDeck = shuffleArray(buildElementDeckList());
  player.elementDiscard = [];
}

function drawElementCard(playerId) {
  const player = state.players[playerId];
  if (!player.elementDeck || player.elementDeck.length === 0) reshuffleElementDeck(playerId);
  const id = player.elementDeck.shift();
  player.elementDiscard.push(id);
  return buildExtractionCardDef(playerId, id);
}

function buildFountainFx() {
  if (!els.boardContent || els.boardContent.querySelector('.fountain-fx')) return;
  [
    { cls: 'fountain-p1', left: 'var(--fountain-p1-left)', top: 'var(--fountain-p1-top)', playerId: 1 },
    { cls: 'fountain-p2', left: 'var(--fountain-p2-left)', top: 'var(--fountain-p2-top)', playerId: 2 },
  ].forEach(item => {
    const div = document.createElement('div');
    div.className = `fountain-fx ${item.cls}`;
    div.dataset.playerId = String(item.playerId);
    div.style.left = item.left;
    div.style.top = item.top;
    div.style.setProperty('--fountain-color', getPlayerElementColor(item.playerId));
    div.innerHTML = `<div class="fountain-gen-glow"></div><div class="fountain-particles">${Array.from({ length: 8 }, (_, i) => `<span class="fountain-particle p${i + 1}"></span>`).join('')}</div>`;
    els.boardContent.appendChild(div);
  });
}

function applyFountainColors() {
  if (!els.boardContent) return;
  els.boardContent.querySelectorAll('.fountain-fx').forEach(node => {
    const playerId = Number(node.dataset.playerId || 1);
    node.style.setProperty('--fountain-color', getPlayerElementColor(playerId));
  });
}

function setFountainExtracting(playerId, active) {
  if (!els.boardContent) return;
  const node = els.boardContent.querySelector(`.fountain-fx[data-player-id="${playerId}"]`);
  if (!node) return;
  node.classList.toggle('is-extracting', !!active);
}

function sumTransitionDurations(items) {
  return (items || []).reduce((sum, item) => sum + (item.duration ?? 860), 0);
}

function schedulePhaseStartActions(delay = 0) {
  clearTimeout(schedulePhaseStartActions.timer);
  schedulePhaseStartActions.timer = setTimeout(() => startPhaseActions(), Math.max(0, delay));
}

async function startPhaseActions() {
  if (state.extractionAnimating) return;
  const phase = currentPhase();
  if (phase.id === 'extraction' && !state.extractedThisPhase) {
    const playerId = state.activePlayer;
    state.extractedThisPhase = true;
    const shouldAutoAdvance = await animateExtractionPhase(playerId);
    renderAll();
    if (shouldAutoAdvance && state.activePlayer === playerId && currentPhase().id === 'extraction') {
      autoAdvanceExtractionToCasting(playerId);
    }
    return;
  }
  if (phase.id === 'casting' && state.aiEnabled && state.activePlayer !== LOCAL_PLAYER_ID) {
    await runEnemyCastingPhase(state.activePlayer);
    return;
  }
  if (phase.id === 'resolution') {
    prepareResolutionMoves(state.activePlayer);
    renderAll();
    if (state.aiEnabled && state.activePlayer !== LOCAL_PLAYER_ID) {
      await runEnemyResolutionPhase(state.activePlayer);
    }
  }
}


function autoAdvanceExtractionToCasting(playerId) {
  if (currentPhase().id !== 'extraction') return;
  state.phaseIndex = PHASES.findIndex(phase => phase.id === 'casting');
  if (state.phaseIndex < 0) state.phaseIndex = 1;
  enterPhase(false, true);
  renderAll();

  const items = [{ text: 'KASTEO', playerId, duration: 860 }];
  queueTransitions(items);
  schedulePhaseStartActions(sumTransitionDurations(items) - 120);
}

async function animateExtractionPhase(playerId) {
  state.extractionAnimating = true;
  renderPhaseUI();
  let shouldAutoAdvance = true;
  try {
    const picks = [drawElementCard(playerId), drawElementCard(playerId)];
    shouldAutoAdvance = picks.every(card => (card.sourceType || 'element') === 'element');
    const tasks = picks.map((pick, index) => animateExtractionCard(playerId, pick, index * 520));
    await Promise.all(tasks);
    return shouldAutoAdvance;
  } finally {
    state.extractionAnimating = false;
    renderAll();
  }
}

async function animateExtractionCard(playerId, cardDef, startDelay = 0) {
  if (startDelay > 0) await sleep(startDelay);
  const source = getExtractionSourcePoint(playerId);
  const center = getExtractionCenterPoint();
  if (!source || !center || !els.extractionFxLayer) {
    extractElements(playerId, cardDef.count);
    return;
  }

  const elementColor = cardDef.elementColor || getPlayerElementColor(playerId);
  const elementLabel = (cardDef.elementLabel || getPlayerElement(playerId).label).toLowerCase();
  setFountainExtracting(playerId, true);

  try {
    const glow = document.createElement('div');
    glow.className = 'extract-source-glow';
    glow.style.left = `${source.x}px`;
    glow.style.top = `${source.y}px`;
    glow.style.setProperty('--fx-color', elementColor);
    els.extractionFxLayer.appendChild(glow);
    animateCss(glow, [
      { transform: 'translate(-50%, -50%) scale(.45)', opacity: 0 },
      { transform: 'translate(-50%, -50%) scale(1.15)', opacity: 1 },
      { transform: 'translate(-50%, -50%) scale(.9)', opacity: .65 },
    ], 420, 'ease-out').then(() => safeRemove(glow));

    const cardEl = createExtractionCardFx(cardDef);
    cardEl.style.left = `${source.x}px`;
    cardEl.style.top = `${source.y}px`;
    cardEl.style.transform = 'translate(-50%, -50%) scale(.52)';
    cardEl.style.opacity = '0';
    els.extractionFxLayer.appendChild(cardEl);

    await animateCss(cardEl, [
      { transform: 'translate(-50%, -50%) scale(.48)', opacity: 0 },
      { transform: 'translate(-50%, -50%) scale(.54)', opacity: 1 },
    ], 320, 'ease-out');

    await animateCss(cardEl, [
      { left: `${source.x}px`, top: `${source.y}px`, transform: 'translate(-50%, -50%) scale(.54)', opacity: 1 },
      { left: `${center.x}px`, top: `${center.y}px`, transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
    ], 720, 'cubic-bezier(.2,.75,.18,1)');

    const impact = document.createElement('div');
    impact.className = 'extract-impact-fx';
    impact.style.left = `${center.x}px`;
    impact.style.top = `${center.y}px`;
    els.extractionFxLayer.appendChild(impact);
    animateCss(impact, [
      { transform: 'translate(-50%, -50%) scale(.2)', opacity: 0 },
      { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
      { transform: 'translate(-50%, -50%) scale(1.35)', opacity: 0 },
    ], 420, 'ease-out').then(() => safeRemove(impact));

    await animateCss(cardEl, [
      { transform: 'translate(-50%, -50%) scale(1)', opacity: 1, filter: 'drop-shadow(0 18px 18px rgba(0,0,0,.45))' },
      { transform: 'translate(-50%, -50%) scale(.66)', opacity: 0, filter: `drop-shadow(0 0 25px ${elementColor})` },
    ], 300, 'ease-in');
    safeRemove(cardEl);

    const orbPromises = [];
    for (let i = 0; i < cardDef.count; i++) {
      if (i > 0) await sleep(210);
      orbPromises.push(animateExtractionOrb(playerId, center, i));
    }
    await Promise.all(orbPromises);
    log(`Jugador ${playerId} extrae ${cardDef.count} elemento${cardDef.count > 1 ? 's' : ''} de ${elementLabel}.`);
  } finally {
    setFountainExtracting(playerId, false);
  }
}

async function animateExtractionOrb(playerId, startPoint, index) {
  const orb = document.createElement('div');
  orb.className = 'extract-orb-fx';
  orb.style.left = `${startPoint.x}px`;
  orb.style.top = `${startPoint.y}px`;
  orb.style.opacity = '0';
  els.extractionFxLayer.appendChild(orb);

  const end = getResourceTargetPoint(playerId, index);
  await animateCss(orb, [
    { left: `${startPoint.x}px`, top: `${startPoint.y}px`, transform: 'translate(-50%, -50%) scale(.55)', opacity: 0 },
    { left: `${startPoint.x}px`, top: `${startPoint.y}px`, transform: 'translate(-50%, -50%) scale(1)', opacity: 1, offset: .18 },
    { left: `${end.x}px`, top: `${end.y}px`, transform: 'translate(-50%, -50%) scale(.78)', opacity: 1 },
  ], 650, 'cubic-bezier(.18,.7,.25,1)');
  safeRemove(orb);
  const element = ELEMENTS[0];
  state.players[playerId].resources.push({ ...element, uid: `orb_${Date.now()}_${index}_${Math.random()}` });
  renderResources();
}

function createExtractionCardFx(cardDef) {
  const div = document.createElement('div');
  div.className = 'extract-card-fx';
  div.innerHTML = `
    <img class="card-layer card-bg" src="${cardDef.bgImage}" alt="fondo elemento">
    <img class="card-layer card-art" src="${cardDef.artImage}" alt="elemento ${cardDef.id}">
    <img class="card-layer card-skin" src="${cardDef.skinImage}" alt="skin carta">
    <span class="extract-card-count">x${cardDef.count}</span>
  `;
  return div;
}

function getExtractionCenterPoint() {
  const boardRect = els.boardContent.getBoundingClientRect();
  const line = document.querySelector('.battle-center-line');
  if (line) {
    const rect = line.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2 - boardRect.left,
      y: rect.top + rect.height / 2 - boardRect.top,
    };
  }
  return { x: boardRect.width * 0.5, y: boardRect.height * 0.5 };
}

function getExtractionSourcePoint(playerId) {
  const rect = els.boardContent.getBoundingClientRect();

  // Calibrado con la textura que enviaste:
  // J1 nace encima de la fuente inferior izquierda.
  // J2 nace encima de la fuente superior derecha.
  if (playerId === 1) {
    return { x: rect.width * 0.145, y: rect.height * 0.862 };
  }
  return { x: rect.width * 0.858, y: rect.height * 0.138 };
}

function getResourceTargetPoint(playerId, orbOffset = 0) {
  const boardRect = els.boardContent.getBoundingClientRect();
  const bar = els.resourceBar.getBoundingClientRect();

  // El panel de orbes vive fuera del boardContent, así que convertimos
  // coordenadas de viewport a coordenadas locales del layer de extracción.
  if (playerId === LOCAL_PLAYER_ID) {
    const resourceIndex = state.players[playerId].resources.length + orbOffset;
    const x = bar.left + bar.width / 2 - boardRect.left;
    const y = bar.top + 26 + Math.min(resourceIndex, 7) * 58 - boardRect.top;
    return { x, y };
  }

  // Provisional para J2 mientras aún probamos local: manda el orbe a la misma barra
  // pero hacia la parte inferior, sin romper el flujo visual.
  return {
    x: bar.left + bar.width / 2 - boardRect.left,
    y: bar.bottom - 26 - boardRect.top,
  };
}

function safeRemove(node) {
  if (node && node.parentNode) node.parentNode.removeChild(node);
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function animateCss(el, keyframes, duration, easing = 'ease') {
  const animation = el.animate(keyframes, { duration, easing, fill: 'forwards' });
  return animation.finished.catch(() => {});
}

function getCardPrimaryElement(card) {
  const first = Object.keys(card.cost || {})[0];
  return ELEMENTS.find(e => e.id === first) || ELEMENTS[0];
}

function findQueuedItemBySpawn(playerId, spawnId) {
  return state.players[playerId].castQueue.find(item => item.spawnId === spawnId) || null;
}

function isCastIntroReady(playerId, spawnId) {
  const item = findQueuedItemBySpawn(playerId, spawnId);
  if (!item) return true;
  if (item.introDone) return true;
  if (item.introEndsAt && Date.now() >= item.introEndsAt) {
    item.justAdded = false;
    item.introDone = true;
    item.introStarted = false;
    item.introEndsAt = 0;
    return true;
  }
  return false;
}

function findUnitBySpawn(playerId, spawnId) {
  return state.players[playerId].units.find(unit => unit.spawnId === spawnId) || null;
}

function clearLinkedHoverStates() {
  document.querySelectorAll('.pulse-linked, .hover-linked, .queue-linked').forEach(el => el.classList.remove('pulse-linked', 'hover-linked', 'queue-linked'));
}

function attachLinkHoverHandlers(el, spawnId, playerId, mode) {
  if (!el || !spawnId) return;
  if (el.dataset.linkHoverReady === '1') return;
  el.dataset.linkHoverReady = '1';
  el.addEventListener('mouseenter', () => {
    clearLinkedHoverStates();

    // Mientras la ficha acaba de ser kasteada y está cayendo en la zona de Kasteo,
    // NO se permite palpitación ni hover cruzado. Primero cae, luego interactúa.
    if (!isCastIntroReady(playerId, spawnId)) return;

    if (mode === 'queue') {
      const marker = document.querySelector(`.spawn-marker[data-spawn-id="${spawnId}"][data-player-id="${playerId}"]`);
      if (marker) marker.classList.add('pulse-linked');
    } else if (mode === 'marker') {
      const queueItem = document.querySelector(`.cast-item[data-spawn-id="${spawnId}"][data-player-id="${playerId}"]`);
      if (queueItem) {
        queueItem.classList.add('queue-linked');
      } else {
        const unit = document.querySelector(`.unit.invocation[data-spawn-id="${spawnId}"][data-player-id="${playerId}"]`);
        if (unit) unit.classList.add('hover-linked');
      }
    } else if (mode === 'unit') {
      const marker = document.querySelector(`.spawn-marker[data-spawn-id="${spawnId}"][data-player-id="${playerId}"]`);
      if (marker) marker.classList.add('hover-linked');
    }
  });
  el.addEventListener('mouseleave', clearLinkedHoverStates);
}


const MOVE_ARROW_BY_DELTA = {
  '-1,-1': 'assets/move_ul.jpg',
  '-1,0': 'assets/move_u.jpg',
  '-1,1': 'assets/move_ur.jpg',
  '0,-1': 'assets/move_l.jpg',
  '0,1': 'assets/move_r.jpg',
  '1,-1': 'assets/move_dl.jpg',
  '1,0': 'assets/move_d.jpg',
  '1,1': 'assets/move_dr.jpg',
};

function prepareResolutionMoves(playerId) {
  const player = state.players[playerId];
  if (!player) return;
  player.caster.movesLeft = TEST_CASTER_MOVE_SPEED;
  player.units.forEach(unit => {
    unit.movesLeft = (unit.status === 'restoring' || isUnitEngaged(unit)) ? 0 : (unit.mov ?? TEST_INVOCATION_MOVE_SPEED);
  });
}

function selectMover(type, playerId, unitId = null) {
  clearCombatMenus();
  if (currentPhase().id !== 'resolution') {
    log('El movimiento solo está disponible en la fase de Resolución.');
    return;
  }
  if (playerId !== state.activePlayer) {
    log('Solo puedes mover tus propias fichas en tu fase de Resolución.');
    return;
  }
  if (type === 'caster') {
    const caster = state.players[playerId].caster;
    if ((caster.movesLeft ?? 0) <= 0) {
      log('El Kaster ya no tiene velocidad disponible en esta fase.');
      return;
    }
    state.selectedMover = { type, playerId };
    log('Kaster seleccionado para mover.');
  } else if (type === 'invocation') {
    const unit = state.players[playerId].units.find(u => u.id === unitId);
    if (!unit) return;
    if (unit.status === 'restoring') {
      log(`${CARD_LIBRARY[unit.cardId]?.name || 'Invocación'} está en restauración.`);
      return;
    }
    if (isUnitEngaged(unit)) {
      log(`${CARD_LIBRARY[unit.cardId]?.name || 'Invocación'} está combatiendo y no puede moverse.`);
      return;
    }
    if ((unit.movesLeft ?? 0) <= 0) {
      log(`${CARD_LIBRARY[unit.cardId]?.name || 'Invocación'} ya no tiene velocidad disponible en esta fase.`);
      return;
    }
    state.selectedMover = { type, playerId, unitId };
    log(`${CARD_LIBRARY[unit.cardId]?.name || 'Invocación'} seleccionada para mover.`);
  }
}

function getSelectedMoverOptions() {
  const sel = state.selectedMover;
  if (!sel || currentPhase().id !== 'resolution') return [];
  if (sel.type === 'caster') {
    const c = state.players[sel.playerId].caster;
    if ((c.movesLeft ?? 0) <= 0) return [];
    const deltas = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    return deltas.map(([dr, dc]) => ({ row: c.row + dr, col: c.col + dc, dr, dc }))
      .filter(opt => isInside(opt.row, opt.col) && !isOccupied(opt.row, opt.col));
  }
  if (sel.type === 'invocation') {
    const unit = state.players[sel.playerId].units.find(u => u.id === sel.unitId);
    if (!unit || unit.status === 'restoring' || isUnitEngaged(unit) || (unit.movesLeft ?? 0) <= 0) return [];
    const deltas = sel.playerId === 1 ? [[-1,-1],[-1,0],[-1,1]] : [[1,-1],[1,0],[1,1]];
    return deltas.map(([dr, dc]) => ({ row: unit.row + dr, col: unit.col + dc, dr, dc }))
      .filter(opt => isInside(opt.row, opt.col) && !isOccupied(opt.row, opt.col));
  }
  return [];
}

function tryMoveSelectedTo(row, col) {
  const option = getSelectedMoverOptions().find(opt => opt.row === row && opt.col === col);
  if (!option || !state.selectedMover) return false;
  const sel = state.selectedMover;
  if (sel.type === 'caster') {
    const caster = state.players[sel.playerId].caster;
    caster.row = row;
    caster.col = col;
    caster.movesLeft = Math.max(0, (caster.movesLeft ?? 0) - 1);
    log(`Kaster se mueve a ${coordLabel(row, col)}.`);
    if ((caster.movesLeft ?? 0) <= 0) state.selectedMover = null;
  } else if (sel.type === 'invocation') {
    const unit = state.players[sel.playerId].units.find(u => u.id === sel.unitId);
    if (!unit) return false;
    unit.row = row;
    unit.col = col;
    unit.movesLeft = Math.max(0, (unit.movesLeft ?? 0) - 1);
    log(`${CARD_LIBRARY[unit.cardId]?.name || 'Invocación'} se mueve a ${coordLabel(row, col)}.`);
    if (checkRiskZoneAttack(sel.playerId, unit)) return true;
    if ((unit.movesLeft ?? 0) <= 0) state.selectedMover = null;
  }
  renderAll();
  return true;
}

function updateCardInfoAction() {
  if (!els.cardInfoKastBtn || !state.infoCard) return;
  const card = CARD_LIBRARY[state.infoCard.cardId];
  if (!card || state.infoCard.source) {
    els.cardInfoKastBtn.disabled = true;
    els.cardInfoKastBtn.textContent = 'Kastear';
    els.cardInfoKastBtn.title = 'Solo disponible desde el Spellbook';
    return;
  }
  const isLocalTurn = state.activePlayer === LOCAL_PLAYER_ID;
  const canPhase = currentPhase().id === 'casting';
  const canKasterZone = isCasterInOwnSide(LOCAL_PLAYER_ID);
  const canPay = canPayCardCostForPlayer(LOCAL_PLAYER_ID, card);
  const enabled = isLocalTurn && canPhase && canPay && canKasterZone;
  els.cardInfoKastBtn.disabled = !enabled;
  els.cardInfoKastBtn.textContent = 'Kastear';
  if (enabled) {
    els.cardInfoKastBtn.title = '';
  } else if (!isLocalTurn) {
    els.cardInfoKastBtn.title = 'No es tu turno';
  } else if (!canPhase) {
    els.cardInfoKastBtn.title = 'Solo disponible en la fase de Kasteo';
  } else if (!canKasterZone) {
    els.cardInfoKastBtn.title = 'El Kaster no puede kastear en la zona enemiga';
  } else {
    els.cardInfoKastBtn.title = 'No tienes elementos suficientes';
  }
}


function openCardInfo(cardId, slotIndex, tab, meta = {}) {
  const card = CARD_LIBRARY[cardId];
  if (!card || !els.cardInfoOverlay) return;

  state.infoCard = { cardId, slotIndex, tab, ...meta };
  els.cardInfoPreview.innerHTML = '';
  els.cardInfoPreview.appendChild(createCardElement(card));
  els.cardInfoName.textContent = card.name;
  els.cardInfoType.textContent = card.type === 'invocation' ? 'Invocación' : card.type;
  const profile = getAttackProfile(card);
  els.cardInfoDamage.textContent = profile.damage;
  els.cardInfoLife.textContent = card.stats?.life ?? card.stats?.def ?? 0;
  if (els.cardInfoDefense) els.cardInfoDefense.textContent = card.stats?.def ?? 0;
  if (els.cardInfoAttackType) els.cardInfoAttackType.textContent = profile.label;
  if (els.cardInfoRange) els.cardInfoRange.textContent = `${profile.range} casilla${profile.range === 1 ? '' : 's'}`;
  if (els.cardInfoMove) els.cardInfoMove.textContent = card.stats?.mov ?? 0;
  if (els.cardInfoMoveType) els.cardInfoMoveType.textContent = movementLabel(card.movementType);
  if (els.cardInfoBiotype) els.cardInfoBiotype.textContent = card.biotype || 'Sin biotipo';
  if (els.cardInfoCastTime) els.cardInfoCastTime.textContent = card.castPhases ?? 0;
  if (els.cardInfoRestoreTime) els.cardInfoRestoreTime.textContent = card.stats?.restore ?? 0;
  els.cardInfoOverlay.classList.add('open');
  els.cardInfoOverlay.setAttribute('aria-hidden', 'false');
  updateCardInfoAction();
  log(`${card.name}: vista de carta abierta.`);
}

function openKasterInfo(playerId) {
  if (!els.cardInfoOverlay) return;
  const caster = state.players[playerId].caster;
  state.infoCard = { source: 'kaster', playerId };
  els.cardInfoPreview.innerHTML = `<div class="kaster-info-token"><img src="assets/caster-hanzo.png" alt="Kaster"></div>`;
  els.cardInfoName.textContent = `Kaster J${playerId}`;
  els.cardInfoType.textContent = isCasterInOwnSide(playerId) ? 'Kaster · zona aliada' : 'Kaster · zona enemiga: recibe 1 daño por fase';
  els.cardInfoDamage.textContent = caster.atk ?? 0;
  els.cardInfoLife.textContent = `${caster.life ?? 30}/${caster.maxLife ?? 30}`;
  if (els.cardInfoDefense) els.cardInfoDefense.textContent = caster.def ?? 0;
  if (els.cardInfoAttackType) els.cardInfoAttackType.textContent = 'Kaster';
  if (els.cardInfoRange) els.cardInfoRange.textContent = '1 casilla';
  if (els.cardInfoMove) els.cardInfoMove.textContent = TEST_INVOCATION_MOVE_SPEED;
  if (els.cardInfoMoveType) els.cardInfoMoveType.textContent = 'Completa';
  if (els.cardInfoBiotype) els.cardInfoBiotype.textContent = '-';
  if (els.cardInfoCastTime) els.cardInfoCastTime.textContent = isCasterInOwnSide(playerId) ? 'Sí' : 'No';
  if (els.cardInfoRestoreTime) els.cardInfoRestoreTime.textContent = '-';
  els.cardInfoOverlay.classList.add('open');
  els.cardInfoOverlay.setAttribute('aria-hidden', 'false');
  updateCardInfoAction();
}

function openGuardianInfo(playerId, guardianId) {
  const guardian = state.players[playerId].guardians.find(g => g.id === guardianId);
  if (!guardian || !els.cardInfoOverlay) return;
  state.infoCard = { source: 'guardian', playerId, guardianId };
  els.cardInfoPreview.innerHTML = `<div class="guardian-info-token"><img src="assets/guardian-darkness.png" alt="Guardián"></div>`;
  els.cardInfoName.textContent = 'Guardián';
  els.cardInfoType.textContent = 'Estructura defensiva · Resistencia';
  els.cardInfoDamage.textContent = '-';
  els.cardInfoLife.textContent = guardian.resistance ?? 5;
  if (els.cardInfoAttackType) els.cardInfoAttackType.textContent = 'Estructura';
  if (els.cardInfoRange) els.cardInfoRange.textContent = '-';
  if (els.cardInfoMove) els.cardInfoMove.textContent = '-';
  if (els.cardInfoMoveType) els.cardInfoMoveType.textContent = 'Fija';
  if (els.cardInfoBiotype) els.cardInfoBiotype.textContent = '-';
  if (els.cardInfoCastTime) els.cardInfoCastTime.textContent = '-';
  if (els.cardInfoRestoreTime) els.cardInfoRestoreTime.textContent = '-';
  els.cardInfoOverlay.classList.add('open');
  els.cardInfoOverlay.setAttribute('aria-hidden', 'false');
  updateCardInfoAction();
}

function closeCardInfo() {
  if (!els.cardInfoOverlay) return;
  els.cardInfoOverlay.classList.remove('open');
  els.cardInfoOverlay.setAttribute('aria-hidden', 'true');
}

function startKastFromInfo() {
  if (!state.infoCard) return;
  const card = CARD_LIBRARY[state.infoCard.cardId];
  if (state.activePlayer !== LOCAL_PLAYER_ID) {
    log('No puedes kastear durante el turno del rival.');
    updateCardInfoAction();
    return;
  }
  if (currentPhase().id !== 'casting') {
    log('Solo puedes kastear en la fase de Kasteo.');
    updateCardInfoAction();
    return;
  }
  if (!isCasterInOwnSide(LOCAL_PLAYER_ID)) {
    log('El Kaster no puede kastear en la zona enemiga.');
    updateCardInfoAction();
    return;
  }
  if (!canPayCost(localPlayer().resources, card.cost)) {
    log(`No tienes elementos suficientes para kastear ${card.name}.`);
    updateCardInfoAction();
    return;
  }
  const { cardId, slotIndex, tab } = state.infoCard;
  state.selectedCardSlot = slotIndex;
  state.pendingCard = { cardId, slotIndex, tab };
  state.pendingPlacement = null;
  closeCardInfo();
  log(`Elige una casilla alrededor del Kaster para kastear ${CARD_LIBRARY[cardId].name}.`);
  renderAll();
}

function handleKeyDown(event) {
  const key = event.key;

  if (key === 'Escape') {
    closeCardInfo();
    state.selectedMover = null;
    renderAll();
    return;
  }

  if (key === 'Enter') {
    if (state.pendingCard && state.pendingPlacement) confirmCast();
    else nextPhase(false);
    return;
  }

  if (key === '0') {
    state.activeTab = (state.activeTab + 1) % 3;
    clearPendingCast();
    renderAll();
    return;
  }

  if (key === '.') {
    state.activeTab = (state.activeTab + 2) % 3;
    clearPendingCast();
    renderAll();
    return;
  }

  if (state.pendingCard && CASTER_DIRS[key]) {
    selectCasterPlacement(key);
    return;
  }

  const slotIndex = CARD_KEYS.indexOf(key);
  if (slotIndex !== -1) {
    selectCardSlot(slotIndex);
  }
}

function selectCardSlot(slotIndex) {
  const cardId = localPlayer().handTabs[state.activeTab][slotIndex];
  if (!cardId) {
    log('Ese espacio está vacío.');
    return;
  }
  state.selectedCardSlot = slotIndex;
  state.infoCard = { cardId, slotIndex, tab: state.activeTab };
  state.pendingCard = null;
  state.pendingPlacement = null;
  openCardInfo(cardId, slotIndex, state.activeTab);
  renderAll();
}

function selectCasterPlacement(key) {
  const caster = localPlayer().caster;
  const dir = CASTER_DIRS[key];
  const row = caster.row + dir.dr;
  const col = caster.col + dir.dc;
  if (!isInside(row, col)) {
    log('Esa casilla está fuera de la arena.');
    return;
  }
  if (isOccupied(row, col)) {
    log('Esa casilla ya está ocupada.');
    return;
  }
  state.pendingPlacement = { row, col, key };
  log(`Casilla elegida: ${coordLabel(row, col)}. Presiona Enter para confirmar.`);
  renderAll();
}

function handleCellClick(row, col) {
  if (!state.pendingCard && state.selectedMover) {
    if (tryMoveSelectedTo(row, col)) return;
  }
  if (!state.pendingCard) {
    log(`Casilla ${coordLabel(row, col)}.`);
    return;
  }
  if (!isCasterInOwnSide(LOCAL_PLAYER_ID)) {
    log('El Kaster no puede kastear desde la zona enemiga.');
    return;
  }
  const caster = localPlayer().caster;
  const isAround = Math.abs(row - caster.row) <= 1 && Math.abs(col - caster.col) <= 1 && !(row === caster.row && col === caster.col);
  if (!isAround) {
    log('La carta debe colocarse en una de las 8 casillas alrededor del Kaster.');
    return;
  }
  if (isOccupied(row, col)) {
    log('Esa casilla ya está ocupada.');
    return;
  }
  state.pendingPlacement = { row, col, key: '?' };
  confirmCast();
}

function confirmCast() {
  const player = localPlayer();
  const pending = state.pendingCard;
  const card = CARD_LIBRARY[pending.cardId];

  if (!canPayCardCostForPlayer(LOCAL_PLAYER_ID, card)) {
    log(`No tienes elementos suficientes para kastear ${card.name}.`);
    return;
  }

  payCardCostForPlayer(LOCAL_PLAYER_ID, card);
  const spawnId = `spawn_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  player.castQueue.push({
    cardId: card.id,
    remaining: card.castPhases,
    row: state.pendingPlacement.row,
    col: state.pendingPlacement.col,
    justAdded: true,
    introStarted: false,
    introDone: false,
    introEndsAt: 0,
    spawnId,
    originTab: pending.tab,
    originSlot: pending.slotIndex,
  });
  if (card.type === 'invocation') {
    player.spawnMarkers = player.spawnMarkers || [];
    player.spawnMarkers.push({
      id: spawnId,
      cardId: card.id,
      row: state.pendingPlacement.row,
      col: state.pendingPlacement.col,
      owner: state.activePlayer,
      originTab: pending.tab,
      originSlot: pending.slotIndex,
    });
  }
  player.handTabs[pending.tab][pending.slotIndex] = null;
  player.caster.state = 'casting';
  log(`${card.name} entra a zona de kasteo. Tiempo: ${card.castPhases} fases.`);
  state.infoCard = null;
  clearPendingCast();
  renderAll();
}

function clearPendingCast() {
  state.selectedCardSlot = null;
  state.pendingCard = null;
  state.pendingPlacement = null;
}

function canPayCost(resources, cost) {
  return Object.entries(cost).every(([elementId, amount]) => resources.filter(r => r.id === elementId).length >= amount);
}

function payCost(resources, cost) {
  Object.entries(cost).forEach(([elementId, amount]) => {
    let removed = 0;
    for (let i = resources.length - 1; i >= 0 && removed < amount; i--) {
      if (resources[i].id === elementId) {
        resources.splice(i, 1);
        removed++;
      }
    }
  });
}

function canPayCardCostForPlayer(playerId, card) {
  const player = state.players[playerId];
  if (!player || !card) return false;
  if (canPayCost(player.resources, card.cost || {})) return true;
  const ownerElement = getPlayerElement(playerId)?.id;
  const needed = totalCost(card.cost || {});
  return needed > 0 && player.resources.filter(res => res.id === ownerElement).length >= needed;
}

function payCardCostForPlayer(playerId, card) {
  const player = state.players[playerId];
  if (!player || !card) return false;
  if (canPayCost(player.resources, card.cost || {})) {
    payCost(player.resources, card.cost || {});
    return true;
  }
  const ownerElement = getPlayerElement(playerId)?.id;
  const needed = totalCost(card.cost || {});
  let removed = 0;
  for (let i = player.resources.length - 1; i >= 0 && removed < needed; i--) {
    if (player.resources[i].id === ownerElement) {
      player.resources.splice(i, 1);
      removed++;
    }
  }
  return removed === needed;
}

function checkRiskZoneAttack(playerId, unit) {
  if (!unit || unit.status === 'restoring') return false;
  const riskRow = getEnemyRiskRow(playerId);
  if (unit.row !== riskRow) return false;
  const card = CARD_LIBRARY[unit.cardId];
  log(`${card?.name || 'Invocación'} ataca la zona de riesgo y extrae 1 carta extra.`);
  animateExtractionCard(playerId, drawElementCard(playerId), 0).then(() => renderAll());
  restoreInvocation(playerId, unit, 'zona de riesgo');
  state.selectedMover = null;
  renderAll();
  return true;
}

function restoreInvocation(playerId, unit, reason = 'restauración') {
  const marker = state.players[playerId].spawnMarkers.find(m => m.id === unit.spawnId);
  if (marker) { animateRestoreInvocationToSpawn(playerId, unit, marker); unit.row = marker.row; unit.col = marker.col; }
  const card = CARD_LIBRARY[unit.cardId];
  unit.status = 'restoring';
  unit.restoreRemaining = card?.stats?.restore ?? TEST_RESTORE_PHASES;
  unit.movesLeft = 0;
  unit.hp = card?.stats?.life ?? unit.hp ?? 1;
  log(`${card?.name || 'Invocación'} vuelve a su punto de restauración por ${reason}.`);
}

function applyDamageToCaster(playerId, amount, reason = '') {
  const caster = state.players[playerId].caster;
  caster.life = Math.max(0, (caster.life ?? 30) - amount);
  showFloatingDamageAt(caster.row, caster.col, amount);
  if (reason) log(`${reason}: Kaster J${playerId} recibe ${amount} daño.`);
}

function showFloatingDamageAt(row, col, amount) {
  const pos = cellCenter(row, col);
  const div = document.createElement('div');
  div.className = 'floating-damage';
  div.textContent = typeof amount === 'number' ? `-${amount}` : String(amount);
  div.style.left = `${pos.x}%`;
  div.style.top = `${pos.y}%`;
  els.boardContent.appendChild(div);
  setTimeout(() => div.remove(), 920);
}

function findAiCastCandidate(playerId) {
  const player = state.players[playerId];
  for (let tab = 0; tab < player.handTabs.length; tab++) {
    const cards = player.handTabs[tab] || [];
    for (let slot = 0; slot < cards.length; slot++) {
      const cardId = cards[slot];
      const card = CARD_LIBRARY[cardId];
      if (card && card.type === 'invocation' && canPayCardCostForPlayer(playerId, card)) {
        return { cardId, tab, slot, card };
      }
    }
  }
  return null;
}

function getCasterAdjacentFreeCells(playerId) {
  const caster = state.players[playerId].caster;
  const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  return dirs
    .map(([dr, dc]) => ({ row: caster.row + dr, col: caster.col + dc, dr, dc }))
    .filter(cell => isInside(cell.row, cell.col) && !isOccupied(cell.row, cell.col));
}

function chooseAiCastCell(playerId) {
  const options = getCasterAdjacentFreeCells(playerId);
  if (!options.length) return null;
  const pressureRow = getEnemyRiskRow(playerId);
  return options.sort((a, b) => {
    const da = Math.abs(a.row - pressureRow) + Math.abs(a.col - 4);
    const db = Math.abs(b.row - pressureRow) + Math.abs(b.col - 4);
    return da - db;
  })[0];
}

function aiConfirmCast(playerId, candidate, cell) {
  const player = state.players[playerId];
  const card = candidate.card;
  if (!cell || !payCardCostForPlayer(playerId, card)) return false;
  const spawnId = `spawn_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  player.castQueue.push({
    cardId: card.id,
    remaining: card.castPhases,
    row: cell.row,
    col: cell.col,
    justAdded: true,
    introStarted: false,
    introDone: false,
    introEndsAt: 0,
    spawnId,
    originTab: candidate.tab,
    originSlot: candidate.slot,
  });
  player.spawnMarkers = player.spawnMarkers || [];
  player.spawnMarkers.push({ id: spawnId, cardId: card.id, row: cell.row, col: cell.col, owner: playerId, originTab: candidate.tab, originSlot: candidate.slot });
  player.handTabs[candidate.tab][candidate.slot] = null;
  player.caster.state = 'casting';
  log(`IA J${playerId}: kastea ${card.name} en ${coordLabel(cell.row, cell.col)}.`);
  return true;
}

async function runEnemyCastingPhase(playerId) {
  if (state.aiThinking) return;
  state.aiThinking = true;
  renderPhaseUI();
  await sleep(520);
  try {
    const candidate = findAiCastCandidate(playerId);
    const cell = candidate ? chooseAiCastCell(playerId) : null;
    if (candidate && cell && isCasterInOwnSide(playerId)) {
      aiConfirmCast(playerId, candidate, cell);
      renderAll();
      await sleep(820);
    } else {
      log(`IA J${playerId}: no tiene kasteo útil ahora.`);
      await sleep(520);
    }
  } finally {
    state.aiThinking = false;
    renderPhaseUI();
    nextPhase(true);
  }
}

function getInvocationMoveOptions(playerId, unit) {
  if (!unit || unit.status === 'restoring' || isUnitEngaged(unit) || (unit.movesLeft ?? 0) <= 0) return [];
  const deltas = playerId === 1 ? [[-1,-1],[-1,0],[-1,1]] : [[1,-1],[1,0],[1,1]];
  return deltas
    .map(([dr, dc]) => ({ row: unit.row + dr, col: unit.col + dc, dr, dc }))
    .filter(opt => isInside(opt.row, opt.col) && !isOccupied(opt.row, opt.col));
}

function distance(aRow, aCol, bRow, bCol) {
  return Math.abs(aRow - bRow) + Math.abs(aCol - bCol);
}

function getAiUnitTarget(playerId, unit) {
  const enemyId = playerId === 1 ? 2 : 1;
  const enemy = state.players[enemyId];
  const own = state.players[playerId];
  const activeEnemyUnits = enemy.units.filter(u => u.status !== 'restoring');
  if (activeEnemyUnits.length) {
    return activeEnemyUnits
      .map(u => ({ row: u.row, col: u.col, label: 'amenaza enemiga', score: distance(unit.row, unit.col, u.row, u.col) }))
      .sort((a, b) => a.score - b.score)[0];
  }
  const threatenedGuardian = own.guardians
    .filter(g => g.active)
    .map(g => ({ row: g.row, col: g.col, label: 'guardián', score: distance(unit.row, unit.col, g.row, g.col) }))
    .sort((a, b) => a.score - b.score)[0];
  if (threatenedGuardian && threatenedGuardian.score <= 3) return threatenedGuardian;
  if (enemy.caster) return { row: enemy.caster.row, col: enemy.caster.col, label: 'Kaster rival', score: 0 };
  return { row: getEnemyRiskRow(playerId), col: 4, label: 'zona de riesgo', score: 0 };
}

async function aiMoveUnitToward(playerId, unit) {
  let safety = TEST_INVOCATION_MOVE_SPEED + 2;
  while (unit && unit.status !== 'restoring' && (unit.movesLeft ?? 0) > 0 && safety-- > 0) {
    if (await aiTryAttackWithUnit(playerId, unit)) { await sleep(420); break; }
    const options = getInvocationMoveOptions(playerId, unit);
    if (!options.length) break;
    const target = getAiUnitTarget(playerId, unit);
    const chosen = options.sort((a, b) => {
      const da = distance(a.row, a.col, target.row, target.col);
      const db = distance(b.row, b.col, target.row, target.col);
      if (da !== db) return da - db;
      return Math.abs(a.col - 4) - Math.abs(b.col - 4);
    })[0];
    unit.row = chosen.row;
    unit.col = chosen.col;
    unit.movesLeft = Math.max(0, (unit.movesLeft ?? 0) - 1);
    log(`IA J${playerId}: ${CARD_LIBRARY[unit.cardId]?.name || 'Invocación'} avanza hacia ${target.label}.`);
    renderAll();
    await sleep(170);
    if (await aiTryAttackWithUnit(playerId, unit)) { await sleep(420); break; }
    if (checkRiskZoneAttack(playerId, unit)) {
      await sleep(520);
      break;
    }
    const enemyId = playerId === 1 ? 2 : 1;
    if (distance(unit.row, unit.col, state.players[enemyId].caster.row, state.players[enemyId].caster.col) <= 1) break;
  }
}

function getCasterMoveOptionsForAi(playerId) {
  const caster = state.players[playerId].caster;
  const deltas = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  return deltas
    .map(([dr, dc]) => ({ row: caster.row + dr, col: caster.col + dc }))
    .filter(opt => isInside(opt.row, opt.col) && !isOccupied(opt.row, opt.col) && (playerId === 1 ? opt.row >= 9 : opt.row <= 8));
}

async function aiDefensiveCasterStep(playerId) {
  const enemyId = playerId === 1 ? 2 : 1;
  const caster = state.players[playerId].caster;
  const threats = state.players[enemyId].units.filter(u => u.status !== 'restoring');
  if (!threats.length || (caster.movesLeft ?? 0) <= 0) return;
  const nearestThreatDistance = Math.min(...threats.map(u => distance(caster.row, caster.col, u.row, u.col)));
  if (nearestThreatDistance > 3) return;
  const options = getCasterMoveOptionsForAi(playerId);
  if (!options.length) return;
  const chosen = options.sort((a, b) => {
    const da = Math.min(...threats.map(u => distance(a.row, a.col, u.row, u.col)));
    const db = Math.min(...threats.map(u => distance(b.row, b.col, u.row, u.col)));
    return db - da;
  })[0];
  caster.row = chosen.row;
  caster.col = chosen.col;
  caster.movesLeft = Math.max(0, (caster.movesLeft ?? 0) - 1);
  log(`IA J${playerId}: el Kaster se reposiciona para defenderse.`);
  renderAll();
  await sleep(260);
}

async function runEnemyResolutionPhase(playerId) {
  if (state.aiThinking) return;
  state.aiThinking = true;
  renderPhaseUI();
  await sleep(520);
  try {
    prepareResolutionMoves(playerId);
    renderAll();
    await aiDefensiveCasterStep(playerId);
    const units = [...state.players[playerId].units].filter(unit => unit.status !== 'restoring');
    for (const unit of units) {
      await aiMoveUnitToward(playerId, unit);
    }
    await sleep(500);
  } finally {
    state.selectedMover = null;
    state.aiThinking = false;
    renderPhaseUI();
    nextPhase(true);
  }
}

function renderAll() {
  applyFountainColors();
  renderPhaseUI();
  renderCards();
  renderResources();
  renderCastQueue();
  renderGridHighlights();
  renderSpawnMarkers();
  renderMoveOptions();
  renderUnits();
  renderCasterStats();
  updateCardInfoAction();
}

function renderPhaseUI() {
  const waitingPlayer = state.activePlayer === 1 ? 2 : 1;
  document.querySelectorAll('.phase-box').forEach((box) => {
    const phaseId = box.dataset.phaseId;
    box.className = 'phase-box';
    if (phaseId === currentPhase().id) box.classList.add('active', state.activePlayer === 1 ? 'p1' : 'p2');
    if (phaseId === 'wait') box.classList.add('active', waitingPlayer === 1 ? 'p1' : 'p2', 'waiting');
  });
  if (els.turnBanner) {
    els.turnBanner.textContent = `J${state.activePlayer} · ${currentPhase().label} / J${waitingPlayer} espera`;
  }
  els.boardContent.classList.toggle('player-p1', state.activePlayer === 1);
  els.boardContent.classList.toggle('player-p2', state.activePlayer === 2);
  if (els.p1Life) els.p1Life.textContent = state.players[1].life;
  if (els.p1ElementCount) els.p1ElementCount.textContent = state.players[1].resources.length;
  document.querySelectorAll('.deck-tab').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.tab) === state.activeTab);
  });
  if (els.nextPhaseBtn) els.nextPhaseBtn.disabled = state.extractionAnimating || state.aiThinking || (state.aiEnabled && state.activePlayer !== LOCAL_PLAYER_ID);
}

function renderCards() {
  const tab = localPlayer().handTabs[state.activeTab] || [];
  els.cardGrid.innerHTML = '';
  for (let i = 0; i < 12; i++) {
    const slot = document.createElement('div');
    slot.className = 'card-slot';
    if (i === state.selectedCardSlot) slot.classList.add('selected');
    const key = document.createElement('span');
    key.className = 'key-label';
    key.textContent = CARD_KEYS[i];
    slot.appendChild(key);
    const cardId = tab[i];
    if (cardId) {
      slot.appendChild(createCardElement(CARD_LIBRARY[cardId]));
      slot.addEventListener('click', () => selectCardSlot(i));
    } else {
      slot.classList.add('empty');
    }
    els.cardGrid.appendChild(slot);
  }
}

function createCardElement(card) {
  const wrap = document.createElement('div');
  wrap.className = 'card';
  wrap.innerHTML = `
    <img class="card-layer card-bg" src="${card.bgImage}" alt="fondo">
    <img class="card-layer card-art" src="${card.artImage}" alt="arte">
    <img class="card-layer card-skin" src="${card.skinImage}" alt="skin">
    <span class="card-cost">${totalCost(card.cost)}</span>
  `;
  return wrap;
}

function renderResources() {
  const resources = localPlayer().resources;
  els.resourceBar.innerHTML = '';
  resources.forEach(res => {
    const orb = document.createElement('div');
    orb.className = 'orb';
    orb.style.setProperty('--orb-color', res.color);
    orb.dataset.type = res.label;
    els.resourceBar.appendChild(orb);
  });
}


function finalizeCastIntro(playerId, spawnId) {
  const item = findQueuedItemBySpawn(playerId, spawnId);
  if (!item || item.introDone) return;
  item.justAdded = false;
  item.introDone = true;
  item.introStarted = false;
  item.introEndsAt = 0;
  renderAll();
}

function scheduleCastIntroFinish(playerId, spawnId, duration = 940) {
  const item = findQueuedItemBySpawn(playerId, spawnId);
  if (!item || item.introTimerSet) return;
  item.introTimerSet = true;
  item.introEndsAt = Date.now() + duration;
  window.setTimeout(() => {
    const queued = findQueuedItemBySpawn(playerId, spawnId);
    if (queued) queued.introTimerSet = false;
    finalizeCastIntro(playerId, spawnId);
  }, duration);
}

function renderCastQueue() {
  const queue = currentPlayer().castQueue;
  els.castQueue.innerHTML = '';
  queue.forEach(item => {
    const card = CARD_LIBRARY[item.cardId];
    const div = document.createElement('div');
    div.className = 'cast-item';
    div.dataset.spawnId = item.spawnId || '';
    div.dataset.playerId = String(state.activePlayer);
    div.title = `${card.name}: ${item.remaining} fases`;
    div.innerHTML = `
      <img src="${card.tokenImage}" alt="${card.name}">
      <div class="cast-status">
        <span class="cast-icon-badge big">⌛<span class="cast-corner-number">${item.remaining}</span></span>
      </div>`;

    const introExpired = Boolean(item.introEndsAt && Date.now() >= item.introEndsAt);
    if (introExpired) {
      item.justAdded = false;
      item.introDone = true;
      item.introStarted = false;
      item.introEndsAt = 0;
    }

    if (item.justAdded && !item.introDone && !item.introStarted) {
      item.introStarted = true;
      div.classList.add('entering', 'intro-locked');
      scheduleCastIntroFinish(state.activePlayer, item.spawnId, 940);
      div.addEventListener('animationend', (event) => {
        if (event.animationName !== 'kastDropLanding') return;
        finalizeCastIntro(state.activePlayer, item.spawnId);
      }, { once: true });
    } else if (!item.introDone) {
      // Si otro render ocurre mientras la animación aún está viva, NO se reinicia.
      // La ficha queda bloqueada hasta que el timer original finalice la intro.
      div.classList.add('intro-locked');
    } else {
      item.justAdded = false;
      item.introDone = true;
      item.introStarted = false;
      attachLinkHoverHandlers(div, item.spawnId, state.activePlayer, 'queue');
    }

    els.castQueue.appendChild(div);
  });
}

function renderGridHighlights() {
  const castingActive = Boolean(state.pendingCard);
  els.enemyGrid.classList.toggle('casting-active', castingActive);
  els.allyGrid.classList.toggle('casting-active', castingActive);
  document.querySelectorAll('.cell').forEach(cell => {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    cell.classList.remove('caster-zone', 'selected-place', 'occupied');
    if (isOccupied(row, col)) cell.classList.add('occupied');
    if (state.pendingCard) {
      const caster = currentPlayer().caster;
      const isAround = Math.abs(row - caster.row) <= 1 && Math.abs(col - caster.col) <= 1 && !(row === caster.row && col === caster.col);
      if (isAround && !isOccupied(row, col)) cell.classList.add('caster-zone');
    }
    if (state.pendingPlacement && state.pendingPlacement.row === row && state.pendingPlacement.col === col) {
      cell.classList.add('selected-place');
    }
  });
}

function renderSpawnMarkers() {
  if (!els.spawnMarkersLayer) return;
  els.spawnMarkersLayer.innerHTML = '';
  for (const playerId of [1, 2]) {
    const player = state.players[playerId];
    (player.spawnMarkers || []).forEach(marker => {
      const card = CARD_LIBRARY[marker.cardId];
      if (!card) return;
      const pos = cellCenter(marker.row, marker.col);
      const holder = document.createElement('div');
      holder.className = 'spawn-marker';
      holder.dataset.spawnId = marker.id;
      holder.dataset.playerId = String(playerId);
      holder.style.left = `${pos.x}%`;
      holder.style.top = `${pos.y}%`;
      holder.style.zIndex = String(100 + marker.row);
      const element = getCardPrimaryElement(card);
      holder.style.setProperty('--marker-glow', element?.color || '#ffffff');
      holder.title = `${card.name} · Punto de respawn en ${coordLabel(marker.row, marker.col)}`;
      const mini = createCardElement(card);
      mini.classList.add('mini');
      holder.appendChild(mini);
      const queued = findQueuedItemBySpawn(playerId, marker.id);
      if (queued) {
        holder.classList.add('waiting');
        if (!isCastIntroReady(playerId, marker.id)) holder.classList.add('intro-locked');
        const status = document.createElement('div');
        status.className = 'spawn-status';
        status.innerHTML = `<span class="cast-icon-badge big">⌛<span class="cast-corner-number">${queued.remaining}</span></span>`;
        holder.appendChild(status);
      }
      attachLinkHoverHandlers(holder, marker.id, playerId, 'marker');
      els.spawnMarkersLayer.appendChild(holder);
    });
  }
}

function renderMoveOptions() {
  if (!els.moveOptionsLayer) return;
  els.moveOptionsLayer.innerHTML = '';
  const options = getSelectedMoverOptions();
  options.forEach(opt => {
    const pos = cellCenter(opt.row, opt.col);
    const arrow = MOVE_ARROW_BY_DELTA[`${opt.dr},${opt.dc}`];
    const size = getBoardCellSizePercent(opt.row);
    const div = document.createElement('button');
    div.type = 'button';
    div.className = 'move-option';
    div.style.left = `${pos.x}%`;
    div.style.top = `${pos.y}%`;
    div.style.width = `${size.width}%`;
    div.style.height = `${size.height}%`;
    div.title = `Mover a ${coordLabel(opt.row, opt.col)}`;
    div.innerHTML = `<img src="${arrow}" alt="Mover a ${coordLabel(opt.row, opt.col)}">`;
    div.addEventListener('click', (event) => {
      event.stopPropagation();
      tryMoveSelectedTo(opt.row, opt.col);
    });
    els.moveOptionsLayer.appendChild(div);
  });
}

function renderUnits() {
  els.unitsLayer.innerHTML = '';
  for (const playerId of [1, 2]) {
    const player = state.players[playerId];
    renderUnit(player.caster.row, player.caster.col, 'caster', 'assets/caster-hanzo.png', `Kaster J${playerId}`, playerId, null, '#9b4dff');
    player.guardians.forEach((g, index) => renderUnit(g.row, g.col, 'guardian', 'assets/guardian-darkness.png', `Guardián ${index + 1} · RES ${g.resistance ?? 5}`, playerId, null, getOwnerColor(playerId), null, g.id));
    player.units.forEach(unit => {
      const card = CARD_LIBRARY[unit.cardId];
      const element = getCardPrimaryElement(card);
      renderUnit(unit.row, unit.col, 'invocation', card.tokenImage, card.name, playerId, unit.spawnId, element?.color || '#ffffff', unit.id);
    });
  }
}

function renderUnit(row, col, type, src, label, playerId = null, spawnId = null, glowColor = '#ffffff', unitId = null, guardianId = null) {
  const div = document.createElement('div');
  div.className = `unit ${type}`;
  div.dataset.row = String(row);
  div.dataset.col = String(col);
  div.dataset.type = type;
  if (playerId !== null) div.dataset.playerId = String(playerId);
  if (spawnId) div.dataset.spawnId = spawnId;
  if (unitId) div.dataset.unitId = unitId;
  if (guardianId) div.dataset.guardianId = guardianId;
  div.style.setProperty('--unit-glow', glowColor || '#ffffff');
  const unitState = unitId && playerId ? state.players[playerId].units.find(u => u.id === unitId) : null;
  if (unitState?.status === 'restoring') {
    div.classList.add('restoring');
    div.style.setProperty('--restore-color', getOwnerColor(playerId));
  }
  if (unitState?.engagedWith) div.classList.add('engaged');
  if (state.selectedMover && state.selectedMover.playerId === playerId) {
    if ((type === 'caster' && state.selectedMover.type === 'caster') || (type === 'invocation' && state.selectedMover.type === 'invocation' && state.selectedMover.unitId === unitId)) {
      div.classList.add('selected-mover');
    }
  }
  div.title = `${label} · ${coordLabel(row, col)}`;
  const pos = cellCenter(row, col);
  div.style.left = `${pos.x}%`;
  div.style.top = `${pos.y}%`;
  div.style.zIndex = String(200 + row);
  div.innerHTML = `<img src="${src}" alt="${label}"><button type="button" class="unit-hitbox" aria-label="${label} en ${coordLabel(row, col)}"></button>`;
  if (type === 'guardian' && guardianId) {
    const g = state.players[playerId].guardians.find(item => item.id === guardianId);
    const badge = document.createElement('div');
    badge.className = 'resistance-status';
    badge.innerHTML = `<span class="cast-icon-badge big resistance-icon-badge"><span class="brick-shield" aria-hidden="true"></span><span class="cast-corner-number resistance-corner-number">${g?.resistance ?? 5}</span></span>`;
    div.appendChild(badge);
  }
  if (type === 'invocation' && unitState) {
    const card = CARD_LIBRARY[unitState.cardId];
    const damage = unitState.damage ?? card?.attackProfile?.damage ?? card?.stats?.damage ?? 0;
    const life = unitState.hp ?? card?.stats?.life ?? 0;
    const badge = document.createElement('div');
    badge.className = 'invocation-stat-status';
    badge.innerHTML = `
      <span class="unit-stat-icon-badge unit-damage-badge" title="Daño">
        <span class="unit-sword-icon" aria-hidden="true"></span>
        <span class="unit-stat-corner-number">${damage}</span>
      </span>
      <span class="unit-stat-icon-badge unit-life-badge" title="Vida">
        <span class="unit-heart-icon" aria-hidden="true"></span>
        <span class="unit-stat-corner-number">${life}</span>
      </span>`;
    div.appendChild(badge);
  }
  if (unitState?.status === 'restoring') {
    const badge = document.createElement('div');
    badge.className = 'restore-badge';
    badge.innerHTML = `⌛<strong>${unitState.restoreRemaining ?? 0}</strong>`;
    div.appendChild(badge);
  }

  const hitbox = div.querySelector('.unit-hitbox');
  hitbox.addEventListener('click', (event) => {
    event.stopPropagation();
    const selectedSource = getSourceUnitFromSelection();
    if (currentPhase().id === 'resolution' && selectedSource && playerId !== selectedSource.playerId) {
      if (type === 'caster') { showTargetMenu(buildTarget('caster', playerId)); return; }
      if (type === 'guardian' && guardianId) { showTargetMenu(buildTarget('guardian', playerId, { guardianId })); return; }
      if (type === 'invocation' && unitId) { showTargetMenu(buildTarget('invocation', playerId, { unitId })); return; }
    }
    clearCombatMenus();
    if (currentPhase().id === 'resolution' && playerId === state.activePlayer && (!state.aiEnabled || playerId === LOCAL_PLAYER_ID)) {
      if (type === 'caster') {
        selectMover('caster', playerId);
        renderAll();
        return;
      }
      if (type === 'invocation' && unitId) {
        selectMover('invocation', playerId, unitId);
        renderAll();
        return;
      }
    }
    if (type === 'invocation' && unitId) {
      const unit = state.players[playerId].units.find(u => u.id === unitId);
      if (unit) openCardInfo(unit.cardId, null, null, { source: 'arena', playerId, unitId });
      return;
    }
    if (type === 'caster') { openKasterInfo(playerId); return; }
    if (type === 'guardian' && guardianId) { openGuardianInfo(playerId, guardianId); return; }
    log(`${label} en ${coordLabel(row, col)}.`);
  });

  hitbox.addEventListener('mouseenter', () => div.classList.add('unit-hovered'));
  hitbox.addEventListener('mouseleave', () => div.classList.remove('unit-hovered'));

  if (type === 'invocation' && spawnId && playerId !== null) {
    attachLinkHoverHandlers(hitbox, spawnId, playerId, 'unit');
  }
  els.unitsLayer.appendChild(div);
}

function renderCasterStats() {
  const caster = currentPlayer().caster;
  els.casterAtk.textContent = caster.atk;
  els.casterDef.textContent = caster.def;
  els.casterCast.textContent = currentPlayer().castQueue.length ? 'Kasteando' : 'Libre';
  els.casterState.textContent = currentPlayer().castQueue.length ? 'No ataca / No defiende' : 'Listo';
}

function cellCenter(row, col) {
  const boardRect = els.boardContent.getBoundingClientRect();
  const gridEl = row >= 9 ? els.allyGrid : els.enemyGrid;
  const gridRect = gridEl.getBoundingClientRect();
  const localRow = row >= 9 ? row - 9 : row;
  return {
    x: ((gridRect.left - boardRect.left) + ((col + 0.5) / 9) * gridRect.width) / boardRect.width * 100,
    y: ((gridRect.top - boardRect.top) + ((localRow + 0.5) / 9) * gridRect.height) / boardRect.height * 100,
  };
}

function isInside(row, col) { return row >= 0 && row < 18 && col >= 0 && col < 9; }

function isOccupied(row, col) {
  for (const id of [1, 2]) {
    const p = state.players[id];
    if (p.caster && p.caster.row === row && p.caster.col === col) return true;
    if (p.guardians.some(g => g.row === row && g.col === col && g.active)) return true;
    if (p.units.some(u => u.row === row && u.col === col)) return true;
  }
  return false;
}

function coordLabel(row, col) {
  // Numeración simple por grid: A1 inicia arriba-izquierda en CADA grid.
  const localRow = row >= 9 ? row - 8 : row + 1;
  const localCol = String.fromCharCode(65 + col);
  return `${localCol}${localRow}`;
}

function totalCost(cost) { return Object.values(cost).reduce((a, b) => a + b, 0); }

function log(message) { els.systemLog.textContent = message; }

function hexToRgbParts(hex) {
  const clean = String(hex || '#9b4dff').replace('#', '').trim();
  const full = clean.length === 3 ? clean.split('').map(ch => ch + ch).join('') : clean;
  const value = parseInt(full, 16);
  if (!Number.isFinite(value)) return '155, 77, 255';
  return `${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}`;
}

function getTransitionColorForPlayer(playerId) {
  // Por ahora el color de transición sigue el lado/energía activa.
  // J1 usa Oscuridad; J2 usa su color rival provisional.
  return playerId === 1 ? '#9b4dff' : '#c63b3b';
}

function showTransition(text, ms = 1050, playerId = state.activePlayer) {
  const line = document.querySelector('.battle-center-line');
  let centerX = window.innerWidth / 2;
  let centerY = window.innerHeight / 2;
  if (line) {
    const rect = line.getBoundingClientRect();
    centerX = rect.left + rect.width / 2;
    centerY = rect.top + rect.height / 2;
  }

  const phaseColor = getTransitionColorForPlayer(playerId);
  els.transitionText.textContent = text;
  els.transitionText.classList.toggle('p2', playerId === 2);
  els.transitionText.classList.remove('fly-phase', 'pinned-top');
  els.transitionText.style.left = `${centerX}px`;
  els.transitionText.style.top = `${centerY}px`;
  els.transitionText.style.setProperty('--phase-rgb', hexToRgbParts(phaseColor));
  els.transitionText.style.setProperty('--phase-color', phaseColor);

  els.transitionOverlay.classList.add('show');
  requestAnimationFrame(() => {
    const rect = els.transitionText.getBoundingClientRect();
    const margin = 18;
    const isOut = rect.top < margin || rect.left < margin || rect.right > window.innerWidth - margin || rect.bottom > window.innerHeight - margin;
    if (isOut) {
      els.transitionText.classList.add('pinned-top');
      els.transitionText.style.left = '50%';
      els.transitionText.style.top = '72px';
    }

    void els.transitionText.offsetWidth;
    els.transitionText.classList.add('fly-phase');
  });

  clearTimeout(showTransition.timer);
  showTransition.timer = setTimeout(() => {
    els.transitionText.classList.remove('fly-phase', 'pinned-top');
    els.transitionOverlay.classList.remove('show');
  }, ms);
}

function queueTransitions(items) {
  if (!Array.isArray(items) || !items.length) return;
  clearTimeout(queueTransitions.timer);
  let delay = 0;
  items.forEach((item, index) => {
    const duration = item.duration ?? 860;
    setTimeout(() => showTransition(item.text, duration, item.playerId ?? state.activePlayer), delay);
    delay += duration;
  });
}

function readRootNumber(name, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}


function getBoardCellSizePercent(row) {
  const enemyWidth = readRootNumber('--enemy-grid-width', 53.7);
  const enemyHeight = readRootNumber('--enemy-grid-height', 34.5);
  const allyWidth = readRootNumber('--ally-grid-width', 53.7);
  const allyHeight = readRootNumber('--ally-grid-height', 39.5);
  if (row < 9) {
    return { width: enemyWidth / 9, height: enemyHeight / 9 };
  }
  return { width: allyWidth / 9, height: allyHeight / 9 };
}

function adjustCssNumber(name, delta, min, max) {
  const current = readRootNumber(name, 1);
  const next = Math.min(max, Math.max(min, current + delta));
  document.documentElement.style.setProperty(name, String(Number(next.toFixed(2))));
  renderUnits();
}

function adjustGridOpacity(delta) {
  const line = readRootNumber('--cell-line-opacity', 0.28);
  const outline = readRootNumber('--calibration-opacity', 0.22);
  const nextLine = Math.min(0.85, Math.max(0.02, line + delta));
  const nextOutline = Math.min(0.85, Math.max(0.02, outline + delta));
  document.documentElement.style.setProperty('--cell-line-opacity', String(Number(nextLine.toFixed(2))));
  document.documentElement.style.setProperty('--calibration-opacity', String(Number(nextOutline.toFixed(2))));
}

function adjustLineOpacity(delta) {
  const risk = readRootNumber('--risk-line-opacity', 0.55);
  const center = readRootNumber('--battle-center-opacity', 0.72);
  const nextRisk = Math.min(1, Math.max(0, risk + delta));
  const nextCenter = Math.min(1, Math.max(0, center + delta));
  document.documentElement.style.setProperty('--risk-line-opacity', String(Number(nextRisk.toFixed(2))));
  document.documentElement.style.setProperty('--battle-center-opacity', String(Number(nextCenter.toFixed(2))));
}

function writeRootValue(name, value) {
  document.documentElement.style.setProperty(name, value);
}

const boardView = {
  zoom: 1,
  panX: 0,
  panY: 0,
  dragging: false,
  startX: 0,
  startY: 0,
  startPanX: 0,
  startPanY: 0,
};

function resetBoardViewToPanoramic() {
  boardView.zoom = 1;
  boardView.panX = 0;
  boardView.panY = 0;
  boardView.dragging = false;
  writeRootValue('--board-zoom', '1');
  writeRootValue('--board-pan-x', '0px');
  writeRootValue('--board-pan-y', '0px');
  if (els.board) els.board.classList.remove('is-panning');
  renderUnits();
}

function bindBoardZoomAndPan() {
  els.board.addEventListener('wheel', (event) => {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    boardView.zoom = Math.min(2.2, Math.max(0.75, boardView.zoom + direction * 0.08));
    writeRootValue('--board-zoom', String(Number(boardView.zoom.toFixed(2))));
    renderUnits();
  }, { passive: false });

  // Evita que el botón central active auto-scroll del navegador.
  els.board.addEventListener('auxclick', (event) => {
    if (event.button === 1) event.preventDefault();
  });

  els.board.addEventListener('pointerdown', (event) => {
    // IMPORTANTE:
    // Click izquierdo NO arrastra la arena. Queda reservado para casillas/fichas.
    // Solo el botón central del mouse permite desplazar/pan.
    if (event.button !== 1) return;

    event.preventDefault();
    boardView.dragging = true;
    boardView.startX = event.clientX;
    boardView.startY = event.clientY;
    boardView.startPanX = boardView.panX;
    boardView.startPanY = boardView.panY;
    els.board.setPointerCapture(event.pointerId);
    els.board.classList.add('is-panning');
  });

  els.board.addEventListener('pointermove', (event) => {
    if (!boardView.dragging) return;
    event.preventDefault();
    boardView.panX = boardView.startPanX + (event.clientX - boardView.startX);
    boardView.panY = boardView.startPanY + (event.clientY - boardView.startY);
    writeRootValue('--board-pan-x', `${Math.round(boardView.panX)}px`);
    writeRootValue('--board-pan-y', `${Math.round(boardView.panY)}px`);
    renderUnits();
  });

  function endDrag(event) {
    if (!boardView.dragging) return;
    boardView.dragging = false;
    els.board.classList.remove('is-panning');
    try { els.board.releasePointerCapture(event.pointerId); } catch (_) {}
  }

  els.board.addEventListener('pointerup', endDrag);
  els.board.addEventListener('pointercancel', endDrag);

  // Doble click: acerca al máximo tomando como centro la coordenada clickeada.
  // Si ya está al máximo, vuelve a tamaño normal.
  els.board.addEventListener('dblclick', (event) => {
    const maxZoom = 2.2;
    const rect = els.board.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;

    if (boardView.zoom < maxZoom - 0.05) {
      boardView.zoom = maxZoom;
      boardView.panX = (rect.width / 2 - localX) * maxZoom;
      boardView.panY = (rect.height / 2 - localY) * maxZoom;
    } else {
      boardView.zoom = 1;
      boardView.panX = 0;
      boardView.panY = 0;
    }

    writeRootValue('--board-zoom', String(Number(boardView.zoom.toFixed(2))));
    writeRootValue('--board-pan-x', `${Math.round(boardView.panX)}px`);
    writeRootValue('--board-pan-y', `${Math.round(boardView.panY)}px`);
    renderAll();
  });
}

window.addEventListener('resize', renderUnits);
window.addEventListener('DOMContentLoaded', init);
