/* ============ VENTAS (CU002) ============ */
const total=()=>cart.reduce((s,i)=>s+i.precio*i.cant,0);
function addRapido(i){const r=DB.rapidos[i];cart.push({nombre:r.n,precio:r.p,cant:1});render()}
function addCodigo(){
 const c=v('cod').trim(),q=parseFloat(v('qty'))||1;
 const p=DB.productos.find(x=>x.codigo===c&&x.activo);
 if(!p){flash('Producto no encontrado','err');return render()}
 if(q<=0){flash('Cantidad inválida','err');return render()}
 cart.push({nombre:p.nombre,precio:p.precio,cant:q,codigo:p.codigo});render()}
function quitar(i){cart.splice(i,1);render()}
function cambioCalc(){
 const t=total(),r=parseFloat(v('recibido'))||0;
 document.getElementById('cambio').textContent=v('pago')==='efectivo'&&r>=t?$$(r-t):'—'}
function cobrar(){
 const t=total(),pago=v('pago');
 if(t<=0){flash('No se puede confirmar una venta con monto cero','err');return render()}
 if(!pago){flash('Selecciona la forma de pago','err');return render()}
 let cambio=0;
 if(pago==='efectivo'){const r=parseFloat(v('recibido'))||0;if(r<t){flash('El efectivo recibido es menor al total','err');return render()}cambio=r-t}
 for(const i of cart)if(i.codigo){const p=DB.productos.find(x=>x.codigo===i.codigo);if(p)p.stock=Math.max(0,p.stock-i.cant)}
 DB.ventas.push({ts:new Date().toISOString(),total:t,pago,usuario:sesion.user,items:cart});
 save();cart=[];flash('Venta registrada'+(pago==='efectivo'?` · Cambio: ${$$(cambio)}`:''));render()}
function ventasView(){
 const t=total();
 return`<h2>Ventas en mostrador</h2><div class="grid">
 <div><div class="card"><h3>Venta rápida</h3><div class="quick">${DB.rapidos.map((r,i)=>`<button onclick="addRapido(${i})">${r.n}<br><small>${$$(r.p)}</small></button>`).join('')}</div></div>
 <div class="card"><h3>Cobrar por código</h3><div class="row"><div><label>Código</label><input id="cod" onkeydown="if(event.key==='Enter')addCodigo()"></div>
 <div><label>Cantidad</label><input id="qty" type="number" value="1" min="1" step="any"></div><button onclick="addCodigo()">Agregar</button></div></div></div>
 <div class="card"><h3>Ticket</h3>
 <table>${cart.map((i,n)=>`<tr><td>${i.nombre}${i.cant!==1?' x'+i.cant:''}</td><td class="right">${$$(i.precio*i.cant)}</td><td><button class="sec" onclick="quitar(${n})">✕</button></td></tr>`).join('')||'<tr><td style="color:var(--mut)">Sin artículos</td></tr>'}</table>
 <p class="big right">${$$(t)}</p>
 <label>Forma de pago</label><select id="pago" onchange="cambioCalc()"><option value="">— Seleccionar —</option><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option><option value="terminal">Terminal</option></select>
 <label>Efectivo recibido</label><input id="recibido" type="number" min="0" step="any" oninput="cambioCalc()">
 <p>Cambio: <b id="cambio">—</b></p>
 <div class="row"><button onclick="cobrar()">✔ Confirmar venta</button><button class="sec" onclick="cart=[];render()">Cancelar</button></div></div></div>`}

