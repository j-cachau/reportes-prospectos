// src/charts_utils.js
export const shortenLabel = (s, max=36)=>{
  s = String(s||''); if(s.length<=max) return s;
  const cut = s.lastIndexOf(' ', max-1);
  return (cut>15 ? s.slice(0,cut) : s.slice(0,max-1)) + '…';
};

export function groupCount(arr, key){ return arr.reduce((acc,it)=>{ const k = (typeof key==='function')? key(it) : (it[key] ?? 'Sin dato'); acc[k]=(acc[k]||0)+1; return acc; },{}); }

export function isSuccessCall(row){
  const raw = (row?.Estatus ?? row?.resultado ?? '').toString();
  const v = raw.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim();
  return v === 'la llamada tuvo exito' || (v.startsWith('la llamada tuvo') && v.includes('exito'));
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
