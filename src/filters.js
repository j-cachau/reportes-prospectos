// src/filters.js
import { RANGE, RAW_PROS, RAW_LLAM } from './state.js';
import { parseDateFlex, startOfDay, endOfDay } from './utils.js';
import { CONFIG } from './config.js';

export function inRange(d){
  if (!(d instanceof Date) || isNaN(d)) return false;
  const today0 = startOfDay(new Date());
  if (RANGE.type === 'todo') return true;
  if (RANGE.type === '30d' || RANGE.type === '90d'){
    const days = RANGE.type === '30d' ? 30 : 90;
    const from = new Date(today0); from.setDate(from.getDate() - days + 1);
    return d >= from && d <= endOfDay(new Date());
  }
  if (RANGE.type === 'ytd'){
    const from = new Date(new Date().getFullYear(),0,1);
    return d >= from && d <= endOfDay(new Date());
  }
  if (RANGE.type === 'custom'){
    const f = RANGE.from ? startOfDay(RANGE.from) : null;
    const t = RANGE.to   ? endOfDay(RANGE.to)     : null;
    if (f && d < f) return false;
    if (t && d > t) return false;
    return true;
  }
  return true;
}

export function getFiltered(){
  const c  = CONFIG.COLS_PROS, cl = CONFIG.COLS_LLAM;
  const pros = RAW_PROS.filter(p => inRange(parseDateFlex(p[c.fechaAlta], 'mdy')));
  const llam = RAW_LLAM.filter(l => inRange(parseDateFlex(l[cl.fecha], 'dmy')));
  return { pros, llam };
}
