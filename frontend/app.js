const API_BASE = "/api";
const state = {
  items: [],
  results: [],
};

const fileInput = document.getElementById("file-input");
const uploadBtn = document.getElementById("upload-btn");
const clearBtn = document.getElementById("clear-btn");
const statusEl = document.getElementById("status");
const gallery = document.getElementById("gallery");
const resultsSection = document.getElementById("results-section");
const results = document.getElementById("results");
const dropZone = document.getElementById("drop-zone");
const modeRadios = document.querySelectorAll('input[name="mode"]');
const capacitiesInput = document.getElementById("capacities-input");
const clustersInput = document.getElementById("clusters-input");
const addImagesBtn = document.getElementById("add-images-btn");
const updateCapacitiesBtn = document.getElementById("update-capacities-btn");
const statusBtn = document.getElementById("status-btn");
const clusterStatusDisplay = document.getElementById("cluster-status-display");
const clusterStatusContent = document.getElementById("cluster-status-content");
const addImagesBtnHu = document.getElementById("add-images-btn-hu");
const updateCapacitiesBtnHu = document.getElementById("update-capacities-btn-hu");
const statusBtnHu = document.getElementById("status-btn-hu");
const clusterStatusDisplayHu = document.getElementById("cluster-status-display-hu");
const clusterStatusContentHu = document.getElementById("cluster-status-content-hu");
const addImagesBtnZernike = document.getElementById("add-images-btn-zernike");
const updateCapacitiesBtnZernike = document.getElementById("update-capacities-btn-zernike");
const statusBtnZernike = document.getElementById("status-btn-zernike");
const clusterStatusDisplayZernike = document.getElementById("cluster-status-display-zernike");
const clusterStatusContentZernike = document.getElementById("cluster-status-content-zernike");
const addImagesBtnSift = document.getElementById("add-images-btn-sift");
const updateCapacitiesBtnSift = document.getElementById("update-capacities-btn-sift");
const statusBtnSift = document.getElementById("status-btn-sift");
const clusterStatusDisplaySift = document.getElementById("cluster-status-display-sift");
const clusterStatusContentSift = document.getElementById("cluster-status-content-sift");
const addImagesBtnHog = document.getElementById("add-images-btn-hog");
const updateCapacitiesBtnHog = document.getElementById("update-capacities-btn-hog");
const statusBtnHog = document.getElementById("status-btn-hog");
const clusterStatusDisplayHog = document.getElementById("cluster-status-display-hog");
const clusterStatusContentHog = document.getElementById("cluster-status-content-hog");

function setStatus(text) {
  statusEl.textContent = text;
}

function resolveUrl(path) {
  return `${API_BASE}${path}`;
}

function getMode() {
  const selected = document.querySelector('input[name="mode"]:checked');
  return selected ? selected.value : "gallery";
}

function renderItem(item) {
  const card = document.createElement("div");
  card.className = "card";

  const title = document.createElement("h3");
  title.textContent = item.filename || "imagen";

  const images = document.createElement("div");
  images.className = "images";

  const original = document.createElement("img");
  original.src = resolveUrl(item.original_url);
  original.alt = "Original";

  const processed = document.createElement("img");
  processed.src = resolveUrl(item.processed_url);
  processed.alt = "Procesada";

  const binarized = document.createElement("img");
  binarized.src = resolveUrl(item.binarized_url);
  binarized.alt = "Binarizada";

  images.appendChild(original);
  images.appendChild(processed);
  images.appendChild(binarized);

  card.appendChild(title);
  card.appendChild(images);

  gallery.prepend(card);
}

function addItems(items) {
  items.forEach((item) => {
    state.items.push(item);
    renderItem(item);
  });
}

function clearGallery() {
  state.items = [];
  gallery.innerHTML = "";
}

