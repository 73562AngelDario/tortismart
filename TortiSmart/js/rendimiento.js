/* ============ RENDIMIENTO (CU006) ============ */
let rendFecha=hoy();
function rendimientoDia(f){
 const d=DB.produccion.filter(p=>p.fecha===f);
 return{kg:d.reduce((s,x)=>s+x.kg,0),sacos:d.reduce((s,x)=>s+x.sacos,0),n:d.length}}
function guardarEstandar(){const e=parseFloat(v('est'));if(!(e>0)){flash('Estándar inválido','err');return render()}DB.config.estandar=e;save();flash('Estándar guardado');render()}
function rendimientoView(){
 const r=rendimientoDia(rendFecha),std=DB.config.estandar;
 let out;
 if(!r.n)out='<div class="alert y">No hay producción registrada en esa fecha</div>';
 else if(r.sacos<=0)out='<div class="alert r">No se puede calcular el rendimiento sin sacos registrados</div>';
 else{const rend=r.kg/r.sacos,dif=rend-std;
  out=`<p>Kilos producidos: <b>${r.kg}</b> · Sacos usados: <b>${r.sacos}</b></p>
  <div class="big">${rend.toFixed(2)} kg/saco</div>
  <p>Estándar: ${std} kg · Diferencia: <b>${dif>=0?'+':''}${dif.toFixed(2)} kg</b></p>
  ${rend<std?'<div class="alert r">⚠ Rendimiento menor a la meta: posible merma o falla en la masa</div>':'<div class="alert g">Rendimiento dentro de la meta</div>'}`}
 return`<h2>Cálculo de rendimiento</h2><div class="grid"><div class="card"><label>Fecha</label>
 <input type="date" value="${rendFecha}" onchange="rendFecha=this.value;render()"><br><br>${out}</div>
 <div class="card"><h3>Rendimiento estándar (kg/saco)</h3><input id="est" type="number" value="${std}"><br><br><button onclick="guardarEstandar()">Guardar</button></div></div>`}

