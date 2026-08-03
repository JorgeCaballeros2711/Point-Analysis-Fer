function toggleTradeArea(on) {
  USE_TRADE_AREA = on;
  // Si el punto actual tiene más de un tiempo cargado (15/20/30 min), nunca se
  // colapsa a "Cumplimiento" a secas: se mantiene el sufijo de minutos.
  var _avTA = CURRENT_POINT ? getAvailMins(CURRENT_POINT) : [];
  var _collapseTA = USE_TRADE_AREA && _avTA.length <= 1;
  // Update tab label
  [15, 20, 30].forEach(function (m) {
    var tab = document.getElementById('tab-' + m + 'min');
    if (tab) {
      tab.innerHTML = _collapseTA ? 'Cumplimiento' : 'Cumplimiento ' + m + ' min';
    }
    var sec = document.getElementById('s-' + m + 'min');
    if (sec) {
      var title = sec.querySelector('.section-title');
      if (title) title.textContent = _collapseTA ? 'Cumplimiento' : 'Cumplimiento — ' + m + ' min';
    }
  });
  // Rebuild compliance tables with new text
  buildComplianceTables();
}

var _PULSTER_LOGO =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABOMAAASCCAYAAADwsCgiAAAACXBIWXMAAC4jAAAuIwF4pT92AAAgAElEQVR4nOzd23Jc53Un8LVdvgcF8J7wExB5ArafQPDNyJmpGbbhU5w4IWTnMEkcC/L5KELWyZYcCZyaqrFzY/AJ1HwCAU9g8B5oE0+w52I3RUqiROLQ39p7f79fFUqxqxz9L6w2+4+1vtW0bRsAAAAAwPJ9LjsAAAAAANRCGQcAAAAAhSjjAAAAAKAQZRwAAAAAFKKMAwAAAIBClHEAAAAAUIgyDgAAAAAKUcYBAAAAQCHKOAAAAAAoRBkHAAAAAIUo4wAAAACgEGUcAAAAABSijAMAAACAQpRxAAAAAFCIMg4AAAAAClHGAQAAAEAhyjgAAAAAKEQZBwAAAACFKOMAAAAAoBBlHAAAAAAUoowDAAAAgEKUcQAAAABQiDIOAAAAAApRxgEAAABAIco4AAAAAChEGQcAAAAAhSjjAAAAAKAQZRwAAAAAFKKMAwAAAIBClHEAAAAAUIgyDgAAAAAKUcYBAAAAQCHKOAAAAAAoRBkHAAAAAIUo4wAAAACgEGUcAAAAABSijAMAAACAQpRxAAAAAFCIMg4AAAAAClHGAQAAAEAhyjgAAAAAKEQZBwAAAACFKOMAAAAAoBBlHAAAAAAUoowDAAAAgEKUcQAAAABQiDIOAAAAAApRxgEAAABAIco4AAAAAChEGQcAAAAAhSjjAAAAAKAQZRwAAAAAFKKMAwAAAIBClHEAAAAAUIgyDgAAAAAKUcYBAAAAQCHKOAAAAAAoRBkHAAAAAIUo4wAAAACgEGUcAAAAABSijAMAAACAQpRxAAAAAFCIMg4AAAAAClHGAQAAAEAhyjgAAAAAKEQZBwAAAACFKOMAAAAAoBBlHAAAAAAUoowDAAAAgEKUcQAAAABQiDIOAAAAAApRxgEAAABAIco4AAAAAChEGQcAAAAAhSjjAAAAAKAQZRwAAAAAFKKMAwAAAIBClHEAAAAAUIgyDgAAAAAKUcYBAAAAQCHKOAAAAAAoRBkHAAAAAIUo4wAAAACgEGUcAAAAABSijAMAAACAQpRxAAAAAFCIMg4AAAAAClHGAQAAAEAhyjgAAAAAKEQZBwAAAACFKOMAAAAAoBBlHAAAAAAUoowDAAAAgEKUcQAAAABQiDIOAAAAAApRxgEAAABAIco4AAAAAChEGQcAAAAAhSjjAAAAAKAQZRwAAAAAFKKMAwAAAIBClHEAAAAAUIgyDgAAAAAKUcYBAAAAQCHKOAAAAAAoRBkHAAAAAIUo4wAAAACgEGUcAAAAABSijAMAAACAQpRxAAAAAFCIMg4AAAAAClHGAQAAAEAhyjgAAAAAKEQZBwAAAACFKOMAAAAAoBBlHAAAAAAUoowDAAAAgEKUcQAAAABQiDIOAAAAAApRxgEAAABAIco4AAAAAChEGQcAAAAAhSjjAAAAAKAQZRwAAAAAFKKMAwAAAIBClHEAAAAAUIgyDgAAAAAKUcYBAAAAQCHKOAAAAAAoRBkHAAAAAIUo4wAAAACgEGUcAAAAABSijAMAAACAQpRxAAAAAFCIMg4AAAAAClHGAQAAAEAhyjgAAAAAKEQZBwAAAACFKOMAAAAAoBBlHAAAAAAUoowDAAAAgEKUcQAAAABQiDIOAAAAAApRxgEAAABAIco4AAAAAChEGQcAAAAAhSjjAAAAAKAQZRwAAAAAFKKMAwAAAIBClHEAAAAAUIgyDgAAAAAKUcYBAAAAQCHKOAAAAAAoRBkHAAAAAIUo4wAAAACgEGUcAAAAABSijAMAAACAQpRxAAAA';
function setLogoSrc(src) {
  var wrap = document.getElementById('logo-wrap');
  if (!wrap) return;
  var ph = document.getElementById('logo-placeholder');
  if (ph) ph.style.display = 'none';
  var img = wrap.querySelector('img');
  if (!img) {
    img = document.createElement('img');
    img.style.cssText =
      'max-height:40px;max-width:150px;object-fit:contain;border-radius:4px;display:block';
    wrap.appendChild(img);
  }
  img.src = src;
  window._logoSrc = src;
}

function loadLogo(input) {
  var f = input.files[0];
  if (!f) return;
  var reader = new FileReader();
  reader.onload = function (e) {
    setLogoSrc(e.target.result);
  };
  reader.readAsDataURL(f);
}
