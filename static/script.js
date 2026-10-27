const $ = (id) => document.getElementById(id);

function parseList(text) {
  return text
    .split(/[\s,;]+/)
    .filter(Boolean)
    .map(Number);
}

function fmt(value, digits = 6) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Number(value).toLocaleString("es-BO", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0
  });
}

function tableHTML(table) {
  if (!table || !table.columns || !table.rows) return "";
  const head = table.columns.map(c => `<th>${c}</th>`).join("");
  const rows = table.rows.map(row => {
    const cells = row.map(v => {
      if (v === null || v === undefined) return "<td>—</td>";
      if (typeof v === "number") return `<td>${fmt(v, 8)}</td>`;
      return `<td>${v}</td>`;
    }).join("");
    return `<tr>${cells}</tr>`;
  }).join("");
  return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderResult(id, html) {
  const el = $(id);
  el.innerHTML = html;
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise([el]).catch(() => {});
  }
}

function drawPlot(id, plot) {
  const el = $(id);
  Plotly.newPlot(el, plot.traces, plot.layout, {
    responsive: true,
    displaylogo: false,
    modeBarButtonsToRemove: ["lasso2d", "select2d"]
  });
}

async function postJSON(url, data) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || "Error en el cálculo.");
  return json;
}

function showError(id, err) {
  renderResult(id, `<p class="error">Error: ${err.message}</p>`);
}

/* -------------------- Ejercicio 19 -------------------- */
async function run19() {
  try {
    const data = {
      t: parseList($("ex19-t").value),
      v: parseList($("ex19-v").value)
    };
    const r = await postJSON("/api/ex19", data);
    renderResult("result19", `
      <p><strong>n = ${r.n}</strong>, <strong>h = ${fmt(r.h)} s</strong></p>
      <p>Trapecio compuesto: <strong>${fmt(r.trap_mi)} mi</strong> = ${fmt(r.trap_m)} m</p>
      <p>Simpson combinado: <strong>${fmt(r.simpson_mi)} mi</strong> = ${fmt(r.simpson_m)} m</p>
      ${tableHTML(r.table)}
    `);
    drawPlot("plot19", r.plot);
  } catch (err) { showError("result19", err); }
}

/* -------------------- Ejercicio 20 -------------------- */
async function run20() {
  try {
    const data = {
      x: parseList($("ex20-x").value),
      F: parseList($("ex20-F").value)
    };
    const r = await postJSON("/api/ex20", data);
    renderResult("result20", `
      <p><strong>n = ${r.n}</strong>, <strong>h = ${fmt(r.h)} in</strong></p>
      <p>Trapecio: <strong>${fmt(r.trap_lbin)} lb·in</strong> = ${fmt(r.trap_J)} J</p>
      <p>Simpson combinado: <strong>${fmt(r.simpson_lbin)} lb·in</strong> = ${fmt(r.simpson_J)} J</p>
      ${tableHTML(r.table)}
    `);
    drawPlot("plot20", r.plot);
  } catch (err) { showError("result20", err); }
}

/* -------------------- Ejercicio 21 -------------------- */
async function run21() {
  try {
    const data = {
      x: parseList($("ex21-x").value),
      y: parseList($("ex21-y").value)
    };
    const r = await postJSON("/api/ex21", data);
    renderResult("result21", `
      <p><strong>n = ${r.n}</strong>, <strong>h = ${fmt(r.h)}</strong></p>
      <p>Trapecio: <strong>${fmt(r.trap)} u²</strong></p>
      <p>Simpson combinado: <strong>${fmt(r.simpson)} u²</strong></p>
      <p class="note">Resultado dependiente de la digitalización del perfil.</p>
      ${tableHTML(r.table)}
    `);
    drawPlot("plot21", r.plot);
  } catch (err) { showError("result21", err); }
}

/* -------------------- Ejercicio 22 -------------------- */
async function run22() {
  try {
    const data = {
      a: Number($("ex22-a").value),
      x0: Number($("ex22-x0").value),
      x1: Number($("ex22-x1").value),
      n: Number($("ex22-n").value)
    };
    const r = await postJSON("/api/ex22", data);
    renderResult("result22", `
      <p><strong>n = ${r.n}</strong>, <strong>h = ${fmt(r.h)} ft</strong></p>
      <p>Trapecio: <strong>${fmt(r.trap)} ft</strong>, error = ${fmt(r.error_trap)} ft</p>
      <p>Simpson: <strong>${fmt(r.simpson)} ft</strong>, error = ${fmt(r.error_simpson)} ft</p>
      <p>Valor exacto analítico: <strong>${fmt(r.exact)} ft</strong></p>
      ${tableHTML(r.table)}
    `);
    drawPlot("plot22", r.plot);
  } catch (err) { showError("result22", err); }
}

/* -------------------- Ejercicio 23 -------------------- */
async function run23() {
  try {
    const data = {
      R: Number($("ex23-R").value),
      vmax: Number($("ex23-vmax").value),
      n: Number($("ex23-n").value)
    };
    const r = await postJSON("/api/ex23", data);
    renderResult("result23", `
      <p><strong>n = ${r.n}</strong>, <strong>h = ${fmt(r.h)} in</strong></p>
      <p>Trapecio: <strong>${fmt(r.trap)} in³/s</strong>, error = ${fmt(r.error_trap)}</p>
      <p>Simpson: <strong>${fmt(r.simpson)} in³/s</strong>, error = ${fmt(r.error_simpson)}</p>
      <p>Valor exacto: <strong>${fmt(r.exact)} in³/s</strong></p>
      ${tableHTML(r.table)}
    `);
    drawPlot("plot23", r.plot);
  } catch (err) { showError("result23", err); }
}

