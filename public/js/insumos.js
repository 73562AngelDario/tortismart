/* ============ MATERIA PRIMA (CU004) ============ */
let prodPend=null,prodMarca=null,nuevaMarca=false,mermaAbierta=false,verTodasCompras=false;
function registrarCompra(){
 const k=v('ci'),q=parseFloat(v('cq')),f=v('cf');
 if(!k||!f||v('cq')===''){flash('Insumo, cantidad y fecha son obligatorios','err');return render()}
 if(!(q>0)){flash('La cantidad debe ser numérica y mayor a cero','err');return render()}
 DB.insumos[k].stock+=q;DB.compras.push({fecha:f,insumo:k,cant:q,usuario:sesion.user});
 save();flash('Compra registrada');render()}

/* --- selección de saco --- */
function elegirMarca(k){prodPend=k;render()}
function cancelarMarca(){prodPend=null;render()}
function confirmarMarca(){prodMarca=prodPend;prodPend=null;render();
 const f=document.getElementById('formProd');if(f)f.scrollIntoView({behavior:'smooth',block:'start'})}
function cambiarMarca(){prodMarca=null;render()}

/* --- estimación automática de tortilla --- */
function resultadoHTML(marca,sc,kgReal){
 if(!(sc>0))return'<div class="res-vacio">Escribe cuántos sacos vas a usar para ver cuánta tortilla saldrá.</div>';
 const m=MARCAS[marca],est=sc*(m.min+m.max)/2;
 let h=`<div class="res-grid">
 <div><small>Tortilla que saldrá (aprox.)</small><div class="big">${fmtKg(est)}</div><small>kg</small></div>
 <div><small>Rango esperado</small><div class="big2">${rngTxt(fmtKg(sc*m.min),fmtKg(sc*m.max))}</div><small>kg de tortilla</small></div>
 <div><small>Harina a usar</small><div class="big2">${fmtKg(sc*m.kg)}</div><small>kg (${fmtSacosU(sc)} de ${m.n})</small></div></div>`;
 if(kgReal>0){const e=evalRend(marca,kgReal/sc);
  h+=`<p style="text-align:center">Tortilla real: <b>${fmtKg(kgReal)} kg</b> · Rendimiento <b>${e.rend.toFixed(2)} kg/saco</b> (meta ${e.meta.toFixed(2)}, diferencia ${e.dif>=0?'+':''}${e.dif.toFixed(2)})</p><div class="alert ${e.cls}">${e.texto}</div>`}
 return h}
function calcProd(){document.getElementById('resProd').innerHTML=resultadoHTML(prodMarca,parseFloat(v('ps')),parseFloat(v('pk')))}
function setSacos(n){document.getElementById('ps').value=n;calcProd()}

function registrarProd(){
 const sc=parseFloat(v('ps')),f=v('pf'),kgReal=parseFloat(v('pk'))||0;
 if(!prodMarca){flash('Selecciona y confirma el saco de harina','err');return render()}
 if(!f||!(sc>0)){flash('Indica la fecha y los sacos utilizados (mayor a cero)','err');return render()}
 if((sc*4)%1!==0){flash('Usa sacos completos o fracciones de cuarto: ¼, ½, ¾ (ej. 2.5)','err');return render()}
 const ins=DB.insumos[prodMarca],m=MARCAS[prodMarca];
 if(sc>ins.stock){flash(`Solo hay ${fmtSacosU(ins.stock)} de ${m.n} registrados. Registra primero la compra.`,'err');return render()}
 const kgEst=sc*(m.min+m.max)/2;
 DB.produccion.push({fecha:f,marca:prodMarca,sacos:sc,kgEst,kg:kgReal>0?kgReal:null,usuario:sesion.user});
 const kgLote=kgReal>0?kgReal:kgEst;
 DB.lotes.push({id:Date.now(),marca:prodMarca,sacos:sc,kgTotal:kgLote,kgRestante:kgLote,fecha:f});
 ins.stock-=sc;
 const quedan=ins.stock;prodMarca=null;revisarTortilla();save();
 flash(`Producción registrada · ${fmtSacosU(sc)} de ${m.n} · aprox. ${fmtKg(kgEst)} kg de tortilla · Tortilla disponible: ${fmtKg(tortillaDisp())} kg`+(quedan%1?` · Queda ${fmtSacos(quedan%1)} saco abierto para mañana`:''));render()}

