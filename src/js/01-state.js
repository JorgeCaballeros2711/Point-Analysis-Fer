// STATE
let WB=null,POINTS=[],CLASIFICACION=[],CLASIF_MAP={},POINT_MAP={};
// Benchmarks per isocrona
let RURAL={15:[],20:[],30:[]}, URBAN={15:[],20:[],30:[]}, GENERAL={15:[],20:[],30:[]};
let CURRENT_POINT=null;
let ROUTES={},IMG_STORE={},CTX_STORE={};
let MANUAL_SELECTED=null;
let USE_TRADE_AREA=false;

const PT={punto:'PUNTO',lat:'LAT',lng:'LNG',tipo:'TIPO',metodo:'METODO_TRANSPORTE',
  ext:'EXTENSION',area:'AREA_KM2',pob:'POBLACION',retail:'RETAIL_USD',income:'INCOME_USD',
  nse_a:'NSE_A',nse_b:'NSE_B',nse_c:'NSE_C',nse_d:'NSE_D',nse_e:'NSE_E',
  mob_frente:'MOVILIDAD_FRENTE_AL_COMERCIO',mob_area:'MOVILIDAD_EN_AREA',pob_flot:'POBLACION_FLOTANTE',
  muni:'Municipio',dpto:'Departamento',pais:'Pais',
  tipo_urb:'TIPO URB O RURAL',
  c1:'COMPETIDOR_1',c2:'COMPETIDOR_2',c3:'COMPETIDOR_3',c4:'COMPETIDOR_4',c5:'COMPETIDOR_5'};

const EG={tienda:'Tienda',cadena:'Cadena',pob:'Poblacion Residente',
  pob_flot_avg:'Poblacion Flotante (Promedio)',pob_flot:'Poblacion Flotante',
  mob_area_avg:'Movilidad en el Area (Promedio)',mob_area:'Movilidad en el Area',
  mob_frente_avg:'Movilidad Frente al Comercio  (Promedio)',mob_frente:'Movilidad Frente al Comercio',
  ingreso:'Ingreso Anual ($Millones)',gasto:'Gasto Retail Anual ($Millones)',
  nse_a:'NSE A (%)',nse_b:'NSE B (%)',nse_c:'NSE C (%)',nse_d:'NSE D (%)',nse_e:'NSE E (%)',
  cobertura:'Área de Cobertura'};


function ptGet(row,key){
  if(!row)return 0;
  const direct={pob:'POBLACION',pob_flot:'POBLACION_FLOTANTE',mob_area:'MOVILIDAD_EN_AREA',mob_frente:'MOVILIDAD_FRENTE_AL_COMERCIO',retail:'RETAIL_USD',income:'INCOME_USD'};
  if(direct[key]&&row[direct[key]]!==undefined&&row[direct[key]]!=='') return pf(row[direct[key]]);
  const proms={mob_frente:'PROM movilidad_FT',mob_area:'PROM movilidad',pob_flot:'PROM poblacion_flotante'};
  if(proms[key]&&row[proms[key]]!==undefined&&row[proms[key]]!==''){const v=pf(row[proms[key]]);if(v)return v;}
  const nc=s=>String(s||'').toLowerCase().replace(/[\s_\-\.()]+/g,'');
  const kws={pob:['pobresid','poblacionres','poblacion'],pob_flot:['prompobfl','pobflot','flotante'],mob_area:['prommovilidad','movilidadarea','movarea'],mob_frente:['prommovilidadft','movft','movilidadfrente'],retail:['retailusd','retail'],income:['incomeusd','income']};
  const cm={};Object.keys(row).forEach(c=>{cm[nc(c)]=c;});
  for(const kw of(kws[key]||[])){const hit=Object.keys(cm).find(nk=>nk.includes(nc(kw)));if(hit!==undefined)return pf(row[cm[hit]]);}
  return 0;
}


function egGetRaw(row,key){
  if(!row) return null;
  const plain={pob_flot:'Poblacion Flotante',mob_area:'Movilidad en el Area',mob_frente:'Movilidad Frente al Comercio'};
  const prom={pob_flot:'Poblacion Flotante (Promedio)',mob_area:'Movilidad en el Area (Promedio)',mob_frente:'Movilidad Frente al Comercio  (Promedio)'};
  if(plain[key]){const v=row[plain[key]];if(v!==undefined&&v!==null&&v!=='') return v;const v2=row[prom[key]];if(v2!==undefined&&v2!==null&&v2!=='') return v2;return null;}
  const variants={pob:['Poblacion Residente','Poblacion'],ingreso:['Ingreso Anual ($Millones)','Ingreso Anual','Ingreso'],gasto:['Gasto Retail Anual ($Millones)','Gasto Retail Anual','Gasto Retail'],nse_a:['NSE A (%)','NSE A'],nse_b:['NSE B (%)','NSE B'],nse_c:['NSE C (%)','NSE C'],nse_d:['NSE D (%)','NSE D'],nse_e:['NSE E (%)','NSE E']};
  for(const col of(variants[key]||[])){if(row[col]!==undefined&&row[col]!==null&&row[col]!=='') return row[col];}
  return null;
}


function egGet(row,key){const v=egGetRaw(row,key);return v!==null?pf(v):0;}


