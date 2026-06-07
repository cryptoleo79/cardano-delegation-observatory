/*
 * charts.js — CDLChart (Cardano Delegation Observatory shared charts)
 * --------------------------------------------------------------------
 * Zero dependencies. No CDNs. No frameworks. Pure vanilla JS rendering
 * inline SVG. Safe to load as a plain browser <script>.
 *
 * Exposes a single global: window.CDLChart
 *
 *   CDLChart.line(el, points, opts)
 *     points : [{ t, v }]   t = epoch-seconds (number) OR a label string
 *                            v = number (null/undefined values are skipped)
 *     Renders an accent polyline with light gridlines and
 *     min / max / last value labels. X axis follows array order.
 *
 *   CDLChart.candles(el, candles, opts)
 *     candles: [{ ts, o, h, l, c }]   ts = epoch seconds
 *     Standard candlesticks: green up (#1d6b46) / red down (#963232),
 *     time axis ticks + price axis min/max.
 *
 *   CDLChart.bars(el, items, opts)
 *     items  : [{ label, value }]   horizontal accent bars, value labels,
 *                                    drawn in the order given.
 *
 * Common opts (all optional):
 *   { height = 240, valueFormat = (v)=>string, title = undefined }
 *
 * Robustness contract (all three methods):
 *   - `el` may be a DOM element OR an element id string; null/missing -> no-op.
 *   - Clears the container before rendering.
 *   - Empty / null data -> centered muted "no data" message.
 *   - Handles a single data point and null numeric values gracefully.
 *   - SVG is responsive: width 100% of container, fixed pixel height.
 *
 * Theme: reads CSS custom properties from :root (set in style.css),
 *   falling back to the documented hex values.
 *
 * Self-test (browser console):
 *   CDLChart.line('myDiv', [{t:1,v:3},{t:2,v:7},{t:3,v:5}]);
 *   CDLChart.bars('myDiv', [{label:'a',value:10},{label:'b',value:4}]);
 *   CDLChart.candles('myDiv', [{ts:1,o:1,h:2,l:0.5,c:1.5}]);
 *   CDLChart.line('myDiv', []);   // -> "no data"
 */
