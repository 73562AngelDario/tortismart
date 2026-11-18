/* ============ DATOS (localStorage) ============ */
const K='tortismart_v1';
const hoy=()=>fmtD(new Date());
function fmtD(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
const $$=n=>'$'+Number(n).toFixed(2);
function defaults(){return{
 usuarios:[
  {user:'admin',pass:'admin123',rol:'admin',activo:true,nombre:'Administrador'},
  {user:'empleado',pass:'empleado123',rol:'trabajador',activo:true,nombre:'Empleado'}],
 productos:[
  {codigo:'101',nombre:'Salsa roja 250ml',precio:25,stock:20,activo:true},
  {codigo:'102',nombre:'Frijoles 1 kg',precio:38,stock:15,activo:true},
  {codigo:'103',nombre:'Refresco 600ml',precio:18,stock:40,activo:true},
  {codigo:'104',nombre:'Queso fresco 1/4 kg',precio:45,stock:10,activo:true}],
 entradasProd:[],
 rapidos:[
  {n:'$10 tortilla',p:10},{n:'$20 tortilla',p:20},{n:'$50 tortilla',p:50},
  {n:'1 kg tortilla',p:28},{n:'1/2 kg tortilla',p:14},{n:'Masa 1 kg',p:20},{n:'Totopos',p:30}],
 insumos:{harina:{n:'Harina (sacos)',stock:10},maiz:{n:'Maíz (kg)',stock:100},gas:{n:'Gas (kg)',stock:60},papel:{n:'Papel (kg)',stock:20}},
 compras:[],produccion:[],ventas:[],
 config:{estandar:45,minHarina:3,whatsapp:'',},
 bloqueo:{fallos:0,hasta:0}};}
let DB=JSON.parse(localStorage.getItem(K)||'null')||defaults();
const save=()=>localStorage.setItem(K,JSON.stringify(DB));
let sesion=JSON.parse(sessionStorage.getItem('ts_ses')||'null');
let vista='ventas',cart=[],msg=null;
const esAdmin=()=>sesion&&sesion.rol==='admin';
const flash=(t,tipo='ok')=>{msg={t,tipo}};
const msgHTML=()=>{if(!msg)return'';const m=msg;msg=null;return`<div class="msg ${m.tipo}">${m.t}</div>`};
const v=id=>document.getElementById(id)?.value??'';

