const $ = (id) => document.getElementById(id);

function parseList(text) {
  return text.split(/[\s,;]+/).filter(Boolean).map(Number);
}

function fmt(value, digits = 6) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Number(value).toLocaleString("es-BO", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0
  });
}

function trapz(y, h) {
  let sum = 0;
  for (let i = 1; i < y.length - 1; i++) sum += y[i];
  return h * (0.5 * y[0] + 0.5 * y[y.length - 1] + sum);
}

function simpson13(y, h) {
  let n = y.length - 1;
  if (n < 2 || n % 2 !== 0) return null;
  let sum = y[0] + y[n];
  for (let i = 1; i < n; i++) sum += (i % 2 === 1 ? 4 : 2) * y[i];
  return (h / 3) * sum;
}

function simpson38(y, h) {
  let n = y.length - 1;
  if (n < 3 || n % 3 !== 0) return null;
  let sum = y[0] + y[n];
  for (let i = 1; i < n; i++) sum += (i % 3 !== 0 ? 3 : 2) * y[i];
  return (3 * h / 8) * sum;
}

function simpsonCombined(y, h) {
  let n = y.length - 1;
  if (n < 2) return null;
  if (n % 2 === 0) return simpson13(y, h);
  if (n % 3 === 0) return simpson38(y, h);
  for (let k = n - 3; k > 1; k -= 2) {
    if ((n - k) % 3 === 0) {
      let a = simpson13(y.slice(0, k + 1), h);
      let b = simpson38(y.slice(k), h);
      if (a !== null && b !== null) return a + b;
    }
  }
  return null;
}

function generateTable(x, y, h, xname="x", yname="y") {
  let html = `<div class="table-wrap"><table><thead><tr><th>i</th><th>${xname}</th><th>${yname}</th><th>Peso Trap</th></tr></thead><tbody>`;
  for (let i = 0; i < x.length; i++) {
    let w = (i === 0 || i === x.length - 1) ? h / 2 : h;
    html += `<tr><td>${i}</td><td>${fmt(x[i])}</td><td>${fmt(y[i])}</td><td>${fmt(w)}</td></tr>`;
  }
  html += `</tbody></table></div>`;
  return html;
}

function renderResult(id, html) {
  const el = $(id);
  el.innerHTML = html;
  if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([el]).catch(() => {});
}

function drawPlot(id, traces, layoutTitle, xTitle, yTitle) {
  const el = $(id);
  Plotly.newPlot(el, traces, {
    title: layoutTitle,
    xaxis: { title: xTitle },
    yaxis: { title: yTitle },
    margin: { t: 40, b: 40, l: 50, r: 20 }
  }, { responsive: true, displaylogo: false });
}

// ==========================================
// EJERCICIOS
// ==========================================

function run19() {
  try {
    const t = parseList($("ex19-t").value);
    const v = parseList($("ex19-v").value);
    if (t.length !== v.length || t.length < 2) throw new Error("Datos inválidos.");
    const h = (t[t.length - 1] - t[0]) / (t.length - 1);
    
    const trap_val = trapz(v, h) / 3600;
    const simp_val = simpsonCombined(v, h) / 3600;

    renderResult("result19", `
      <p><strong>n = ${t.length - 1}</strong>, <strong>h = ${fmt(h)} s</strong></p>
      <p>Trapecio: <strong>${fmt(trap_val)} mi</strong></p>
      <p>Simpson: <strong>${fmt(simp_val)} mi</strong></p>
      ${generateTable(t, v, h, "t (s)", "v (mi/h)")}
    `);
    drawPlot("plot19", [{ x: t, y: v, type: "scatter", mode: "lines+markers", fill: "tozeroy" }], "Ejercicio 19", "t (s)", "v (mi/h)");
  } catch (err) { renderResult("result19", `<p class="error">${err.message}</p>`); }
}

