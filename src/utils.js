// src/utils.js
export const $ = (sel)=> document.querySelector(sel);
export const fmt = (n)=> Number(n||0).toLocaleString('es-AR');

export function syncHeightPair(canvasId, scrollId, min = 200) {
  const canvas = document.getElementById(canvasId);
  const box    = document.getElementById(scrollId);
  if (!canvas || !box) return;
  const h = canvas.getBoundingClientRect().height || 0;
  box.style.maxHeight = Math.max(min, Math.round(h)) + 'px';
}

export function parseDurationToSeconds(s){
  if (!s) return 0;
  s = String(s).toLowerCase();
  const mm = s.match(/(\d+(?:[.,]\d+)?)\s*min/);
  const ss = s.match(/(\d+(?:[.,]\d+)?)\s*s/);
  const m = mm ? parseFloat(String(mm[1]).replace(',', '.')) : 0;
  const sec = ss ? parseFloat(String(ss[1]).replace(',', '.')) : 0;
  return Math.round(m*60 + sec);
}
export function formatSecondsBrief(total){
  total = Math.max(0, Math.round(total||0));
  const h = Math.floor(total/3600);
  const m = Math.floor((total%3600)/60);
  const s = total%60;
  const two = (n)=> String(n).padStart(2,'0');
  return h ? `${h}:${two(m)}:${two(s)}` : `${m}:${two(s)}`;
}

export function parseDateFlex(v, prefer='mdy'){
  if (!v) return null;
  const s = String(v).trim();
  let m = s.match(/^(\d{4})[/-](\d{2})[/-](\d{2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m) return new Date(+m[1], +m[2]-1, +m[3], +(m[4]||0), +(m[5]||0), +(m[6]||0));
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m){
    let a=+m[1], b=+m[2], day, month;
    if (a > 12 && b <= 12)      { day=a; month=b; }
    else if (b > 12 && a <= 12) { month=a; day=b; }
    else if (prefer==='dmy')    { day=a; month=b; }
    else                        { month=a; day=b; }
    return new Date(+m[3], month-1, day, +(m[4]||0), +(m[5]||0), +(m[6]||0));
  }
  const d = new Date(s);
  return isNaN(d)? null : d;
}

export const startOfDay = (d)=>{ const x=new Date(d); x.setHours(0,0,0,0); return x; };
export const endOfDay   = (d)=>{ const x=new Date(d); x.setHours(23,59,59,999); return x; };

export const daysAgo = (d, n)=>{
  if (!(d instanceof Date)) return false;
  const cut = new Date(); cut.setHours(0,0,0,0);
  cut.setDate(cut.getDate() - n);
  return d >= cut;
};

export const groupCount = (arr, key)=> arr.reduce((acc,it)=>{
  const k = (typeof key==='function') ? key(it) : (it[key] ?? 'Sin dato');
  acc[k] = (acc[k]||0) + 1;
  return acc;
}, {});

export function isSuccessCall(row){
  const raw = (row?.Estatus ?? row?.resultado ?? '').toString();
  const v = raw.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim();
  return v === 'la llamada tuvo exito' || (v.startsWith('la llamada tuvo') && v.includes('exito'));
}

// Helpers para export
export function toCSV(rows){
  if (!rows?.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v)=> (`"${String(v).replace(/"/g,'""')}"`);
  const body = rows.map(r=> headers.map(h=> esc(r[h] ?? '')).join(',')).join('\n');
  return headers.join(',') + '\n' + body + '\n';
}
export function downloadFile(name, data, mime='text/plain'){
  const blob = new Blob([data], {type:mime});
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), {href:url, download:name});
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

// Clasifica el resultado de la llamada
export function classifyCall(raw) {
  const v = String(raw || '')
    .normalize('NFD').replace(/\p{Diacritic}/gu,'')
    .toLowerCase().trim();

  if (!v) return 'unknown';
  if (v.includes('exito'))    return 'success';   // "La llamada tuvo/fue éxito"
  if (v.includes('omitid'))   return 'omitted';   // "La llamada fue omitida"
  if (v.includes('declinad')) return 'declined';  // "Declinado"
  if (v.includes('indefinid'))return 'undefined'; // "Indefinido"
  return 'unknown';
}

// Solo llamadas entrantes
export function isInbound(rawType) {
  const v = String(rawType || '')
    .normalize('NFD').replace(/\p{Diacritic}/gu,'')
    .toLowerCase().trim();
  return v === 'entrante' || v === 'inbound';
}

export function weekdayEs(d) {
  return ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][d.getDay()];
}
