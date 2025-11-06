// src/tables.js
import { CONFIG } from './config.js';
import { PROS, LLAM } from './state.js';
import { $, toCSV, downloadFile, parseDateFlex } from './utils.js';
import { computeAvgUniqueByHour } from './charts.js';

export function renderTables(){
  const c = CONFIG.COLS_PROS, cl = CONFIG.COLS_LLAM;
  const tbodyP = $('#tbodyPros');
  const tbodyL = $('#tbodyLlam');
  if (!tbodyP || !tbodyL) return;

  const prosOrd = [...PROS].sort((a,b)=>(parseDateFlex(b[c.fechaAlta],'mdy')||0)-(parseDateFlex(a[c.fechaAlta],'mdy')||0));
  const llamOrd = [...LLAM].sort((a,b)=>(parseDateFlex(b[cl.fecha],'dmy')||0)-(parseDateFlex(a[cl.fecha],'dmy')||0));

  const rowP = (p)=> `<tr><td>${p[c.fechaAlta]||''}</td><td>${p[c.compania]||''}</td><td>${p[c.contacto]||''}</td><td>${p[c.estado]||''}</td><td>${p[c.origen]||''}</td></tr>`;
  const rowL = (l)=> `<tr><td>${l[cl.fecha]||''}</td><td>${l[cl.prospectoId]||''}</td><td>${l[cl.operador]||''}</td><td>${l[cl.resultado]||''}</td></tr>`;

  const MAX = 50;
  tbodyP.innerHTML = prosOrd.slice(0,MAX).map(rowP).join('');
  tbodyL.innerHTML = llamOrd.slice(0,MAX).map(rowL).join('');

  const sp = $('#searchPros'); const sl = $('#searchLlam');
  if (sp) sp.oninput = (e)=>{ const q = e.target.value.toLowerCase(); tbodyP.innerHTML = prosOrd.filter(p=>[p[c.compania],p[c.contacto],p[c.estado],p[c.origen]].some(x=>(x||'').toLowerCase().includes(q))).slice(0,MAX).map(rowP).join(''); };
  if (sl) sl.oninput = (e)=>{ const q = e.target.value.toLowerCase(); tbodyL.innerHTML = llamOrd.filter(l=>[l[cl.operador],l[cl.resultado],l[cl.prospectoId]].some(x=>(x||'').toLowerCase().includes(q))).slice(0,MAX).map(rowL).join(''); };

  // Export botones (compacto)
  const pf = $('#prosFooter'), lf = $('#llamFooter');
  if (pf){ pf.innerHTML = '<button id="expPros" class="pill">Exportar CSV</button>'; $('#expPros').onclick = ()=> downloadFile('prospectos.csv', toCSV(prosOrd), 'text/csv'); }
  if (lf){ lf.innerHTML = '<button id="expLlam" class="pill">Exportar CSV</button>'; $('#expLlam').onclick = ()=> downloadFile('llamados.csv', toCSV(llamOrd), 'text/csv'); }
}

export function renderTablaPromediosHora() {
  const { avgWd, avgWe, daysWd, daysWe } = computeAvgUniqueByHour();
  const $tbl = document.querySelector('#tblAvgHora');
  if (!$tbl) return;
  const $tbody = $tbl.querySelector('tbody');

  const fmtHour = h => `${String(h).padStart(2,'0')}:00`;
  const fmtNum  = v => (Math.round(v * 10) / 10).toLocaleString('es-AR');

  // (opcional) mostrar denominadores en caption
  const $cap = $tbl.querySelector('caption');
  if ($cap) {
    $cap.style.display = 'block';
    $cap.textContent = `Promedio por hora (números únicos válidos) — Lun–Vie / Sáb–Dom | días: ${daysWd} / ${daysWe}`;
  }

  const rows = [];
  for (let h = 0; h < 24; h++) {
    rows.push(`
      <tr>
        <td>${fmtHour(h)}</td>
        <td class="num">${fmtNum(avgWd[h])}</td>
        <td class="num">${fmtNum(avgWe[h])}</td>
      </tr>
    `);
  }
  $tbody.innerHTML = rows.join('');
}
