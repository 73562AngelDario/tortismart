/* ============ ALERTAS (CU007) ============ */
function diasRestantes(k,campo){
 const cons=DB.produccion.reduce((s,x)=>s+(x[campo]||0),0);
 const dias=new Set(DB.produccion.filter(x=>x[campo]>0).map(x=>x.fecha)).size;
 if(!cons||!dias)return null;
 return DB.insumos[k].stock/(cons/dias)}
/* Cuántos sacos conviene comprar de una marca: según lo que se ha usado en los últimos 14 días */
const cfgAviso=()=>{const n=parseFloat(DB.config.avisoSaco);return isNaN(n)?2:n};
const cfgDias=()=>Math.max(1,parseInt(DB.config.diasCompra)||7);
const txtSacos=n=>n+(n===1?' saco':' sacos');
function sugerirCompra(k){
 const lim=new Date();lim.setDate(lim.getDate()-14);const desde=fmtD(lim);
 const regs=DB.produccion.filter(x=>(x.marca||'maseca')===k&&x.fecha>=desde);
 const dias=new Set(regs.map(x=>x.fecha)).size;
 if(!dias)return 5;
 const prom=regs.reduce((s,x)=>s+x.sacos,0)/dias;
 return Math.max(1,Math.ceil(prom*cfgDias()-DB.insumos[k].stock))}
function calcAlertas(){
 const a=[],h=totalHarina(),min=DB.config.minHarina;
 if(h<=min)a.push({nivel:h<min?'r':'y',t:`Quedan ${fmtSacosU(h)} de harina en total. Stock crítico`});
 activas().forEach(([k,m])=>{
  const st=DB.insumos[k].stock,n=sugerirCompra(k);
  if(st<=0)a.push({nivel:'r',t:`Se acabó el saco ${m.n}. Compra aprox. ${txtSacos(n)}`});
  else if(st<=cfgAviso())a.push({nivel:'y',t:`Quedan ${fmtSacosU(st)} de ${m.n}. Compra aprox. ${txtSacos(n)}`})});
 if(DB.lotes.length){const d=tortillaDisp();
  if(d<=0.0005)a.push({nivel:'r',t:'Ya no hay más tortillas registradas. Registra una nueva producción'});
  else if(d<=LIM_TORTILLA+0.0005)a.push({nivel:'r',t:`Quedan solo ${fmtKg(d)} kg de tortilla (límite ${LIM_TORTILLA} kg). Registra una nueva producción`})}
 Object.entries(rendimientoDia(hoy()).por).forEach(([k,g])=>{
  if(!(g.sacosReal>0)||!MARCAS[k])return;
  const m=MARCAS[k],meta=(m.min+m.max)/2,real=g.kgReal/g.sacosReal;
  if(real<meta-0.0005)a.push({nivel:real<m.min?'r':'y',t:`Rendimiento de hoy con ${m.n}: ${real.toFixed(2)} kg/saco, por debajo de la meta de ${meta.toFixed(2)} kg/saco`})});
 productosBajos().forEach(p=>a.push({nivel:p.stock<=0?'r':'y',t:p.stock<=0?`Se agotó ${p.nombre}. Resurtir`:`Quedan ${p.stock} ${p.stock===1?'unidad':'unidades'} de ${p.nombre}. Resurtir`}));
 if(!a.length)a.push({nivel:'g',t:'Sin alertas por el momento'});
 return a}
/* Aviso automático por WhatsApp cuando la tortilla baja a 10 kg o menos.
   Se manda una sola vez y se vuelve a armar cuando la tortilla sube de 10 kg. */
let avisandoTort=false;
function revisarTortilla(){
 if(!DB.lotes.length)return;
 const d=tortillaDisp();
 if(d>LIM_TORTILLA+0.0005){if(DB.config.avisoTortilla)DB.config.avisoTortilla=false;return}
 if(DB.config.avisoTortilla||avisandoTort||!numWA())return;
 avisandoTort=true;
 api('/whatsapp/tortilla',{method:'POST',body:JSON.stringify({kg:Math.round(d*100)/100})})
  .then(()=>{DB.config.avisoTortilla=true;save()})
  .catch(()=>estadoNube('No se pudo enviar el aviso de tortilla por WhatsApp','err'))
  .finally(()=>{avisandoTort=false})}
function guardarCfg(){
 DB.config.minHarina=parseFloat(v('mh'))||3;DB.config.avisoSaco=Math.max(0,parseFloat(v('as')));if(isNaN(DB.config.avisoSaco))DB.config.avisoSaco=2;DB.config.diasCompra=Math.max(1,parseInt(v('dc'))||7);DB.config.whatsapp=v('wa').trim();save();flash('Configuración guardada');render()}
