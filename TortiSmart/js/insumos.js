/* ============ MATERIA PRIMA (CU004) ============ */
function registrarCompra(){
 const k=v('ci'),q=parseFloat(v('cq')),f=v('cf');
 if(!k||!f||v('cq')===''){flash('Insumo, cantidad y fecha son obligatorios','err');return render()}
 if(!(q>0)){flash('La cantidad debe ser numérica y mayor a cero','err');return render()}
 DB.insumos[k].stock+=q;DB.compras.push({fecha:f,insumo:k,cant:q,usuario:sesion.user});
 save();flash('Compra registrada');render()}
function registrarProd(){
 const kg=parseFloat(v('pk')),sc=parseFloat(v('ps')),f=v('pf');
 const gas=parseFloat(v('pg'))||0,pap=parseFloat(v('pa'))||0;
 if(!f||!(kg>0)||!(sc>0)){flash('Kilos, sacos y fecha deben ser numéricos mayores a cero','err');return render()}
 DB.produccion.push({fecha:f,kg,sacos:sc,gas,papel:pap,usuario:sesion.user});
 DB.insumos.harina.stock=Math.max(0,DB.insumos.harina.stock-sc);
 DB.insumos.gas.stock=Math.max(0,DB.insumos.gas.stock-gas);
 DB.insumos.papel.stock=Math.max(0,DB.insumos.papel.stock-pap);
 save();flash('Producción registrada');render()}
function insumosView(){
 const ins=DB.insumos;
 return`<h2>Materia prima</h2>
 <div class="grid">${Object.values(ins).map(i=>`<div class="card"><small>${i.n}</small><div class="big">${i.stock}</div></div>`).join('')}</div>
 <div class="grid"><div class="card"><h3>Registrar compra</h3>
 <label>Insumo</label><select id="ci"><option value="">—</option>${Object.entries(ins).map(([k,i])=>`<option value="${k}">${i.n}</option>`).join('')}</select>
 <label>Cantidad</label><input id="cq" type="number" min="0" step="any"><label>Fecha</label><input id="cf" type="date" value="${hoy()}">
 <br><button onclick="registrarCompra()">Guardar compra</button></div>
 <div class="card"><h3>Registrar producción diaria</h3>
 <label>Fecha</label><input id="pf" type="date" value="${hoy()}">
 <label>Kilos de tortilla producidos</label><input id="pk" type="number" min="0" step="any">
 <label>Sacos de harina utilizados</label><input id="ps" type="number" min="0" step="any">
 <label>Gas usado (kg, opcional)</label><input id="pg" type="number" min="0" step="any">
 <label>Papel usado (kg, opcional)</label><input id="pa" type="number" min="0" step="any">
 <br><button onclick="registrarProd()">Guardar producción</button></div></div>
 <div class="card"><h3>Últimas compras</h3><table><tr><th>Fecha</th><th>Insumo</th><th>Cantidad</th><th>Usuario</th></tr>
 ${DB.compras.slice(-8).reverse().map(c=>`<tr><td>${c.fecha}</td><td>${ins[c.insumo].n}</td><td>${c.cant}</td><td>${c.usuario}</td></tr>`).join('')||'<tr><td colspan="4">Sin registros</td></tr>'}</table></div>`}

