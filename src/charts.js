// src/charts.js
import { CONFIG } from './config.js';
import { PROS, LLAM } from './state.js';
import { groupCount, isSuccessCall, shortenLabel, formatSecondsBrief, parseDurationToSeconds, } from './charts_utils.js';
import { getFiltered } from './filters.js';
import { parseDateFlex, classifyCall, isInbound,weekdayEs, syncHeightPair } from './utils.js';

let chartEstados, chartOperador, chartCompanias, chartDuracion;

export function renderCharts(){
  const c  = CONFIG.COLS_PROS, cl = CONFIG.COLS_LLAM;

  const estados  = groupCount(PROS, p => p[c.estado] || 'Sin estado');
  const entriesE = Object.entries(estados).sort((a,b)=> b[1]-a[1]).slice(0,10);
  const labelsE  = entriesE.map(([k]) => k);
  const dataE    = entriesE.map(([,v]) => v);

  const llamOK = LLAM.filter(isSuccessCall);
  const porOper = groupCount(llamOK, l => l[cl.operador] || 'Sin operador');
  const entriesO= Object.entries(porOper).sort((a,b)=> b[1]-a[1]);
  const labelsO = entriesO.map(([k]) => k);
  const dataO   = entriesO.map(([,v]) => v);

  const companias = groupCount(PROS, p => p[c.compania] || 'Sin compañía');
  const entriesC  = Object.entries(companias).sort((a,b)=> b[1]-a[1]).slice(0,10);
  const labelsC   = entriesC.map(([k]) => k);
  const dataC     = entriesC.map(([,v]) => v);

  const H = (n)=> !n?160: (n<=6?220: Math.min(320, 22*n+80));

  const elE = document.getElementById('chartEstados');
  const elO = document.getElementById('chartOperador');
  const elC = document.getElementById('chartCompanias');
  if(!elE || !elO || !elC) return;

  //elE.style.height = H(labelsE.length)+'px';
  //elO.style.height = H(labelsO.length)+'px';
  //elC.style.height = H(labelsC.length)+'px';

  const ctxE = elE.getContext('2d');
  const ctxO = elO.getContext('2d');
  const ctxC = elC.getContext('2d');

  if (chartEstados) chartEstados.destroy();
  if (chartOperador) chartOperador.destroy();
  if (chartCompanias) chartCompanias.destroy();

  const commonOpts = (labels)=>({
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    layout: { padding: { right: 28 } },
    plugins: { legend: { display:false }, tooltip: { mode:'nearest', intersect:false } },
    scales: {
      x: { beginAtZero:true, ticks:{ precision:0 }, grid:{ color:'rgba(255,255,255,.06)' } },
      y: { ticks:{ autoSkip:false, font:{ size:12 }, callback:(v,i)=> shortenLabel(labels[i], 36) }, grid:{ display:false } }
    }
  });

  chartEstados = new Chart(ctxE, {
    type:'bar',
    data:{ labels:labelsE, datasets:[{ label:'Prospectos', data:dataE, barThickness:18, maxBarThickness:22, borderRadius:6, borderSkipped:false, categoryPercentage:0.6, barPercentage:0.9 }]},
    options: commonOpts(labelsE),
    plugins: [valueLabels]
  });

  chartOperador = new Chart(ctxO, {
    type:'bar',
    data:{ labels:labelsO, datasets:[{ label:'Llamados (30d)', data:dataO, barThickness:18, maxBarThickness:22, borderRadius:6, borderSkipped:false, categoryPercentage:0.6, barPercentage:0.9 }]},
    options: commonOpts(labelsO),
    plugins: [valueLabels]
  });

  chartCompanias = new Chart(ctxC, {
    type:'bar',
    data:{ labels:labelsC, datasets:[{ label:'Prospectos', data:dataC, barThickness:18, maxBarThickness:22, borderRadius:6, borderSkipped:false, categoryPercentage:0.6, barPercentage:0.9 }]},
    options: commonOpts(labelsC),
    plugins: [valueLabels]
  });
}

