// src/data.js
import { CONFIG } from './config.js';
import { setRaw } from './state.js';
import { computeLastDataDate, setLastModifiedKPI } from './kpis.js';

export function ensureConfig(){
  let ok = true;
  if(!CONFIG.CSV_PROSPECTOS_URL || CONFIG.CSV_PROSPECTOS_URL.startsWith('REEMPLAZA')) ok=false;
  if(!CONFIG.CSV_LLAMADOS_URL  || CONFIG.CSV_LLAMADOS_URL.startsWith('REEMPLAZA')) ok=false;
  if(!ok) document.getElementById('configNotice').style.display='block';
  const logo = document.getElementById('logo'); if (logo) logo.src = CONFIG.LOGO_URL || 'assets/logo.png';
}

export function papaCsv(url){
  return new Promise((resolve, reject)=>{
    window.Papa.parse(url, {download:true, header:true, skipEmptyLines:true, complete:(res)=> resolve(res.data), error:reject});
  });
}

export async function loadData(){
  const [pros, llam] = await Promise.all([papaCsv(CONFIG.CSV_PROSPECTOS_URL), papaCsv(CONFIG.CSV_LLAMADOS_URL)]);
  setRaw(pros, llam);
}

export async function fetchLastModifiedFlexible(url){
  const u = url + (url.includes('?') ? '&' : '?') + 'cb=' + Date.now();
  try{
    const r = await fetch(u, { method:'HEAD', cache:'no-store' });
    const lm = r.headers.get('last-modified');
    if (lm){ const d = new Date(lm); if(!isNaN(d)) return d; }
  }catch{}
  try{
    const r = await fetch(u, { method:'GET', cache:'no-store' });
    const lm = r.headers.get('last-modified');
    if (lm){ const d = new Date(lm); if(!isNaN(d)) return d; }
  }catch{}
  return null;
}

export async function updateLastModifiedKPI(){
  try{
    const [m1, m2] = await Promise.all([fetchLastModifiedFlexible(CONFIG.CSV_PROSPECTOS_URL), fetchLastModifiedFlexible(CONFIG.CSV_LLAMADOS_URL)]);
    let d = [m1, m2].filter(Boolean).sort((a,b)=> b-a)[0];
    if (!d) d = computeLastDataDate();
    if (d) setLastModifiedKPI(d);
  }catch{
    const d = computeLastDataDate();
    if (d) setLastModifiedKPI(d);
  }
}
