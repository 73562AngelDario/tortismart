/* ============ VENTAS (CU002) ============ */
const total=()=>cart.reduce((s,i)=>s+i.precio*i.cant,0);
const precioKg=()=>{const r=DB.rapidos.find(x=>/1 kg tortilla/i.test(x.n));return r?r.p:28};
const esTortilla=n=>/tortilla/i.test(n);
const tortillaCart=()=>cart.reduce((s,i)=>s+(i.tkg||0)*i.cant,0);
function tortillaPanel(){
 const act=lotesActivos(),disp=tortillaDisp(),tot=act.reduce((s,l)=>s+l.kgTotal,0);
 if(!DB.lotes.length)return`<div class="card"><b>Tortilla disponible</b><br><small>Aún no hay producción registrada. En Materia prima elige un saco y captura cuántos sacos vas a usar.</small></div>`;
 if(disp<=0)return`<div class="alert r" style="font-size:1.05rem">Ya no hay más tortillas. Registra una nueva producción en Materia prima.</div>`;
 const pct=Math.max(0,Math.min(100,disp/tot*100));
 return`<div class="card tort"><div class="row" style="align-items:center"><div><small>Tortilla disponible</small><div class="big">${fmtKg(disp)} kg</div></div>
 <div style="flex:3"><div class="bar ${pct<=15?'low':''}"><i style="width:${pct}%"></i></div>
 ${act.map((l,i)=>`<div class="lote"><span>${i===0?'<span class="tag uso">En uso</span> ':''}${MARCAS[l.marca].n} · ${fmtSacosU(l.sacos)}</span><span>quedan <b>${fmtKg(l.kgRestante)}</b> de ${fmtKg(l.kgTotal)} kg</span></div>`).join('')}</div></div></div>`}
function resurtidoPanel(){
 const b=productosBajos();
 if(!b.length)return'';
 return`<div class="alert ${b.some(p=>p.stock<=0)?'r':'y'}"><b>Por resurtir:</b> ${b.map(p=>`${esc(p.nombre)} (${p.stock<=0?'agotado':'quedan '+p.stock})`).join(' · ')}</div>`}
function addRapido(i){const r=DB.rapidos[i];cart.push({nombre:r.n,precio:r.p,cant:1,tkg:esTortilla(r.n)?r.p/precioKg():0});render()}
function addMonto(){
 const m=parseFloat(v('monto')),c=v('concepto');
 if(!(m>0)){flash('Escribe un monto mayor a cero','err');return render()}
 cart.push({nombre:'$'+m+' de '+c.toLowerCase(),precio:m,cant:1,tkg:c==='Tortilla'?m/precioKg():0});render()}
function sugerir(inp,box,soloActivos){
 const q=document.getElementById(inp).value.trim(),b=document.getElementById(box);
 if(!q){b.innerHTML='';return}
 const l=DB.productos.filter(p=>p.codigo.startsWith(q)&&(!soloActivos||p.activo));
 b.innerHTML=l.length?l.map(p=>`<div class="sug" onclick="elegir('${inp}','${box}','${p.codigo}')"><span><b>${p.codigo}</b> &nbsp;${p.nombre}</span><span>${$$(p.precio)}</span></div>`).join(''):'<div class="sug vacio">Producto no encontrado</div>'}
function elegir(inp,box,c){const i=document.getElementById(inp);i.value=c;document.getElementById(box).innerHTML='';i.focus()}
function addCodigo(){
 const c=v('cod').trim(),q=parseFloat(v('qty'))||1;
 const p=DB.productos.find(x=>x.codigo===c&&x.activo);
 if(!p){flash('Producto no encontrado','err');return render()}
 if(q<=0){flash('Cantidad inválida','err');return render()}
 cart.push({nombre:p.nombre,precio:p.precio,cant:q,codigo:p.codigo});render()}
function quitar(i){cart.splice(i,1);render()}
function cambioCalc(){
 const ef=v('pago')==='efectivo',box=document.getElementById('boxEfectivo');
 box.style.display=ef?'block':'none';
 if(!ef){document.getElementById('recibido').value='';document.getElementById('cambio').textContent='—';return}
 const t=total(),r=parseFloat(v('recibido'))||0;
 document.getElementById('cambio').textContent=r>=t&&t>0?$$(r-t):'—'}
