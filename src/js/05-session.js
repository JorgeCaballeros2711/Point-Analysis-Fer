function saveSession(){
  // Save current point state first
  if(CURRENT_POINT&&CURRENT_POINT._mapKey){
    saveCtxState(CURRENT_POINT._mapKey);
    saveRouteState(CURRENT_POINT._mapKey);
  }
  const session={
    version:1,
    savedAt:new Date().toISOString(),
    CTX_STORE:CTX_STORE,
    ROUTES:ROUTES,
    IMG_STORE:IMG_STORE,
    currentPoint:CURRENT_POINT?CURRENT_POINT._mapKey:'',
    pointNames:Object.keys(POINT_MAP),
    USE_TRADE_AREA:USE_TRADE_AREA,
    HIDDEN_SECS:Array.from(HIDDEN_SECS),
  };
  const json=JSON.stringify(session);
  // Embed session in an HTML comment inside a minimal HTML wrapper
  const html='<!DOCTYPE html><!--REPORTE_SESSION:'+btoa(unescape(encodeURIComponent(json)))+'--><html><body><p style="font-family:sans-serif;padding:2rem;color:#666">Este archivo contiene una sesión guardada del Reporte de Puntos.<br>Ábrelo desde la pantalla de carga usando "Importar sesión guardada".</p></body></html>';
  const blob=new Blob([html],{type:'text/html'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download='Sesion_Reporte_'+new Date().toISOString().slice(0,10)+'.html';
  a.click();
  URL.revokeObjectURL(url);
}


function importSession(input){
  const f=input.files[0];if(!f)return;
  const reader=new FileReader();
  reader.onload=function(e){
    try{
      const html=e.target.result;

      // Format 1: Session file
      const sessionMatch=html.match(/<!--REPORTE_SESSION:([A-Za-z0-9+/=]+)-->/);
      if(sessionMatch){
        const json=decodeURIComponent(escape(atob(sessionMatch[1])));
        const session=JSON.parse(json);
        if(session&&session.version===1){
          if(session.CTX_STORE) Object.assign(CTX_STORE,session.CTX_STORE);
          if(session.ROUTES)    Object.assign(ROUTES,session.ROUTES);
          if(session.IMG_STORE) Object.assign(IMG_STORE,session.IMG_STORE);
          if(session.USE_TRADE_AREA!==undefined) USE_TRADE_AREA=session.USE_TRADE_AREA;
          // Rebuild POINT_MAP from saved pointNames so we can switchPoint
          var _names=session.pointNames||[];
          _names.forEach(function(n){
            if(!POINT_MAP[n]){
              var d={_mapKey:n};if(typeof PT!=='undefined')d[PT.punto]=n;
              POINT_MAP[n]=[d]; POINTS.push(d);
            }
          });
          if(_names.length){
            var sel=document.getElementById('point-select');
            if(sel){sel.innerHTML='';_names.forEach(function(n,i){
              var o=document.createElement('option');o.value=n;o.textContent=n;sel.appendChild(o);
            });}
            document.getElementById('upload-screen').style.display='none';
            document.getElementById('report-screen').style.display='block';
          }
          showImportConfirm('Sesion importada: '+_names.length+' puntos',session.savedAt);
          var _target=session.currentPoint||_names[0];
          if(_target&&POINT_MAP[_target]){
            CURRENT_POINT=POINT_MAP[_target][0];
            switchPoint(_target);
          }
          return;
        }
      }

      // Format 2: Exported report HTML
      const parser=new DOMParser();
      const doc=parser.parseFromString(html,'text/html');

      const ptBtns=doc.querySelectorAll('.exp-pt-btn');
      const pointNames=Array.from(ptBtns).map(function(b){return b.textContent.trim();}).filter(Boolean);
      if(!pointNames.length){alert('No se encontraron datos de puntos en este archivo HTML.');return;}

      pointNames.forEach(function(pName,i){
        const pfx='pt'+i;
        function sec(s){return doc.getElementById(pfx+'-'+s);}
        function txt(el){return el?el.innerHTML:'';} 

        // Contexto
        const ctxBody=sec('ctx')?sec('ctx').querySelectorAll('.card-body'):[];
        const desc=ctxBody[1]?ctxBody[1].querySelector('div[style]')?ctxBody[1].querySelector('div[style]').innerHTML:'':'';
        const fuenteEl=ctxBody[1]?ctxBody[1].querySelector('[style*="font-size:.78rem"]'):null;
        const fuente=fuenteEl?fuenteEl.textContent:'';

        // Accesibilidad
        const accSec=sec('acc');
        const accDescEl=accSec?accSec.querySelector('.card-body div[style]'):null;
        const accDesc=accDescEl?accDescEl.innerHTML:'';
        // Route blocks — export uses: .route-card > .route-card-header (name) + div[style] > div[style] (desc)
        const routeCards=accSec?accSec.querySelectorAll('.route-card'):[];
        const routes=Array.from(routeCards).map(function(card){
          const hdr=card.querySelector('.route-card-header');
          const inner=card.querySelector('div[style*="padding"]');
          const descEl=inner?inner.querySelector('div[style*="font-size"]'):null;
          const imgEl=card.querySelector('img');
          return {
            name:hdr?hdr.textContent.trim():'Acceso',
            desc:descEl?descEl.innerHTML:'',
            imgSrc:imgEl&&imgEl.src&&imgEl.src.startsWith('data:')?imgEl.src:null
          };
        });

        // Trabajo
        const trbSec=sec('trb');
        const trbConc=trbSec?trbSec.querySelector('.card-body div[style*="line-height"]')?trbSec.querySelector('.card-body div[style*="line-height"]').innerHTML:'':'';
        const trbImgEl=trbSec?trbSec.querySelector('img'):null;

        // Domicilio
        const domSec=sec('dom');
        const domConc=domSec?domSec.querySelector('.card-body div[style*="line-height"]')?domSec.querySelector('.card-body div[style*="line-height"]').innerHTML:'':'';
        const domImgEl=domSec?domSec.querySelector('img'):null;

        // Comparables
        const cmpSec=sec('cmp');
        const compDescEl=cmpSec?cmpSec.querySelector('.summary-box'):null;
        const compDesc=compDescEl?compDescEl.textContent:'';
        const cmpTableEl=cmpSec?cmpSec.querySelector('.h-table-wrap'):null;
        const cmpTable=cmpTableEl?cmpTableEl.innerHTML:'';
        const cmpImgEl=cmpSec?cmpSec.querySelector('.card-body img'):null;
        const cmpImgSrc=(cmpImgEl&&cmpImgEl.src&&cmpImgEl.src.startsWith('data:'))?cmpImgEl.src:null;
        const _cmpRows=cmpTableEl?cmpTableEl.querySelectorAll('tbody tr'):[];
        const manualSelArr=Array.from(_cmpRows).map(function(tr){var td=tr.querySelector('td');return td?td.textContent.trim():'';}).filter(Boolean);

        // Overlap
        const ovlSec=sec('ovl');
        const ovlPills=ovlSec?ovlSec.querySelectorAll('[style*="border-radius:20px"]'):[];
        const ovlPct=ovlPills[0]?ovlPills[0].textContent.replace('%','').trim():'';
        const ovlVis=ovlPills[1]?ovlPills[1].textContent.replace('%','').trim():'';
        const ovlDescEl=(function(){if(!ovlSec)return null;var headers=ovlSec.querySelectorAll('.card-header');for(var h of headers){  if(h.textContent.trim()==='Descripción'){    var cb=h.nextElementSibling;    return cb?cb.querySelector('div[style]')||cb:null;  }}return null;})();
        const ovlDesc=ovlDescEl?ovlDescEl.innerHTML:'';
        // Overlap table rows
        const ovlRows=[];
        if(ovlSec){ovlSec.querySelectorAll('table tbody tr').forEach(function(tr){
          const tds=tr.querySelectorAll('td');
          if(tds.length>=3)ovlRows.push({tienda:tds[0].textContent.trim(),dist:tds[1].textContent.trim(),vis:tds[2].textContent.trim()});
        });}

        // Calificacion
        const calSec=sec('cal');
        const calScoreEl=(function(){if(!calSec)return null;var inl=calSec.querySelector('#cal-score-inline');if(inl)return {textContent:inl.textContent};var spans=calSec.querySelectorAll('span[style*="border-radius"]');for(var s of spans){if(/\d/.test(s.textContent))return s;}return null;})();
        const calScore=calScoreEl?calScoreEl.textContent.replace('%','').trim():'';
        const calDescDivs=calSec?calSec.querySelectorAll('[style*="font-size:.88rem"]'):[];
        const calDesc=calDescDivs.length?calDescDivs[0].innerHTML:'';

        // Hallazgos
        const halSec=sec('hal');
        const hallEl=halSec?halSec.querySelector('.card-body'):null;
        const hall=hallEl?hallEl.innerHTML:'';

        // Images
        const ctxImgEl=sec('ctx')?sec('ctx').querySelector('.card-body img'):null;
        const calImgEl=calSec?calSec.querySelector('img'):null;
        const ovlImgEl=ovlSec?ovlSec.querySelector('img'):null;
        if(ctxImgEl&&ctxImgEl.src.startsWith('data:')) IMG_STORE[pName+'__map-main']=ctxImgEl.src;
        if(trbImgEl&&trbImgEl.src.startsWith('data:')) IMG_STORE[pName+'__map-trabajo']=trbImgEl.src;
        if(domImgEl&&domImgEl.src.startsWith('data:')) IMG_STORE[pName+'__map-domicilio']=domImgEl.src;
        if(calImgEl&&calImgEl.src.startsWith('data:')) IMG_STORE[pName+'__map-calificacion']=calImgEl.src;
        if(ovlImgEl&&ovlImgEl.src.startsWith('data:')) IMG_STORE[pName+'__map-overlap-1']=ovlImgEl.src;
        if(ovlImgEl&&ovlImgEl.src&&ovlImgEl.src.startsWith('data:')&&pName){ if(!CTX_STORE[pName])CTX_STORE[pName]={}; CTX_STORE[pName].imgOverlap=ovlImgEl.src; IMG_STORE[pName+'__map-overlap-1']=ovlImgEl.src; }
        // Read cumplimiento images from export
        [15,20,30].forEach(function(mins){
          var cw=doc.getElementById(pfx+'-cumpl-img-wrap-'+mins)||doc.querySelector('#cumpl-img-wrap-'+mins);
          if(!cw){
            // Also try inside the compliance section
            var cSec=sec(String(mins));
            cw=cSec?cSec.querySelector('#cumpl-img-wrap-'+mins)||cSec.querySelector('.map-placeholder'):null;
          }
          if(cw){
            var ci=cw.querySelector('img');
            if(ci&&ci.src&&ci.src.startsWith('data:')){
              if(!CTX_STORE[pName])CTX_STORE[pName]={};
              IMG_STORE[pName+'__cumpl-'+mins]=ci.src;
            }
          }
        });

        // Routes: restore to ROUTES and route images
        if(routes.length){
          ROUTES[pName]=routes.map(function(r){return {name:r.name,desc:r.desc};});
          routes.forEach(function(r,ri){
            if(r.imgSrc) IMG_STORE[pName+'_acc_'+ri]=r.imgSrc;
          });
        }

        // Save to CTX_STORE
        CTX_STORE[pName]=CTX_STORE[pName]||{};
        if(desc)     CTX_STORE[pName].desc=desc;
        if(fuente)   CTX_STORE[pName].fuente=fuente;
        if(accDesc)  CTX_STORE[pName].accDesc=accDesc;
        if(trbConc)  CTX_STORE[pName].trbConc=trbConc;
        if(domConc)  CTX_STORE[pName].domConc=domConc;
        if(compDesc) CTX_STORE[pName].compDesc=compDesc;
        if(cmpTable) CTX_STORE[pName].cmpTable=cmpTable;
        if(cmpImgSrc){CTX_STORE[pName].compMapSrc=cmpImgSrc;IMG_STORE[pName+'__comp-map']=cmpImgSrc;}
        if(manualSelArr.length) CTX_STORE[pName].manualSel=manualSelArr;
        if(ovlPct)   CTX_STORE[pName].ovlPct=ovlPct;
        if(ovlVis)   CTX_STORE[pName].ovlVis=ovlVis;
        if(ovlDesc)  CTX_STORE[pName].ovlDesc=ovlDesc;
        if(ovlRows.length) CTX_STORE[pName].ovlRows=ovlRows;
        if(calScore) CTX_STORE[pName].calScore=calScore;
        if(calDesc)  CTX_STORE[pName].calDesc=calDesc;
        if(hall)     CTX_STORE[pName].hall=hall;
      });

      // Detect trade area mode from exported tab labels
      var firstPt=doc.querySelector('.exp-point');
      if(firstPt){
        var tabs=Array.from(firstPt.querySelectorAll('.nav-tab'));
        var hasCumplimiento=tabs.some(function(t){return t.textContent.trim()==='Cumplimiento';});
        if(hasCumplimiento) USE_TRADE_AREA=true;
      }
      showImportConfirm(pointNames.length+' puntos importados del reporte exportado',null);
      if(pointNames[0]&&POINT_MAP[pointNames[0]]){
        CURRENT_POINT=POINT_MAP[pointNames[0]][0];
        switchPoint(pointNames[0]);
        if(USE_TRADE_AREA){
          setTimeout(function(){
            [15,20,30].forEach(function(m){
              var tab=document.getElementById('tab-'+m+'min');
              if(tab&&tab.style.display!=='none')tab.textContent='Cumplimiento';
            });
          },400);
        }
      }

    }catch(err){
      alert('Error al importar: '+err.message);
      console.error(err);
    }
  };
  reader.readAsText(f,'UTF-8');
}


function showImportConfirm(msg, savedAt){
  const el=document.getElementById('import-confirm');
  if(!el)return;
  el.style.display='block';
  el.innerHTML='<div style="background:#e8f5e9;border:1.5px solid #a5d6a7;border-radius:8px;padding:.75rem 1rem;font-size:.83rem;color:#2e7d32;margin-top:.75rem">'
    +'✅ '+msg+(savedAt?'<br><span style="font-size:.75rem;opacity:.8">Guardado el '+new Date(savedAt).toLocaleString('es')+'</span>':'')
    +'</div>';
}


