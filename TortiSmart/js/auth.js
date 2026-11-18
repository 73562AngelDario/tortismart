/* ============ LOGIN / LOGOUT (CU001, CU008) ============ */
function loginView(){
 return`<div class="login"><div class="logo">🌽</div><h2>TortiSmart</h2>
 ${msgHTML()}
 <label style="text-align:left">Usuario</label><input id="u" autofocus>
 <label style="text-align:left">Contraseña</label><input id="p" type="password" onkeydown="if(event.key==='Enter')login()">
 <br><br><button style="width:100%" onclick="login()">Iniciar sesión</button>
 <p style="color:var(--mut);font-size:.8rem">Demo: admin / admin123 · empleado / empleado123</p></div>`}
function login(){
 const b=DB.bloqueo;
 if(Date.now()<b.hasta){flash(`Acceso bloqueado. Intenta en ${Math.ceil((b.hasta-Date.now())/1000)} s`,'err');return render()}
 const u=v('u').trim(),p=v('p');
 if(!u||!p){flash('Completa usuario y contraseña','err');return render()}
 const us=DB.usuarios.find(x=>x.user===u&&x.pass===p&&x.activo);
 if(!us){
  b.fallos++;
  if(b.fallos>=3){b.fallos=0;b.hasta=Date.now()+60000;flash('3 intentos fallidos. Acceso bloqueado 1 minuto','err')}
  else flash('Usuario o contraseña incorrectos','err');
  save();return render()}
 b.fallos=0;save();
 sesion={user:us.user,rol:us.rol,nombre:us.nombre};
 sessionStorage.setItem('ts_ses',JSON.stringify(sesion));
 vista=us.rol==='admin'?'panel':'ventas';render()}
function logout(){
 if(cart.length&&!confirm('Hay una venta en curso sin cobrar. ¿Cerrar sesión de todos modos?'))return;
 cart=[];sesion=null;sessionStorage.removeItem('ts_ses');render()}