function renderResults(resultList, type) {
  resultsSection.style.display = "block";
  gallery.parentElement.style.display = "none";

  if (type === "momentos" || type === "hu" || type === "zernike" || type === "sift" || type === "hog") {
    resultList.forEach((item) => {
      state.results.push(item);
      const cid = typeof item.cluster_id === "number" ? item.cluster_id : "sin-cluster";
      let group = results.querySelector(`[data-cluster-id="${cid}"]`);
      if (!group) {
        group = document.createElement("div");
        group.className = "cluster-group";
        group.dataset.clusterId = cid;

        const title = document.createElement("h3");
        title.textContent = `Cluster ${cid}`;

        const centroid = document.createElement("div");
        centroid.className = "cluster-centroid";
        centroid.textContent = "Centroide: []";

        const grid = document.createElement("div");
        grid.className = "cluster-grid";

        group.appendChild(title);
        group.appendChild(centroid);
        group.appendChild(grid);
        results.appendChild(group);
      }

      const centroidEl = group.querySelector(".cluster-centroid");
      if (centroidEl && Array.isArray(item.ultimo_centroide)) {
        const c = item.ultimo_centroide.slice(0, 8).map(v => Number(v).toFixed(3)).join(", ");
        centroidEl.textContent = `Centroide: [${c}, ...]`;
      }

      const grid = group.querySelector(".cluster-grid");
      const tile = document.createElement("div");
      tile.className = "cluster-item";

      const img = document.createElement("img");
      img.src = resolveUrl(item.original_url);
      img.alt = item.filename || "imagen";

      const caption = document.createElement("div");
      caption.className = "cluster-caption";
      caption.textContent = item.filename || "imagen";

      tile.appendChild(img);
      tile.appendChild(caption);
      grid.appendChild(tile);
    });
    return;
  }

  resultList.forEach((item) => {
    state.results.push(item);

    const resultItem = document.createElement("div");
    resultItem.className = "result-item";

    const preview = document.createElement("div");
    preview.className = "result-preview";

    if (type === "sift") {
      const processedDiv = document.createElement("div");
      const processedImg = document.createElement("img");
      processedImg.src = resolveUrl(item.processed_url);
      const processedLabel = document.createElement("div");
      processedLabel.className = "result-preview-label";
      processedLabel.textContent = "SIFT";
      processedDiv.appendChild(processedImg);
      processedDiv.appendChild(processedLabel);
      preview.appendChild(processedDiv);
    } else if (type === "hog") {
      const originalDiv = document.createElement("div");
      const originalImg = document.createElement("img");
      originalImg.src = resolveUrl(item.original_url);
      const originalLabel = document.createElement("div");
      originalLabel.className = "result-preview-label";
      originalLabel.textContent = "Original";
      originalDiv.appendChild(originalImg);
      originalDiv.appendChild(originalLabel);

      const processedDiv = document.createElement("div");
      const processedImg = document.createElement("img");
      processedImg.src = resolveUrl(item.processed_url);
      const processedLabel = document.createElement("div");
      processedLabel.className = "result-preview-label";
      processedLabel.textContent = "HOG";
      processedDiv.appendChild(processedImg);
      processedDiv.appendChild(processedLabel);

      preview.appendChild(originalDiv);
      preview.appendChild(processedDiv);
    } else {
      const originalDiv = document.createElement("div");
      const originalImg = document.createElement("img");
      originalImg.src = resolveUrl(item.original_url);
      const originalLabel = document.createElement("div");
      originalLabel.className = "result-preview-label";
      originalLabel.textContent = "Original";
      originalDiv.appendChild(originalImg);
      originalDiv.appendChild(originalLabel);

      const processedDiv = document.createElement("div");
      const processedImg = document.createElement("img");
      processedImg.src = resolveUrl(item.processed_url);
      const processedLabel = document.createElement("div");
      processedLabel.className = "result-preview-label";
      processedLabel.textContent = "Procesada";
      processedDiv.appendChild(processedImg);
      processedDiv.appendChild(processedLabel);

      const binarizedDiv = document.createElement("div");
      const binarizedImg = document.createElement("img");
      binarizedImg.src = resolveUrl(item.binarized_url);
      const binarizedLabel = document.createElement("div");
      binarizedLabel.className = "result-preview-label";
      binarizedLabel.textContent = "Binarizada";
      binarizedDiv.appendChild(binarizedImg);
      binarizedDiv.appendChild(binarizedLabel);

      preview.appendChild(originalDiv);
      preview.appendChild(processedDiv);
      preview.appendChild(binarizedDiv);
    }

    const dataSection = document.createElement("div");
    dataSection.className = "result-data";

    const title = document.createElement("h4");
    title.textContent = item.filename;

    const momentosData = document.createElement("div");
    
    if (type === "hu") {
      const h = item.momentos_hu;
      momentosData.innerHTML = `
        <p><strong>Momentos de Hu:</strong></p>
        <p>  h1: ${h.hu1.toExponential(6)}</p>
        <p>  h2: ${h.hu2.toExponential(6)}</p>
        <p>  h3: ${h.hu3.toExponential(6)}</p>
        <p>  h4: ${h.hu4.toExponential(6)}</p>
        <p>  h5: ${h.hu5.toExponential(6)}</p>
        <p>  h6: ${h.hu6.toExponential(6)}</p>
        <p>  h7: ${h.hu7.toExponential(6)}</p>
      `;
    } else if (type === "zernike") {
      const z = item.momentos_zernike || {};
      const keys = Object.keys(z);
      if (keys.length === 0) {
        momentosData.innerHTML = '<p><strong>Momentos de Zernike:</strong> no disponibles</p>';
      } else {
        let html = '<p><strong>Momentos de Zernike:</strong></p>';
        for (let i = 0; i < keys.length; i += 5) {
          const chunk = keys.slice(i, i + 5);
          html += '<p>  ' + chunk.map(k => {
            const val = Number(z[k]);
            const text = Number.isFinite(val) ? val.toExponential(4) : String(z[k]);
            return `${k}: ${text}`;
          }).join(' | ') + '</p>';
        }
        momentosData.innerHTML = html;
      }
    } else if (type === "sift") {
      const d = item.descriptores || [];
      const count = d.length;
      const sample = d.slice(0, 3);
      let html = `<p><strong>SIFT:</strong> ${count} descriptores</p>`;
      if (sample.length > 0) {
        html += '<p><strong>Ejemplo (primeros 3):</strong></p>';
        sample.forEach((vec, i) => {
          const shortVec = vec.slice(0, 8).map(v => Number(v).toFixed(3)).join(', ');
          html += `<p>  d${i + 1}: [${shortVec}, ...]</p>`;
        });
      }
      momentosData.innerHTML = html;
    } else if (type === "hog") {
      const d = item.descriptores_hog || [];
      const count = d.length;
      const sample = d.slice(0, 12).map(v => Number(v).toFixed(4)).join(', ');
      let html = `<p><strong>HOG:</strong> ${count} valores</p>`;
      if (count > 0) {
        html += `<p><strong>Ejemplo (primeros 12):</strong> [${sample}, ...]</p>`;
      }
      momentosData.innerHTML = html;
    } else {
      const m = item.momentos;
      momentosData.innerHTML = `
        <p><strong>Momentos Espaciales:</strong></p>
        <p>  m00: ${m.m00.toFixed(2)} | m10: ${m.m10.toFixed(2)} | m01: ${m.m01.toFixed(2)}</p>
        <p>  m20: ${m.m20.toFixed(2)} | m11: ${m.m11.toFixed(2)} | m02: ${m.m02.toFixed(2)}</p>
        <p>  m30: ${m.m30.toFixed(2)} | m21: ${m.m21.toFixed(2)} | m12: ${m.m12.toFixed(2)} | m03: ${m.m03.toFixed(2)}</p>
        <p><strong>Momentos Centrales:</strong></p>
        <p>  mu20: ${m.mu20.toFixed(2)} | mu11: ${m.mu11.toFixed(2)} | mu02: ${m.mu02.toFixed(2)}</p>
        <p>  mu30: ${m.mu30.toFixed(2)} | mu21: ${m.mu21.toFixed(2)} | mu12: ${m.mu12.toFixed(2)} | mu03: ${m.mu03.toFixed(2)}</p>
        <p><strong>Momentos Normalizados:</strong></p>
        <p>  nu20: ${m.nu20.toExponential(4)} | nu11: ${m.nu11.toExponential(4)} | nu02: ${m.nu02.toExponential(4)}</p>
        <p>  nu30: ${m.nu30.toExponential(4)} | nu21: ${m.nu21.toExponential(4)} | nu12: ${m.nu12.toExponential(4)} | nu03: ${m.nu03.toExponential(4)}</p>
      `;
      if (item.ultimo_centroide) {
        const c = item.ultimo_centroide.slice(0, 6).map(v => Number(v).toFixed(3)).join(", ");
        momentosData.innerHTML += `
          <p><strong>Cluster:</strong> ${item.cluster_id}</p>
          <p><strong>Último centroide:</strong> [${c}, ...]</p>
        `;
      }
    }

    dataSection.appendChild(title);
    dataSection.appendChild(momentosData);

    resultItem.appendChild(preview);
    resultItem.appendChild(dataSection);

    results.appendChild(resultItem);
  });
}

