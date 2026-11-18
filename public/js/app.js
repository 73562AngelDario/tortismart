/* ============ LAYOUT ============ */
function menu(){
 const m=[['ventas','Ventas']];
 if(esAdmin())m.unshift(['panel','Panel']);
 m.push(['productos','Productos'],['insumos','Materia prima']);
 if(esAdmin())m.push(['rendimiento','Rendimiento'],['alertas','Alertas'],['reportes','Reportes']);
 return m}
function render(){
 const r=document.getElementById('root');
 if(!sesion){r.innerHTML=loginView();return}
 const al=esAdmin()?calcAlertas().filter(a=>a.nivel!=='g').length:0;
 r.innerHTML=`<header class="topbar">
 <div class="brand"><span>Torti<b>Smart</b></span></div>
 <div class="tabs">${menu().map(([k,t])=>`<button class="${vista===k?'act':''}" onclick="vista='${k}';repKey='';render()">${t}${k==='alertas'&&al?`<span class="tag">${al}</span>`:''}</button>`).join('')}</div>
 <div class="user"><span>${sesion.nombre}</span><span class="rol">${sesion.rol}</span><button onclick="logout()">Cerrar sesión</button></div></header>
 <main>${msgHTML()}${vistas[vista]()}</main>`}

/* ============ PANEL ADMIN ============ */
function panelView(){
 const f=hoy(),vs=DB.ventas.filter(x=>fmtD(new Date(x.ts))===f);
 const al=calcAlertas();
 return`<h2>Panel de control</h2>${tortillaPanel()}<div class="grid">
 <div class="card"><small>Ventas de hoy</small><div class="big">${$$(vs.reduce((s,x)=>s+x.total,0))}</div><small>${vs.length} ventas</small></div>
 <div class="card"><small>Sacos de harina</small><div class="big">${fmtSacos(totalHarina())}</div></div>
 <div class="card"><small>Productos activos</small><div class="big">${DB.productos.filter(p=>p.activo).length}</div></div></div>
 <div class="card"><h3>Alertas</h3>${al.map(a=>`<div class="alert ${a.nivel}">${a.t}</div>`).join('')}</div>`}

const vistas={ventas:ventasView,productos:productosView,insumos:insumosView,rendimiento:rendimientoView,alertas:alertasView,reportes:reportesView,panel:panelView};

(async function arrancar(){
 if(sesion&&tok){
  try{await cargarEstado()}
  catch(e){
   sesion=null;tok=null;sessionStorage.removeItem('ts_ses');sessionStorage.removeItem('ts_tok');
   flash(e.status===401?'Tu sesión expiró. Inicia sesión de nuevo.':'No se pudo conectar con el servidor','err')}}
 render()})();