function marcaImg(m){
 return m.img?`<img src="${m.img}" alt="${m.n}">`:`<div class="sacoph"><svg viewBox="0 0 100 140" width="110"><path d="M20 20 L80 20 L88 125 Q88 132 80 132 L20 132 Q12 132 12 125 Z" fill="#efe3c8" stroke="#b9a77a" stroke-width="3"/><path d="M20 20 Q50 34 80 20" fill="none" stroke="#b9a77a" stroke-width="3"/><text x="50" y="86" text-anchor="middle" font-size="18" font-weight="700" fill="#6b5a3a">${m.kg} kg</text></svg><b>${m.n}</b></div>`}
const esc=t=>String(t).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const oculta=k=>!!(MARCAS[k]&&MARCAS[k].archivada);
function abrirNuevaMarca(){nuevaMarca=true;render()}
function editarMarca(k){nuevaMarca=k;render()}
function cerrarNuevaMarca(){nuevaMarca=false;render()}
function guardarMarca(){
 const edit=typeof nuevaMarca==='string'?nuevaMarca:null;
 const n=v('nm').trim(),kg=parseFloat(v('nk')),mn=parseFloat(v('nt1')),mxRaw=v('nt2').trim(),mx=mxRaw===''?mn:parseFloat(mxRaw),st=parseFloat(v('ne'))||0,co=parseFloat(v('nco'))||0;
 const err=t=>{const e=document.getElementById('errNM');e.textContent=t;e.style.display='block'};
 if(!n)return err('Escribe el nombre del saco');
 if(!(kg>0))return err('Indica cuántos kilos pesa el saco');
 if(!(mn>0))return err('Indica cuántos kilos de tortilla dice que rinde');
 if(!(mx>=mn))return err('El máximo debe ser mayor o igual al mínimo');
 if(co<0)return err('El costo no puede ser negativo');
 if(st<0||(st*4)%1!==0)return err('Los sacos en existencia deben ser completos o en cuartos (ej. 2.5)');
 if(activas().some(([k,m])=>k!==edit&&m.n.toLowerCase()===n.toLowerCase()))return err('Ya existe un saco con ese nombre');
 if(edit){
  const o=MARCAS[edit],cambio=o.kg!==kg||o.min!==mn||o.max!==mx;
  const def={...o,n,kg,min:mn,max:mx,costo:co,porKg:cambio?rngTxt(+(mn/kg).toFixed(2),+(mx/kg).toFixed(2)):o.porKg};
  MARCAS[edit]=def;DB.marcasExtra[edit]=def;
  DB.insumos[edit].n=`Saco ${n} ${kg} kg`;DB.insumos[edit].stock=st;
  save();nuevaMarca=false;flash(`Saco "${n}" actualizado`);return render()}
 const key='x_'+n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
 if(key==='x_'||(MARCAS[key]&&!MARCAS[key].archivada)||(DB.insumos[key]&&!MARCAS[key]))return err('Ya existe un saco con ese nombre');
 const def={n,fab:'Marca agregada',img:null,kg,min:mn,max:mx,costo:co,porKg:rngTxt(+(mn/kg).toFixed(2),+(mx/kg).toFixed(2))};
 MARCAS[key]=def;DB.marcasExtra[key]=def;DB.insumos[key]={n:`Saco ${n} ${kg} kg`,stock:st};
 save();nuevaMarca=false;flash(`Saco "${n}" agregado${st?'':'. Registra su compra para tener existencia'}`);render()}