(function (global) {
  'use strict';

  var SVGNS = 'http://www.w3.org/2000/svg';

  // ---- theme -------------------------------------------------------------
  // Resolve a CSS var from :root, falling back to a documented default.
  function cssVar(name, fallback) {
    try {
      var v = getComputedStyle(document.documentElement)
        .getPropertyValue(name).trim();
      return v || fallback;
    } catch (e) {
      return fallback;
    }
  }
  function theme() {
    return {
      accent: cssVar('--accent', '#2c5670'),
      border: cssVar('--border', 'rgba(0,0,0,0.1)'),
      muted:  cssVar('--muted',  '#666'),
      faint:  cssVar('--faint',  '#999'),
      bg:     cssVar('--bg',     '#fafaf7'),
      up:     '#1d6b46',
      down:   '#963232'
    };
  }

  // ---- helpers -----------------------------------------------------------
  // Accept either a DOM element or an id string. Returns null if unresolved.
  function resolveEl(el) {
    if (!el) return null;
    if (typeof el === 'string') {
      try { return document.getElementById(el); } catch (e) { return null; }
    }
    if (el.nodeType === 1) return el;
    return null;
  }

  function clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function isNum(n) {
    return typeof n === 'number' && isFinite(n);
  }

  function defaultFormat(v) {
    if (!isNum(v)) return '–';
    var a = Math.abs(v);
    if (a >= 1e9) return (v / 1e9).toFixed(2) + 'B';
    if (a >= 1e6) return (v / 1e6).toFixed(2) + 'M';
    if (a >= 1e3) return (v / 1e3).toFixed(2) + 'K';
    if (a !== 0 && a < 0.01) return v.toExponential(2);
    return (Math.round(v * 100) / 100).toString();
  }

  function fmtFn(opts) {
    return (opts && typeof opts.valueFormat === 'function')
      ? opts.valueFormat : defaultFormat;
  }

  function getHeight(opts) {
    var h = opts && opts.height;
    return (isNum(h) && h > 0) ? h : 240;
  }

  // Format an epoch-seconds value as a short time/date axis tick.
  function fmtTime(ts) {
    if (!isNum(ts)) return '';
    var d = new Date(ts * 1000);
    if (isNaN(d.getTime())) return String(ts);
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    var hh = String(d.getHours()).padStart(2, '0');
    var mi = String(d.getMinutes()).padStart(2, '0');
    // Use date for coarse ranges, time for intraday — caller-agnostic short form.
    return mm + '/' + dd + ' ' + hh + ':' + mi;
  }

  // ---- SVG element factory ----------------------------------------------
  function svgEl(name, attrs, text) {
    var n = document.createElementNS(SVGNS, name);
    if (attrs) {
      for (var k in attrs) {
        if (attrs.hasOwnProperty(k) && attrs[k] != null) {
          n.setAttribute(k, attrs[k]);
        }
      }
    }
    if (text != null) n.appendChild(document.createTextNode(text));
    return n;
  }

  // Create the root responsive SVG (width 100%, fixed pixel height).
  function makeSvg(width, height) {
    var svg = svgEl('svg', {
      viewBox: '0 0 ' + width + ' ' + height,
      width: '100%',
      height: height,
      preserveAspectRatio: 'none',
      'font-family': 'inherit',
      style: 'display:block;overflow:visible'
    });
    return svg;
  }

  // Render the centered "no data" message into a cleared container.
  function renderEmpty(el, height, t) {
    var width = 600;
    var svg = makeSvg(width, height);
    svg.appendChild(svgEl('text', {
      x: width / 2, y: height / 2,
      'text-anchor': 'middle', 'dominant-baseline': 'middle',
      'font-size': 13, fill: t.faint
    }, 'no data'));
    el.appendChild(svg);
  }

  // Optional title text drawn at the top-left; returns y-offset consumed.
  function renderTitle(svg, opts, t, width) {
    if (!opts || !opts.title) return 0;
    svg.appendChild(svgEl('text', {
      x: 2, y: 13, 'font-size': 12, 'font-weight': 600, fill: t.muted
    }, String(opts.title)));
    return 20;
  }

  // ---- LINE --------------------------------------------------------------
  function line(el, points, opts) {
    el = resolveEl(el);
    if (!el) return;
    opts = opts || {};
    var t = theme();
    var height = getHeight(opts);
    clear(el);

    // Keep only points with numeric v; remember original order for X.
    var pts = Array.isArray(points)
      ? points.filter(function (p) { return p && isNum(p.v); })
      : [];
    if (!pts.length) { renderEmpty(el, height, t); return; }

    var width = 600;
    var fmt = fmtFn(opts);
    var titleH = 0;

    // Plot area margins (room for value labels on the right).
    var mL = 8, mR = 56, mT = 14, mB = 22;
    var svg = makeSvg(width, height);
    titleH = renderTitle(svg, opts, t, width);
    mT += titleH;

    var pw = width - mL - mR;
    var ph = height - mT - mB;

    var vals = pts.map(function (p) { return p.v; });
    var vMin = Math.min.apply(null, vals);
    var vMax = Math.max.apply(null, vals);
    if (vMin === vMax) { vMin -= 1; vMax += 1; } // flat line padding

    var n = pts.length;
    function px(i) { return mL + (n === 1 ? pw / 2 : (i / (n - 1)) * pw); }
    function py(v) { return mT + ph - ((v - vMin) / (vMax - vMin)) * ph; }

    // Horizontal gridlines (4 divisions) + faint frame.
    var divs = 4;
    for (var g = 0; g <= divs; g++) {
      var gy = mT + (g / divs) * ph;
      svg.appendChild(svgEl('line', {
        x1: mL, y1: gy, x2: mL + pw, y2: gy,
        stroke: t.border, 'stroke-width': 1
      }));
    }

    // Build the polyline path.
    var d = '';
    for (var i = 0; i < n; i++) {
      d += (i === 0 ? 'M' : 'L') + px(i).toFixed(2) + ',' + py(pts[i].v).toFixed(2);
    }
    if (n === 1) {
      // single point -> just a dot
      svg.appendChild(svgEl('circle', {
        cx: px(0), cy: py(pts[0].v), r: 3, fill: t.accent
      }));
    } else {
      svg.appendChild(svgEl('path', {
        d: d, fill: 'none', stroke: t.accent,
        'stroke-width': 1.6, 'stroke-linejoin': 'round', 'stroke-linecap': 'round'
      }));
    }

    // Optional small dots on each vertex.
    if (opts.dots) {
      for (var j = 0; j < n; j++) {
        svg.appendChild(svgEl('circle', {
          cx: px(j), cy: py(pts[j].v), r: 2, fill: t.accent
        }));
      }
    }

    // max (top) / min (bottom) value labels at right edge.
    svg.appendChild(svgEl('text', {
      x: mL + pw + 4, y: py(vMax) + 3, 'font-size': 10, fill: t.faint
    }, fmt(vMax)));
    svg.appendChild(svgEl('text', {
      x: mL + pw + 4, y: py(vMin) + 3, 'font-size': 10, fill: t.faint
    }, fmt(vMin)));

    // last-value marker + label.
    var lastV = pts[n - 1].v;
    svg.appendChild(svgEl('circle', {
      cx: px(n - 1), cy: py(lastV), r: 2.5, fill: t.accent
    }));
    svg.appendChild(svgEl('text', {
      x: mL + pw + 4, y: py(lastV) + 3, 'font-size': 10,
      'font-weight': 600, fill: t.accent
    }, fmt(lastV)));

    // First / last X labels (epoch -> time, else string).
    function xlabel(p) {
      return isNum(p.t) ? fmtTime(p.t) : (p.t != null ? String(p.t) : '');
    }
    svg.appendChild(svgEl('text', {
      x: mL, y: height - 6, 'font-size': 10, fill: t.faint
    }, xlabel(pts[0])));
    if (n > 1) {
      svg.appendChild(svgEl('text', {
        x: mL + pw, y: height - 6, 'font-size': 10,
        fill: t.faint, 'text-anchor': 'end'
      }, xlabel(pts[n - 1])));
    }

    el.appendChild(svg);
  }

  // ---- CANDLES -----------------------------------------------------------
  function candles(el, data, opts) {
    el = resolveEl(el);
    if (!el) return;
    opts = opts || {};
    var t = theme();
    var height = getHeight(opts);
    clear(el);

    // Keep candles with all four numeric prices.
    var cs = Array.isArray(data)
      ? data.filter(function (c) {
          return c && isNum(c.o) && isNum(c.h) && isNum(c.l) && isNum(c.c);
        })
      : [];
    if (!cs.length) { renderEmpty(el, height, t); return; }

    var width = 600;
    var fmt = fmtFn(opts);
    var mL = 8, mR = 56, mT = 14, mB = 22;
    var svg = makeSvg(width, height);
    var titleH = renderTitle(svg, opts, t, width);
    mT += titleH;

    var pw = width - mL - mR;
    var ph = height - mT - mB;

    // Price range over highs/lows.
    var hi = -Infinity, lo = Infinity;
    cs.forEach(function (c) {
      if (c.h > hi) hi = c.h;
      if (c.l < lo) lo = c.l;
    });
    if (hi === lo) { hi += 1; lo -= 1; }

    function py(v) { return mT + ph - ((v - lo) / (hi - lo)) * ph; }

    // Gridlines.
    var divs = 4;
    for (var g = 0; g <= divs; g++) {
      var gy = mT + (g / divs) * ph;
      svg.appendChild(svgEl('line', {
        x1: mL, y1: gy, x2: mL + pw, y2: gy,
        stroke: t.border, 'stroke-width': 1
      }));
    }

    var n = cs.length;
    var slot = pw / n;
    var bodyW = Math.max(1, Math.min(slot * 0.7, 14));

    for (var i = 0; i < n; i++) {
      var c = cs[i];
      var cx = mL + slot * (i + 0.5);
      var up = c.c >= c.o;
      var color = up ? t.up : t.down;
      // wick (high-low)
      svg.appendChild(svgEl('line', {
        x1: cx, y1: py(c.h), x2: cx, y2: py(c.l),
        stroke: color, 'stroke-width': 1
      }));
      // body (open-close); guarantee >=1px so doji stays visible
      var yo = py(c.o), yc = py(c.c);
      var top = Math.min(yo, yc);
      var bh = Math.max(1, Math.abs(yc - yo));
      svg.appendChild(svgEl('rect', {
        x: cx - bodyW / 2, y: top, width: bodyW, height: bh,
        fill: color, stroke: color
      }));
    }

    // Price axis min/max labels.
    svg.appendChild(svgEl('text', {
      x: mL + pw + 4, y: py(hi) + 3, 'font-size': 10, fill: t.faint
    }, fmt(hi)));
    svg.appendChild(svgEl('text', {
      x: mL + pw + 4, y: py(lo) + 3, 'font-size': 10, fill: t.faint
    }, fmt(lo)));

    // Time axis: first + last (and middle if room).
    function tlabel(c) { return isNum(c.ts) ? fmtTime(c.ts) : ''; }
    svg.appendChild(svgEl('text', {
      x: mL, y: height - 6, 'font-size': 10, fill: t.faint
    }, tlabel(cs[0])));
    if (n > 1) {
      svg.appendChild(svgEl('text', {
        x: mL + pw, y: height - 6, 'font-size': 10,
        fill: t.faint, 'text-anchor': 'end'
      }, tlabel(cs[n - 1])));
    }
    if (n > 4) {
      var mid = cs[Math.floor(n / 2)];
      svg.appendChild(svgEl('text', {
        x: mL + pw / 2, y: height - 6, 'font-size': 10,
        fill: t.faint, 'text-anchor': 'middle'
      }, tlabel(mid)));
    }

    el.appendChild(svg);
  }

  // ---- BARS --------------------------------------------------------------
  function bars(el, items, opts) {
    el = resolveEl(el);
    if (!el) return;
    opts = opts || {};
    var t = theme();
    clear(el);

    // Keep items with numeric value; preserve given order.
    var its = Array.isArray(items)
      ? items.filter(function (d) { return d && isNum(d.value); })
      : [];

    var fmt = fmtFn(opts);
    var n = its.length;

    // Height: honor opts.height, else size to row count.
    var rowH = 24, gap = 6, mT = 14, mB = 8;
    var titleSpace = (opts.title) ? 20 : 0;
    var natural = mT + titleSpace + mB + n * rowH + (n - 1) * gap;
    var height = (opts && isNum(opts.height) && opts.height > 0)
      ? opts.height : Math.max(60, natural);

    if (!n) { renderEmpty(el, height, t); return; }

    var width = 600;
    var svg = makeSvg(width, height);
    var titleH = renderTitle(svg, opts, t, width);

    // Label column width scales with longest label, then bar area + value.
    var labelW = 110, valW = 56;
    var mL = 8, mR = 8;
    var barX = mL + labelW;
    var barAreaW = width - barX - valW - mR;

    var maxV = Math.max.apply(null, its.map(function (d) {
      return Math.abs(d.value);
    }));
    if (maxV <= 0) maxV = 1;

    // Distribute rows across available vertical space.
    var top = mT + titleH;
    var avail = height - top - mB;
    var step = n > 0 ? avail / n : rowH;
    var bh = Math.min(rowH, step - gap > 6 ? step - gap : step * 0.7);

    for (var i = 0; i < n; i++) {
      var d = its[i];
      var y = top + i * step + (step - bh) / 2;
      var w = (Math.abs(d.value) / maxV) * barAreaW;

      // label (truncate visually via clipping is overkill; rely on small font)
      svg.appendChild(svgEl('text', {
        x: mL, y: y + bh / 2 + 3, 'font-size': 11, fill: t.muted
      }, String(d.label == null ? '' : d.label)));

      // bar
      svg.appendChild(svgEl('rect', {
        x: barX, y: y, width: Math.max(0, w), height: bh,
        fill: t.accent, rx: 2
      }));

      // value label after the bar
      svg.appendChild(svgEl('text', {
        x: barX + Math.max(0, w) + 4, y: y + bh / 2 + 3,
        'font-size': 10, fill: t.faint
      }, fmt(d.value)));
    }

    el.appendChild(svg);
  }

  // ---- export ------------------------------------------------------------
  global.CDLChart = { line: line, candles: candles, bars: bars };

})(typeof window !== 'undefined' ? window : this);
