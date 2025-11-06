// src/main.js
import { CONFIG } from './config.js';
import { RANGE, setFiltered } from './state.js';
import { ensureConfig, loadData, updateLastModifiedKPI } from './data.js';
import { getFiltered } from './filters.js';
import { renderKPIs } from './kpis.js';
import { renderCharts, renderDuracionChart,renderLlamadosTrend,renderProspectosPorDia,renderLlamadosPorHoraUnique, syncAvgTableHeight } from './charts.js';
import { renderTables,renderTablaPromediosHora } from './tables.js';
import { $ } from './utils.js';
import { initRouter } from './router.js';

window.Chart = window.Chart || Chart; // garantizamos acceso global
window.Papa  = window.Papa  || Papa;

function rerenderAll(){
  const { pros, llam } = getFiltered();
  setFiltered(pros, llam);
  renderKPIs();
  renderCharts();
  renderTables();
  renderLlamadosTrend();
  renderLlamadosPorHoraUnique();
  syncAvgTableHeight();
  renderDuracionChart($('#durMode')?.value || 'avg');
  renderProspectosPorDia();
  renderTablaPromediosHora();
}

window.addEventListener('resize', () => {
  requestAnimationFrame(syncAvgTableHeight);
});

async function init(){
  ensureConfig();
  $('#dataStatus').textContent = 'Cargando…';

  // UI rango
  const preset = $('#presetRange'), from=$('#fromDate'), to=$('#toDate'), apply=$('#applyRange');
  if (preset) preset.onchange = ()=>{
    const v = preset.value;
    if (v==='custom'){ from.disabled=false; to.disabled=false; }
    else { from.disabled=true; to.disabled=true; Object.assign(RANGE,{type:v, from:null, to:null}); rerenderAll(); }
  };
  if (apply) apply.onclick = ()=>{
    if (preset.value!=='custom') return;
    const f = from.value ? new Date(from.value+'T00:00:00') : null;
    const t = to.value   ? new Date(to.value+'T23:59:59') : null;
    Object.assign(RANGE,{type:'custom', from:f, to:t}); rerenderAll();
  };
  if ($('#durMode')) $('#durMode').onchange = ()=> renderDuracionChart($('#durMode').value);

  // Datos
  try{
    await loadData();
    await updateLastModifiedKPI();
    rerenderAll();
    $('#dataStatus').textContent = 'Datos OK';
  }catch(err){
    console.error(err);
    $('#dataStatus').textContent = 'Error de datos';
  }

  initRouter();
}

init();