function eliminarMarca(k){
 const m=MARCAS[k],st=DB.insumos[k].stock;
 if(!confirm(`¿Eliminar el saco "${m.n}"?`+(st>0?`\nAún tiene ${fmtSacosU(st)} en existencia.`:'')+'\nLos registros de producción anteriores se conservan.'))return;
 m.archivada=true;DB.marcasExtra[k]=m;if(prodMarca===k)prodMarca=null;if(prodPend===k)prodPend=null;
 save();flash(`Saco "${m.n}" eliminado`);render()}

function marcaCards(){
 return activas().map(([k,m])=>{
  const sel=prodMarca===k,uso=lotesActivos().filter(l=>l.marca===k),kgU=uso.reduce((x,l)=>x+l.kgRestante,0);
  return`<div class="marca ${sel?'sel':''}"><div class="marca-img">${marcaImg(m)}${uso.length?'<span class="badge uso">En uso</span>':''}${sel?'<span class="badge">Seleccionado</span>':''}</div>
  <div class="marca-body"><h3>${m.n}</h3><small>${m.fab}</small>
  <div class="dato"><span>Por 1 kg de harina</span><b>${m.porKg} kg de tortilla</b></div>
  <div class="dato"><span>Por saco (${m.kg} kg)</span><b>${rngTxt(m.min,m.max)} kg de tortilla</b></div>
  ${uso.length?`<div class="dato"><span>Tortilla que queda de este saco</span><b>${fmtKg(kgU)} kg</b></div>`:''}
  <div class="dato"><span>Costo por saco</span><b>${m.costo>0?$$(m.costo):'Sin definir'}</b></div>
  <div class="dato"><span>Existencia</span><b>${fmtSacosU(DB.insumos[k].stock)}</b></div>
  <button class="${sel?'sec':''}" style="width:100%;margin-top:.7rem" onclick="elegirMarca('${k}')">${sel?'Saco seleccionado':'Seleccionar este saco'}</button>
  <div class="acc"><button class="sec" onclick="editarMarca('${k}')">Editar</button><button class="sec peligro" onclick="eliminarMarca('${k}')">Eliminar</button></div></div></div>`}).join('')+`<div class="marca nueva" onclick="abrirNuevaMarca()"><div class="plus">+</div><b>Agregar otro tipo de saco</b><small>Si usan una marca distinta</small></div>`}

