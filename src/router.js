// src/router.js
export function initRouter(){
  function apply(){
    const hash = location.hash || '#/';
    const route = hash.replace(/^#\//,'') || '/';
    document.querySelectorAll('.view').forEach(v=> v.classList.add('hidden'));
    document.querySelectorAll('.tabs a').forEach(a=> a.classList.remove('active'));
    if (route==='/' || route===''){ document.getElementById('view-dashboard').classList.remove('hidden'); document.querySelector('.tabs a[data-route="/"]').classList.add('active'); }
    else if (route==='prospectos'){ document.getElementById('view-prospectos').classList.remove('hidden'); document.querySelector('.tabs a[data-route="prospectos"]').classList.add('active'); }
    else if (route==='llamados'){ document.getElementById('view-llamados').classList.remove('hidden'); document.querySelector('.tabs a[data-route="llamados"]').classList.add('active'); }
  }
  window.addEventListener('hashchange', apply);
  apply();
}
