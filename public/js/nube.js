/* ============ NUBE: guarda y carga los datos desde el servidor ============ */
let tok=sessionStorage.getItem('ts_tok')||null;
let verSrv=0,guardando=false,otraVez=false,sucio=false;

async function api(ruta,op={}){
 const r=await fetch('/api'+ruta,{...op,headers:{'Content-Type':'application/json',...(tok?{Authorization:'Bearer '+tok}:{}),...(op.headers||{})}});
 let d=null;try{d=await r.json()}catch(e){}
 if(!r.ok){const e=new Error((d&&d.error)||('Error '+r.status));e.status=r.status;throw e}
 return d}

function estadoNube(t,cls){const el=document.getElementById('nube');if(el){el.textContent=t;el.className=cls||''}}

async function cargarEstado(){
 const ini=new Date();ini.setHours(0,0,0,0);ini.setDate(ini.getDate()-1);
 const d=await api('/estado?desde='+ini.getTime());
 verSrv=d.version;
 DB=Object.assign(defaults(),d.data||{});
 DB.ventas=(d.ventas||[]).map(x=>({...x,sync:true}));
 normalizar();
 if(!d.data)save();
 autoVentasEjemplo()}

function save(){sucio=true;if(guardando){otraVez=true;return}empujar()}

async function empujar(){
 guardando=true;estadoNube('Guardando…','');
 try{
  do{
   otraVez=false;
   const nuevas=DB.ventas.filter(x=>!x.sync);
   const{ventas,...resto}=DB;
   const envio=nuevas.map(({sync,...x})=>x);
   const r=await api('/estado',{method:'PUT',body:JSON.stringify({version:verSrv,data:resto,ventas:envio})});
   verSrv=r.version;nuevas.forEach(x=>x.sync=true)
  }while(otraVez);
  sucio=false;guardando=false;estadoNube('Guardado ✓','ok');
  setTimeout(()=>{if(!sucio)estadoNube('')},2500)
 }catch(e){
  guardando=false;
  if(e.status===409){sucio=false;alert('Los datos se actualizaron desde otro dispositivo.\n\nSe recargarán para no perder información. Si estabas registrando algo, repítelo.');location.reload();return}
  if(e.status===401){sucio=false;flash('Tu sesión expiró. Inicia sesión de nuevo.','err');cerrarLocal();return}
  estadoNube('Sin conexión. Reintentando…','err');
  setTimeout(()=>{if(!guardando)empujar()},5000)}}

window.addEventListener('beforeunload',e=>{if(sucio){e.preventDefault();e.returnValue=''}});
