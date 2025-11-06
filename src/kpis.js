// src/kpis.js
import { CONFIG } from './config.js';
import { RAW_PROS, RAW_LLAM, PROS, LLAM } from './state.js';
import { $, fmt, parseDateFlex, classifyCall, isInbound } from './utils.js';

export function renderKPIs(){
  const c  = CONFIG.COLS_PROS;

  // Prospectos (igual que antes)
  const totalProsHistorico = RAW_PROS.length;
  const nuevos30 = RAW_PROS.filter(p=>{
    const d = parseDateFlex(p[c.fechaAlta], 'mdy');
    if (!d) return false;
    const ago = new Date(); ago.setDate(ago.getDate()-30); ago.setHours(0,0,0,0);
    return d >= ago;
  }).length;
  $('#kpiPros').textContent    = fmt(totalProsHistorico);
  $('#kpiProsSub').textContent = `${fmt(nuevos30)} nuevos (30d)`;

  // 🔽 Llamados (solo Entrantes + Éxito/Omitido)
  const cl = CONFIG.COLS_LLAM;
  const filterValidCall = (r) =>
    isInbound(r[cl.tipo]) && ['success', 'omitted'].includes(classifyCall(r[cl.resultado]));

  const validInRange = (LLAM || []).filter(filterValidCall);      // rango activo
  const validAll     = (RAW_LLAM || []).filter(filterValidCall);  // histórico

  $('#kpiLlam30').textContent    = fmt(validInRange.length);
  $('#kpiLlam30Sub').textContent = `${fmt(validAll.length)} total histórico`;

  // Prospectos en rango (igual que antes)
  $('#kpiPros30').textContent = fmt(PROS.length);
}


// Fallback por contenido si no conseguimos Last-Modified
export function computeLastDataDate(){
  const c  = CONFIG.COLS_PROS;
  const cl = CONFIG.COLS_LLAM;
  const a1 = RAW_PROS.map(p=> parseDateFlex(p[c.fechaAlta], 'mdy')).filter(Boolean);
  const a2 = RAW_LLAM.map(l=> parseDateFlex(l[cl.fecha], 'dmy')).filter(Boolean);
  if (!a1.length && !a2.length) return null;
  return a1.concat(a2).sort((a,b)=> b-a)[0];
}

export function setLastModifiedKPI(d){
  if (!d) return;
  const el = $('#kpiUpdated');
  const sub= $('#kpiUpdatedSub');
  el.textContent = d.toLocaleDateString('es-AR');
  const days = Math.round((new Date()-d)/86400000);
  sub.textContent = days===0 ? 'hoy' : (days===1 ? 'hace 1 día' : `hace ${days} días`);
}