function run20() {
  try {
    const x = parseList($("ex20-x").value);
    const f = parseList($("ex20-F").value);
    if (x.length !== f.length || x.length < 2) throw new Error("Datos inválidos.");
    const h = (x[x.length - 1] - x[0]) / (x.length - 1);
    
    const trap_lbin = trapz(f, h);
    const simp_lbin = simpsonCombined(f, h);
    const J = 0.112984829;

    renderResult("result20", `
      <p><strong>n = ${x.length - 1}</strong>, <strong>h = ${fmt(h)} in</strong></p>
      <p>Trapecio: <strong>${fmt(trap_lbin)} lb·in</strong> = ${fmt(trap_lbin * J)} J</p>
      <p>Simpson: <strong>${fmt(simp_lbin)} lb·in</strong> = ${fmt(simp_lbin * J)} J</p>
      ${generateTable(x, f, h, "x (in)", "F (lb)")}
    `);
    drawPlot("plot20", [{ x: x, y: f, type: "scatter", mode: "lines+markers", fill: "tozeroy" }], "Ejercicio 20", "x (in)", "F (lb)");
  } catch (err) { renderResult("result20", `<p class="error">${err.message}</p>`); }
}

function run21() {
  try {
    const x = parseList($("ex21-x").value);
    const y = parseList($("ex21-y").value);
    if (x.length !== y.length || x.length < 2) throw new Error("Datos inválidos.");
    const h = (x[x.length - 1] - x[0]) / (x.length - 1);
    
    const trap = trapz(y, h);
    const simp = simpsonCombined(y, h);

    renderResult("result21", `
      <p><strong>n = ${x.length - 1}</strong>, <strong>h = ${fmt(h)}</strong></p>
      <p>Trapecio: <strong>${fmt(trap)} u²</strong></p>
      <p>Simpson: <strong>${fmt(simp)} u²</strong></p>
      ${generateTable(x, y, h)}
    `);
    drawPlot("plot21", [{ x: x, y: y, type: "scatter", mode: "lines+markers", fill: "tozeroy" }], "Ejercicio 21", "x", "y");
  } catch (err) { renderResult("result21", `<p class="error">${err.message}</p>`); }
}

function run22() {
  try {
    const a = Number($("ex22-a").value);
    const x0 = Number($("ex22-x0").value);
    const x1 = Number($("ex22-x1").value);
    const n = Number($("ex22-n").value);
    const h = (x1 - x0) / n;

    let x_arr = [], y_arr = [], f_arr = [];
    for (let i = 0; i <= n; i++) {
      let xi = x0 + i * h;
      x_arr.push(xi);
      y_arr.push(a * Math.cosh(xi / a));
      f_arr.push(Math.cosh(xi / a));
    }

    const trap = trapz(f_arr, h);
    const simp = simpsonCombined(f_arr, h);
    const exact = a * (Math.sinh(x1 / a) - Math.sinh(x0 / a));

    renderResult("result22", `
      <p><strong>n = ${n}</strong>, <strong>h = ${fmt(h)}</strong></p>
      <p>Trapecio: <strong>${fmt(trap)}</strong> (error: ${fmt(Math.abs(exact - trap))})</p>
      <p>Simpson: <strong>${fmt(simp)}</strong> (error: ${fmt(Math.abs(exact - simp))})</p>
      <p>Exacto: <strong>${fmt(exact)}</strong></p>
      ${generateTable(x_arr, f_arr, h, "x", "cosh(x/a)")}
    `);
    drawPlot("plot22", [{ x: x_arr, y: y_arr, type: "scatter", mode: "lines+markers" }], "Ejercicio 22 (Catenaria)", "x", "y");
  } catch (err) { renderResult("result22", `<p class="error">${err.message}</p>`); }
}