async function loadExisting() {
  setStatus("Cargando...");
  try {
    const res = await fetch(`${API_BASE}/images`);
    const data = await res.json();
    if (Array.isArray(data)) {
      addItems(data);
    }
    setStatus("Listo");
  } catch (err) {
    setStatus("Error al cargar");
  }
}

async function uploadFiles(files) {
  if (!files || files.length === 0) {
    return;
  }

  const mode = getMode();
  uploadBtn.disabled = true;
  setStatus("Subiendo...");

  const form = new FormData();
  Array.from(files).forEach((file) => form.append("files", file));

  try {
    if (mode === "momentos") {
      const caps = capacitiesInput.value.trim();
      const k = clustersInput.value.trim();
      if (!caps && !k) {
        setStatus("Ingresa capacities o número de clusters");
        uploadBtn.disabled = false;
        return;
      }
      if (caps) {
        form.append("capacities", caps);
      }
      if (k) {
        form.append("clusters", k);
      }
      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const data = await res.json();
      if (data.results) {
        renderResults(data.results, "momentos");
        if (data.metrics) {
          displayMetrics(data.metrics);
        }
      }
    } else if (mode === "hu") {
      const caps = document.getElementById("hu-capacities-input").value.trim();
      const k = document.getElementById("hu-clusters-input").value.trim();
      if (!caps && !k) {
        setStatus("Ingresa capacities o número de clusters");
        uploadBtn.disabled = false;
        return;
      }
      if (caps) {
        form.append("capacities", caps);
      }
      if (k) {
        form.append("clusters", k);
      }
      const res = await fetch(`${API_BASE}/analyze-hu`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const data = await res.json();
      if (data.results) {
        renderResults(data.results, "hu");
        if (data.metrics) {
          displayMetrics(data.metrics);
        }
      }
    } else if (mode === "zernike") {
      const caps = document.getElementById("zernike-capacities-input").value.trim();
      const k = document.getElementById("zernike-clusters-input").value.trim();
      if (!caps && !k) {
        setStatus("Ingresa capacities o número de clusters");
        uploadBtn.disabled = false;
        return;
      }
      if (caps) {
        form.append("capacities", caps);
      }
      if (k) {
        form.append("clusters", k);
      }
      const res = await fetch(`${API_BASE}/analyze-zernike`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const data = await res.json();
      if (data.results) {
        renderResults(data.results, "zernike");
        if (data.metrics) {
          displayMetrics(data.metrics);
        }
      }
    } else if (mode === "sift") {
      const caps = document.getElementById("sift-capacities-input").value.trim();
      const k = document.getElementById("sift-clusters-input").value.trim();
      if (!caps && !k) {
        setStatus("Ingresa capacities o número de clusters");
        uploadBtn.disabled = false;
        return;
      }
      if (caps) {
        form.append("capacities", caps);
      }
      if (k) {
        form.append("clusters", k);
      }
      const res = await fetch(`${API_BASE}/analyze-sift`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const data = await res.json();
      if (data.results) {
        renderResults(data.results, "sift");
        if (data.metrics) {
          displayMetrics(data.metrics);
        }
      }
    } else if (mode === "hog") {
      const caps = document.getElementById("hog-capacities-input").value.trim();
      const k = document.getElementById("hog-clusters-input").value.trim();
      if (!caps && !k) {
        setStatus("Ingresa capacities o número de clusters");
        uploadBtn.disabled = false;
        return;
      }
      if (caps) {
        form.append("capacities", caps);
      }
      if (k) {
        form.append("clusters", k);
      }
      const res = await fetch(`${API_BASE}/analyze-hog`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const data = await res.json();
      if (data.results) {
        renderResults(data.results, "hog");
        if (data.metrics) {
          displayMetrics(data.metrics);
        }
      }
    } else {
      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const data = await res.json();
      if (data.items) {
        addItems(data.items);
      }
    }

    setStatus("Listo");
    fileInput.value = "";
  } catch (err) {
    const msg = err && err.message ? err.message : "Error al subir";
    setStatus(msg.replace(/^"|"$/g, ""));
  } finally {
    uploadBtn.disabled = false;
  }
}

async function addImagesToCluster(files) {
  if (!files || files.length === 0) {
    return;
  }

  const mode = getMode();
  if (mode !== "momentos") {
    setStatus("❌ Selecciona 'Momentos' para agregar imágenes al clustering");
    return;
  }

  addImagesBtn.disabled = true;
  setStatus("Verificando modelo de clustering...");

  // Primero verificar que existe un modelo activo
  try {
    const statusRes = await fetch(`${API_BASE}/cluster-status`);
    const statusData = await statusRes.json();
    
    if (!statusData.active) {
      setStatus("❌ No hay modelo activo. Sube imágenes primero con capacidades");
      addImagesBtn.disabled = false;
      return;
    }
    
    console.log("✓ Modelo activo encontrado");
  } catch (err) {
    setStatus("❌ Error verificando modelo");
    addImagesBtn.disabled = false;
    return;
  }

  setStatus("Agregando imágenes...");

  const form = new FormData();
  Array.from(files).forEach((file) => form.append("files", file));

  try {
    const res = await fetch(`${API_BASE}/add-images`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }

    const data = await res.json();
    if (data.results) {
      renderResults(data.results, "momentos");
    }
    if (data.metrics) {
      displayMetrics(data.metrics);
    }
    setStatus("✓ Imágenes agregadas exitosamente");
    fileInput.value = "";
  } catch (err) {
    const msg = err && err.message ? err.message : "Error al agregar";
    setStatus("❌ " + msg.replace(/^"|"$/g, ""));
  } finally {
    addImagesBtn.disabled = false;
  }
}

async function updateCapacities() {
  const mode = getMode();
  if (mode !== "momentos") {
    setStatus("Selecciona 'Momentos' para actualizar restricciones");
    return;
  }

  const caps = capacitiesInput.value.trim();
  if (!caps) {
    setStatus("Ingresa capacities para actualizar restricciones");
    return;
  }

  updateCapacitiesBtn.disabled = true;
  setStatus("Actualizando restricciones...");

  const form = new FormData();
  form.append("capacities", caps);

  try {
    const res = await fetch(`${API_BASE}/update-capacities`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }

    const data = await res.json();
    if (data.metrics) {
      displayMetrics(data.metrics);
    }
    setStatus("Restricciones actualizadas ✓");
    // Mostrar estado después de actualizar
    await showClusterStatus();
  } catch (err) {
    const msg = err && err.message ? err.message : "Error al actualizar";
    setStatus(msg.replace(/^"|"$/g, ""));
  } finally {
    updateCapacitiesBtn.disabled = false;
  }
}

async function showClusterStatus() {
  try {
    const res = await fetch(`${API_BASE}/cluster-status`);
    if (!res.ok) return;
    
    const status = await res.json();
    if (!status.active) {
      clusterStatusDisplay.style.display = "none";
      return;
    }
    
    let html = "<ul style='margin: 5px 0; padding-left: 20px;'>";
    for (let i = 0; i < status['num_clusters']; i++) {
      const current = status['current_counts'][i] || 0;
      const capacity = status['capacities'][i] || 0;
      const available = status['available_spaces'][i] || 0;
      const percent = Math.round((current / capacity) * 100);
      html += `<li>Cluster ${i}: ${current}/${capacity} (${available} cupo) [${percent}%]</li>`;
    }
    html += "</ul>";
    
    clusterStatusContent.innerHTML = html;
    clusterStatusDisplay.style.display = "block";
  } catch (err) {
    console.error("Error al obtener estado", err);
  }
}

async function deleteAll() {
  clearBtn.disabled = true;
  setStatus("Borrando...");
  try {
    const res = await fetch(`${API_BASE}/images`, { method: "DELETE" });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }
    clearGallery();
    state.results = [];
    results.innerHTML = "";
    resultsSection.style.display = "none";
    gallery.parentElement.style.display = "block";
    setStatus("Listo");
  } catch (err) {
    setStatus("Error al borrar");
  } finally {
    clearBtn.disabled = false;
  }
}

// Funciones para Hu Moments
async function addImagesToClusterHu(files) {
  if (!files || files.length === 0) {
    return;
  }

  const mode = getMode();
  if (mode !== "hu") {
    setStatus("❌ Selecciona 'Momentos de Hu' para agregar imágenes al clustering");
    return;
  }

  addImagesBtnHu.disabled = true;
  setStatus("Verificando modelo de clustering...");

  // Primero verificar que existe un modelo activo
  try {
    const statusRes = await fetch(`${API_BASE}/cluster-status-hu`);
    const statusData = await statusRes.json();
    
    if (!statusData.active) {
      setStatus("❌ No hay modelo activo. Sube imágenes primero con capacidades");
      addImagesBtnHu.disabled = false;
      return;
    }
    
    console.log("✓ Modelo activo encontrado");
  } catch (err) {
    setStatus("❌ Error verificando modelo");
    addImagesBtnHu.disabled = false;
    return;
  }

  setStatus("Agregando imágenes...");

  const form = new FormData();
  Array.from(files).forEach((file) => form.append("files", file));

  try {
    const res = await fetch(`${API_BASE}/add-images-hu`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }

    const data = await res.json();
    if (data.results) {
      renderResults(data.results, "hu");
    }
    if (data.metrics) {
      displayMetrics(data.metrics);
    }
    setStatus("✓ Imágenes agregadas exitosamente");
    fileInput.value = "";
  } catch (err) {
    const msg = err && err.message ? err.message : "Error al agregar";
    setStatus("❌ " + msg.replace(/^"|"$/g, ""));
  } finally {
    addImagesBtnHu.disabled = false;
  }
}

async function updateCapacitiesHu() {
  const mode = getMode();
  if (mode !== "hu") {
    setStatus("Selecciona 'Momentos de Hu' para actualizar restricciones");
    return;
  }

  const caps = document.getElementById("hu-capacities-input").value.trim();
  if (!caps) {
    setStatus("Ingresa capacities para actualizar restricciones");
    return;
  }

  updateCapacitiesBtnHu.disabled = true;
  setStatus("Actualizando restricciones...");

  const form = new FormData();
  form.append("capacities", caps);

  try {
    const res = await fetch(`${API_BASE}/update-capacities-hu`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }

    const data = await res.json();
    if (data.metrics) {
      displayMetrics(data.metrics);
    }
    setStatus("Restricciones actualizadas ✓");
    // Mostrar estado después de actualizar
    await showClusterStatusHu();
  } catch (err) {
    const msg = err && err.message ? err.message : "Error al actualizar";
    setStatus(msg.replace(/^"|"$/g, ""));
  } finally {
    updateCapacitiesBtnHu.disabled = false;
  }
}

async function showClusterStatusHu() {
  try {
    const res = await fetch(`${API_BASE}/cluster-status-hu`);
    if (!res.ok) return;
    
    const status = await res.json();
    if (!status.active) {
      clusterStatusDisplayHu.style.display = "none";
      return;
    }
    
    let html = "<ul style='margin: 5px 0; padding-left: 20px;'>";
    for (let i = 0; i < status['num_clusters']; i++) {
      const current = status['current_counts'][i] || 0;
      const capacity = status['capacities'][i] || 0;
      const available = status['available_spaces'][i] || 0;
      const percent = Math.round((current / capacity) * 100);
      html += `<li>Cluster ${i}: ${current}/${capacity} (${available} cupo) [${percent}%]</li>`;
    }
    html += "</ul>";
    
    clusterStatusContentHu.innerHTML = html;
    clusterStatusDisplayHu.style.display = "block";
  } catch (err) {
    console.error("Error al obtener estado", err);
  }
}

async function addImagesToClusterZernike(files) {
  if (!files || files.length === 0) {
    return;
  }

  const mode = getMode();
  if (mode !== "zernike") {
    setStatus("❌ Selecciona 'Momentos de Zernike' para agregar imágenes al clustering");
    return;
  }

  addImagesBtnZernike.disabled = true;
  setStatus("Verificando modelo de clustering...");

  // Primero verificar que existe un modelo activo
  try {
    const statusRes = await fetch(`${API_BASE}/cluster-status-zernike`);
    const statusData = await statusRes.json();
    
    if (!statusData.active) {
      setStatus("❌ No hay modelo activo. Sube imágenes primero con capacidades");
      addImagesBtnZernike.disabled = false;
      return;
    }
    
    console.log("✓ Modelo activo encontrado");
  } catch (err) {
    setStatus("❌ Error verificando modelo");
    addImagesBtnZernike.disabled = false;
    return;
  }

  setStatus("Agregando imágenes...");

  const form = new FormData();
  Array.from(files).forEach((file) => form.append("files", file));

  try {
    const res = await fetch(`${API_BASE}/add-images-zernike`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }

    const data = await res.json();
    if (data.results) {
      renderResults(data.results, "zernike");
    }
    if (data.metrics) {
      displayMetrics(data.metrics);
    }
    setStatus("✓ Imágenes agregadas exitosamente");
    fileInput.value = "";
  } catch (err) {
    const msg = err && err.message ? err.message : "Error al agregar";
    setStatus("❌ " + msg.replace(/^"|"$/g, ""));
  } finally {
    addImagesBtnZernike.disabled = false;
  }
}

async function updateCapacitiesZernike() {
  const mode = getMode();
  if (mode !== "zernike") {
    setStatus("Selecciona 'Momentos de Zernike' para actualizar restricciones");
    return;
  }

  const caps = document.getElementById("zernike-capacities-input").value.trim();
  if (!caps) {
    setStatus("Ingresa capacities para actualizar restricciones");
    return;
  }

  updateCapacitiesBtnZernike.disabled = true;
  setStatus("Actualizando restricciones...");

  const form = new FormData();
  form.append("capacities", caps);

  try {
    const res = await fetch(`${API_BASE}/update-capacities-zernike`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }

    const data = await res.json();
    if (data.metrics) {
      displayMetrics(data.metrics);
    }
    setStatus("Restricciones actualizadas ✓");
    // Mostrar estado después de actualizar
    await showClusterStatusZernike();
  } catch (err) {
    const msg = err && err.message ? err.message : "Error al actualizar";
    setStatus(msg.replace(/^"|"$/g, ""));
  } finally {
    updateCapacitiesBtnZernike.disabled = false;
  }
}

async function showClusterStatusZernike() {
  try {
    const res = await fetch(`${API_BASE}/cluster-status-zernike`);
    if (!res.ok) return;
    
    const status = await res.json();
    if (!status.active) {
      clusterStatusDisplayZernike.style.display = "none";
      return;
    }
    
    let html = "<ul style='margin: 5px 0; padding-left: 20px;'>";
    for (let i = 0; i < status['num_clusters']; i++) {
      const current = status['current_counts'][i] || 0;
      const capacity = status['capacities'][i] || 0;
      const available = status['available_spaces'][i] || 0;
      const percent = Math.round((current / capacity) * 100);
      html += `<li>Cluster ${i}: ${current}/${capacity} (${available} cupo) [${percent}%]</li>`;
    }
    html += "</ul>";
    
    clusterStatusContentZernike.innerHTML = html;
    clusterStatusDisplayZernike.style.display = "block";
  } catch (err) {
    console.error("Error al obtener estado", err);
  }
}

async function addImagesToClusterSift(files) {
  if (!files || files.length === 0) {
    return;
  }

  const mode = getMode();
  if (mode !== "sift") {
    setStatus("❌ Selecciona 'SIFT' para agregar imágenes al clustering");
    return;
  }

  addImagesBtnSift.disabled = true;
  setStatus("Verificando modelo de clustering...");

  // Primero verificar que existe un modelo activo
  try {
    const statusRes = await fetch(`${API_BASE}/cluster-status-sift`);
    const statusData = await statusRes.json();
    
    if (!statusData.active) {
      setStatus("❌ No hay modelo activo. Sube imágenes primero con capacidades");
      addImagesBtnSift.disabled = false;
      return;
    }
    
    console.log("✓ Modelo activo encontrado");
  } catch (err) {
    setStatus("❌ Error verificando modelo");
    addImagesBtnSift.disabled = false;
    return;
  }

  setStatus("Agregando imágenes...");

  const form = new FormData();
  Array.from(files).forEach((file) => form.append("files", file));

  try {
    const res = await fetch(`${API_BASE}/add-images-sift`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }

    const data = await res.json();
    if (data.results) {
      renderResults(data.results, "sift");
    }
    if (data.metrics) {
      displayMetrics(data.metrics);
    }
    setStatus("✓ Imágenes agregadas exitosamente");
    fileInput.value = "";
  } catch (err) {
    const msg = err && err.message ? err.message : "Error al agregar";
    setStatus("❌ " + msg.replace(/^"|"$/g, ""));
  } finally {
    addImagesBtnSift.disabled = false;
  }
}

async function updateCapacitiesSift() {
  const mode = getMode();
  if (mode !== "sift") {
    setStatus("Selecciona 'SIFT' para actualizar restricciones");
    return;
  }

  const caps = document.getElementById("sift-capacities-input").value.trim();
  if (!caps) {
    setStatus("Ingresa capacities para actualizar restricciones");
    return;
  }

  updateCapacitiesBtnSift.disabled = true;
  setStatus("Actualizando restricciones...");

  const form = new FormData();
  form.append("capacities", caps);

  try {
    const res = await fetch(`${API_BASE}/update-capacities-sift`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }

    const data = await res.json();
    if (data.metrics) {
      displayMetrics(data.metrics);
    }
    setStatus("Restricciones actualizadas ✓");
    // Mostrar estado después de actualizar
    await showClusterStatusSift();
  } catch (err) {
    const msg = err && err.message ? err.message : "Error al actualizar";
    setStatus(msg.replace(/^"|"$/g, ""));
  } finally {
    updateCapacitiesBtnSift.disabled = false;
  }
}

async function showClusterStatusSift() {
  try {
    const res = await fetch(`${API_BASE}/cluster-status-sift`);
    if (!res.ok) return;
    
    const status = await res.json();
    if (!status.active) {
      clusterStatusDisplaySift.style.display = "none";
      return;
    }
    
    let html = "<ul style='margin: 5px 0; padding-left: 20px;'>";
    for (let i = 0; i < status['num_clusters']; i++) {
      const current = status['current_counts'][i] || 0;
      const capacity = status['capacities'][i] || 0;
      const available = status['available_spaces'][i] || 0;
      const percent = Math.round((current / capacity) * 100);
      html += `<li>Cluster ${i}: ${current}/${capacity} (${available} cupo) [${percent}%]</li>`;
    }
    html += "</ul>";
    
    clusterStatusContentSift.innerHTML = html;
    clusterStatusDisplaySift.style.display = "block";
  } catch (err) {
    console.error("Error al obtener estado", err);
  }
}

async function addImagesToClusterHog(files) {
  if (!files || files.length === 0) {
    return;
  }

  const mode = getMode();
  if (mode !== "hog") {
    setStatus("❌ Selecciona 'HOG' para agregar imágenes al clustering");
    return;
  }

  addImagesBtnHog.disabled = true;
  setStatus("Verificando modelo de clustering...");

  // Primero verificar que existe un modelo activo
  try {
    const statusRes = await fetch(`${API_BASE}/cluster-status-hog`);
    const statusData = await statusRes.json();
    
    if (!statusData.active) {
      setStatus("❌ No hay modelo activo. Sube imágenes primero con capacidades");
      addImagesBtnHog.disabled = false;
      return;
    }
    
    console.log("✓ Modelo activo encontrado");
  } catch (err) {
    setStatus("❌ Error verificando modelo");
    addImagesBtnHog.disabled = false;
    return;
  }

  setStatus("Agregando imágenes...");

  const form = new FormData();
  Array.from(files).forEach((file) => form.append("files", file));

  try {
    const res = await fetch(`${API_BASE}/add-images-hog`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }

    const data = await res.json();
    if (data.results) {
      renderResults(data.results, "hog");
    }
    if (data.metrics) {
      displayMetrics(data.metrics);
    }
    setStatus("✓ Imágenes agregadas exitosamente");
    fileInput.value = "";
  } catch (err) {
    const msg = err && err.message ? err.message : "Error al agregar";
    setStatus("❌ " + msg.replace(/^"|"$/g, ""));
  } finally {
    addImagesBtnHog.disabled = false;
  }
}

async function updateCapacitiesHog() {
  const mode = getMode();
  if (mode !== "hog") {
    setStatus("Selecciona 'HOG' para actualizar restricciones");
    return;
  }

  const caps = document.getElementById("hog-capacities-input").value.trim();
  if (!caps) {
    setStatus("Ingresa capacities para actualizar restricciones");
    return;
  }

  updateCapacitiesBtnHog.disabled = true;
  setStatus("Actualizando restricciones...");

  const form = new FormData();
  form.append("capacities", caps);

  try {
    const res = await fetch(`${API_BASE}/update-capacities-hog`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }

    const data = await res.json();
    if (data.metrics) {
      displayMetrics(data.metrics);
    }
    setStatus("Restricciones actualizadas ✓");
    // Mostrar estado después de actualizar
    await showClusterStatusHog();
  } catch (err) {
    const msg = err && err.message ? err.message : "Error al actualizar";
    setStatus(msg.replace(/^"|"$/g, ""));
  } finally {
    updateCapacitiesBtnHog.disabled = false;
  }
}

async function showClusterStatusHog() {
  try {
    const res = await fetch(`${API_BASE}/cluster-status-hog`);
    if (!res.ok) return;
    
    const status = await res.json();
    if (!status.active) {
      clusterStatusDisplayHog.style.display = "none";
      return;
    }
    
    let html = "<ul style='margin: 5px 0; padding-left: 20px;'>";
    for (let i = 0; i < status['num_clusters']; i++) {
      const current = status['current_counts'][i] || 0;
      const capacity = status['capacities'][i] || 0;
      const available = status['available_spaces'][i] || 0;
      const percent = Math.round((current / capacity) * 100);
      html += `<li>Cluster ${i}: ${current}/${capacity} (${available} cupo) [${percent}%]</li>`;
    }
    html += "</ul>";
    
    clusterStatusContentHog.innerHTML = html;
    clusterStatusDisplayHog.style.display = "block";
  } catch (err) {
    console.error("Error al obtener estado", err);
  }
}

uploadBtn.addEventListener("click", () => uploadFiles(fileInput.files));
clearBtn.addEventListener("click", deleteAll);
fileInput.addEventListener("change", () => setStatus(`${fileInput.files.length} archivo(s) listo(s)`));
addImagesBtn.addEventListener("click", () => addImagesToCluster(fileInput.files));
updateCapacitiesBtn.addEventListener("click", updateCapacities);
statusBtn.addEventListener("click", showClusterStatus);
addImagesBtnHu.addEventListener("click", () => addImagesToClusterHu(fileInput.files));
updateCapacitiesBtnHu.addEventListener("click", updateCapacitiesHu);
statusBtnHu.addEventListener("click", showClusterStatusHu);
addImagesBtnZernike.addEventListener("click", () => addImagesToClusterZernike(fileInput.files));
updateCapacitiesBtnZernike.addEventListener("click", updateCapacitiesZernike);
statusBtnZernike.addEventListener("click", showClusterStatusZernike);
addImagesBtnSift.addEventListener("click", () => addImagesToClusterSift(fileInput.files));
updateCapacitiesBtnSift.addEventListener("click", updateCapacitiesSift);
statusBtnSift.addEventListener("click", showClusterStatusSift);
addImagesBtnHog.addEventListener("click", () => addImagesToClusterHog(fileInput.files));
updateCapacitiesBtnHog.addEventListener("click", updateCapacitiesHog);
statusBtnHog.addEventListener("click", showClusterStatusHog);

["dragenter", "dragover"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropZone.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropZone.classList.remove("dragover");
  });
});

