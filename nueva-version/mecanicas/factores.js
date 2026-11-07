// Registro para implementaciones lógicas reutilizables de factores.
export const factorHandlers = new Map();

// Entrada estable para el motor compartido. Se conservan los handlers heredados
// hasta migrarlos factor por factor sin duplicar efectos.
export {
 FACTOR_LAYERS,FACTOR_COLORS,factorDefinition,describeFactor,
 createFactorInstance,factorBlocks,absorbFactorDamage,stepFactor
} from '../compartido/factores-core.js';
