// Adaptador "Memoria del Operador" (equivale a DataStore en Roblox / Steam Cloud en PC).
// localStorage puede fallar (modo privado, previews): siempre con try/catch y valores por defecto.
const KEY = 'plotzero.memory.v1';
const DEFAULT = { globalCycle: 4817, runs: 0, endings: {}, badges: [], operator: '', lastAwakened: null };

export function loadMemory() {
  try { const raw = localStorage.getItem(KEY); return raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT }; }
  catch { return { ...DEFAULT }; }
}
export function saveMemory(mem) { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch { /* sin almacenamiento */ } }
export function wipeMemory() { try { localStorage.removeItem(KEY); } catch { } return { ...DEFAULT }; }