dropZone.addEventListener("drop", (event) => {
  const files = event.dataTransfer.files;
  fileInput.files = files;
  setStatus(`${files.length} archivo(s) listo(s)`);
});

modeRadios.forEach((radio) => {
  radio.addEventListener("change", () => {
    const mode = getMode();
    const momentosConfig = document.getElementById("momentos-config");
    const huConfig = document.getElementById("hu-config");
    const zernikeConfig = document.getElementById("zernike-config");
    const siftConfig = document.getElementById("sift-config");
    const hogConfig = document.getElementById("hog-config");
    
    // Ocultar todas las configuraciones
    if (momentosConfig) momentosConfig.style.display = "none";
    if (huConfig) huConfig.style.display = "none";
    if (zernikeConfig) zernikeConfig.style.display = "none";
    if (siftConfig) siftConfig.style.display = "none";
    if (hogConfig) hogConfig.style.display = "none";
    
    // Mostrar configuración según el modo
    if (mode === "momentos" && momentosConfig) {
      momentosConfig.style.display = "flex";
    } else if (mode === "hu" && huConfig) {
      huConfig.style.display = "flex";
    } else if (mode === "zernike" && zernikeConfig) {
      zernikeConfig.style.display = "flex";
    } else if (mode === "sift" && siftConfig) {
      siftConfig.style.display = "flex";
    } else if (mode === "hog" && hogConfig) {
      hogConfig.style.display = "flex";
    }
    
    if (mode === "gallery") {
      resultsSection.style.display = "none";
      gallery.parentElement.style.display = "block";
    } else {
      state.results = [];
      results.innerHTML = "";
      resultsSection.style.display = "none";
    }
  });
});

