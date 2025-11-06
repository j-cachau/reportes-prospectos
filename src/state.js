// src/state.js
export let RAW_PROS = [], RAW_LLAM = []; // CSV completos
export let PROS = [], LLAM = [];         // filtrados por rango
export let RANGE = { type:'30d', from:null, to:null };

export function setRaw(p,l){ RAW_PROS = p; RAW_LLAM = l; }
export function setFiltered(p,l){ PROS = p; LLAM = l; }
export function setRange(r){ RANGE = r; }