function insumosView(){
 const ins=DB.insumos,pm=prodPend?MARCAS[prodPend]:null;
 const sob=prodMarca?DB.insumos[prodMarca].stock%1:0;
 return`<h2>Materia prima</h2>
 ${tortillaPanel()}
 <div class="row" style="margin-bottom:1rem"><button class="sec peligro" onclick="abrirMerma()">Dar de baja saco / merma</button></div>
 <div class="grid">${Object.entries(ins).filter(([k])=>!oculta(k)&&k!=='papel').map(([k,i])=>{const mk=!!MARCAS[k];return`<div class="card"><small>${i.n}</small><div class="big">${mk?fmtSacos(i.stock):i.stock}</div>${mk&&i.stock%1?`<small>incluye ${fmtSacos(i.stock%1)} saco abierto</small>`:''}</div>`}).join('')}</div>

 <h3 class="paso"><span>1</span> Registro de producción: elige el saco de harina</h3>
 <div class="marcas">${marcaCards()}</div>

 ${prodMarca?`<div class="card" id="formProd"><h3><span class="paso-n">2</span> Datos de la producción</h3>
 <div class="banner">Saco seleccionado: <b>${MARCAS[prodMarca].n}</b> · <a href="#" onclick="cambiarMarca();return false">Cambiar</a></div>
 ${(()=>{const u=lotesActivos().filter(l=>l.marca===prodMarca);return u.length?`<div class="alert i">Este saco ya se está usando actualmente: quedan <b>${fmtKg(u.reduce((x,l)=>x+l.kgRestante,0))} kg</b> de tortilla de la producción anterior. Lo que registres se suma como una nueva tanda.</div>`:''})()}
 ${sob?`<div class="alert i">Sobrante del día anterior: queda <b>${fmtSacos(sob)} saco</b> abierto de ${MARCAS[prodMarca].n}. Si lo usas hoy, cuéntalo dentro de los sacos utilizados (ej. 2 sacos + ${fmtSacos(sob)} = ${fmtSacos(2+sob)}).</div>`:''}
 <div class="grid">
 <div><label>Fecha</label><input id="pf" type="date" value="${hoy()}"></div>
 <div><label>Sacos utilizados</label><input id="ps" type="number" min="0.25" step="0.25" placeholder="Ej. 2.5" oninput="calcProd()">
  <div class="chips">${[0.5,1,1.5,2,2.5,3,4].map(n=>`<button type="button" class="sec" onclick="setSacos(${n})">${fmtSacos(n)}</button>`).join('')}</div></div>
 <div><label>Tortilla real pesada (kg, opcional)</label><input id="pk" type="number" min="0" step="any" oninput="calcProd()"><small>Solo si la pesaron; sirve para medir el rendimiento real.</small></div></div>
 <div id="resProd" class="res">${resultadoHTML(prodMarca,0,0)}</div>
 <button onclick="registrarProd()">Guardar registro</button></div>`
 :'<div class="card" style="text-align:center;color:var(--mut)">Selecciona un saco para capturar la producción.</div>'}

 <div class="grid"><div class="card"><h3>Registrar compra</h3>
 <label>Insumo</label><select id="ci"><option value="">—</option>${Object.entries(ins).filter(([k])=>!oculta(k)&&k!=='papel').map(([k,i])=>`<option value="${k}">${i.n}</option>`).join('')}</select>
 <label>Cantidad</label><input id="cq" type="number" min="0" step="any"><label>Fecha</label><input id="cf" type="date" value="${hoy()}">
 <br><button onclick="registrarCompra()">Guardar compra</button></div>
 <div class="card"><h3>Últimas compras</h3><table><tr><th>Fecha</th><th>Insumo</th><th>Cantidad</th><th>Usuario</th></tr>
 ${DB.compras.slice(verTodasCompras?0:-8).reverse().map(c=>`<tr><td>${c.fecha}</td><td>${ins[c.insumo]?ins[c.insumo].n:c.insumo}</td><td>${c.cant}</td><td>${c.usuario}</td></tr>`).join('')||'<tr><td colspan="4">Sin registros</td></tr>'}</table>
 <div class="row" style="margin-top:.8rem"><button class="sec" onclick="verTodasCompras=!verTodasCompras;render()">${verTodasCompras?'Ver solo las últimas':'Ver todas las compras'}</button>
 ${esAdmin()&&!DB.compras.some(c=>c.ejemplo)?'<button class="sec" onclick="cargarComprasEjemplo()">Agregar compras de ejemplo (sep y oct)</button>':''}</div></div></div>

 <div class="card"><h3>Mermas registradas (sacos / producción tirada)</h3><table><tr><th>Fecha</th><th>Saco</th><th>Sacos</th><th>Tortilla (kg)</th><th>Pérdida</th><th>Motivo</th><th>Usuario</th></tr>
 ${(DB.mermas||[]).slice(-8).reverse().map(m=>`<tr><td>${m.fecha}</td><td>${MARCAS[m.marca]?MARCAS[m.marca].n:m.marca}</td><td>${fmtSacos(m.sacos)}</td><td>${fmtKg(m.kgTortilla)}</td><td>${m.costo>0?$$(m.costo):'—'}</td><td>${esc(m.motivo)}${m.nota?' · '+esc(m.nota):''}</td><td>${m.usuario}</td></tr>`).join('')||'<tr><td colspan="7">Sin mermas</td></tr>'}</table></div>

 ${pm?`<div class="overlay"><div class="modal"><div class="modal-img">${marcaImg(pm)}</div>
 <h3>Seleccionaste ${pm.n}</h3><p>Por saco de ${pm.kg} kg se esperan <b>${rngTxt(pm.min,pm.max)} kg</b> de tortilla.${(()=>{const u=lotesActivos().filter(l=>l.marca===prodPend);return u.length?`<br><br><b>Este saco ya se está usando actualmente</b> (quedan ${fmtKg(u.reduce((x,l)=>x+l.kgRestante,0))} kg de tortilla).`:''})()}<br><br>¿Confirmas que usarás este saco?</p>
 <div class="row"><button onclick="confirmarMarca()">Sí, confirmar</button><button class="sec" onclick="cancelarMarca()">Cancelar</button></div></div></div>`:''}
 ${nuevaMarca?(()=>{const e=typeof nuevaMarca==='string'?MARCAS[nuevaMarca]:null;
 return`<div class="overlay"><div class="modal" style="text-align:left"><h3>${e?'Editar saco':'Agregar otro tipo de saco'}</h3>
 <label>Nombre del saco</label><input id="nm" placeholder="Ej. Maíz Nixtamal Premium" value="${e?esc(e.n):''}">
 <label>Peso del saco (kg)</label><input id="nk" type="number" min="0" step="any" value="${e?e.kg:20}">
 <label>Tortilla que dice que rinde por saco (kg)</label>
 <div class="row"><input id="nt1" type="number" min="0" step="any" placeholder="Mínimo" value="${e?e.min:''}"><input id="nt2" type="number" min="0" step="any" placeholder="Máximo (opcional)" value="${e&&e.max!==e.min?e.max:''}"></div>
 <small>Si el empaque da un solo dato, déjalo en "Mínimo".</small>
 <label>Costo por saco ($, opcional)</label><input id="nco" type="number" min="0" step="any" placeholder="Ej. 380" value="${e&&e.costo?e.costo:''}">
 <label>${e?'Sacos en existencia':'Sacos que tienes ahora (opcional)'}</label><input id="ne" type="number" min="0" step="0.25" value="${e?DB.insumos[nuevaMarca].stock:0}">
 <div class="msg err" id="errNM" style="display:none"></div>
 <br><div class="row"><button onclick="guardarMarca()">${e?'Guardar cambios':'Agregar saco'}</button><button class="sec" onclick="cerrarNuevaMarca()">Cancelar</button></div></div></div>`})():''}
 ${mermaAbierta?mermaModal():''}`}

