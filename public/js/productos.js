/* ============ PRODUCTOS TIENDA (CU005 + admin códigos CU002) ============ */
let editCod=null,filtro='';
function guardarProd(){
 const c=v('pc').trim(),n=v('pn').trim(),pr=parseFloat(v('pp'));
 if(!c||!n||!(pr>=0)||v('pp')===''){flash('Completa código, nombre y precio','err');return render()}
 if(editCod){const p=DB.productos.find(x=>x.codigo===editCod);p.nombre=n;p.precio=pr;editCod=null;flash('Producto actualizado')}
 else{if(DB.productos.some(x=>x.codigo===c)){flash('El código ya existe','err');return render()}
  DB.productos.push({codigo:c,nombre:n,precio:pr,stock:0,activo:true});flash('Producto registrado')}
 save();render()}
function editarProd(c){editCod=c;render();const p=DB.productos.find(x=>x.codigo===c);
 document.getElementById('pc').value=p.codigo;document.getElementById('pc').disabled=true;
 document.getElementById('pn').value=p.nombre;document.getElementById('pp').value=p.precio}
function toggleProd(c){const p=DB.productos.find(x=>x.codigo===c);p.activo=!p.activo;save();render()}
function eliminarProd(c){if(!confirm('¿Eliminar producto?'))return;DB.productos=DB.productos.filter(x=>x.codigo!==c);save();flash('Producto eliminado');render()}
function entradaProd(){
 const c=v('ec').trim(),q=parseFloat(v('eq'));
 const p=DB.productos.find(x=>x.codigo===c);
 if(!p){flash('Código de producto no encontrado','err');return render()}
 if(!(q>0)){flash('La cantidad debe ser numérica y mayor a cero','err');return render()}
 p.stock+=q;DB.entradasProd.push({fecha:hoy(),codigo:c,cant:q,usuario:sesion.user});
 save();flash(`Entrada registrada: ${p.nombre} +${q} (existencia ${p.stock})`);render()}
function productosView(){
 const f=filtro.toLowerCase();
 const lista=DB.productos.filter(p=>!f||p.codigo.toLowerCase().includes(f)||p.nombre.toLowerCase().includes(f));
 return`<h2>Productos de tienda</h2><div class="grid">
 <div class="card"><h3>${editCod?'Editar producto':'Registrar producto'}</h3>
 <label>Código</label><input id="pc"><label>Nombre</label><input id="pn"><label>Precio</label><input id="pp" type="number" min="0" step="any">
 <br><div class="row"><button onclick="guardarProd()">Guardar</button>${editCod?'<button class="sec" onclick="editCod=null;render()">Cancelar</button>':''}</div></div>
 <div class="card"><h3>Registrar entrada de producto</h3>
 <div class="sugwrap"><label>Código</label><input id="ec" autocomplete="off" oninput="sugerir('ec','sug2',false)"><div class="sugbox" id="sug2"></div></div><label>Cantidad recibida</label><input id="eq" type="number" min="0" step="any">
 <br><button onclick="entradaProd()">Sumar a existencias</button></div></div>
 <div class="card"><div class="row"><div><label>Buscar por código o nombre</label><input value="${filtro}" oninput="filtro=this.value;render();const i=document.querySelector('[data-s]');i.focus();i.setSelectionRange(99,99)" data-s></div></div><br>
 <table><tr><th>Código</th><th>Nombre</th><th>Precio</th><th>Existencia</th><th>Estado</th><th></th></tr>
 ${lista.map(p=>`<tr><td>${p.codigo}</td><td>${p.nombre}</td><td>${$$(p.precio)}</td><td>${p.stock}${p.activo&&p.stock<=LIM_PROD?` <span class="tag">${p.stock<=0?'Agotado':'Resurtir'}</span>`:''}</td><td>${p.activo?'Activo':'Inactivo'}</td>
 <td class="right"><button class="sec" onclick="editarProd('${p.codigo}')">Editar</button>
 ${esAdmin()?`<button class="sec" onclick="toggleProd('${p.codigo}')">${p.activo?'Desactivar':'Activar'}</button><button class="bad" onclick="eliminarProd('${p.codigo}')">Eliminar</button>`:''}</td></tr>`).join('')||'<tr><td colspan="6">Sin resultados</td></tr>'}</table></div>`}