/* -------------------- Ejercicio 24 -------------------- */
async function run24() {
  try {
    const data = {
      b: Number($("ex24-b").value),
      n: Number($("ex24-n").value)
    };
    const r = await postJSON("/api/ex24", data);
    renderResult("result24", `
      <p><strong>n = ${r.n}</strong>, <strong>h = ${fmt(r.h)} rad</strong></p>
      <p>Trapecio: <strong>${fmt(r.trap)}</strong>, error = ${fmt(r.error_trap)}</p>
      <p>Simpson: <strong>${fmt(r.simpson)}</strong>, error = ${fmt(r.error_simpson)}</p>
      <p>Longitud exacta: <strong>${fmt(r.exact)}</strong></p>
      ${tableHTML(r.table)}
    `);
    drawPlot("plot24", r.plot);
  } catch (err) { showError("result24", err); }
}

/* -------------------- Ejercicio 25 -------------------- */
async function run25() {
  try {
    const data = {
      m: Number($("ex25-m").value),
      h: Number($("ex25-h").value),
      R: Number($("ex25-R").value),
      g0: Number($("ex25-g0").value),
      n: Number($("ex25-n").value)
    };
    const r = await postJSON("/api/ex25", data);
    renderResult("result25", `
      <p><strong>n = ${r.n}</strong>, <strong>h = ${fmt(r.h)} m</strong></p>
      <p>Trapecio: <strong>${fmt(r.trap)} J</strong></p>
      <p>Simpson: <strong>${fmt(r.simpson)} J</strong></p>
      <p>Valor exacto del modelo: <strong>${fmt(r.exact)} J</strong></p>
      <p>Aproximación \(mgh\) con \(g\) constante: ${fmt(r.constant_approx)} J</p>
      ${tableHTML(r.table)}
    `);
    drawPlot("plot25", r.plot);
  } catch (err) { showError("result25", err); }
}

/* -------------------- Ejercicio 26 -------------------- */
async function run26(formPrefix, resultId, plotId) {
  try {
    const data = {
      x: parseList($(`${formPrefix}-x`).value),
      w: parseList($(`${formPrefix}-w`).value),
      ref: Number($(`${formPrefix}-ref`).value)
    };
    const r = await postJSON("/api/ex26", data);
    renderResult(resultId, `
      <p><strong>n = ${r.n}</strong>, <strong>h = ${fmt(r.h)}</strong></p>
      <p>Trapecio: <strong>${fmt(r.area_trap)} u²</strong></p>
      <p>Simpson combinado: <strong>${fmt(r.area_simpson)} u²</strong></p>
      ${r.ref ? `<p>Referencia: ${fmt(r.ref)} u² · error trapecio = ${fmt(r.error_trap_vs_ref)} (${fmt(r.error_pct_trap_vs_ref)} %)</p>` : ""}
      ${tableHTML(r.table)}
    `);
    drawPlot(plotId, r.plot);
  } catch (err) { showError(resultId, err); }
}

/* -------------------- Ejercicio 27 -------------------- */
async function run27() {
  try {
    const data = {
      z: parseList($("ex27-z").value),
      d: parseList($("ex27-d").value)
    };
    const r = await postJSON("/api/ex27", data);
    renderResult("result27", `
      <p><strong>n = ${r.n}</strong>, <strong>h = ${fmt(r.h)} in</strong></p>
      <p>Volumen por trapecio: <strong>${fmt(r.vol_trap)} in³</strong></p>
      <p>Volumen por Simpson: <strong>${fmt(r.vol_simpson)} in³</strong></p>
      <p>Superficie simplificada \(2\pi\int r\,dz\): trapecio = ${fmt(r.surf_simple_trap)} in², Simpson = ${fmt(r.surf_simple_simpson)} in²</p>
      <p>Superficie geométrica \(2\pi\int r\sqrt{1+(r')^2}\,dz\): trapecio = ${fmt(r.surf_geom_trap)} in², Simpson = ${fmt(r.surf_geom_simpson)} in²</p>
      <p class="note">La fórmula simplificada no es el área superficial exacta de revolución; la geométrica incorpora la pendiente del perfil.</p>
      ${tableHTML(r.table)}
    `);
    drawPlot("plot27", r.plot);
  } catch (err) { showError("result27", err); }
}

/* -------------------- Eventos e inicio -------------------- */
document.addEventListener("DOMContentLoaded", () => {
  $("form19").addEventListener("submit", (e) => { e.preventDefault(); run19(); });
  $("form20").addEventListener("submit", (e) => { e.preventDefault(); run20(); });
  $("form21").addEventListener("submit", (e) => { e.preventDefault(); run21(); });
  $("form22").addEventListener("submit", (e) => { e.preventDefault(); run22(); });
  $("form23").addEventListener("submit", (e) => { e.preventDefault(); run23(); });
  $("form24").addEventListener("submit", (e) => { e.preventDefault(); run24(); });
  $("form25").addEventListener("submit", (e) => { e.preventDefault(); run25(); });

  $("form26erie").addEventListener("submit", (e) => {
    e.preventDefault();
    run26("ex26erie", "result26erie", "plot26erie");
  });
  $("form26titicaca").addEventListener("submit", (e) => {
    e.preventDefault();
    run26("ex26titicaca", "result26titicaca", "plot26titicaca");
  });

  $("form27").addEventListener("submit", (e) => { e.preventDefault(); run27(); });

  // Cálculo inicial con los datos cargados
  run19(); run20(); run21(); run22(); run23(); run24(); run25();
  run26("ex26erie", "result26erie", "plot26erie");
  run26("ex26titicaca", "result26titicaca", "plot26titicaca");
  run27();
});