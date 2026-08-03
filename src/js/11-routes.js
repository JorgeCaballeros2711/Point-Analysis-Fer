// ROUTES
function renderRoutes(pName) {
  const list = ROUTES[pName] || [];
  const grid = document.getElementById('acceso-grid');
  grid.innerHTML = '';
  list.forEach(function (r, i) {
    const key = pName + '_acc_' + i;
    const div = document.createElement('div');
    div.className = 'route-card';

    // Header: editable name + delete button
    const hdr = document.createElement('div');
    hdr.className = 'route-card-header';
    hdr.style.cssText = 'display:flex;align-items:center;justify-content:space-between';

    const nameEl = document.createElement('div');
    nameEl.contentEditable = 'true';
    nameEl.dataset.routeName = i;
    nameEl.style.cssText = 'outline:none;flex:1;cursor:text';
    nameEl.title = 'Clic para editar nombre';
    nameEl.textContent = r.name;
    // Guardar el nombre editado en ROUTES para que no se pierda al agregar/eliminar rutas
    (function (idx, pn) {
      nameEl.addEventListener('input', function () {
        if (ROUTES[pn] && ROUTES[pn][idx]) ROUTES[pn][idx].name = nameEl.textContent;
      });
    })(i, pName);

    const delBtn = document.createElement('button');
    delBtn.textContent = '✕';
    delBtn.title = 'Eliminar ruta';
    delBtn.style.cssText =
      'background:rgba(255,255,255,.2);border:none;color:white;border-radius:5px;padding:.15rem .5rem;cursor:pointer;font-size:.8rem;margin-left:.5rem';
    (function (idx, pn) {
      delBtn.onclick = function () {
        deleteRoute(idx, pn);
      };
    })(i, pName);

    hdr.appendChild(nameEl);
    hdr.appendChild(delBtn);
    div.appendChild(hdr);

    // Body
    const body = document.createElement('div');
    body.style.padding = '1rem';

    // Image area
    const imgDiv = document.createElement('div');
    imgDiv.className = 'access-img';
    imgDiv.id = 'acc-img-' + i;
    const fileId = 'acc-file-' + i;
    imgDiv.onclick = function () {
      document.getElementById(fileId).click();
    };
    if (IMG_STORE[key]) {
      const img = document.createElement('img');
      img.src = IMG_STORE[key];
      img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover';
      imgDiv.appendChild(img);
      const chgBtn = document.createElement('button');
      chgBtn.className = 'overlay-btn';
      chgBtn.textContent = 'Cambiar';
      chgBtn.onclick = function (e) {
        e.stopPropagation();
        document.getElementById(fileId).click();
      };
      imgDiv.appendChild(chgBtn);
    } else {
      const ph = document.createElement('p');
      ph.textContent = 'Subir imagen de ruta';
      imgDiv.appendChild(ph);
    }

    // File input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = fileId;
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    (function (idx, pn) {
      fileInput.onchange = function () {
        loadAccImg(this, idx, pn);
      };
    })(i, pName);

    // Description
    const descEl = document.createElement('div');
    descEl.className = 'editable-text';
    descEl.dataset.routeDesc = i;
    descEl.style.minHeight = '45px';
    descEl.contentEditable = 'true';
    descEl.innerHTML = r.desc;
    // Guardar la descripción editada en ROUTES para que no se pierda al agregar/eliminar rutas
    (function (idx, pn) {
      descEl.addEventListener('input', function () {
        if (ROUTES[pn] && ROUTES[pn][idx]) ROUTES[pn][idx].desc = descEl.innerHTML;
      });
    })(i, pName);

    body.appendChild(imgDiv);
    body.appendChild(fileInput);
    body.appendChild(descEl);
    div.appendChild(body);
    grid.appendChild(div);
  });
}

function addRoute() {
  const n = document.getElementById('new-route-name').value.trim();
  const d = document.getElementById('new-route-desc').value.trim();
  if (!n) {
    alert('Ingresa un nombre.');
    return;
  }
  const pn = CURRENT_POINT ? CURRENT_POINT[PT.punto] : 'Punto';
  if (!ROUTES[pn]) ROUTES[pn] = [];
  ROUTES[pn].push({ name: n, desc: d || 'Descripción del acceso.' });
  renderRoutes(pn);
  document.getElementById('new-route-name').value = '';
  document.getElementById('new-route-desc').value = '';
}

function loadAccImg(input, i) {
  const f = input.files[0];
  if (!f) return;
  const pn = CURRENT_POINT ? CURRENT_POINT[PT.punto] : 'Punto';
  const key = pn + '_acc_' + i;
  const reader = new FileReader();
  reader.onload = e => {
    IMG_STORE[key] = e.target.result;
    renderRoutes(pn);
  };
  reader.readAsDataURL(f);
}