function run23() {
  try {
    const R = Number($("ex23-R").value);
    const vmax = Number($("ex23-vmax").value);
    const n = Number($("ex23-n").value);
    const h = R / n;

    let r_arr = [], v_arr = [], f_arr = [];
    for (let i = 0; i <= n; i++) {
      let ri = i * h;
      r_arr.push(ri);
      let vi = vmax * Math.pow(Math.max(0, 1 - ri/R), 1/7);
      v_arr.push(vi);
      f_arr.push(2 * Math.PI * ri * vi);
    }

    const trap = trapz(f_arr, h);
    const simp = simpsonCombined(f_arr, h);
    const exact = 49 * Math.PI / 12;

    renderResult("result23", `
      <p><strong>n = ${n}</strong>, <strong>h = ${fmt(h)}</strong></p>
      <p>Trapecio: <strong>${fmt(trap)}</strong></p>
      <p>Simpson: <strong>${fmt(simp)}</strong></p>
      <p>Exacto: <strong>${fmt(exact)}</strong></p>
      ${generateTable(r_arr, v_arr, h, "r", "v(r)")}
    `);
    drawPlot("plot23", [{ x: r_arr, y: v_arr, type: "scatter", mode: "lines+markers", fill: "tozeroy" }], "Ejercicio 23", "r", "v(r)");
  } catch (err) { renderResult("result23", `<p class="error">${err.message}</p>`); }
}

function run24() {
  try {
    const b = Number($("ex24-b").value);
    const n = Number($("ex24-n").value);
    const h = (2 * Math.PI) / n;

    let t_arr = [], x_arr = [], y_arr = [], f_arr = [];
    for (let i = 0; i <= n; i++) {
      let ti = i * h;
      t_arr.push(ti);
      let xi = 2*b*Math.cos(ti) - b*Math.cos(2*ti);
      let yi = 2*b*Math.sin(ti) - b*Math.sin(2*ti);
      x_arr.push(xi);
      y_arr.push(yi);
      let dx = -2*b*Math.sin(ti) + 2*b*Math.sin(2*ti);
      let dy = 2*b*Math.cos(ti) - 2*b*Math.cos(2*ti);
      f_arr.push(Math.sqrt(dx*dx + dy*dy));
    }

    const trap = trapz(f_arr, h);
    const simp = simpsonCombined(f_arr, h);
    const exact = 16 * b;

    renderResult("result24", `
      <p><strong>n = ${n}</strong>, <strong>h = ${fmt(h)}</strong></p>
      <p>Trapecio: <strong>${fmt(trap)}</strong></p>
      <p>Simpson: <strong>${fmt(simp)}</strong></p>
      <p>Exacto: <strong>${fmt(exact)}</strong></p>
      ${generateTable(t_arr, f_arr, h, "t", "Rapidez")}
    `);
    drawPlot("plot24", [{ x: x_arr, y: y_arr, type: "scatter", mode: "lines" }], "Ejercicio 24 (Cardioide)", "x(t)", "y(t)");
  } catch (err) { renderResult("result24", `<p class="error">${err.message}</p>`); }
}

function run25() {
  try {
    const m = Number($("ex25-m").value);
    const h_alt = Number($("ex25-h").value);
    const R = Number($("ex25-R").value);
    const g0 = Number($("ex25-g0").value);
    const n = Number($("ex25-n").value);
    const h = h_alt / n;

    let y_arr = [], g_arr = [], f_arr = [];
    for (let i = 0; i <= n; i++) {
      let yi = i * h;
      y_arr.push(yi);
      let gi = g0 * R * R / Math.pow(R + yi, 2);
      g_arr.push(gi);
      f_arr.push(gi);
    }

    const trap = trapz(f_arr, h) * m;
    const simp = simpsonCombined(f_arr, h) * m;
    const exact = m * g0 * R * h_alt / (R + h_alt);
    const simple = m * g0 * h_alt;

    renderResult("result25", `
      <p><strong>n = ${n}</strong>, <strong>h = ${fmt(h)}</strong></p>
      <p>Trapecio: <strong>${fmt(trap)} J</strong></p>
      <p>Simpson: <strong>${fmt(simp)} J</strong></p>
      <p>Exacto: <strong>${fmt(exact)} J</strong></p>
      ${generateTable(y_arr, g_arr, h, "y", "g(y)")}
    `);
    drawPlot("plot25", [{ x: y_arr, y: g_arr, type: "scatter", mode: "lines+markers", fill: "tozeroy" }], "Ejercicio 25", "y (m)", "g(y)");
  } catch (err) { renderResult("result25", `<p class="error">${err.message}</p>`); }
}

