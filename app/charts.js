/* 安家账本 · 手写 SVG 图表：分类横条、月度趋势、分类占比环形。零依赖。 */
(function () {
  var PALETTE = ["#1f7a5c", "#f4b942", "#4a90b8", "#c96a4a", "#7a6fb8", "#4fae8a", "#b85c7a", "#8a9a5b"];

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* 近 6 个月收支趋势：柱状 + 折线（结余），返回 SVG 字符串 */
  function trendChart(months) {
    var W = 640, H = 260, padL = 46, padB = 28, padT = 16;
    var maxV = 1000;
    months.forEach(function (m) { maxV = Math.max(maxV, m.income, m.expense); });
    maxV = Math.ceil(maxV / 5000) * 5000;
    var innerW = W - padL - 16, innerH = H - padT - padB;
    var slot = innerW / months.length;
    var y = function (v) { return padT + innerH - (v / maxV) * innerH; };
    var parts = ['<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="近6个月收支趋势图">'];
    [0, 0.5, 1].forEach(function (f) {
      var yy = y(maxV * f);
      parts.push('<line x1="' + padL + '" y1="' + yy + '" x2="' + (W - 16) + '" y2="' + yy + '" stroke="#e3eae5"/>');
      parts.push('<text x="' + (padL - 6) + '" y="' + (yy + 4) + '" font-size="11" fill="#6b7a72" text-anchor="end">' + Math.round(maxV * f / 1000) + 'k</text>');
    });
    var pts = [];
    months.forEach(function (m, i) {
      var cx = padL + slot * i + slot / 2;
      var bw = Math.min(26, slot / 3.4);
      parts.push('<rect x="' + (cx - bw - 3) + '" y="' + y(m.income) + '" width="' + bw + '" height="' + (y(0) - y(m.income)) + '" fill="#1f7a5c" rx="2"/>');
      parts.push('<rect x="' + (cx + 3) + '" y="' + y(m.expense) + '" width="' + bw + '" height="' + (y(0) - y(m.expense)) + '" fill="#c96a4a" rx="2"/>');
      parts.push('<text x="' + cx + '" y="' + (H - 8) + '" font-size="12" fill="#22302a" text-anchor="middle">' + esc(m.label) + '</text>');
      pts.push(cx + "," + y(m.balance));
    });
    parts.push('<polyline points="' + pts.join(" ") + '" fill="none" stroke="#f4b942" stroke-width="2.5"/>');
    months.forEach(function (m, i) {
      var cx = padL + slot * i + slot / 2;
      parts.push('<circle cx="' + cx + '" cy="' + y(m.balance) + '" r="3.5" fill="#f4b942" stroke="#fff"/>');
    });
    parts.push('</svg>');
    return parts.join("");
  }

  /* 分类占比环形图 */
  function donutChart(slices) {
    /* 调用方可传 { value } 或 { amount } 两种字段 */
    var vals = slices.map(function (s) { return (s.value != null ? s.value : s.amount) || 0; });
    var total = vals.reduce(function (a, v) { return a + v; }, 0) || 1;
    var cx = 110, cy = 110, r = 78, inner = 48;
    var a0 = -Math.PI / 2;
    var parts = ['<svg viewBox="0 0 220 220" width="220" height="220" role="img" aria-label="分类支出占比环形图">'];
    slices.forEach(function (s, i) {
      var frac = vals[i] / total;
      var a1 = a0 + frac * Math.PI * 2;
      var large = frac > 0.5 ? 1 : 0;
      var x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
      var x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      var xi1 = cx + inner * Math.cos(a1), yi1 = cy + inner * Math.sin(a1);
      var xi0 = cx + inner * Math.cos(a0), yi0 = cy + inner * Math.sin(a0);
      parts.push('<path d="M ' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x1.toFixed(1) + ' ' + y1.toFixed(1) +
        ' L ' + xi1.toFixed(1) + ' ' + yi1.toFixed(1) + ' A ' + inner + ' ' + inner + ' 0 ' + large + ' 0 ' + xi0.toFixed(1) + ' ' + yi0.toFixed(1) + ' Z" fill="' + PALETTE[i % PALETTE.length] + '"/>');
      a0 = a1;
    });
    parts.push('<text x="' + cx + '" y="' + (cy - 6) + '" font-size="13" fill="#6b7a72" text-anchor="middle">本月支出</text>');
    parts.push('<text x="' + cx + '" y="' + (cy + 16) + '" font-size="17" font-weight="700" fill="#22302a" text-anchor="middle">¥' + total.toLocaleString("zh-CN") + '</text>');
    parts.push('</svg>');
    return parts.join("");
  }

  window.Charts = { trend: trendChart, donut: donutChart, palette: PALETTE };
})();
