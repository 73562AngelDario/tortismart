/* ============ RENDIMIENTO (CU006) ============ */
let rendFecha=hoy();
function evalRend(marca,rend){
 const m=MARCAS[marca],meta=(m.min+m.max)/2,dif=rend-meta;
 let cls,texto;
 const tol=m.min===m.max?m.min*0.05:0;
 if(rend<m.min-tol){cls='r';texto='Por debajo del rango esperado: posible merma o falla en la masa'}
 else if(rend>m.max+tol){cls='y';texto='Por encima del rango esperado: revisa el pesaje de sacos y tortilla'}
 else{cls='g';texto='Dentro del rango esperado'}
 return{rend,meta,dif,cls,texto}}
function rendimientoDia(f){
 const d=DB.produccion.filter(p=>p.fecha===f),por={};
 d.forEach(x=>{const k=x.marca||'maseca',m=MARCAS[k],g=por[k]=por[k]||{sacos:0,kgEst:0,sacosReal:0,kgReal:0};
  g.sacos+=x.sacos;g.kgEst+=(x.kgEst!=null?x.kgEst:x.sacos*(m.min+m.max)/2);
  if(x.kg>0){g.sacosReal+=x.sacos;g.kgReal+=x.kg}});
 return{n:d.length,por,regs:d}}
function rendimientoView(){
 const r=rendimientoDia(rendFecha);let out;
 if(!r.n)out='<div class="alert y">No hay producción registrada en esa fecha</div>';
 else out=`<div class="grid">${Object.entries(r.por).map(([k,g])=>{
  const m=MARCAS[k];let eva;
  if(g.sacosReal>0){const e=evalRend(k,g.kgReal/g.sacosReal);
   eva=`<p>Tortilla real: <b>${fmtKg(g.kgReal)} kg</b> · Rendimiento <b>${e.rend.toFixed(2)} kg/saco</b></p>
   <p>Meta: ${e.meta.toFixed(2)} kg (rango ${rngTxt(m.min,m.max)}) · Diferencia: <b>${e.dif>=0?'+':''}${e.dif.toFixed(2)} kg</b></p>
   <div class="alert ${e.cls}">${e.texto}</div>`}
  else eva='<div class="alert i">Sin pesaje real: el rendimiento se mide cuando se captura la tortilla real obtenida.</div>';
  return`<div class="card"><h3>${m.n}</h3><p>Sacos usados: <b>${fmtSacosU(g.sacos)}</b></p>
  <div class="big">${fmtKg(g.kgEst)} <small>kg de tortilla estimada</small></div>${eva}</div>`}).join('')}</div>
  <div class="card"><h3>Registros del día</h3><table><tr><th>Marca</th><th>Sacos</th><th>Estimada (kg)</th><th>Real (kg)</th><th>Rendimiento</th><th>Usuario</th></tr>
  ${r.regs.map(x=>{const m=MARCAS[x.marca||'maseca'],est=x.kgEst!=null?x.kgEst:x.sacos*(m.min+m.max)/2;
   return`<tr><td>${m.n}</td><td>${fmtSacos(x.sacos)}</td><td>${fmtKg(est)}</td><td>${x.kg>0?fmtKg(x.kg):'—'}</td><td>${x.kg>0?(x.kg/x.sacos).toFixed(2)+' kg/saco':'—'}</td><td>${x.usuario}</td></tr>`}).join('')}</table></div>`;
 return`<h2>Cálculo de rendimiento</h2>
 <div class="card"><label>Fecha</label><input type="date" value="${rendFecha}" onchange="rendFecha=this.value;render()" style="max-width:220px"></div>
 ${out}
 <div class="card"><h3>Rendimientos de referencia</h3><table><tr><th>Marca</th><th>Por 1 kg de harina</th><th>Por saco completo</th></tr>
 ${activas().map(([k,m])=>`<tr><td>${m.n} (${m.kg} kg)</td><td>${m.porKg} kg</td><td>${rngTxt(m.min,m.max)} kg</td></tr>`).join('')}</table></div>`}