function run26(prefix, resultId, plotId) {
  try {
    const x = parseList($(`${prefix}-x`).value);
    const w = parseList($(`${prefix}-w`).value);
    const ref = Number($(`${prefix}-ref`).value);
    if (x.length !== w.length || x.length < 2) throw new Error("Datos inválidos.");
    const h = (x[x.length - 1] - x[0]) / (x.length - 1);

    const trap = trapz(w, h);
    const simp = simpsonCombined(w, h);

    renderResult(resultId, `
      <p><strong>n = ${x.length - 1}</strong>, <strong>h = ${fmt(h)}</strong></p>
      <p>Trapecio: <strong>${fmt(trap)} u²</strong></p>
      <p>Simpson: <strong>${fmt(simp)} u²</strong></p>
      ${generateTable(x, w, h, "x", "Ancho")}
    `);
    drawPlot(plotId, [{ x: x, y: w, type: "scatter", mode: "lines+markers", fill: "tozeroy" }], "Ejercicio 26", "x", "Ancho");
  } catch (err) { renderResult(resultId, `<p class="error">${err.message}</p>`); }
}

function run27() {
  try {
    const z = parseList($("ex27-z").value);
    const d = parseList($("ex27-d").value);
    if (z.length !== d.length || z.length < 2) throw new Error("Datos inválidos.");
    const h = (z[z.length - 1] - z[0]) / (z.length - 1);

    let r = d.map(val => val / 2);
    let r2 = r.map(val => val * val);
    
    const volTrap = Math.PI * trapz(r2, h);
    const volSimp = Math.PI * simpsonCombined(r2, h);

    renderResult("result27", `
      <p><strong>n = ${z.length - 1}</strong>, <strong>h = ${fmt(h)}</strong></p>
      <p>Volumen Trapecio: <strong>${fmt(volTrap)} in³</strong></p>
      <p>Volumen Simpson: <strong>${fmt(volSimp)} in³</strong></p>
      ${generateTable(z, r, h, "z", "r(z)")}
    `);
    drawPlot("plot27", [{ x: z, y: r, type: "scatter", mode: "lines+markers", fill: "tozeroy" }], "Ejercicio 27", "z", "r(z)");
  } catch (err) { renderResult("result27", `<p class="error">${err.message}</p>`); }
}

document.addEventListener("DOMContentLoaded", () => {
  $("form19").addEventListener("submit", (e) => { e.preventDefault(); run19(); });
  $("form20").addEventListener("submit", (e) => { e.preventDefault(); run20(); });
  $("form21").addEventListener("submit", (e) => { e.preventDefault(); run21(); });
  $("form22").addEventListener("submit", (e) => { e.preventDefault(); run22(); });
  $("form23").addEventListener("submit", (e) => { e.preventDefault(); run23(); });
  $("form24").addEventListener("submit", (e) => { e.preventDefault(); run24(); });
  $("form25").addEventListener("submit", (e) => { e.preventDefault(); run25(); });
  $("form26erie").addEventListener("submit", (e) => { e.preventDefault(); run26("ex26erie", "result26erie", "plot26erie"); });
  $("form26titicaca").addEventListener("submit", (e) => { e.preventDefault(); run26("ex26titicaca", "result26titicaca", "plot26titicaca"); });
  $("form27").addEventListener("submit", (e) => { e.preventDefault(); run27(); });

  run19(); run20(); run21(); run22(); run23(); run24(); run25();
  run26("ex26erie", "result26erie", "plot26erie");
  run26("ex26titicaca", "result26titicaca", "plot26titicaca");
  run27();
});