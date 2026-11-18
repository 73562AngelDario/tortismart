/* ============ ALERTAS (CU007) ============ */
function diasRestantes(k,campo){
 const cons=DB.produccion.reduce((s,x)=>s+(x[campo]||0),0);
 const dias=new Set(DB.produccion.filter(x=>x[campo]>0).map(x=>x.fecha)).size;
 if(!cons||!dias)return null;
 return DB.insumos[k].stock/(cons/dias)}
function calcAlertas(){
 const a=[],h=DB.insumos.harina.stock,min=DB.config.minHarina;
 if(h<=min)a.push({nivel:h<=0?'r':(h<min?'r':'y'),t:`Quedan ${h} sacos de harina. Stock crítico`});
 const r=rendimientoDia(hoy());
 if(r.n&&r.sacos>0&&r.kg/r.sacos<DB.config.estandar)a.push({nivel:'y',t:`Rendimiento de hoy (${(r.kg/r.sacos).toFixed(2)} kg/saco) por debajo de la meta de ${DB.config.estandar}`});
 [['gas','gas','Gas'],['papel','papel','Papel']].forEach(([k,c,n])=>{
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
 const al=calcAlertas(),gd=diasRestantes('gas','gas'),pd=diasRestantes('papel','papel');
 return`<h2>Alertas</h2>
 ${al.map(a=>`<div class="alert ${a.nivel}">${a.nivel==='r'?'🔴':a.nivel==='y'?'🟡':'🟢'} ${a.t}${a.nivel!=='g'?` <button class="sec" style="float:right" onclick="enviarWA(${JSON.stringify(a.t).replace(/"/g,'&quot;')})">WhatsApp</button>`:''}</div>`).join('')}
 <div class="grid"><div class="card"><h3>Días restantes estimados</h3>
 <p>Gas: <b>${gd===null?'sin datos':gd.toFixed(1)+' días'}</b></p><p>Papel: <b>${pd===null?'sin datos':pd.toFixed(1)+' días'}</b></p></div>
 <div class="card"><h3>Configuración</h3><label>Stock mínimo de harina (sacos)</label><input id="mh" type="number" value="${DB.config.minHarina}">
 <label>WhatsApp del dueño (con lada, ej. 529811234567)</label><input id="wa" value="${DB.config.whatsapp}"><br><br><button onclick="guardarCfg()">Guardar</button></div></div>`}