/* --- MERMA: dar de baja un saco contaminado / producción tirada --- */
function abrirMerma(){mermaAbierta=true;render()}
function cerrarMerma(){mermaAbierta=false;render()}
function mermaModal(){
 return`<div class="overlay"><div class="modal" style="text-align:left"><h3>Dar de baja saco / merma</h3>
 <p style="color:var(--mut)">Úsalo cuando la harina se contamina o se echa a perder y hay que tirarla, junto con la tortilla ya hecha con ella.</p>
 <label>Saco afectado</label><select id="mk">${activas().map(([k,m])=>{const kg=lotesActivos().filter(l=>l.marca===k).reduce((x,l)=>x+l.kgRestante,0);return`<option value="${k}">${m.n} · existencia ${fmtSacosU(DB.insumos[k].stock)}${kg>0?' · tortilla en uso '+fmtKg(kg)+' kg':''}</option>`}).join('')}</select>
 <label>Sacos de la existencia que se tiran</label><input id="ms" type="number" min="0" step="0.25" value="0"><small>Déjalo en 0 si solo se tira la tortilla ya hecha.</small>
 <label style="display:flex;gap:.5rem;align-items:center;margin-top:.7rem"><input id="mt" type="checkbox" checked style="width:auto"> Tirar también la tortilla en uso de este saco</label>
 <label>Motivo</label><select id="mm"><option>Contaminación</option><option>Humedad / echado a perder</option><option>Plaga</option><option>Saco roto o dañado</option><option>Otro</option></select>
 <label>Nota (opcional)</label><input id="mn" placeholder="Ej. Se encontró un cuerpo extraño en la masa">
 <div class="msg err" id="errMerma" style="display:none"></div>
 <br><div class="row"><button class="bad" onclick="registrarMerma()">Dar de baja</button><button class="sec" onclick="cerrarMerma()">Cancelar</button></div></div></div>`}
