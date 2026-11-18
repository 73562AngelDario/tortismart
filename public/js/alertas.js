/* ============ ALERTAS (CU007) ============ */
function diasRestantes(k,campo){
 const cons=DB.produccion.reduce((s,x)=>s+(x[campo]||0),0);
 const dias=new Set(DB.produccion.filter(x=>x[campo]>0).map(x=>x.fecha)).size;
 if(!cons||!dias)return null;
 return DB.insumos[k].stock/(cons/dias)}
function calcAlertas(){
 const a=[],h=totalHarina(),min=DB.config.minHarina;
 if(h<=min)a.push({nivel:h<min?'r':'y',t:`Quedan ${fmtSacosU(h)} de harina en total. Stock crítico`});
 if(DB.lotes.length){const d=tortillaDisp(),t=lotesActivos().reduce((x,l)=>x+l.kgTotal,0);
  if(d<=0.0005)a.push({nivel:'r',t:'Ya no hay más tortillas registradas. Registra una nueva producción'});
  else if(d/t<=0.15)a.push({nivel:'y',t:`Quedan pocas tortillas: ${fmtKg(d)} kg`})}
 Object.entries(rendimientoDia(hoy()).por).forEach(([k,g])=>{
  if(g.sacosReal>0&&g.kgReal/g.sacosReal<MARCAS[k].min)a.push({nivel:'y',t:`Rendimiento de hoy con ${MARCAS[k].n} (${(g.kgReal/g.sacosReal).toFixed(2)} kg/saco) por debajo del mínimo de ${MARCAS[k].min}`})});
 [['papel','papel','Papel']].forEach(([k,c,n])=>{
  const d=diasRestantes(k,c);
  if(d!==null&&d<=5)a.push({nivel:d<=2?'r':'y',t:`${n}: se agotará en aprox. ${d.toFixed(1)} días`})});
 if(!a.length)a.push({nivel:'g',t:'Sin alertas por el momento'});
 return a}
function guardarCfg(){
 DB.config.minHarina=parseFloat(v('mh'))||3;DB.config.whatsapp=v('wa').trim();save();flash('Configuración guardada');render()}
function enviarWA(t){
 if(!DB.config.whatsapp){flash('Registra primero el número de WhatsApp','err');return render()}
 window.open(`https://wa.me/${DB.config.whatsapp}?text=${encodeURIComponent(t)}`,'_blank')}
function alertasView(){
 const al=calcAlertas(),pd=diasRestantes('papel','papel');
 return`<h2>Alertas</h2>
 ${al.map(a=>`<div class="alert ${a.nivel}">${a.t}${a.nivel!=='g'?` <button class="sec" style="float:right" onclick="enviarWA(${JSON.stringify(a.t).replace(/"/g,'&quot;')})">WhatsApp</button>`:''}</div>`).join('')}
 <div class="grid"><div class="card"><h3>Días restantes estimados</h3>
 <p>Papel: <b>${pd===null?'sin datos':pd.toFixed(1)+' días'}</b></p></div>
 <div class="card"><h3>Configuración</h3><label>Stock mínimo de harina (sacos)</label><input id="mh" type="number" value="${DB.config.minHarina}">
 <label>WhatsApp del dueño (con lada, ej. 529811234567)</label><input id="wa" value="${DB.config.whatsapp}"><br><br><button onclick="guardarCfg()">Guardar</button></div></div>`}