function cobrar(){
 const t=total(),pago=v('pago');
 if(t<=0){flash('No se puede confirmar una venta con monto cero','err');return render()}
 if(!pago){flash('Selecciona la forma de pago','err');return render()}
 let cambio=0;
 if(pago==='efectivo'){const r=parseFloat(v('recibido'))||0;if(r<t){flash('El efectivo recibido es menor al total','err');return render()}cambio=r-t}
 if(pago==='terminal'&&!confirm('¿La terminal ya mostró el pago como APROBADO?\n\nSolo confirma la venta si el pago ya se aprobó.'))return;
 const need=tortillaCart(),disp=tortillaDisp();
 if(need>0.0005&&need>disp+0.0005&&!confirm(disp<=0?`Ya no hay más tortillas registradas y esta venta necesita ${fmtKg2(need)} kg.\n¿Vender de todos modos?`:`Solo quedan ${fmtKg2(disp)} kg de tortilla registrada y esta venta necesita ${fmtKg2(need)} kg.\n¿Vender de todos modos?`))return;
 const vendidos=[];
 for(const i of cart)if(i.codigo){const p=DB.productos.find(x=>x.codigo===i.codigo);if(p){p.stock=Math.max(0,p.stock-i.cant);vendidos.push(p)}}
 DB.ventas.push({uid:Date.now().toString(36)+Math.random().toString(36).slice(2,8),ts:new Date().toISOString(),total:t,pago,usuario:sesion.user,items:cart});
 descontarTortilla(need);revisarTortilla();
 const resurtir=[...new Set(vendidos)].filter(p=>p.stock<=limProd());
 save();cart=[];flash('Venta registrada'+(pago==='efectivo'?` · Cambio: ${$$(cambio)}`:'')+(need>0&&tortillaDisp()<=0.0005?' · Ya no hay más tortillas':'')+(resurtir.length?' · Resurtir: '+resurtir.map(p=>`${esc(p.nombre)} (quedan ${p.stock})`).join(', '):''));render()}
function ventasView(){
 const t=total();
 return`<h2>Ventas en mostrador</h2>${tortillaPanel()}${resurtidoPanel()}<div class="grid">
 <div><div class="card"><h3>Venta rápida</h3><div class="quick">${DB.rapidos.map((r,i)=>`<button onclick="addRapido(${i})">${r.n}<br><small>${$$(r.p)}</small></button>`).join('')}</div></div>
 <div class="card"><h3>Monto libre</h3><div class="row"><div><label>Concepto</label><select id="concepto"><option>Tortilla</option><option>Masa</option><option>Totopos</option></select></div>
 <div><label>Monto ($)</label><input id="monto" type="number" min="1" step="any" placeholder="Ej. 5, 6, 13" onkeydown="if(event.key==='Enter')addMonto()"></div><button onclick="addMonto()">Agregar</button></div></div>
 <div class="card"><h3>Cobrar por código</h3><div class="row"><div class="sugwrap"><label>Código</label><input id="cod" autocomplete="off" oninput="sugerir('cod','sug1',true)" onkeydown="if(event.key==='Enter')addCodigo()"><div class="sugbox" id="sug1"></div></div>
 <div><label>Cantidad</label><input id="qty" type="number" value="1" min="1" step="any"></div><button onclick="addCodigo()">Agregar</button></div></div></div>
 <div class="card"><h3>Ticket</h3>
 <table>${cart.map((i,n)=>`<tr><td>${i.nombre}${i.cant!==1?' x'+i.cant:''}${i.tkg?` <small>(${fmtKg2(i.tkg*i.cant)} kg)</small>`:''}</td><td class="right">${$$(i.precio*i.cant)}</td><td><button class="sec" onclick="quitar(${n})">x</button></td></tr>`).join('')||'<tr><td style="color:var(--mut)">Sin artículos</td></tr>'}</table>
 <p class="big right">${$$(t)}</p>
 <label>Forma de pago</label><select id="pago" onchange="cambioCalc()"><option value="">— Seleccionar —</option><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option><option value="terminal">Terminal</option></select>
 <div id="boxEfectivo" style="display:none"><label>Efectivo recibido</label><input id="recibido" type="number" min="0" step="any" oninput="cambioCalc()">
 <p>Cambio: <b id="cambio">—</b></p></div>
 <div class="row"><button onclick="cobrar()">Confirmar venta</button><button class="sec" onclick="cart=[];render()">Cancelar</button></div></div></div>`}