function registrarMerma(){
 const k=v('mk'),sc=parseFloat(v('ms'))||0,tirarT=document.getElementById('mt').checked,motivo=v('mm'),nota=v('mn').trim();
 const err=t=>{const e=document.getElementById('errMerma');e.textContent=t;e.style.display='block'};
 if(!k||!DB.insumos[k])return err('Selecciona el saco');
 if(sc<0||(sc*4)%1!==0)return err('Los sacos deben ser completos o en cuartos (ej. 1.5)');
 if(sc>DB.insumos[k].stock)return err(`Solo hay ${fmtSacosU(DB.insumos[k].stock)} en existencia`);
 const lotes=tirarT?lotesActivos().filter(l=>l.marca===k):[];
 const kgT=lotes.reduce((x,l)=>x+l.kgRestante,0);
 const cSaco=MARCAS[k].costo||0,sacosEnTortilla=lotes.reduce((x,l)=>x+(l.kgTotal>0?l.sacos*l.kgRestante/l.kgTotal:0),0);
 const costo=Math.round((sc+sacosEnTortilla)*cSaco*100)/100;
 if(sc===0&&kgT<=0)return err('No hay nada que dar de baja: indica sacos o marca la tortilla en uso');
 if(!confirm(`¿Dar de baja ${fmtSacosU(sc)} de ${MARCAS[k].n}`+(kgT>0?` y ${fmtKg(kgT)} kg de tortilla`:'')+(costo>0?`\nPérdida estimada: ${$$(costo)}`:'')+`\nMotivo: ${motivo}\n\nEsto no se puede deshacer.`))return;
 DB.insumos[k].stock-=sc;
 lotes.forEach(l=>{l.kgRestante=0});
 DB.mermas=DB.mermas||[];
 DB.mermas.push({id:Date.now(),fecha:hoy(),marca:k,sacos:sc,kgTortilla:Math.round(kgT*1000)/1000,costo,motivo,nota,usuario:sesion.user});
 mermaAbierta=false;revisarTortilla();save();
 flash(`Merma registrada · ${fmtSacosU(sc)} de ${MARCAS[k].n}`+(kgT>0?` · ${fmtKg(kgT)} kg de tortilla tirada`:'')+(costo>0?` · Pérdida ${$$(costo)}`:''));render()}

/* --- Compras de ejemplo de septiembre y octubre (solo historial: NO cambian las existencias) --- */
function cargarComprasEjemplo(){
 if(!esAdmin())return;
 if(DB.compras.some(c=>c.ejemplo)){flash('Las compras de ejemplo ya estaban agregadas','err');return render()}
 if(!confirm('Se agregarán compras de ejemplo de septiembre y octubre 2026 al historial.\nNo cambian tus existencias actuales.\n¿Continuar?'))return;
 const plan=[
  ['2026-09-02','maseca',10],['2026-09-05','maiz',60],['2026-09-09','minsa',8],['2026-09-16','maseca',10],
  ['2026-09-19','harimasa',6],['2026-09-23','maiz',40],['2026-09-30','minsa',8],
  ['2026-10-03','maseca',10],['2026-10-07','harimasa',6],['2026-10-10','maiz',50],['2026-10-14','minsa',8],
  ['2026-10-17','maseca',10],['2026-10-21','harimasa',6],['2026-10-24','maiz',40],['2026-10-28','minsa',8],['2026-10-31','maseca',10]];
 let n=0;
 for(const [fecha,insumo,cant] of plan){if(!DB.insumos[insumo])continue;DB.compras.push({fecha,insumo,cant,usuario:sesion.user,ejemplo:true});n++}
 DB.compras.sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha)));
 save();flash(`${n} compras de ejemplo agregadas (septiembre y octubre)`);render()}
