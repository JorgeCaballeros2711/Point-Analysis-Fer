// EXPORT
function exportStaticHTML() {
  const mainCSS = getMainCSS();
  const pointNames = Object.keys(POINT_MAP);
  if (!pointNames.length) {
    alert('No hay puntos cargados.');
    return;
  }

  // Save current point name to restore after export
  const savedPoint = CURRENT_POINT ? CURRENT_POINT[PT.punto] : null;

  // Snapshot of per-point data (render each point then capture)
  const snapshots = [];

  function captureCurrentPoint(name) {
    const p = CURRENT_POINT;
    if (!p) return null;

    function gImg(id) {
      const el = document.getElementById(id);
      const img = el && el.querySelector('img');
      return img ? img.src : null;
    }
    const allRowsSnap = p._allRows || [p];
    const availMinsSnap = allRowsSnap
      .map(function (r) {
        const m = String(r[PT.ext] || '').match(/\b(30|20|15)\b/);
        return m ? parseInt(m[1]) : null;
      })
      .filter(Boolean);

    const pName = p[PT.punto] || name;
    const rl = ROUTES[pName] || [];
    const routeBlocksSnap = rl
      .map(function (r, i) {
        const key = pName + '_acc_' + i;
        const imgSrc = IMG_STORE[key];
        const descEl = document.querySelectorAll('#acceso-grid .editable-text')[i];
        const desc = descEl ? descEl.innerHTML : r.desc;
        const ih = imgSrc
          ? '<img src="' +
            imgSrc +
            '" style="width:100%;border-radius:8px;display:block;margin-bottom:.75rem">'
          : '<div style="background:var(--p-pale);border:2px dashed var(--p-mid);border-radius:8px;min-height:120px;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:.82rem;margin-bottom:.75rem">Sin imagen</div>';
        return (
          '<div class="route-card"><div class="route-card-header">' +
          r.name +
          '</div>' +
          '<div style="padding:1rem">' +
          ih +
          '<div style="font-size:.88rem;line-height:1.6">' +
          desc +
          '</div></div></div>'
        );
      })
      .join('');

    function mb(src, lbl) {
      if (!src)
        return (
          '<div style="background:var(--p-pale);border:2px dashed var(--p-mid);border-radius:10px;min-height:200px;display:flex;align-items:center;justify-content:center;color:var(--p-mid);font-weight:600">' +
          lbl +
          '</div>'
        );
      return (
        '<div style="position:relative;overflow:hidden;border-radius:10px;background:#000;min-height:200px">' +
        '<img src="' +
        src +
        '" style="width:100%;display:block;transform-origin:0 0;cursor:grab;user-select:none;transition:none"' +
        ' onmousedown="this.__d=1;this.__sx=event.clientX-(this.__ox||0);this.__sy=event.clientY-(this.__oy||0);this.style.cursor=\'grabbing\'"' +
        ' onmouseup="this.__d=0;this.style.cursor=\'grab\'"' +
        " onmousemove=\"if(!this.__d)return;this.__ox=event.clientX-this.__sx;this.__oy=event.clientY-this.__sy;this.style.transform='translate('+this.__ox+'px,'+this.__oy+'px) scale('+( this.__sc||1)+')'\"" +
        " onwheel=\"event.preventDefault();this.__sc=Math.max(0.3,Math.min(8,(this.__sc||1)*(event.deltaY<0?1.15:0.87)));this.style.transform='translate('+( this.__ox||0)+'px,'+( this.__oy||0)+'px) scale('+this.__sc+')'\">  " +
        '<div style="position:absolute;bottom:.5rem;right:.5rem;display:flex;flex-direction:column;gap:.2rem;z-index:10">' +
        "<button title=\"Acercar\" onclick=\"var i=this.parentElement.parentElement.querySelector('img');i.__sc=Math.min(8,(i.__sc||1)*1.25);i.style.transform='translate('+( i.__ox||0)+'px,'+( i.__oy||0)+'px) scale('+i.__sc+')';event.stopPropagation()\" style=\"background:rgba(29,26,116,.85);color:white;border:none;border-radius:5px;width:28px;height:28px;font-size:1rem;cursor:pointer;font-weight:700\">+</button>" +
        "<button title=\"Alejar\" onclick=\"var i=this.parentElement.parentElement.querySelector('img');i.__sc=Math.max(0.3,(i.__sc||1)/1.25);i.style.transform='translate('+( i.__ox||0)+'px,'+( i.__oy||0)+'px) scale('+i.__sc+')';event.stopPropagation()\" style=\"background:rgba(29,26,116,.85);color:white;border:none;border-radius:5px;width:28px;height:28px;font-size:1rem;cursor:pointer;font-weight:700\">−</button>" +
        '<button title="Restablecer" onclick="var i=this.parentElement.parentElement.querySelector(\'img\');i.__sc=1;i.__ox=0;i.__oy=0;i.style.transform=\'\';event.stopPropagation()" style="background:rgba(29,26,116,.85);color:white;border:none;border-radius:5px;width:28px;height:28px;font-size:.8rem;cursor:pointer">↺</button>' +
        '</div></div>'
      );
    }

    return {
      name: pName,
      availMins: availMinsSnap,
      sub: document.getElementById('ctx-subtitulo').textContent,
      heroMeta: document.getElementById('hero-meta').innerHTML,
      ctxDesc: document.getElementById('ctx-descripcion').innerHTML,
      ctxFuente: document.getElementById('ctx-fuente').value,
      accDesc: document.getElementById('acc-descripcion').innerHTML,
      trbConc: document.getElementById('trabajo-concentracion').innerHTML,
      domConc: document.getElementById('domicilio-concentracion').innerHTML,
      trbTags: document.getElementById('trabajo-tags').innerHTML,
      domTags: document.getElementById('domicilio-tags').innerHTML,
      genConc: document.getElementById('general-concentracion')
        ? document.getElementById('general-concentracion').innerHTML
        : '',
      rutConc: document.getElementById('rutas-concentracion')
        ? document.getElementById('rutas-concentracion').innerHTML
        : '',
      genTags: document.getElementById('general-tags')
        ? document.getElementById('general-tags').innerHTML
        : '',
      rutTags: document.getElementById('rutas-tags')
        ? document.getElementById('rutas-tags').innerHTML
        : '',
      cmpDesc: document.getElementById('comparables-desc').textContent,
      cmpTable: document.getElementById('comparables-table').innerHTML,
      c15: document.getElementById('compliance-15').innerHTML,
      c20: document.getElementById('compliance-20').innerHTML,
      c30: document.getElementById('compliance-30').innerHTML,
      hallazgos: document.getElementById('hallazgos-texto').innerHTML,
      calImgSrc: (function () {
        var img =
          document.getElementById('map-calificacion') &&
          document.getElementById('map-calificacion').querySelector('img');
        return img ? img.src : null;
      })(),
      calTableHTML: document.getElementById('cal-table')
        ? document.getElementById('cal-table').outerHTML
        : '',
      calScore: document.getElementById('cal-score')
        ? document.getElementById('cal-score').value
        : '',
      calDesc: document.getElementById('cal-desc')
        ? document.getElementById('cal-desc').innerHTML
        : '',
      overlapDesc: document.getElementById('overlap-desc')
        ? document.getElementById('overlap-desc').innerHTML
        : '',
      overlapPct: document.getElementById('overlap-pct')
        ? document.getElementById('overlap-pct').value
        : '0',
      overlapVisible: (function () {
        var tog = document.getElementById('tog-overlap');
        return tog ? tog.checked : true;
      })(),
      overlapVis: document.getElementById('overlap-vis')
        ? document.getElementById('overlap-vis').value
        : '0',
      imgOverlap1: gImg('map-overlap-1'),
      overlapTableHTML: (function () {
        var el = document.getElementById('overlap-table');
        if (!el) return '';
        var cl = el.cloneNode(true);
        cl.querySelectorAll('button.del-row,button[onclick*="removeOverlapRow"]').forEach(
          function (b) {
            b.remove();
          }
        );
        cl.querySelectorAll('input').forEach(function (inp) {
          var sp = document.createElement('span');
          sp.textContent = inp.value;
          inp.parentNode.replaceChild(sp, inp);
        });
        return cl.outerHTML;
      })(),

      imgMain: gImg('map-main'),
      imgMain2: gImg('map-main2'),
      imgTrabajo: gImg('map-trabajo'),
      imgDomicilio: gImg('map-domicilio'),
      imgGeneral: gImg('map-general'),
      imgRutas: gImg('map-rutas'),
      hiddenSecs: Array.from(HIDDEN_SECS),
      imgCompMap: gImg('comp-map-wrap'),
      routeBlocks: routeBlocksSnap,
      calPesos: (function () {
        var r = {};
        document.querySelectorAll('.cal-peso').forEach(function (inp) {
          if (inp.dataset.key) r[inp.dataset.key] = inp.value;
        });
        return r;
      })(),
      calBench: (function () {
        var r = {};
        document.querySelectorAll('.cal-bench').forEach(function (inp) {
          if (inp.dataset.key) r[inp.dataset.key] = inp.value;
        });
        return r;
      })(),
      compMapSrc:
        CURRENT_POINT && CURRENT_POINT._mapKey
          ? IMG_STORE[CURRENT_POINT._mapKey + '__comp-map'] || null
          : null,
      cmpTable: (function () {
        var el = document.getElementById('comparables-table');
        return el ? el.innerHTML : '';
      })(),
      manualSel: MANUAL_SELECTED ? Array.from(MANUAL_SELECTED) : null,
      mb: mb,
      cumplEdits: JSON.parse(JSON.stringify(CUMPL_EDITS || {})),
      puntoEditsSnap:
        CURRENT_POINT && CURRENT_POINT._mapKey
          ? JSON.parse(JSON.stringify(PUNTO_EDITS[CURRENT_POINT._mapKey] || {}))
          : {},
      calEdits:
        CURRENT_POINT && CURRENT_POINT._mapKey
          ? JSON.parse(JSON.stringify(CAL_EDITS[CURRENT_POINT._mapKey] || {}))
          : null,
      cumplImgs: (function () {
        var r = {};
        [15, 20, 30].forEach(function (m) {
          var mk = CURRENT_POINT && CURRENT_POINT._mapKey;
          if (mk && IMG_STORE[mk + '__cumpl-' + m]) r[m] = IMG_STORE[mk + '__cumpl-' + m];
        });
        return r;
      })(),
      puntoEditsSnap:
        CURRENT_POINT && CURRENT_POINT._mapKey
          ? JSON.parse(JSON.stringify(PUNTO_EDITS[CURRENT_POINT._mapKey] || {}))
          : {}
    };
  }

  // Capture current point first
  if (savedPoint) snapshots.push(captureCurrentPoint(savedPoint));

  // Render remaining points and capture
  function captureAll(idx) {
    if (idx >= pointNames.length) {
      buildExport(snapshots);
      // Restore original point
      if (savedPoint) switchPoint(savedPoint);
      return;
    }
    const pn = pointNames[idx];
    if (pn === savedPoint) {
      captureAll(idx + 1);
      return;
    }
    switchPoint(pn);
    setTimeout(function () {
      snapshots.push(captureCurrentPoint(pn));
      captureAll(idx + 1);
    }, 300);
  }
  captureAll(0);
}