function displayMetrics(metrics) {
  // Crear o actualizar el contenedor de métricas
  let metricsContainer = document.getElementById("metrics-display");
  if (!metricsContainer) {
    metricsContainer = document.createElement("div");
    metricsContainer.id = "metrics-display";
    metricsContainer.className = "metrics-container";
    resultsSection.insertBefore(metricsContainer, results);
  }

  const dunn = metrics.dunn_index !== undefined ? metrics.dunn_index : "N/A";
  const silhouette = metrics.silhouette_coefficient !== undefined ? metrics.silhouette_coefficient : "N/A";

  metricsContainer.innerHTML = `
    <div class="metrics-box">
      <h3>📊 Métricas de Evaluación</h3>
      <div class="metrics-grid">
        <div class="metric-item">
          <span class="metric-label">Índice de Dunn:</span>
          <span class="metric-value">${dunn}</span>
          <small>Mayor es mejor (separación entre clusters)</small>
        </div>
        <div class="metric-item">
          <span class="metric-label">Coeficiente de Silueta:</span>
          <span class="metric-value">${silhouette}</span>
          <small>Rango [-1, 1], mayor es mejor</small>
        </div>
      </div>
    </div>
  `;
}

loadExisting();

// Inicializar configuración de modo
const mode = getMode();
const momentosConfig = document.getElementById("momentos-config");
const huConfig = document.getElementById("hu-config");
if (mode === "momentos" && momentosConfig) {
  momentosConfig.style.display = "flex";
} else if (mode === "hu" && huConfig) {
  huConfig.style.display = "flex";
}
