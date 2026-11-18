/* ============ DATOS (se guardan en la nube: ver nube.js) ============ */
/* Marcas de harina: rango esperado de kg de tortilla por bulto de 20 kg */
const MARCAS={
 maseca:{n:'Maseca',fab:'Gruma',img:'img/maseca.png',kg:20,min:36,max:40,porKg:'1.8 – 2.0'},
 minsa:{n:'Minsa',fab:'Minsa',img:'img/minsa.png',kg:20,min:36,max:39,porKg:'1.8 – 1.95'},
 harimasa:{n:'Harimasa',fab:'Cargill (Harimasa / Macsa)',img:'img/harimasa.png',kg:20,min:36,max:39,porKg:'1.8 – 1.95'}};
/* Sacos con fracciones de cuarto: 7.5 -> "7½" */
const rngTxt=(a,b)=>a===b?String(a):a+' – '+b;
function fmtSacos(n){n=Math.round(n*4)/4;const w=Math.floor(n),f=n-w,fr={0:'',0.25:'¼',0.5:'½',0.75:'¾'}[f];return(w===0&&f)?fr:String(w)+fr}
function fmtSacosU(n){return fmtSacos(n)+(n<=1?' saco':' sacos')}
const fmtKg=n=>String(Math.round(n*10)/10);
const fmtKg2=n=>String(Math.round(n*100)/100);
/* Tortilla disponible: cada producción crea un lote (saco en uso) y las ventas lo van bajando */
const lotesActivos=()=>DB.lotes.filter(l=>l.kgRestante>0.0005);
const tortillaDisp=()=>lotesActivos().reduce((s,l)=>s+l.kgRestante,0);
function descontarTortilla(kg){let r=kg;for(const l of DB.lotes){if(r<=0.0005)break;if(l.kgRestante<=0)continue;const t=Math.min(l.kgRestante,r);l.kgRestante=Math.round((l.kgRestante-t)*1000)/1000;r-=t}}
const activas=()=>Object.entries(MARCAS).filter(([k,m])=>!m.archivada);
const totalHarina=()=>activas().reduce((s,[k])=>s+DB.insumos[k].stock,0);
const hoy=()=>fmtD(new Date());
function fmtD(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
const $$=n=>'$'+Number(n).toFixed(2);
/* Límites de las alertas */
const limTortilla=()=>{const n=parseFloat(DB.config.limTortilla);return n>0?n:10};
const limProd=()=>{const n=parseFloat(DB.config.limProd);return isNaN(n)||n<0?2:n};
const productosBajos=()=>DB.productos.filter(p=>p.activo&&p.stock<=limProd());
function defaults(){return{
 productos:[
  {codigo:'101',nombre:'Salsa roja 250ml',precio:25,stock:20,activo:true},
  {codigo:'102',nombre:'Frijoles 1 kg',precio:38,stock:15,activo:true},
  {codigo:'103',nombre:'Refresco 600ml',precio:18,stock:40,activo:true},
  {codigo:'104',nombre:'Queso fresco 1/4 kg',precio:45,stock:10,activo:true}],
 entradasProd:[],
 rapidos:[
  {n:'$10 tortilla',p:10},{n:'$20 tortilla',p:20},{n:'$50 tortilla',p:50},
  {n:'1 kg tortilla',p:28},{n:'1/2 kg tortilla',p:14},{n:'Masa 1 kg',p:20},{n:'Totopos',p:30}],
 insumos:{maseca:{n:'Saco Maseca 20 kg',stock:10},minsa:{n:'Saco Minsa 20 kg',stock:10},harimasa:{n:'Saco Harimasa 20 kg',stock:10},maiz:{n:'Maíz (kg)',stock:100},papel:{n:'Papel (kg)',stock:20}},
 marcasExtra:{},mermas:[],lotes:[],compras:[],produccion:[],ventas:[],
 config:{minHarina:3,whatsapp:''}};}
let DB=defaults();
function normalizar(){
 delete DB.insumos.gas;
 if(DB.insumos.harina){delete DB.insumos.harina}
 DB.marcasExtra=DB.marcasExtra||{};DB.mermas=DB.mermas||[];DB.lotes=DB.lotes||[];DB.ventas=DB.ventas||[];
 DB.compras=DB.compras||[];DB.produccion=DB.produccion||[];DB.entradasProd=DB.entradasProd||[];
 Object.assign(MARCAS,DB.marcasExtra);
 for(const [k,n] of [['maseca','Saco Maseca 20 kg'],['minsa','Saco Minsa 20 kg'],['harimasa','Saco Harimasa 20 kg']])if(!DB.insumos[k])DB.insumos[k]={n,stock:10};
}
normalizar();
let sesion=JSON.parse(sessionStorage.getItem('ts_ses')||'null');
let vista='ventas',cart=[],msg=null;
const esAdmin=()=>sesion&&sesion.rol==='admin';
const flash=(t,tipo='ok')=>{msg={t,tipo}};
const msgHTML=()=>{if(!msg)return'';const m=msg;msg=null;return`<div class="msg ${m.tipo}">${m.t}</div>`};
const v=id=>document.getElementById(id)?.value??'';