function buildExport(snapshots) {
  const mainCSS = getMainCSS();
  const date = new Date().toLocaleDateString('es', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const pointNames = snapshots.map(function (s) {
    return s.name;
  });

  // Point selector bar
  const pointBtns = pointNames
    .map(function (n, i) {
      return (
        '<button class="exp-pt-btn' +
        (i === 0 ? ' active' : '') +
        '" onclick="expSwitch(' +
        i +
        ')">' +
        n +
        '</button>'
      );
    })
    .join('');

  // Build section HTML for one point snapshot
  // Confidencialidad text for export
  var _CONF_TEXT =
    '<p style="font-weight:700;font-size:1.05rem;margin-bottom:.75rem;color:#1D1A74">Cláusula de Confidencialidad y Propiedad Intelectual | Pulster.AI</p>' +
    '<p style="margin-bottom:.7rem">La presente Cláusula regula el uso, tratamiento y protección de la información, metodologías, herramientas, modelos, datos y demás activos intangibles compartidos por Pulster.AI con cualquier persona natural o jurídica que acceda a dicha información (el &quot;Receptor&quot;).</p>' +
    '<p style="font-weight:700;margin-bottom:.3rem">1. INFORMACIÓN CONFIDENCIAL Y PROPIEDAD EXCLUSIVA</p>' +
    '<p style="margin-bottom:.7rem">Toda la información, metodología, procesos, algoritmos, modelos de inteligencia artificial, estructuras de datos, flujos de trabajo, documentación técnica, reportes, análisis, estrategias, interfaces y cualquier otro material compartido por Pulster.AI constituye propiedad intelectual exclusiva y confidencial, protegida por las leyes aplicables de propiedad intelectual, derechos de autor y secretos comerciales.</p>' +
    '<p style="font-weight:700;margin-bottom:.3rem">2. OBLIGACIONES DEL RECEPTOR</p>' +
    '<p style="margin-bottom:.35rem">El Receptor se compromete irrevocablemente a:</p>' +
    '<p style="margin-bottom:.3rem">a) No divulgar, compartir, transferir, publicar, reproducir ni transmitir, de forma parcial o total, la información confidencial a terceros no autorizados.</p>' +
    '<p style="margin-bottom:.3rem">b) No utilizar la información, metodología o materiales de Pulster.AI para fines distintos a los acordados expresamente con el Titular.</p>' +
    '<p style="margin-bottom:.3rem">c) No reproducir, copiar, adaptar, modificar ni realizar ingeniería inversa sobre ningún componente de la metodología de Pulster.AI sin autorización previa.</p>' +
    '<p style="margin-bottom:.3rem">d) Adoptar todas las medidas razonables de seguridad para proteger la información confidencial contra accesos no autorizados.</p>' +
    '<p style="margin-bottom:.7rem">e) Limitar el acceso únicamente a personas con estricta necesidad de conocerla para los fines autorizados.</p>' +
    '<p style="font-weight:700;margin-bottom:.3rem">3. PROPIEDAD INTELECTUAL</p>' +
    '<p style="margin-bottom:.7rem">Nada en la presente Cláusula deberá interpretarse como una cesión o transferencia de derechos de propiedad intelectual. El Receptor reconoce que la totalidad de los derechos corresponden única y exclusivamente a Pulster.AI.</p>' +
    '<p style="font-weight:700;margin-bottom:.3rem">4. VIGENCIA</p>' +
    '<p style="margin-bottom:.7rem">Las obligaciones de confidencialidad tendrán una vigencia indefinida y se mantendrán en vigor incluso después de la terminación de cualquier relación comercial o contractual entre las partes.</p>' +
    '<p style="font-weight:700;margin-bottom:.3rem">5. CONSECUENCIAS DEL INCUMPLIMIENTO</p>' +
    '<p style="margin-bottom:.7rem">El incumplimiento facultará a Pulster.AI a ejercer todas las acciones legales disponibles, incluyendo: (i) cese inmediato de la infracción; (ii) reclamación de daños y perjuicios; (iii) medidas cautelares ante tribunales competentes; y (iv) cualquier acción derivada de la legislación aplicable en materia de propiedad intelectual.</p>' +
    '<p style="font-weight:700;margin-bottom:.3rem">6. LEY APLICABLE Y JURISDICCIÓN</p>' +
    '<p style="margin-bottom:.7rem">La presente Cláusula se regirá de conformidad con la legislación aplicable en la jurisdicción donde opere el Titular. Las partes se someten a la jurisdicción de los tribunales competentes.</p>' +
    '<p style="font-style:italic;font-weight:600;margin-bottom:.5rem">Al acceder, recibir o utilizar cualquier información o material de Pulster.AI, el Receptor declara haber leído, comprendido y aceptado íntegramente los términos de la presente Cláusula.</p>' +
    '<p style="color:#888;font-size:.8rem;border-top:1px solid #e5e7eb;padding-top:.5rem;margin-top:1rem">© Pulster.AI — Todos los derechos reservados.</p>';
  function buildPointSections(s, idx) {
    const av = s.availMins;
    const pfx = 'pt' + idx; // prefix for unique IDs

    var _ta = typeof USE_TRADE_AREA !== 'undefined' && USE_TRADE_AREA && av.length <= 1;
    var hidden = new Set(s.hiddenSecs || []);
    var KEY2ID = {
      ctx: 's-contexto',
      acc: 's-accesibilidad',
      trb: 's-calor-trabajo',
      dom: 's-calor-domicilio',
      gen: 's-calor-general',
      rut: 's-rutas-calientes',
      15: 's-15min',
      20: 's-20min',
      30: 's-30min',
      ovl: 's-overlap',
      cmp: 's-comparables',
      cal: 's-calificacion',
      hal: 's-hallazgos',
      conf: 's-confidencialidad'
    };
    function vis(key) {
      var id = KEY2ID[key];
      return !id || !hidden.has(id);
    }
    function present(key) {
      if (key === '15') return av.includes(15);
      if (key === '20') return av.includes(20);
      if (key === '30') return av.includes(30);
      if (key === 'ovl') return s.overlapVisible !== false;
      return true;
    }
    function shown(key) {
      return present(key) && vis(key);
    }
    var ORDER = [
      'ctx',
      'acc',
      'trb',
      'dom',
      'gen',
      'rut',
      '15',
      '20',
      '30',
      'ovl',
      'cmp',
      'cal',
      'hal',
      'conf'
    ];
    var firstVis =
      ORDER.find(function (k) {
        return shown(k);
      }) || 'ctx';
    function navTab(sec, lbl) {
      if (!shown(sec)) return '';
      return (
        '<div class="nav-tab' +
        (sec === firstVis ? ' active' : '') +
        '" onclick="expSec(\'' +
        pfx +
        '-' +
        sec +
        "',this,'" +
        pfx +
        '\')">' +
        lbl +
        '</div>'
      );
    }
    function secCls(key) {
      return 'exp-sec' + (key === firstVis ? ' active' : '');
    }

    const nav =
      '<div class="nav-tabs exp-nav" id="' +
      pfx +
      '-nav">' +
      navTab('ctx', 'Contexto') +
      navTab('acc', 'Accesibilidad') +
      navTab('trb', 'Mapa Trabajo') +
      navTab('dom', 'Mapa Domicilio') +
      navTab('gen', 'Mapa de Calor') +
      navTab('rut', 'Rutas Calientes') +
      navTab('15', _ta ? 'Cumplimiento' : 'Cumplimiento 15 min') +
      navTab('20', _ta ? 'Cumplimiento' : 'Cumplimiento 20 min') +
      navTab('30', _ta ? 'Cumplimiento' : 'Cumplimiento 30 min') +
      navTab('ovl', 'Overlap') +
      navTab('cmp', 'Comparables') +
      navTab('cal', 'Calificación') +
      navTab('hal', 'Hallazgos') +
      navTab('conf', 'Confidencialidad') +
      '</div>';

    const mb = s.mb;

    const secs =
      '' +
      // Contexto
      (shown('ctx')
        ? '<div class="' +
          secCls('ctx') +
          '" id="' +
          pfx +
          '-ctx">' +
          '<div class="hero-banner"><div class="hero-text"><h1>' +
          s.name +
          '</h1><p>' +
          s.sub +
          '</p>' +
          '<div class="hero-meta">' +
          s.heroMeta +
          '</div></div></div>' +
          '<div class="grid-2">' +
          '<div class="card"><div class="card-header">Ubicación</div><div class="card-body">' +
          mb(s.imgMain, 'Sin imagen') +
          (s.imgMain2
            ? '<div style="margin-top:.75rem">' + mb(s.imgMain2, 'Sin imagen') + '</div>'
            : '') +
          '</div></div>' +
          '<div class="card"><div class="card-header">Contexto del Sitio</div><div class="card-body">' +
          '<div style="font-size:.9rem;line-height:1.7">' +
          s.ctxDesc +
          '</div>' +
          (s.ctxFuente
            ? '<div style="font-size:.78rem;color:var(--muted);margin-top:.75rem">' +
              s.ctxFuente +
              '</div>'
            : '') +
          '</div></div>' +
          '</div>' +
          '</div>'
        : '') +
      // Accesibilidad
      (shown('acc')
        ? '<div class="' +
          secCls('acc') +
          '" id="' +
          pfx +
          '-acc">' +
          '<div class="section-title">Accesibilidad del Punto</div>' +
          '<div class="card" style="margin-bottom:1.25rem"><div class="card-header">Descripción General</div>' +
          '<div class="card-body"><div style="font-size:.9rem;line-height:1.7">' +
          s.accDesc +
          '</div></div></div>' +
          '<div class="grid-2">' +
          s.routeBlocks +
          '</div>' +
          '</div>'
        : '') +
      // Trabajo
      (shown('trb')
        ? '<div class="' +
          secCls('trb') +
          '" id="' +
          pfx +
          '-trb">' +
          '<div class="section-title">Mapa de Calor — Trabajo</div>' +
          '<div class="grid-2">' +
          '<div class="card"><div class="card-header">Mapa Trabajo</div><div class="card-body">' +
          mb(s.imgTrabajo, 'Sin imagen') +
          '</div></div>' +
          '<div class="card"><div class="card-header">Características</div><div class="card-body">' +
          '<div style="margin-bottom:.75rem"><div style="font-size:.75rem;font-weight:600;color:var(--muted);text-transform:uppercase;margin-bottom:.4rem">Competidores</div>' +
          s.trbTags +
          '</div>' +
          '<div style="font-size:.9rem;line-height:1.7">' +
          s.trbConc +
          '</div>' +
          '</div></div>' +
          '</div>' +
          '</div>'
        : '') +
      // Domicilio
      (shown('dom')
        ? '<div class="' +
          secCls('dom') +
          '" id="' +
          pfx +
          '-dom">' +
          '<div class="section-title">Mapa de Calor — Domicilio</div>' +
          '<div class="grid-2">' +
          '<div class="card"><div class="card-header">Mapa Domicilio</div><div class="card-body">' +
          mb(s.imgDomicilio, 'Sin imagen') +
          '</div></div>' +
          '<div class="card"><div class="card-header">Características</div><div class="card-body">' +
          '<div style="margin-bottom:.75rem"><div style="font-size:.75rem;font-weight:600;color:var(--muted);text-transform:uppercase;margin-bottom:.4rem">Competidores</div>' +
          s.domTags +
          '</div>' +
          '<div style="font-size:.9rem;line-height:1.7">' +
          s.domConc +
          '</div>' +
          '</div></div>' +
          '</div>' +
          '</div>'
        : '') +
      // Mapa de Calor (general)
      (shown('gen')
        ? '<div class="' +
          secCls('gen') +
          '" id="' +
          pfx +
          '-gen">' +
          '<div class="section-title">Mapa de Calor</div>' +
          '<div class="grid-2">' +
          '<div class="card"><div class="card-header">Mapa de Calor</div><div class="card-body">' +
          mb(s.imgGeneral, 'Sin imagen') +
          '</div></div>' +
          '<div class="card"><div class="card-header">Características</div><div class="card-body">' +
          (s.genTags
            ? '<div style="margin-bottom:.75rem"><div style="font-size:.75rem;font-weight:600;color:var(--muted);text-transform:uppercase;margin-bottom:.4rem">Competidores</div>' +
              s.genTags +
              '</div>'
            : '') +
          '<div style="font-size:.9rem;line-height:1.7">' +
          (s.genConc || '') +
          '</div>' +
          '</div></div>' +
          '</div>' +
          '</div>'
        : '') +
      // Rutas Calientes
      (shown('rut')
        ? '<div class="' +
          secCls('rut') +
          '" id="' +
          pfx +
          '-rut">' +
          '<div class="section-title">Rutas Calientes</div>' +
          '<div class="grid-2">' +
          '<div class="card"><div class="card-header">Rutas Calientes</div><div class="card-body">' +
          mb(s.imgRutas, 'Sin imagen') +
          '</div></div>' +
          '<div class="card"><div class="card-header">Características</div><div class="card-body">' +
          (s.rutTags
            ? '<div style="margin-bottom:.75rem"><div style="font-size:.75rem;font-weight:600;color:var(--muted);text-transform:uppercase;margin-bottom:.4rem">Competidores</div>' +
              s.rutTags +
              '</div>'
            : '') +
          '<div style="font-size:.9rem;line-height:1.7">' +
          (s.rutConc || '') +
          '</div>' +
          '</div></div>' +
          '</div>' +
          '</div>'
        : '') +
      // Isocronas
      (shown('15')
        ? '<div class="' +
          secCls('15') +
          '" id="' +
          pfx +
          '-15"><div class="section-title">' +
          (_ta ? 'Cumplimiento' : 'Cumplimiento — 15 min') +
          '</div>' +
          s.c15 +
          '</div>'
        : '') +
      (shown('20')
        ? '<div class="' +
          secCls('20') +
          '" id="' +
          pfx +
          '-20"><div class="section-title">' +
          (_ta ? 'Cumplimiento' : 'Cumplimiento — 20 min') +
          '</div>' +
          s.c20 +
          '</div>'
        : '') +
      (shown('30')
        ? '<div class="' +
          secCls('30') +
          '" id="' +
          pfx +
          '-30"><div class="section-title">' +
          (_ta ? 'Cumplimiento' : 'Cumplimiento — 30 min') +
          '</div>' +
          s.c30 +
          '</div>'
        : '') +
      (shown('ovl')
        ? '<div class="' +
          secCls('ovl') +
          '" id="' +
          pfx +
          '-ovl">' +
          '<div class="section-title">Overlap Visitantes del Sitio</div>' +
          '<div class="grid-2" style="margin-bottom:1.25rem">' +
          '<div class="card"><div class="card-header">Mapa de Overlap</div><div class="card-body">' +
          mb(s.imgOverlap1, 'Sin imagen') +
          '</div></div>' +
          '<div class="card"><div class="card-header">Indicadores de Overlap</div><div class="card-body">' +
          '<div style="display:flex;justify-content:space-around;margin-bottom:1rem">' +
          '<div style="text-align:center"><div style="font-size:.72rem;color:var(--muted);margin-bottom:.35rem">Overlap</div>' +
          '<div style="border:1.5px solid var(--p-border);border-radius:20px;padding:.3rem 1rem;font-size:1rem;font-weight:700;color:var(--p-dark)">' +
          s.overlapPct +
          '%</div></div>' +
          '<div style="text-align:center"><div style="font-size:.72rem;color:var(--muted);margin-bottom:.35rem">Overlap Visitantes</div>' +
          '<div style="border:1.5px solid var(--p-mid);border-radius:20px;padding:.3rem 1rem;font-size:1rem;font-weight:700;color:var(--p-mid);background:var(--p-pale)">' +
          s.overlapVis +
          '%</div></div>' +
          '</div>' +
          s.overlapTableHTML +
          '</div></div>' +
          '</div>' +
          '<div class="card"><div class="card-header">Descripción</div><div class="card-body"><div style="font-size:.9rem;line-height:1.8">' +
          s.overlapDesc +
          '</div></div></div>' +
          '</div>'
        : '') + // end overlap conditional
      // Comparables
      (shown('cmp')
        ? '<div class="' +
          secCls('cmp') +
          '" id="' +
          pfx +
          '-cmp">' +
          '<div class="section-title">Comparables</div>' +
          '<div class="grid-2" style="margin-bottom:1.25rem">' +
          '<div class="card"><div class="card-header">Mapa de Comparables</div><div class="card-body">' +
          mb(s.imgCompMap, 'Sin imagen') +
          '</div></div>' +
          '<div class="card"><div class="card-header">Comparables</div><div class="card-body"><div class="summary-box">' +
          s.cmpDesc +
          '</div></div></div>' +
          '</div>' +
          '<div class="card"><div class="card-body" style="padding:.5rem 0"><div class="h-table-wrap">' +
          s.cmpTable +
          '</div></div></div>' +
          '</div>'
        : '') +
      // Calificación
      (shown('cal')
        ? '<div class="' +
          secCls('cal') +
          '" id="' +
          pfx +
          '-cal">' +
          '<div class="section-title">Calificación del Punto</div>' +
          '<div class="grid-2" style="margin-bottom:1.25rem">' +
          '<div class="card"><div class="card-header">Mapa</div><div class="card-body">' +
          (s.calImgSrc
            ? '<img src="' + s.calImgSrc + '" style="width:100%;border-radius:10px;display:block">'
            : '<div style="background:var(--p-pale);border:2px dashed var(--p-mid);border-radius:10px;min-height:240px;display:flex;align-items:center;justify-content:center;color:var(--p-mid);font-weight:600">Sin imagen</div>') +
          '</div></div>' +
          '<div class="card"><div class="card-header">Tabla de Calificación</div><div class="card-body" style="padding:.75rem">' +
          '<div style="overflow-x:auto">' +
          s.calTableHTML +
          '</div>' +
          '<div style="margin-top:1rem;text-align:right"><span style="font-size:.85rem;font-weight:600;color:var(--p-dark)">Calificación Final: </span>' +
          (function () {
            var _sc = parseFloat(s.calScore);
            var _bg = isNaN(_sc)
              ? '#F4A261'
              : _sc >= 100
                ? '#2D9E6B'
                : _sc >= 90
                  ? '#E67E22'
                  : _sc >= 80
                    ? '#B8860B'
                    : '#C0392B';
            return (
              '<span style="background:' +
              _bg +
              ';color:white;font-size:1.2rem;font-weight:800;border-radius:8px;padding:.3rem 1rem;margin-left:.5rem">' +
              s.calScore +
              '%</span>'
            );
          })() +
          '<div style="font-size:.88rem;line-height:1.7;margin-top:.75rem">' +
          s.calDesc +
          '</div>' +
          '</div></div>' +
          '</div>' +
          '</div>' +
          '</div>'
        : '') +
      // Hallazgos
      (shown('hal')
        ? '<div class="' +
          secCls('hal') +
          '" id="' +
          pfx +
          '-hal">' +
          '<div class="section-title">Hallazgos del Punto</div>' +
          '<div class="card"><div class="card-header">Hallazgos</div>' +
          '<div class="card-body"><div style="font-size:.92rem;line-height:2">' +
          s.hallazgos +
          '</div></div>' +
          '</div>' +
          '</div>'
        : '') +
      // Confidencialidad
      (shown('conf')
        ? '<div class="' +
          secCls('conf') +
          '" id="' +
          pfx +
          '-conf">' +
          '<div class="section-title">Confidencialidad</div>' +
          '<div class="card"><div class="card-body" style="font-size:.88rem;line-height:1.8">' +
          _CONF_TEXT +
          '</div></div>' +
          '</div>'
        : '');
    return (
      '<div class="exp-point" id="exp-pt-' +
      idx +
      '" style="display:' +
      (idx === 0 ? 'block' : 'none') +
      '">' +
      nav +
      '<div class="content-area">' +
      secs +
      '</div></div>'
    );
  }

  const allPointsHTML = snapshots
    .map(function (s, i) {
      return buildPointSections(s, i);
    })
    .join('');

  const html =
    '<!DOCTYPE html><html lang="es">\n<head>\n<meta charset="UTF-8">' +
    '<meta name="pulster-mode" content="' +
    (typeof USE_TRADE_AREA !== 'undefined' && USE_TRADE_AREA ? 'trade-area' : 'isocrona') +
    '">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1.0">' +
    '<title>Reporte de Análisis — ' +
    pointNames.join(', ') +
    '</title>\n' +
    '<style>\n' +
    mainCSS +
    '\n' +
    '.exp-pt-btn{background:rgba(255,255,255,.15);color:white;border:1px solid rgba(255,255,255,.3);border-radius:8px;padding:.4rem 1rem;cursor:pointer;font-size:.82rem;font-family:Poppins,sans-serif;transition:all .2s;white-space:nowrap}' +
    '.exp-pt-btn.active,.exp-pt-btn:hover{background:white;color:var(--p-dark);font-weight:700}' +
    '.exp-point{display:none}.exp-sec{display:none}.exp-sec.active{display:block;padding:1.5rem 2rem;box-sizing:border-box;max-width:1200px;margin:0 auto}' +
    '.exp-nav .nav-tab{cursor:pointer}' +
    'input,textarea,[contenteditable]{pointer-events:none}' +
    '.editable-hint,.zoom-upload-btn,input[type=file]{display:none!important}' +
    '.editable-text{border:none!important;background:transparent!important;padding:0!important;min-height:0!important}' +
    '.point-selector-bar,#upload-screen,#loading-overlay,.btn-export,.btn-header{display:none!important}' +
    '@media print{' +
    '*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}' +
    '.report-header{position:static!important;box-shadow:none!important}' +
    '.exp-nav,.nav-tabs,.exp-pt-btn{display:none!important}' +
    '.exp-point{display:block!important}' +
    '.exp-point+.exp-point{page-break-before:always}' +
    '.exp-sec{display:block!important;max-width:100%!important;margin:0!important;padding:1rem 1.25rem!important}' +
    '.exp-sec+.exp-sec{page-break-before:always}' +
    '.card,.hero-banner,.route-block{page-break-inside:avoid}' +
    'img{max-width:100%!important}' +
    '}' +
    '</style>\n</head>\n<body>\n' +
    '<div class="report-header" style="flex-direction:column;gap:.75rem;padding:1rem 1.5rem">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;width:100%">' +
    (window._logoSrc
      ? '<div style="display:flex;align-items:center;gap:.75rem">' +
        '<img src="' +
        window._logoSrc +
        '" style="height:40px;max-width:150px;object-fit:contain">' +
        '<div class="header-logo">Análisis de Puntos</div></div>'
      : '<div><div class="header-logo">Análisis de Puntos</div>') +
    '<div style="font-size:.82rem;color:rgba(255,255,255,.7)">' +
    date +
    '</div></div>' +
    '<span style="background:rgba(255,255,255,.15);color:white;border:1px solid rgba(255,255,255,.25);border-radius:8px;padding:.3rem .8rem;font-size:.78rem">' +
    snapshots.length +
    ' punto' +
    (snapshots.length !== 1 ? 's' : '') +
    ' exportado' +
    (snapshots.length !== 1 ? 's' : '') +
    '</span>' +
    '</div>' +
    '<div style="display:flex;gap:.5rem;flex-wrap:wrap;background:rgba(0,0,0,.3);padding:.5rem 1.5rem">' +
    pointBtns +
    '</div>' +
    '</div>\n' +
    allPointsHTML +
    '<sc' +
    'ript>\n' +
    'var _curPt=0;\n' +
    'function expSwitch(i){' +
    'document.querySelectorAll(".exp-point").forEach(function(el){el.style.display="none";});' +
    'document.getElementById("exp-pt-"+i).style.display="block";' +
    'document.querySelectorAll(".exp-pt-btn").forEach(function(b){b.classList.remove("active");});' +
    'document.querySelectorAll(".exp-pt-btn")[i].classList.add("active");' +
    '_curPt=i;' +
    '}\n' +
    'function expShowConf(){' +
    'document.querySelectorAll(".exp-point").forEach(function(el){el.style.display="none";});' +
    'var cg=document.getElementById("conf-global");if(cg)cg.style.display="block";' +
    'document.querySelectorAll(".exp-pt-btn").forEach(function(b){b.classList.remove("active");});' +
    'var bc=document.getElementById("btn-conf-global");if(bc)bc.classList.add("active");' +
    '}\n' +
    'function expSec(id,el,pfx){' +
    'document.querySelectorAll("#exp-pt-"+_curPt+" .exp-sec").forEach(function(s){s.classList.remove("active");});' +
    'document.querySelectorAll("#"+pfx+"-nav .nav-tab").forEach(function(t){t.classList.remove("active");});' +
    'document.getElementById(id).classList.add("active");' +
    'if(el)el.classList.add("active");' +
    '}\n' +
    '</' +
    'script>\n' +
    '<style>.ezwrap{cursor:grab;user-select:none}.ezwrap.ezg{cursor:grabbing}</style>\n' +
    '<sc' +
    'ript>\n' +
    'var _ez={};function ezG(w){if(!_ez[w])_ez[w]={sc:1,ox:0,oy:0};return _ez[w];}\n' +
    'function ezA(wid,iid){var s=ezG(wid),el=document.getElementById(iid);if(el)el.style.transform="translate("+s.ox+"px,"+s.oy+"px) scale("+s.sc+")";}\n' +
    'document.addEventListener("click",function(e){\n' +
    '  var btn=e.target.closest(".ezbtn");if(!btn)return;\n' +
    '  var w=btn.dataset.w,ii=btn.dataset.i,f=parseFloat(btn.dataset.f);\n' +
    '  var s=ezG(w);\n' +
    '  if(f===0){s.sc=1;s.ox=0;s.oy=0;}else{s.sc=Math.max(0.5,Math.min(12,s.sc*f));}\n' +
    '  ezA(w,ii);\n' +
    '});\n' +
    'document.addEventListener("DOMContentLoaded",function(){\n' +
    '  document.querySelectorAll(".ezwrap").forEach(function(wrap){\n' +
    '    if(wrap._ez)return;wrap._ez=1;\n' +
    '    var wid=wrap.dataset.wid,iid=wrap.dataset.iid;\n' +
    '    if(!wid||!iid)return;\n' +
    '    wrap.addEventListener("wheel",function(e){\n' +
    '      e.preventDefault();var s=ezG(wid),r=wrap.getBoundingClientRect();\n' +
    '      var mx=e.clientX-r.left,my=e.clientY-r.top;\n' +
    '      var ns=Math.max(0.5,Math.min(12,s.sc*(e.deltaY<0?1.1:0.9)));\n' +
    '      s.ox=mx-(mx-s.ox)*(ns/s.sc);s.oy=my-(my-s.oy)*(ns/s.sc);s.sc=ns;ezA(wid,iid);\n' +
    '    },{passive:false});\n' +
    '    var drag=false,sx=0,sy=0;\n' +
    '    wrap.addEventListener("mousedown",function(e){drag=true;var s=ezG(wid);sx=e.clientX-s.ox;sy=e.clientY-s.oy;wrap.classList.add("ezg");e.preventDefault();});\n' +
    '    document.addEventListener("mousemove",function(e){if(!drag)return;var s=ezG(wid);s.ox=e.clientX-sx;s.oy=e.clientY-sy;ezA(wid,iid);});\n' +
    '    document.addEventListener("mouseup",function(){drag=false;wrap.classList.remove("ezg");});\n' +
    '  });\n' +
    '});\n' +
    '</' +
    'script>\n' +
    '</body></html>';

  // Se antepone el BOM (\ufeff) para que SharePoint y otros visores detecten
  // correctamente la codificación UTF-8 y las tildes/ñ se vean bien.
  const blob = new Blob(['\ufeff' + html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Reporte_Analisis_' + new Date().toISOString().slice(0, 10) + '.html';
  a.click();
  URL.revokeObjectURL(url);
}
