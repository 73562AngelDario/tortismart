/* ============ LAYOUT ============ */
function menu(){
 const m=[['ventas','🧾 Ventas']];
 if(esAdmin())m.unshift(['panel','📊 Panel']);
 m.push(['productos','🛒 Productos tienda'],['insumos','🌾 Materia prima']);
 if(esAdmin())m.push(['rendimiento','⚖️ Rendimiento'],['alertas','🔔 Alertas'],['reportes','📈 Reportes']);
 return m}
function render(){
 const r=document.getElementById('root');
 if(!sesion){r.innerHTML=loginView();return}
 const al=esAdmin()?calcAlertas().filter(a=>a.nivel!=='g').length:0;
 r.innerHTML=`<div class="app"><nav><h1>🌽 TortiSmart</h1><small>${sesion.nombre} (${sesion.rol})</small>
 ${menu().map(([k,t])=>`<button class="${vista===k?'act':''}" onclick="vista='${k}';render()">${t}${k==='alertas'&&al?` <span class="tag">${al}</span>`:''}</button>`).join('')}
 <div class="spacer"></div><button onclick="logout()">🚪 Cerrar sesión</button></nav>
 <main>${msgHTML()}${vistas[vista]()}</main></div>`}

/* ============ PANEL ADMIN ============ */
function panelView(){
 const f=hoy(),vs=DB.ventas.filter(x=>fmtD(new Date(x.ts))===f);
 const al=calcAlertas();
 return`<h2>Panel de control</h2><div class="grid">
 <div class="card"><small>Ventas de hoy</small><div class="big">${$$(vs.reduce((s,x)=>s+x.total,0))}</div><small>${vs.length} ventas</small></div>
 <div class="card"><small>Sacos de harina</small><div class="big">${DB.insumos.harina.stock}</div></div>
 <div class="card"><small>Productos activos</small><div class="big">${DB.productos.filter(p=>p.activo).length}</div></div></div>
 <div class="card"><h3>Alertas</h3>${al.map(a=>`<div class="alert ${a.nivel}">${a.t}</div>`).join('')}</div>`}

const vistas={ventas:ventasView,productos:productosView,insumos:insumosView,rendimiento:rendimientoView,alertas:alertasView,reportes:reportesView,panel:panelView};
render();