async function cambiarPassEmpleado(){
 const a=v('pea'),n1=v('pe1'),n2=v('pe2');
 if(!a||!n1||!n2){flash('Completa los tres campos','err');return render()}
 if(n1!==n2){flash('Las contraseñas nuevas no coinciden','err');return render()}
 if(n1.length<6){flash('La contraseña nueva debe tener al menos 6 caracteres','err');return render()}
 try{await api('/empleado/pass',{method:'POST',body:JSON.stringify({miPass:a,nueva:n1})});
  flash('Contraseña del empleado actualizada. Avísale la nueva contraseña.')}
 catch(e){flash(e.message||'No se pudo cambiar la contraseña','err')}
 render()}
function numWA(){let n=String(DB.config.whatsapp||'').replace(/\D/g,'');if(n.length===10)n='52'+n;return n}
async function enviarWA(t){
 const num=numWA();
 if(!num){flash('Registra primero el número de WhatsApp','err');return render()}
 try{await api('/whatsapp',{method:'POST',body:JSON.stringify({phone:num,texto:'TortiSmart: '+t})});
  flash('Alerta enviada por WhatsApp')}
 catch(e){
  /* Si el envío automático no está disponible (servidor sin actualizar o sin clave), se abre WhatsApp como antes */
  if(e.status===404||e.status===503){
   window.open(`https://wa.me/${num}?text=${encodeURIComponent(t)}`,'_blank')}
  else flash(e.message||'No se pudo enviar el mensaje','err')}
 render()}
function estadoStock(st,lim){
 if(st<=0)return'<span class="tag">Agotado</span>';
 if(st<=lim)return'<span class="tag" style="background:var(--warn);color:#2a1d05">Bajo</span>';
 return'<span class="tag uso">Bien</span>'}
function existenciasHTML(){
 const sacos=activas().map(([k,m])=>{const st=DB.insumos[k].stock;
  return`<tr><td>${esc(m.n)}</td><td class="right"><b>${fmtSacos(st)}</b></td><td>${estadoStock(st,cfgAviso())}</td></tr>`}).join('');
 const prods=DB.productos.filter(p=>p.activo).sort((a,b)=>a.stock-b.stock).map(p=>
  `<tr><td>${esc(p.nombre)}</td><td class="right"><b>${p.stock}</b></td><td>${estadoStock(p.stock,LIM_PROD)}</td></tr>`).join('');
 return`<div class="grid">
 <div class="card"><h3>Sacos de harina</h3><table><tr><th>Marca</th><th class="right">Sacos</th><th>Estado</th></tr>${sacos||'<tr><td colspan="3">Sin marcas</td></tr>'}</table>
 <p><small>Total: ${fmtSacosU(totalHarina())} · "Bajo" cuando quedan ${txtSacos(cfgAviso())} o menos</small></p></div>
 <div class="card"><h3>Productos de tienda</h3><table><tr><th>Producto</th><th class="right">Existencia</th><th>Estado</th></tr>${prods||'<tr><td colspan="3">Sin productos</td></tr>'}</table>
 <p><small>"Bajo" cuando quedan ${LIM_PROD} unidades o menos</small></p></div></div>`}
function alertasView(){
 const al=calcAlertas();
 return`<h2>Alertas</h2>
 ${al.map(a=>`<div class="alert ${a.nivel}">${a.t}${a.nivel!=='g'?` <button class="sec" style="float:right" onclick="enviarWA(${JSON.stringify(a.t).replace(/"/g,'&quot;')})">WhatsApp</button>`:''}</div>`).join('')}
 <div class="grid"> <div class="card"><h3>Configuración</h3><label>Stock mínimo de harina (sacos)</label><input id="mh" type="number" value="${DB.config.minHarina}">
 <label>Avisar cuando queden este número de sacos de una marca</label><input id="as" type="number" min="0" step="0.5" value="${cfgAviso()}">
 <label>Calcular la compra para cuántos días de producción</label><input id="dc" type="number" min="1" step="1" value="${cfgDias()}">
 <label>WhatsApp del dueño (con lada, ej. 529811234567)</label><input id="wa" value="${DB.config.whatsapp}"><br><br><button onclick="guardarCfg()">Guardar</button></div>
 <div class="card"><h3>Contraseña del empleado</h3>
 <label>Nueva contraseña del empleado</label><input id="pe1" type="password" autocomplete="new-password">
 <label>Repite la nueva contraseña</label><input id="pe2" type="password" autocomplete="new-password">
 <label>Tu contraseña de administrador (para confirmar)</label><input id="pea" type="password" autocomplete="current-password">
 <br><br><button onclick="cambiarPassEmpleado()">Cambiar contraseña</button></div></div>
 <h3 style="margin:1.2rem 0 .6rem">Existencias</h3>${existenciasHTML()}`}

