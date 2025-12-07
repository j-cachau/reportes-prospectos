// src/config.js
export const CONFIG = {
  LOGO_URL: 'assets/logo.png',
  CSV_PROSPECTOS_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR11IHFM7jVM_QT1iTEzGEAyhRIBWhI_X6s1XWxW7ZILxMOK09jKQ0356inkeevTTp-L4ukSoFn2wjK/pub?gid=375626003&single=true&output=csv',   // <-- poné tus URLs
  CSV_LLAMADOS_URL  : 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR11IHFM7jVM_QT1iTEzGEAyhRIBWhI_X6s1XWxW7ZILxMOK09jKQ0356inkeevTTp-L4ukSoFn2wjK/pub?gid=1112671308&single=true&output=csv',

  COLS_PROS: {
    id: 'ID',
    fechaAlta: 'Creado',
    compania: 'Compañias',
    contacto: 'Responsable',
    tel: 'Tel',
    email: 'Email',
    origen: 'Origen',
    estado: 'Etiquetas'
  },
  COLS_LLAM: {
    id: 'LlamadoID',
    prospectoId: 'ProspectoID',
    fecha: 'Fecha de la llamada', // si tu hoja usa 'Fecha', cambialo aquí
    operador: 'Empleado',
    resultado: 'Estatus',
    notas: 'Notas',
    Duracion: 'Duración de la llamada',
    tipo: 'Tipo de la llamada'
  }
};
