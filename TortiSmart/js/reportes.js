/* ============ REPORTES (CU003) ============ */
let repP='diario',repF=hoy();
function rango(){
 const d=new Date(repF+'T00:00:00');let a=new Date(d),b=new Date(d);
 if(repP==='semanal'){const dow=(d.getDay()+6)%7;a.setDate(d.getDate()-dow);b=new Date(a);b.setDate(a.getDate()+6)}
 if(repP==='mensual'){a=new Date(d.getFullYear(),d.getMonth(),1);b=new Date(d.getFullYear(),d.getMonth()+1,0)}
 return[fmtD(a),fmtD(b)]}
function reportesView(){
 const[a,b]=rango();
 const vs=DB.ventas.filter(x=>{const f=fmtD(new Date(x.ts));return f>=a&&f<=b});
 const sum=p=>vs.filter(x=>!p||x.pago===p).reduce((s,x)=>s+x.total,0);
 return`<h2>Reportes de ventas</h2><div class="card"><div class="row">
 <div><label>Periodo</label><select onchange="repP=this.value;render()">${['diario','semanal','mensual'].map(p=>`<option ${p===repP?'selected':''}>${p}</option>`).join('')}</select></div>
 <div><label>Fecha de referencia</label><input type="date" value="${repF}" onchange="repF=this.value;render()"></div></div>
 <p style="color:var(--mut)">Del ${a} al ${b}</p>
 ${vs.length?`<div class="big">${$$(sum())}</div><p>${vs.length} ventas</p>
 <table><tr><th>Forma de pago</th><th class="right">Ingresos</th></tr>
 <tr><td>Efectivo</td><td class="right">${$$(sum('efectivo'))}</td></tr>
 <tr><td>Transferencia</td><td class="right">${$$(sum('transferencia'))}</td></tr>
 <tr><td>Terminal</td><td class="right">${$$(sum('terminal'))}</td></tr></table>`
 :'<div class="alert y">No hay ventas registradas en el periodo seleccionado</div>'}</div>`}

