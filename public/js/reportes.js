/* ============ REPORTES (CU003) ============ */
let repP='diario',repF=hoy(),repRes=null,repKey='';
function rango(){
 const d=new Date(repF+'T00:00:00');let a=new Date(d),b=new Date(d);
 if(repP==='semanal'){const dow=(d.getDay()+6)%7;a.setDate(d.getDate()-dow);b=new Date(a);b.setDate(a.getDate()+6)}
 if(repP==='mensual'){a=new Date(d.getFullYear(),d.getMonth(),1);b=new Date(d.getFullYear(),d.getMonth()+1,0)}
 return[fmtD(a),fmtD(b)]}
function cargarReporte(a,b,key){
 const d1=new Date(a+'T00:00:00').getTime(),d2=new Date(b+'T23:59:59.999').getTime();
 api('/reporte?desde='+d1+'&hasta='+d2)
  .then(r=>{if(repKey===key){repRes=r;render()}})
  .catch(e=>{if(repKey===key){repRes={error:e.message};render()}})}
function reportesView(){
 const[a,b]=rango(),key=a+'|'+b;
 if(repKey!==key){repKey=key;repRes=null;cargarReporte(a,b,key)}
 let cuerpo;
 if(!repRes)cuerpo='<p style="color:var(--mut)">Cargando…</p>';
 else if(repRes.error)cuerpo=`<div class="alert r">No se pudo cargar el reporte: ${repRes.error}</div>`;
 else if(!repRes.n)cuerpo='<div class="alert y">No hay ventas registradas en el periodo seleccionado</div>';
 else{const p=repRes.porPago||{};
  cuerpo=`<div class="big">${$$(repRes.total)}</div><p>${repRes.n} ventas</p>
 <table><tr><th>Forma de pago</th><th class="right">Ingresos</th></tr>
 <tr><td>Efectivo</td><td class="right">${$$(p.efectivo||0)}</td></tr>
 <tr><td>Transferencia</td><td class="right">${$$(p.transferencia||0)}</td></tr>
 <tr><td>Terminal</td><td class="right">${$$(p.terminal||0)}</td></tr></table>`}
 return`<h2>Reportes de ventas</h2><div class="card"><div class="row">
 <div><label>Periodo</label><select onchange="repP=this.value;render()">${['diario','semanal','mensual'].map(p=>`<option ${p===repP?'selected':''}>${p}</option>`).join('')}</select></div>
 <div><label>Fecha de referencia</label><input type="date" value="${repF}" onchange="repF=this.value;render()"></div>
 <button class="sec" onclick="repKey='';render()">Actualizar</button></div>
 <p style="color:var(--mut)">Del ${a} al ${b}</p>
 ${cuerpo}</div>`}