// Ajusta la altura scrolleable de la tabla a la del gráfico
export function syncAvgTableHeight() {
  const plotCanvas = document.getElementById('chartHoraUnique');
  const scrollBox  = document.getElementById('tableScroll');
  if (!plotCanvas || !scrollBox) return;

  const h = plotCanvas.getBoundingClientRect().height;
  scrollBox.style.maxHeight = Math.max(200, Math.round(h)) + 'px';
}


export function renderDuracionChart(mode = 'avg'){
  const cl = CONFIG.COLS_LLAM;

  // Agrupa segundos por operador SOLO para llamadas entrantes y con resultado éxito/omitido
  const agg = new Map();
  for (const r of (LLAM || [])) {
    // Tipo: solo Entrante
    if (!isInbound(r[cl.tipo])) continue;

    // Resultado: solo éxito
    const cls = classifyCall(r[cl.resultado]);
    if (cls !== 'success') continue;


    const oper = r[cl.operador] || 'Sin operador';
    const sec =
      parseDurationToSeconds(r[cl.Duracion]) ||
      parseDurationToSeconds(r['Duración de la llamada']) ||
      parseDurationToSeconds(r['Duración']);
    if (!sec) continue;

    let a = agg.get(oper);
    if (!a) agg.set(oper, (a = { sumSec: 0, count: 0 }));
    a.sumSec += sec;
    a.count  += 1;
  }

  // Si no hay datos válidos, limpiar y salir
  if (agg.size === 0) {
    if (chartDuracion) { chartDuracion.destroy(); chartDuracion = null; }
    const elEmpty = document.getElementById('chartDuracion');
    if (elEmpty) elEmpty.getContext('2d').clearRect(0, 0, elEmpty.width, elEmpty.height);
    return;
  }

  // Armar dataset (promedio o suma) ordenado desc
  const entries = Array.from(agg.entries())
    .map(([k,v]) => [k, mode === 'avg' ? v.sumSec / Math.max(1, v.count) : v.sumSec])
    .sort((a,b) => b[1] - a[1]);

  const labels = entries.map(e => e[0]);
  const data   = entries.map(e => e[1]);

  const el = document.getElementById('chartDuracion');
  if (!el) return;

  // Altura dinámica opcional (si querés reactivarla, descomentá la línea)
  // const H = (n) => !n ? 160 : (n <= 6 ? 220 : Math.min(320, 22 * n + 80));
  // el.style.height = H(labels.length) + 'px';

  const ctx = el.getContext('2d');
  if (chartDuracion) chartDuracion.destroy();

  chartDuracion = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: mode === 'avg' ? 'Promedio por llamada' : 'Suma total',
        data,
        barThickness: 18,
        maxBarThickness: 22,
        borderRadius: 6,
        borderSkipped: false,
        categoryPercentage: 0.6,
        barPercentage: 0.9,
        valueLabelFormatter: (v) => formatSecondsBrief(v)
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      layout: { padding: { right: 28 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${formatSecondsBrief(ctx.parsed.x)}`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,.06)' },
          ticks: { callback: (v) => formatSecondsBrief(v), precision: 0 }
        },
        y: {
          ticks: { autoSkip: false, font: { size: 12 }, callback: (v, i) => shortenLabel(labels[i], 36) },
          grid: { display: false }
        }
      }
    },
    plugins: [valueLabels]
  });
}


// plugin & helpers for charts moved to charts_utils.js
export const valueLabels = {
  id:'valueLabels',
  afterDatasetsDraw(chart){
    const {ctx} = chart;
    const ds = chart.data.datasets[0];
    const fmtVal = ds.valueLabelFormatter || ((v)=> v.toLocaleString('es-AR'));
    ctx.save(); ctx.fillStyle = getComputedStyle(document.body).color; ctx.font = '12px system-ui, Segoe UI, Roboto, Arial';
    chart.getDatasetMeta(0).data.forEach((bar,i)=>{ const raw = ds.data[i]; if(raw==null) return; ctx.fillText(fmtVal(raw), bar.x+6, bar.y+4); });
    ctx.restore();
  }
};

let chartLlamTrend;

/** Normaliza texto con acentos quitados y minúsculas */
function _norm(s){
  return String(s||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim();
}

/** Heurística simple para “omitida” */
function isOmittedCall(row){
  const cl = CONFIG.COLS_LLAM;
  const v = _norm(row?.[cl.resultado]);
  // “omitid” cubre omitida/omitido; ajusta si tenés otra etiqueta
  return v.includes('omitid');
}

/** Rellena días faltantes entre min y max con 0 */
function fillDaysRange(counts, minDate, maxDate){
  const out = {};
  const d = new Date(minDate);
  d.setHours(0,0,0,0);
  const end = new Date(maxDate);
  end.setHours(0,0,0,0);
  while (d <= end){
    const k = d.toISOString().slice(0,10);
    out[k] = counts[k] || 0;
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function renderLlamadosTrend(){
  const { llam } = getFiltered();            // respeta el rango global
  const cl = CONFIG.COLS_LLAM;

  if (!llam || !llam.length){
    if (chartLlamTrend) { chartLlamTrend.destroy(); chartLlamTrend = null; }
    return;
  }

  // Agrupa por día yyyy-mm-dd
  const succ = {};   // éxitos por día
  const omit = {};   // omitidos por día
  let minD = null, maxD = null;

  for (const r of llam){
    // 1) Solo llamadas ENTRANTES
    if (!isInbound(r[cl.tipo])) continue;

    // 2) Clasificar el resultado (solo success/omitted)
    const kind = classifyCall(r[cl.resultado]);
    if (kind !== 'success' && kind !== 'omitted') continue;

    // 3) Fecha (tu hoja es dmy)
    const d = parseDateFlex(r[cl.fecha], 'dmy');
    if (!d || isNaN(d)) continue;
    d.setHours(0,0,0,0);

    if (!minD || d < minD) minD = new Date(d);
    if (!maxD || d > maxD) maxD = new Date(d);

    const key = d.toISOString().slice(0,10);
    if (kind === 'success') {
      succ[key] = (succ[key] || 0) + 1;
    } else { // omitted
      omit[key] = (omit[key] || 0) + 1;
    }
  }

  if (!minD || !maxD){
    if (chartLlamTrend) { chartLlamTrend.destroy(); chartLlamTrend = null; }
    return;
  }

  // Rellenar días sin registros con 0 para líneas continuas
  const succFull = fillDaysRange(succ, minD, maxD);
  const omitFull = fillDaysRange(omit, minD, maxD);

  // Unificar llaves (por si un día hay solo una serie)
  const keys = Array.from(new Set([
    ...Object.keys(succFull),
    ...Object.keys(omitFull)
  ])).sort();

  const labels = keys.map(k => {
    const [y,m,d] = k.split('-').map(Number);
    return new Date(y, m-1, d).toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit' });
  });

  const dataSucc = keys.map(k => succFull[k] || 0);
  const dataOmit = keys.map(k => omitFull[k] || 0);

  // Render — línea verde (éxitos) y roja (omitidos)
  const el = document.getElementById('chartLlamTrend');
  if (!el) return;
  const ctx = el.getContext('2d');

  if (chartLlamTrend) chartLlamTrend.destroy();

  chartLlamTrend = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Éxitos',
          data: dataSucc,
          borderColor: '#34d399',
          backgroundColor: 'rgba(52,211,153,0.15)',
          fill: false,
          tension: 0.25,
          borderWidth: 2,
          pointRadius: 2
        },
        {
          label: 'Omitidos',
          data: dataOmit,
          borderColor: '#f87171',
          backgroundColor: 'rgba(248,113,113,0.15)',
          fill: false,
          tension: 0.25,
          borderWidth: 2,
          pointRadius: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        legend: { display: true },
        tooltip: {
          callbacks: {
            label: (ctx)=> `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('es-AR')}`
          }
        }
      },
      scales: {
        x: { grid: { color:'rgba(255,255,255,.06)' } },
        y: {
          beginAtZero: true,
          grid: { color:'rgba(255,255,255,.06)' },
          ticks: { precision: 0, stepSize: 1 }
        }
      }
    }
  });
}

let chartProsDia = null;

/**
 * Prospectos por día
 * - Usa PROS ya filtrado por el rango global (getFiltered()).
 * - Agrupa por fecha (yyyy-mm-dd).
 */
export function renderProspectosPorDia() {
  const { pros } = getFiltered();
  const c = CONFIG.COLS_PROS;

  // Agrupar por día
  const buckets = new Map(); // key -> {date: Date, count}
  let minD=null, maxD=null;

  for (const r of (pros || [])) {
    const d = parseDateFlex(r[c.fechaAlta], 'mdy'); // tu “Creado” es mm/dd/yyyy
    if (!d || isNaN(d)) continue;
    d.setHours(0,0,0,0);
    const key = d.toISOString().slice(0,10);
    const obj = buckets.get(key) || { date: new Date(d), count: 0 };
    obj.count += 1;
    buckets.set(key, obj);

    if (!minD || d < minD) minD = new Date(d);
    if (!maxD || d > maxD) maxD = new Date(d);
  }

  // ----- Tabla Top días
  const top = Array.from(buckets.values())
    .sort((a,b)=> b.count - a.count)
    .slice(0, 10); // top 10

  const tb = document.getElementById('tbodyTopDiasPros');
  if (tb) {
    tb.innerHTML = top.map(({date,count})=>{
      const f = date.toISOString().slice(0,10);
      const w = weekdayEs(date);
      return `<tr>
        <td>${f}</td>
        <td>${w}</td>
        <td style="text-align:right">${count.toLocaleString('es-AR')}</td>
      </tr>`;
    }).join('') || `<tr><td colspan="3" style="color:var(--muted)">Sin datos</td></tr>`;
  }

  // ----- Línea por día
  const canvas = document.getElementById('chartProsDia');
  if (!canvas) return;

  if (!minD || !maxD) {
    if (chartProsDia) { chartProsDia.destroy(); chartProsDia = null; }
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    return;
  }

  // Rango completo de días con 0s
  const labels = [];
  const series = [];
  for (let d = new Date(minD); d <= maxD; d.setDate(d.getDate()+1)) {
    const key = d.toISOString().slice(0,10);
    labels.push(key);
    series.push( (buckets.get(key)?.count) || 0 );
  }

  const ctx = canvas.getContext('2d');
  if (chartProsDia) chartProsDia.destroy();

  chartProsDia = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Prospectos',
        data: series,
        borderColor: '#4da3ff',
        backgroundColor: 'rgba(77,163,255,.15)',
        fill: true,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items)=> {
              const k = items[0].label; // yyyy-mm-dd
              const [y,m,dd] = k.split('-').map(Number);
              const d = new Date(y, m-1, dd);
              return `${weekdayEs(d)} ${dd.toString().padStart(2,'0')}/${m.toString().padStart(2,'0')}`;
            },
            label: (ctx)=> `Prospectos: ${ctx.parsed.y.toLocaleString('es-AR')}`
          }
        }
      },
      scales: {
        x: {
          grid: { color:'rgba(255,255,255,.06)' },
          ticks: {
            callback: (v, i) => {
              const k = labels[i]; if (!k) return '';
              const [y,m,d] = k.split('-');
              return `${d}/${m}`;
            }
          }
        },
        y: {
          beginAtZero: true,
          grid: { color:'rgba(255,255,255,.06)' },
          ticks: { precision: 0 }
        }
      }
    }
  });
  // ⬇️ Sincronizá la altura de la tabla con el alto real del canvas
  requestAnimationFrame(() => syncHeightPair('chartProsDia', 'tableScrollPros'));
}

let chartLlamPorHora = null;

// Helpers locales para robustez con acentos / mayúsculas
function norm(s){
  return (s ?? '')
    .toString()
    .normalize('NFD').replace(/\p{Diacritic}/gu,'') // saca acentos
    .toLowerCase().trim();
}
function esEntrante(v){
  const s = norm(v);
  // “entrante”, “entrada”, etc (por si viene con variantes)
  return s.includes('entrante') || s.includes('entrada');
}
function esStatusValido(v){
  const s = norm(v);
  // acepta “La llamada tuvo éxito” y “La llamada fue omitida”
  return s.includes('exito') || s.includes('omitida');
}

// Intenta tomar teléfono con prioridad “Teléfono”
function getTelefono(r, cl){
  return (
    r?.['Teléfono'] ??
    r?.['Telefono'] ??
    r?.['Phone'] ??
    (cl?.telefono ? r?.[cl.telefono] : null)
  );
}

let chartHoraUnique = null;

export function renderLlamadosPorHoraUnique(){
  const { llam } = getFiltered();        // respeta el rango global
  const cl = CONFIG.COLS_LLAM || {};     // por si querés usar mapeos existentes

  // Conjuntos de teléfonos únicos por hora (0..23)
  const uniqWeekday = Array.from({length:24}, ()=> new Set());
  const uniqWeekend = Array.from({length:24}, ()=> new Set());

  for (const r of (llam || [])){
    const tel   = getTelefono(r, cl);
    const tipo  = r?.['tipo de llamado'] ?? (cl?.tipo ? r?.[cl.tipo] : null);
    const est   = r?.['Estatus'] ?? (cl?.resultado ? r?.[cl.resultado] : null);

    if (!tel) continue;                      // sin número no cuenta
    if (!esEntrante(tipo)) continue;         // solo entrantes
    if (!esStatusValido(est)) continue;      // solo éxito u omitida

    // Fecha/hora del registro
    const f = r?.[cl?.fecha] ?? r?.['Fecha'] ?? r?.['fecha'];
    const d = parseDateFlex(f, 'dmy');       // igual que el resto del dashboard
    if (!d || isNaN(d)) continue;

    const hour = d.getHours();               // 0..23
    const dow  = d.getDay();                 // 0=Dom .. 6=Sáb

    if (dow === 0 || dow === 6){
      uniqWeekend[hour].add(tel);
    } else {
      uniqWeekday[hour].add(tel);
    }
  }

  // Pasamos a cantidades por hora
  const dataWeekday = uniqWeekday.map(s => s.size);
  const dataWeekend = uniqWeekend.map(s => s.size);
  const labels = Array.from({length:24}, (_,h)=> String(h).padStart(2,'0') + ':00');

  const el = document.getElementById('chartHoraUnique') || document.getElementById('chartLlamPorHora');
  if (!el) return;

  if (chartLlamPorHora) { chartLlamPorHora.destroy(); chartLlamPorHora = null; }
  const ctx = el.getContext('2d');

  chartLlamPorHora = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Lun–Vie (números únicos)',
          data: dataWeekday,
          borderColor: '#4da3ff',
          backgroundColor: 'rgba(77,163,255,0.15)',
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 0,
          fill: true
        },
        {
          label: 'Sáb–Dom (números únicos)',
          data: dataWeekend,
          borderColor: '#ffb86b',
          backgroundColor: 'rgba(255,184,107,0.15)',
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 0,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        legend: { display: true },
        tooltip: {
          callbacks: {
            label: (ctx)=> `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('es-AR')}`
          }
        }
      },
      scales: {
        x: { grid: { color:'rgba(255,255,255,.06)' } },
        y: {
          beginAtZero: true,
          grid: { color:'rgba(255,255,255,.06)' },
          ticks: { precision: 0, stepSize: 1 }
        }
      }
    }
  });
  requestAnimationFrame(syncAvgTableHeight);
}

// === Promedio de llamados por hora (números únicos válidos) ===
// Entrantes + (éxito u omitida), únicos por hora. Separa Lun–Vie y Sáb–Dom.

function toYMD(d) {
  return d.toISOString().slice(0,10);
}
function isWeekday(d) {
  const wd = d.getDay(); // 0=dom .. 6=sab
  return wd >= 1 && wd <= 5;
}
function normPhone(s) {
  if (!s) return '';
  return String(s).replace(/[^\d+]/g,'').replace(/^(\+?54)?0+/,''); // simple normalizador
}

// Devuelve promedios por hora: { avgWd: number[24], avgWe: number[24], daysWd, daysWe }
export function computeAvgUniqueByHour() {
  const { llam } = getFiltered();
  const cl = CONFIG.COLS_LLAM;

  // Mapa fecha -> array[24] de Set() de teléfonos únicos por hora
  const wdByDay = new Map(); // Lunes–Viernes
  const weByDay = new Map(); // Sábado–Domingo

  for (const r of (llam || [])) {
    // tipo: solo entrante
    if (!isInbound(r[cl.tipo])) continue;

    // estado: solo éxito/omitida
    const stat = classifyCall(r[cl.resultado]);
    if (stat !== 'success' && stat !== 'omitted') continue;

    const d = parseDateFlex(r[cl.fecha], 'dmy');
    if (!d || isNaN(d)) continue;
    const h = d.getHours();
    const key = toYMD(d);
    const phone = normPhone(r[cl.telefono] || r['Teléfono'] || r['Telefono'] || '');

    if (!phone) continue;

    const bucket = (isWeekday(d) ? wdByDay : weByDay);
    let arr = bucket.get(key);
    if (!arr) { arr = Array.from({length:24}, () => new Set()); bucket.set(key, arr); }
    arr[h].add(phone);
  }

  // Armar promedios por hora
  const hours = Array.from({length:24}, (_,h)=>h);
  const daysWd = wdByDay.size;
  const daysWe = weByDay.size;

  const sumWd = Array(24).fill(0);
  const sumWe = Array(24).fill(0);

  for (const arr of wdByDay.values()) {
    hours.forEach(h => sumWd[h] += arr[h].size);
  }
  for (const arr of weByDay.values()) {
    hours.forEach(h => sumWe[h] += arr[h].size);
  }

  // Si preferís dividir por TODOS los días calendario del rango (incluyendo días sin datos),
  // en lugar de daysWd/daysWe, calculá daysWd/daysWe desde el rango global y reemplazá acá.
  const avgWd = sumWd.map(v => daysWd ? v / daysWd : 0);
  const avgWe = sumWe.map(v => daysWe ? v / daysWe : 0);

  return { avgWd, avgWe, daysWd, daysWe };
}


// Horas "HH:00"
function hours24(){
  return Array.from({length:24}, (_,h)=> String(h).padStart(2,'0') + ':00');
}

/**
 * Construye métricas por hora CONTANDO TODAS las llamadas
 * (no números únicos), y promedios por día.
 * @param {Array} rows - filas (LLAM filtrado por rango)
 * @param {Object} col - mapa de columnas (CONFIG.COLS_LLAM)
 * @param {Function} pickRow - fn(row) -> bool (filtro extra por estatus, etc.)
 * @returns {Object} { totals:{wd:[24], we:[24]}, avg:{wd:[24], we:[24]} }
 */
function buildHourlyCountsWithAverages(rows, col, pickRow){
  // dayHours[group][yyyy-mm-dd] => Array<number> de 24 posiciones
  const dayHours = { wd: Object.create(null), we: Object.create(null) };

  for (const r of rows || []){
    if (!pickRow(r)) continue;

    const d = parseDateFlex(r[col.fecha], 'dmy'); // "Fecha de la llamada"
    if (!d || isNaN(d)) continue;

    // Sólo entrantes
    const type = (r[col.tipo] || '').toLowerCase();
    if (!isInbound(type)) continue;

    const hour = new Date(d).getHours(); // 0..23
    const dow  = d.getDay();             // 0..6 (0=Dom)
    const grp  = (dow>=1 && dow<=5) ? 'wd' : 'we';

    const dayKey = d.toISOString().slice(0,10);
    if (!dayHours[grp][dayKey]){
      dayHours[grp][dayKey] = new Array(24).fill(0);
    }
    dayHours[grp][dayKey][hour] += 1;   // 👈 contamos TODAS
  }

  const totals = { wd: new Array(24).fill(0), we: new Array(24).fill(0) };
  const avg    = { wd: new Array(24).fill(0), we: new Array(24).fill(0) };

  for (const grp of ['wd','we']){
    const days = Object.values(dayHours[grp]);  // Array< Array<number> >
    const nDays = days.length || 1;

    for (const arrPerHour of days){
      for (let h=0; h<24; h++){
        totals[grp][h] += arrPerHour[h];
        avg[grp][h]    += arrPerHour[h];
      }
    }
    for (let h=0; h<24; h++){
      avg[grp][h] = Math.round((avg[grp][h] / nDays) * 10) / 10; // 1 decimal
    }
  }

  return { totals, avg };
}

let chartHoraOmitidos = null;

export function renderOmitidasPorHora(){
  const { llam } = getFiltered();        // respeta el rango global
  const cl = CONFIG.COLS_LLAM;

  // Sólo "La llamada fue omitida"
  const data = buildHourlyCountsWithAverages(
    llam,
    cl,
    (r)=> classifyCall(r[cl.resultado]) === 'omitted'
  );

  // ----- Gráfico
  const el = document.getElementById('chartHoraOmitidos');
  if (el){
    const ctx = el.getContext('2d');
    if (chartHoraOmitidos) chartHoraOmitidos.destroy();

    chartHoraOmitidos = new Chart(ctx, {
      type: 'line',
      data: {
        labels: hours24(),
        datasets: [
          {
            label: 'Lun–Vie (omitidas)',
            data: data.totals.wd,
            borderColor: '#ff6b6b',
            backgroundColor: 'rgba(255,107,107,.12)',
            fill: true,
            tension: .35,
            borderWidth: 2,
            pointRadius: 0
          },
          {
            label: 'Sáb–Dom (omitidas)',
            data: data.totals.we,
            borderColor: '#f0ad4e',
            backgroundColor: 'rgba(240,173,78,.12)',
            fill: true,
            tension: .35,
            borderWidth: 2,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode:'nearest', intersect:false },
        plugins:{
          legend: { display: true },
          tooltip:{
            callbacks:{
              title: (items)=> items?.[0]?.label ?? '',
              label: (ctx)=> `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('es-AR')}`
            }
          }
        },
        scales:{
          x: { grid:{ color:'rgba(255,255,255,.06)' } },
          y: {
            beginAtZero: true,
            grid:{ color:'rgba(255,255,255,.06)' },
            ticks:{ precision: 0 }
          }
        }
      }
    });
  }

  // ----- Tabla de promedio por hora
  const tb = document.querySelector('#tblAvgHoraOmit tbody');
  if (tb){
    const hrs = hours24();
    tb.innerHTML = hrs.map((label, i)=> `
      <tr>
        <td>${label}</td>
        <td class="num">${data.avg.wd[i].toLocaleString('es-AR')}</td>
        <td class="num">${data.avg.we[i].toLocaleString('es-AR')}</td>
      </tr>
    `).join('');
  }

  // Sincronizar altura del scroll con la altura real del gráfico
  if (typeof syncHeightPair === 'function'){
    requestAnimationFrame(() => syncHeightPair('chartHoraOmitidos', 'scrollAvgOmit'));
    window.addEventListener('resize', () => syncHeightPair('chartHoraOmitidos', 'scrollAvgOmit'));
  }
}

