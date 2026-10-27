import math
import functools
import numpy as np
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder="static", static_url_path="")

# ---------------------------------------------------------------------------
# Métodos de integración numérica
# ---------------------------------------------------------------------------

def trapz(y, h):
    y = np.asarray(y, dtype=float)
    return h * (0.5 * y[0] + 0.5 * y[-1] + np.sum(y[1:-1]))


def simpson13(y, h):
    y = np.asarray(y, dtype=float)
    n = len(y) - 1
    if n < 2 or n % 2 != 0:
        return None
    s = y[0] + y[-1]
    for i in range(1, n):
        s += (4 if i % 2 == 1 else 2) * y[i]
    return h * s / 3.0


def simpson38(y, h):
    y = np.asarray(y, dtype=float)
    n = len(y) - 1
    if n < 3 or n % 3 != 0:
        return None
    s = y[0] + y[-1]
    for i in range(1, n):
        s += (3 if i % 3 != 0 else 2) * y[i]
    return 3.0 * h * s / 8.0


def simpson_combined(y, h):
    """
    Simpson combinado:
    - n par: Simpson 1/3 en todo el intervalo.
    - n múltiplo de 3: Simpson 3/8 en todo el intervalo.
    - otro n: se busca un bloque inicial par para 1/3 y un bloque final
      múltiplo de 3 para 3/8. Ejemplo n=7 -> 4+3; n=11 -> 8+3.
    """
    y = np.asarray(y, dtype=float)
    n = len(y) - 1
    if n < 2:
        return None
    if n % 2 == 0:
        return simpson13(y, h)
    if n % 3 == 0:
        return simpson38(y, h)
    for k in range(n - 3, 1, -2):
        if (n - k) % 3 == 0:
            a = simpson13(y[:k + 1], h)
            b = simpson38(y[k:], h)
            if a is not None and b is not None:
                return a + b
    return None


def trap_weights(n, h):
    w = np.full(n + 1, h, dtype=float)
    w[0] = h / 2.0
    w[-1] = h / 2.0
    return w


def s13_weights(n, h):
    if n < 2 or n % 2 != 0:
        return None
    w = np.ones(n + 1, dtype=float)
    for i in range(1, n):
        w[i] = 4.0 if i % 2 == 1 else 2.0
    return w * h / 3.0


def s38_weights(n, h):
    if n < 3 or n % 3 != 0:
        return None
    w = np.ones(n + 1, dtype=float)
    for i in range(1, n):
        w[i] = 2.0 if i % 3 == 0 else 3.0
    return w * 3.0 * h / 8.0


def combined_weights(n, h):
    if n % 2 == 0:
        return s13_weights(n, h)
    if n % 3 == 0:
        return s38_weights(n, h)
    for k in range(n - 3, 1, -2):
        if (n - k) % 3 == 0:
            w1 = s13_weights(k, h)
            w2 = s38_weights(n - k, h)
            if w1 is not None and w2 is not None:
                w = np.zeros(n + 1, dtype=float)
                w[:k + 1] += w1
                w[k:] += w2
                return w
    return None


