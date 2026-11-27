/* ============ REPORTES (CU003) ============ */
let repP='diario',repF=hoy(),repRes=null,repKey='';
function rango(){
 const d=new Date(repF+'T00:00:00');let a=new Date(d),b=new Date(d);
 if(repP==='semanal'){const dow=(d.getDay()+6)%7;a.setDate(d.getDate()-dow);b=new Date(a);b.setDate(a.getDate()+6)}
 if(repP==='mensual'){a=new Date(d.getFullYear(),d.getMonth(),1);b=new Date(d.getFullYear(),d.getMonth()+1,0)}
 return[fmtD(a),fmtD(b)]}
function cargarReporte(a,b,key){
 const d1=new Date(a+'T00:00:00').getTime(),d2=new Date(b+'T23:59:59.999').getTime();
 api('/reporte?desde='+d1+'&hasta='+d2+'&tz='+new Date().getTimezoneOffset())
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
/* --- Gráfica de ventas (SVG, sin librerías): por hora si el periodo es diario, por día si es semanal o mensual --- */
function pasoBonito(x){const p=Math.pow(10,Math.floor(Math.log10(x||1))),f=x/p;return(f<=1?1:f<=2?2:f<=5?5:10)*p}
function graficaVentas(r){
 const[a,b]=rango(),dn=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];let datos=[],tit;
 if(repP==='diario'){
  const m={};(r.porHora||[]).forEach(x=>m[x.h]=x);
  const hs=Object.keys(m).map(Number);
  for(let h=Math.min(7,...hs);h<=Math.max(20,...hs);h++){const x=m[h]||{n:0,total:0};datos.push({etq:h+'h',val:x.total,n:x.n,tip:h+':00 a '+h+':59'})}
  tit='Ventas por hora'}
 else{
  const m={};(r.porDia||[]).forEach(x=>m[x.dia]=x);
  for(const d=new Date(a+'T00:00:00'),fin=new Date(b+'T00:00:00');d<=fin;d.setDate(d.getDate()+1)){
   const k=fmtD(d),x=m[k]||{n:0,total:0};
   datos.push({etq:repP==='semanal'?dn[d.getDay()]+' '+d.getDate():String(d.getDate()),val:x.total,n:x.n,tip:dn[d.getDay()]+' '+k})}
  tit='Ventas por día'}
 const W=640,H=250,L=52,R=8,T=16,B=30,n=datos.length;
 const vals=datos.map(d=>d.val),maxV=Math.max(...vals,0),paso=pasoBonito((maxV||1)/4),top=Math.ceil((maxV||1)/paso)*paso;
 const bw=(W-L-R)/n,anch=Math.min(bw*.7,48),y=q=>T+(H-T-B)*(1-q/top),cada=Math.ceil(n/(repP==='semanal'?7:12));
 let g='';
 for(let t=0;t<=top+paso/100;t+=paso)g+=`<line x1="${L}" x2="${W-R}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}" stroke="#e3e0d3"/><text x="${L-6}" y="${(y(t)+4).toFixed(1)}" text-anchor="end" font-size="11" fill="#6b7a72">$${Math.round(t)}</text>`;
 datos.forEach((d,i)=>{
  const x=L+bw*i+(bw-anch)/2,h=Math.max(0,y(0)-y(d.val));
  g+=`<rect x="${x.toFixed(1)}" y="${y(d.val).toFixed(1)}" width="${anch.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${d.val===maxV&&d.val>0?'#e2a33b':'#1f5c3a'}"><title>${d.tip}: ${$$(d.val)} · ${d.n} venta${d.n===1?'':'s'}</title></rect>`;
  if(i%cada===0)g+=`<text x="${(x+anch/2).toFixed(1)}" y="${H-10}" text-anchor="middle" font-size="11" fill="#6b7a72">${d.etq}</text>`});
 const mejor=datos.find(d=>d.val===maxV&&maxV>0);
 return`<h3 style="margin-top:1.2rem">${tit}</h3>
 <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block" role="img" aria-label="${tit}">${g}</svg>
 ${mejor?`<p><small>${repP==='diario'?'Hora más fuerte':'Día más fuerte'}: <b>${mejor.tip}</b> con ${$$(maxV)} (${mejor.n} ventas)</small></p>`:''}`}
function reportesView(){
 const[a,b]=rango(),key=a+'|'+b;
 if(repKey!==key){repKey=key;repRes=null;cargarReporte(a,b,key)}
 let cuerpo;
 if(!repRes)cuerpo='<p style="color:var(--mut)">Cargando…</p>';
 else if(repRes.error)cuerpo=`<div class="alert r">No se pudo cargar el reporte: ${repRes.error}</div>`;
 else if(!repRes.n)cuerpo='<div class="alert y">No hay ventas registradas en el periodo seleccionado</div>';
 else{const p=repRes.porPago||{};
  cuerpo=`<div class="big">${$$(repRes.total)}</div><p>${repRes.n} ventas · ticket promedio <b>${$$(repRes.total/repRes.n)}</b></p>
 ${graficaVentas(repRes)}
 <h3 style="margin-top:1.2rem">Forma de pago</h3>
 <table><tr><th>Forma de pago</th><th class="right">%</th><th class="right">Ingresos</th></tr>
 ${[['Efectivo','efectivo'],['Transferencia','transferencia'],['Terminal','terminal']].map(([t,k])=>`<tr><td>${t}</td><td class="right">${Math.round((p[k]||0)/repRes.total*100)}%</td><td class="right">${$$(p[k]||0)}</td></tr>`).join('')}</table>
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
