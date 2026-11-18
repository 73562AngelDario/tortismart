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
/* --- Ventas de ejemplo (septiembre y octubre 2026) --- */
function generarVentasEjemplo(){
 let s=20260901;const rnd=()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296};
 const pick=a=>a[Math.floor(rnd()*a.length)];
 const rap=DB.rapidos.length?DB.rapidos:[{n:'$20 tortilla',p:20}];
 const peso=[3,5,3,3,1,1,1]; // más ventas de $10-$20-$50 que de otros
 const bolsa=[];rap.forEach((r,i)=>{for(let k=0;k<(peso[i]||1);k++)bolsa.push(r)});
 const prods=DB.productos.filter(p=>p.activo);
 const out=[];
 for(let d=new Date(2026,8,1);d<=new Date(2026,9,31);d.setDate(d.getDate()+1)){
  const fin=d.getDay()===0||d.getDay()===6,n=12+Math.floor(rnd()*10)+(fin?4:0),ymd=fmtD(d).replace(/-/g,'');
  for(let i=0;i<n;i++){
   const items=[];
   const r=pick(bolsa);items.push({nombre:r.n,precio:r.p,cant:1,tkg:esTortilla(r.n)?r.p/precioKg():0});
   if(prods.length&&rnd()<0.2){const p=pick(prods);items.push({nombre:p.nombre,precio:p.precio,cant:1,codigo:p.codigo})}
   const t=rnd(),pago=t<0.65?'efectivo':t<0.8?'transferencia':'terminal';
   const f=new Date(d.getFullYear(),d.getMonth(),d.getDate(),7+Math.floor(rnd()*13),Math.floor(rnd()*60),Math.floor(rnd()*60));
   out.push({uid:'ej-'+ymd+'-'+String(i).padStart(2,'0'),ts:f.toISOString(),total:items.reduce((x,y)=>x+y.precio*y.cant,0),pago,usuario:rnd()<0.7?'empleado':'admin',items})}}
 return out}
/* Los datos de septiembre y octubre se cargan solos, una sola vez (las ventas 'ej-' no se duplican) */
function autoVentasEjemplo(){
 if(DB.config.ventasEjemplo)return;
 generarVentasEjemplo().forEach(x=>DB.ventas.push({...x,sync:false}));
 DB.config.ventasEjemplo=true;save()}
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
 <tr><td>Terminal</td><td class="right">${$$(p.terminal||0)}</td></tr></table>
 <h3 style="margin-top:1.2rem">Qué se vendió</h3>
 ${repRes.tortillaKg>0?`<p>Tortilla vendida: <b>${fmtKg(repRes.tortillaKg)} kg</b></p>`:''}
 <table><tr><th>Producto</th><th class="right">Cantidad</th><th class="right">Importe</th></tr>
 ${(repRes.productos||[]).map(x=>`<tr><td>${esc(x.nombre)}</td><td class="right">${fmtKg2(x.cant)}</td><td class="right">${$$(x.importe)}</td></tr>`).join('')||'<tr><td colspan="3">Sin detalle</td></tr>'}</table>`}
 const mer=(DB.mermas||[]).filter(m=>m.fecha>=a&&m.fecha<=b);
 const mSacos=mer.reduce((s,m)=>s+m.sacos,0),mKg=mer.reduce((s,m)=>s+m.kgTortilla,0),mCosto=mer.reduce((s,m)=>s+(m.costo||0),0);
 const mermaHTML=`<div class="card"><h3>Pérdidas por merma</h3>${mer.length?`<p><b>${fmtSacosU(mSacos)}</b> de harina y <b>${fmtKg(mKg)} kg</b> de tortilla tirados${mCosto>0?` · pérdida estimada <b>${$$(mCosto)}</b>`:''} · ${mer.length} registro${mer.length>1?'s':''}</p>
 <table><tr><th>Fecha</th><th>Saco</th><th class="right">Sacos</th><th class="right">Tortilla (kg)</th><th class="right">Pérdida</th><th>Motivo</th></tr>${mer.map(m=>`<tr><td>${m.fecha}</td><td>${MARCAS[m.marca]?MARCAS[m.marca].n:m.marca}</td><td class="right">${fmtSacos(m.sacos)}</td><td class="right">${fmtKg(m.kgTortilla)}</td><td class="right">${m.costo>0?$$(m.costo):'—'}</td><td>${esc(m.motivo)}${m.nota?' · '+esc(m.nota):''}</td></tr>`).join('')}</table>`:'<p style="color:var(--mut)">Sin mermas en el periodo</p>'}</div>`;
 return`<h2>Reportes de ventas</h2><div class="card"><div class="row">
 <div><label>Periodo</label><select onchange="repP=this.value;render()">${['diario','semanal','mensual'].map(p=>`<option ${p===repP?'selected':''}>${p}</option>`).join('')}</select></div>
 <div><label>Fecha de referencia</label><input type="date" value="${repF}" onchange="repF=this.value;render()"></div>
 <button class="sec" onclick="repKey='';render()">Actualizar</button></div>
 <p style="color:var(--mut)">Del ${a} al ${b}</p>
 ${cuerpo}</div>${mermaHTML}`}