def api_route(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            return fn(*args, **kwargs)
        except Exception as e:
            return jsonify({"error": str(e)}), 400
    return wrapper


def json_data():
    return request.get_json(force=True, silent=True) or {}


def parse_tabular(data, xkey="x", ykey="y"):
    if xkey not in data or ykey not in data:
        raise ValueError(f"Faltan los datos '{xkey}' o '{ykey}'.")
    x = np.asarray(data[xkey], dtype=float)
    y = np.asarray(data[ykey], dtype=float)
    if len(x) != len(y):
        raise ValueError("Las listas x e y deben tener la misma longitud.")
    if len(x) < 2:
        raise ValueError("Se necesitan al menos dos puntos.")
    if not np.all(np.isfinite(x)) or not np.all(np.isfinite(y)):
        raise ValueError("Los datos deben ser numéricos y finitos.")
    if np.any(np.diff(x) <= 0):
        raise ValueError("Los valores de x deben ser estrictamente crecientes.")
    h = (x[-1] - x[0]) / (len(x) - 1)
    if not np.allclose(np.diff(x), h, rtol=1e-9, atol=1e-9):
        raise ValueError("Los nodos deben estar igualmente espaciados.")
    return x, y, h


def tabular_payload(x, y, h, xname="x", yname="y"):
    n = len(x) - 1
    t = float(trapz(y, h))
    s = simpson_combined(y, h)
    s = float(s) if s is not None else None
    wt = trap_weights(n, h)
    ws = combined_weights(n, h)

    rows = []
    for i in range(n + 1):
        rows.append([
            i,
            float(x[i]),
            float(y[i]),
            float(wt[i]),
            None if ws is None else float(ws[i])
        ])

    table = {
        "columns": ["i", xname, yname, "peso trapecio", "peso Simpson"],
        "rows": rows
    }
    return {"n": n, "h": float(h), "trap": t, "simpson": s, "table": table}


# ---------------------------------------------------------------------------
# Ejercicio 19
# ---------------------------------------------------------------------------
@app.post("/api/ex19")
@api_route
def ex19():
    data = json_data()
    t = np.asarray(data.get("t", [0, 1, 2, 3, 4, 5, 6, 7]), dtype=float)
    v = np.asarray(data.get("v", [0, 14, 39, 69, 95, 114, 129, 139]), dtype=float)
    if len(t) != len(v):
        raise ValueError("Las listas de tiempo y velocidad deben tener igual longitud.")
    if np.any(np.diff(t) <= 0):
        raise ValueError("Los tiempos deben ser crecientes.")
    h = (t[-1] - t[0]) / (len(t) - 1)
    if not np.allclose(np.diff(t), h):
        raise ValueError("Los tiempos deben estar igualmente espaciados.")

    base = tabular_payload(t, v, h, "t (s)", "v (mi/h)")
    trap_mi = base["trap"] / 3600.0
    simpson_mi = base["simpson"] / 3600.0 if base["simpson"] is not None else None
    base.update({
        "trap_mi": trap_mi,
        "simpson_mi": simpson_mi,
        "trap_m": trap_mi * 1609.344,
        "simpson_m": None if simpson_mi is None else simpson_mi * 1609.344,
        "plot": {
            "traces": [{
                "x": t.tolist(), "y": v.tolist(),
                "type": "scatter", "mode": "lines+markers",
                "fill": "tozeroy", "name": "v(t)"
            }],
            "layout": {
                "title": "Ejercicio 19: velocidad vs tiempo",
                "xaxis": {"title": "t (s)"},
                "yaxis": {"title": "v (mi/h)"}
            }
        }
    })
    return jsonify(base)


# ---------------------------------------------------------------------------
# Ejercicio 20
# ---------------------------------------------------------------------------
@app.post("/api/ex20")
@api_route
def ex20():
    data = json_data()
    x = np.asarray(data.get("x", [0, 0.4, 0.8, 1.2, 1.6, 2.0, 2.4, 2.8]), dtype=float)
    f = np.asarray(data.get("F", [0, 0.85, 1.30, 1.60, 1.87, 2.14, 2.34, 2.52]), dtype=float)
    if len(x) != len(f):
        raise ValueError("Las listas x y F deben tener igual longitud.")
    if np.any(np.diff(x) <= 0):
        raise ValueError("Los desplazamientos deben ser crecientes.")
    h = (x[-1] - x[0]) / (len(x) - 1)
    if not np.allclose(np.diff(x), h):
        raise ValueError("Los desplazamientos deben estar igualmente espaciados.")

    base = tabular_payload(x, f, h, "x (in)", "F (lb)")
    J = 0.112984829
    base.update({
        "trap_lbin": base["trap"],
        "simpson_lbin": base["simpson"],
        "trap_J": base["trap"] * J,
        "simpson_J": None if base["simpson"] is None else base["simpson"] * J,
        "plot": {
            "traces": [{
                "x": x.tolist(), "y": f.tolist(),
                "type": "scatter", "mode": "lines+markers",
                "fill": "tozeroy", "name": "F(x)"
            }],
            "layout": {
                "title": "Ejercicio 20: fuerza vs desplazamiento",
                "xaxis": {"title": "x (in)"},
                "yaxis": {"title": "F (lb)"}
            }
        }
    })
    return jsonify(base)


# ---------------------------------------------------------------------------
# Ejercicio 21
# ---------------------------------------------------------------------------
@app.post("/api/ex21")
@api_route
def ex21():
    data = json_data()
    x = np.asarray(data.get("x", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), dtype=float)
    y = np.asarray(data.get("y", [1.3, 3.7, 4.6, 4.4, 2.7, 2.5, 3.6, 5.3, 6.0, 5.9]), dtype=float)
    _, _, h = parse_tabular({"x": x.tolist(), "y": y.tolist()})
    base = tabular_payload(x, y, h, "x", "y aprox.")
    base.update({
        "plot": {
            "traces": [{
                "x": x.tolist(), "y": y.tolist(),
                "type": "scatter", "mode": "lines+markers",
                "fill": "tozeroy", "name": "perfil"
            }],
            "layout": {
                "title": "Ejercicio 21: perfil topográfico",
                "xaxis": {"title": "x"},
                "yaxis": {"title": "altura y"}
            }
        }
    })
    return jsonify(base)


# ---------------------------------------------------------------------------
# Ejercicio 22
# ---------------------------------------------------------------------------
@app.post("/api/ex22")
@api_route
def ex22():
    data = json_data()
    a = float(data.get("a", 24.0))
    x0 = float(data.get("x0", -12.0))
    x1 = float(data.get("x1", 26.0))
    n = int(data.get("n", 8))
    if a <= 0:
        raise ValueError("a debe ser positivo.")
    if x1 <= x0:
        raise ValueError("x1 debe ser mayor que x0.")
    if n < 1:
        raise ValueError("n debe ser al menos 1.")

    x = np.linspace(x0, x1, n + 1)
    integrand = np.cosh(x / a)
    h = (x1 - x0) / n
    trap = float(trapz(integrand, h))
    simp = simpson_combined(integrand, h)
    simp = float(simp) if simp is not None else None
    exact = a * (math.sinh(x1 / a) - math.sinh(x0 / a))

    wt = trap_weights(n, h)
    ws = combined_weights(n, h)
    rows = []
    for i in range(n + 1):
        rows.append([
            i, float(x[i]), float(integrand[i]), float(wt[i]),
            None if ws is None else float(ws[i])
        ])

    xs = np.linspace(x0, x1, 300)
    ys = a * np.cosh(xs / a)
    plot = {
        "traces": [
            {"x": xs.tolist(), "y": ys.tolist(), "type": "scatter",
             "mode": "lines", "name": "catenaria"},
            {"x": [x0, x1], "y": [a * math.cosh(x0 / a), a * math.cosh(x1 / a)],
             "type": "scatter", "mode": "markers", "name": "apoyos"}
        ],
        "layout": {
            "title": "Ejercicio 22: catenaria",
            "xaxis": {"title": "x (ft)"},
            "yaxis": {"title": "y (ft)"}
        }
    }

    return jsonify({
        "n": n, "h": h, "trap": trap, "simpson": simp, "exact": exact,
        "error_trap": abs(exact - trap),
        "error_simpson": None if simp is None else abs(exact - simp),
        "table": {"columns": ["i", "x", "cosh(x/a)", "peso trapecio", "peso Simpson"], "rows": rows},
        "plot": plot
    })


# ---------------------------------------------------------------------------
# Ejercicio 23
# ---------------------------------------------------------------------------
@app.post("/api/ex23")
@api_route
def ex23():
    data = json_data()
    R = float(data.get("R", 0.25))
    vmax = float(data.get("vmax", 80.0))
    n = int(data.get("n", 8))
    p = 1.0 / 7.0
    if R <= 0 or vmax <= 0:
        raise ValueError("R y vmax deben ser positivos.")
    if n < 2:
        raise ValueError("n debe ser al menos 2.")

    r = np.linspace(0, R, n + 1)
    v = vmax * np.maximum(0.0, 1.0 - r / R) ** p
    integrand = 2.0 * math.pi * r * v
    h = R / n
    trap = float(trapz(integrand, h))
    simp = simpson_combined(integrand, h)
    simp = float(simp) if simp is not None else None
    exact = 2.0 * math.pi * vmax * R * R * (1.0 / (1.0 + p) - 1.0 / (2.0 + p))

    wt = trap_weights(n, h)
    ws = combined_weights(n, h)
    rows = []
    for i in range(n + 1):
        rows.append([
            i, float(r[i]), float(v[i]), float(integrand[i]),
            float(wt[i]), None if ws is None else float(ws[i])
        ])

    return jsonify({
        "n": n, "h": h, "trap": trap, "simpson": simp, "exact": exact,
        "error_trap": abs(exact - trap),
        "error_simpson": None if simp is None else abs(exact - simp),
        "table": {
            "columns": ["i", "r", "v(r)", "2πr v(r)", "peso trapecio", "peso Simpson"],
            "rows": rows
        },
        "plot": {
            "traces": [{
                "x": r.tolist(), "y": v.tolist(),
                "type": "scatter", "mode": "lines+markers",
                "name": "v(r)"
            }],
            "layout": {
                "title": "Ejercicio 23: perfil turbulento de velocidad",
                "xaxis": {"title": "r (in)"},
                "yaxis": {"title": "v (in/s)"}
            }
        }
    })


# ---------------------------------------------------------------------------
# Ejercicio 24
# ---------------------------------------------------------------------------
@app.post("/api/ex24")
@api_route
def ex24():
    data = json_data()
    b = float(data.get("b", 5.0))
    n = int(data.get("n", 8))
    if b <= 0:
        raise ValueError("b debe ser positivo.")
    if n < 2:
        raise ValueError("n debe ser al menos 2.")

    t = np.linspace(0, 2.0 * math.pi, n + 1)
    x = 2.0 * b * np.cos(t) - b * np.cos(2.0 * t)
    y = 2.0 * b * np.sin(t) - b * np.sin(2.0 * t)
    dx = -2.0 * b * np.sin(t) + 2.0 * b * np.sin(2.0 * t)
    dy = 2.0 * b * np.cos(t) - 2.0 * b * np.cos(2.0 * t)
    speed = np.sqrt(dx ** 2 + dy ** 2)
    h = (t[-1] - t[0]) / n
    trap = float(trapz(speed, h))
    simp = simpson_combined(speed, h)
    simp = float(simp) if simp is not None else None
    exact = 16.0 * b

    wt = trap_weights(n, h)
    ws = combined_weights(n, h)
    rows = []
    for i in range(n + 1):
        rows.append([
            i, float(t[i]), float(x[i]), float(y[i]), float(speed[i]),
            float(wt[i]), None if ws is None else float(ws[i])
        ])

    return jsonify({
        "n": n, "h": h, "trap": trap, "simpson": simp, "exact": exact,
        "error_trap": abs(exact - trap),
        "error_simpson": None if simp is None else abs(exact - simp),
        "table": {
            "columns": ["i", "t", "x(t)", "y(t)", "rapidez", "peso trapecio", "peso Simpson"],
            "rows": rows
        },
        "plot": {
            "traces": [{
                "x": x.tolist(), "y": y.tolist(),
                "type": "scatter", "mode": "lines",
                "name": "cardioide"
            }],
            "layout": {
                "title": "Ejercicio 24: cardioide paramétrica",
                "xaxis": {"title": "x(t)"},
                "yaxis": {"title": "y(t)"},
                "yaxis.scaleanchor": "x"
            }
        }
    })


# ---------------------------------------------------------------------------
# Ejercicio 25
# ---------------------------------------------------------------------------
@app.post("/api/ex25")
@api_route
def ex25():
    data = json_data()
    m = float(data.get("m", 500.0))
    h_alt = float(data.get("h", 800000.0))
    n = int(data.get("n", 8))
    R = float(data.get("R", 6371000.0))
    g0 = float(data.get("g0", 9.81))
    if m <= 0 or h_alt <= 0 or R <= 0 or n < 2:
        raise ValueError("m, h, R deben ser positivos y n >= 2.")

    y = np.linspace(0, h_alt, n + 1)
    g = g0 * R ** 2 / (R + y) ** 2
    integrand = g
    h = h_alt / n
    trap = float(trapz(integrand, h)) * m
    simp = simpson_combined(integrand, h)
    simp = float(simp) * m if simp is not None else None
    exact = m * g0 * R * h_alt / (R + h_alt)
    constant_approx = m * g0 * h_alt

    wt = trap_weights(n, h)
    ws = combined_weights(n, h)
    rows = []
    for i in range(n + 1):
        rows.append([
            i, float(y[i]), float(g[i]), float(integrand[i]),
            float(wt[i]), None if ws is None else float(ws[i])
        ])

    return jsonify({
        "n": n, "h": h, "trap": trap, "simpson": simp, "exact": exact,
        "constant_approx": constant_approx,
        "error_trap": abs(exact - trap),
        "error_simpson": None if simp is None else abs(exact - simp),
        "table": {
            "columns": ["i", "y (m)", "g(y) (m/s²)", "integrando", "peso trapecio", "peso Simpson"],
            "rows": rows
        },
        "plot": {
            "traces": [{
                "x": y.tolist(), "y": g.tolist(),
                "type": "scatter", "mode": "lines+markers",
                "fill": "tozeroy", "name": "g(y)"
            }],
            "layout": {
                "title": "Ejercicio 25: gravedad vs altura",
                "xaxis": {"title": "y (m)"},
                "yaxis": {"title": "g(y) (m/s²)"}
            }
        }
    })


# ---------------------------------------------------------------------------
# Ejercicio 26
# ---------------------------------------------------------------------------
@app.post("/api/ex26")
@api_route
def ex26():
    data = json_data()
    x = np.asarray(data.get("x", [40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260]), dtype=float)
    w = np.asarray(data.get("w", [8, 20, 40, 55, 65, 66, 63, 65, 55, 40, 20, 8]), dtype=float)
    ref = data.get("ref", 9940.0)
    _, _, h = parse_tabular({"x": x.tolist(), "w": w.tolist()})
    base = tabular_payload(x, w, h, "x (mi)", "ancho w (mi)")
    area_trap = base["trap"]
    area_simp = base["simpson"]
    error = None
    error_pct = None
    if ref is not None:
        try:
            ref = float(ref)
            if ref != 0 and area_trap is not None:
                error = abs(area_trap - ref)
                error_pct = 100.0 * error / abs(ref)
        except Exception:
            ref = None
    base.update({
        "area_trap": area_trap,
        "area_simpson": area_simp,
        "ref": ref,
        "error_trap_vs_ref": error,
        "error_pct_trap_vs_ref": error_pct,
        "plot": {
            "traces": [{
                "x": x.tolist(), "y": w.tolist(),
                "type": "scatter", "mode": "lines+markers",
                "fill": "tozeroy", "name": "ancho"
            }],
            "layout": {
                "title": "Ejercicio 26: anchuras vs posición",
                "xaxis": {"title": "x"},
                "yaxis": {"title": "ancho"}
            }
        }
    })
    return jsonify(base)


# ---------------------------------------------------------------------------
# Ejercicio 27
# ---------------------------------------------------------------------------
@app.post("/api/ex27")
@api_route
def ex27():
    data = json_data()
    z = np.asarray(data.get("z", list(range(13))), dtype=float)
    d = np.asarray(data.get("d", [0, 2.6, 3.2, 4.8, 5.6, 6.0, 6.2, 6.0, 5.6, 4.8, 3.3, 2.6, 0]), dtype=float)
    if len(z) != len(d):
        raise ValueError("Las listas z y d deben tener igual longitud.")
    if len(z) < 2:
        raise ValueError("Se necesitan al menos dos puntos.")
    if np.any(np.diff(z) <= 0):
        raise ValueError("z debe ser creciente.")
    h = (z[-1] - z[0]) / (len(z) - 1)
    if not np.allclose(np.diff(z), h):
        raise ValueError("Los valores de z deben estar igualmente espaciados.")

    r = d / 2.0
    n = len(z) - 1
    vol_trap = math.pi * float(trapz(r ** 2, h))
    vol_simp = math.pi * simpson_combined(r ** 2, h)
    vol_simp = float(vol_simp) if vol_simp is not None else None

    surf_simple_trap = 2.0 * math.pi * float(trapz(r, h))
    surf_simple_simp = 2.0 * math.pi * simpson_combined(r, h)
    surf_simple_simp = float(surf_simple_simp) if surf_simple_simp is not None else None

    dr = np.gradient(r, z)
    geom_integrand = 2.0 * math.pi * r * np.sqrt(1.0 + dr ** 2)
    surf_geom_trap = float(trapz(geom_integrand, h))
    surf_geom_simp = simpson_combined(geom_integrand, h)
    surf_geom_simp = float(surf_geom_simp) if surf_geom_simp is not None else None

    wt = trap_weights(n, h)
    ws = combined_weights(n, h)
    rows = []
    for i in range(n + 1):
        rows.append([
            i, float(z[i]), float(d[i]), float(r[i]),
            float(wt[i]), None if ws is None else float(ws[i])
        ])

    return jsonify({
        "n": n, "h": h,
        "vol_trap": vol_trap, "vol_simpson": vol_simp,
        "surf_simple_trap": surf_simple_trap,
        "surf_simple_simpson": surf_simple_simp,
        "surf_geom_trap": surf_geom_trap,
        "surf_geom_simpson": surf_geom_simp,
        "table": {
            "columns": ["i", "z (in)", "d (in)", "r=d/2 (in)", "peso trapecio", "peso Simpson"],
            "rows": rows
        },
        "plot": {
            "traces": [{
                "x": z.tolist(), "y": r.tolist(),
                "type": "scatter", "mode": "lines+markers",
                "fill": "tozeroy", "name": "r(z)"
            }],
            "layout": {
                "title": "Ejercicio 27: perfil del objeto",
                "xaxis": {"title": "z (in)"},
                "yaxis": {"title": "r(z) (in)"}
            }
        }
    })


@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)