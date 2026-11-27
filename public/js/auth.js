/* ============ LOGIN / LOGOUT (CU001, CU008) ============ */
function loginView(){
 return`<div class="login"><img class="login-logo" src="img/logo.png" alt="TortiSmart">
 ${msgHTML()}
 <label>Usuario</label><input id="u" autofocus>
 <label>Contraseña</label><input id="p" type="password" onkeydown="if(event.key==='Enter')login()">
 <br><br><button style="width:100%" onclick="login()">Iniciar sesión</button></div>`}
async function login(){
 const u=v('u').trim(),p=v('p');
 if(!u||!p){flash('Completa usuario y contraseña','err');return render()}
 const btn=document.querySelector('.login button');
 if(btn){btn.disabled=true;btn.textContent='Entrando…'}
 try{
  const r=await api('/login',{method:'POST',body:JSON.stringify({user:u,pass:p})});
  tok=r.token;sessionStorage.setItem('ts_tok',tok);
  sesion=r.usuario;sessionStorage.setItem('ts_ses',JSON.stringify(sesion));
  await cargarEstado();
  vista=sesion.rol==='admin'?'panel':'ventas';render()
 }catch(e){
  sesion=null;tok=null;sessionStorage.removeItem('ts_tok');sessionStorage.removeItem('ts_ses');
  flash(e.message||'No se pudo iniciar sesión','err');render()}}
function cerrarLocal(){
 cart=[];sesion=null;tok=null;
 sessionStorage.removeItem('ts_ses');sessionStorage.removeItem('ts_tok');render()}
function logout(){
 if(sucio&&!confirm('Hay cambios que todavía no se han guardado. ¿Cerrar sesión de todos modos?'))return;
 if(cart.length&&!confirm('Hay una venta en curso sin cobrar. ¿Cerrar sesión de todos modos?'))return;
 cerrarLocal()}
