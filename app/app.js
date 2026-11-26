/* 安家账本 · 路由 + 渲染 + 交互。hash 路由：#/ 总览、#/transactions 流水、#/budgets 预算、#/goals 目标、#/reports 报表。 */
(function () {
  var state = window.LedgerStore.load();
  var currentMonth = "2026-11"; /* 默认展示最新月份 */
  var view = document.getElementById("view");

  function money(n) { return "¥" + Number(n).toLocaleString("zh-CN"); }
  function monthLabel(m) { return m.slice(0, 4) + "年" + Number(m.slice(5, 7)) + "月"; }
  function monthTxns(m) { return state.txns.filter(function (t) { return t.date.slice(0, 7) === m; }); }
  function shiftMonth(m, d) {
    var y = Number(m.slice(0, 4)), mo = Number(m.slice(5, 7)) + d;
    while (mo < 1) { mo += 12; y -= 1; }
    while (mo > 12) { mo -= 12; y += 1; }
    return y + "-" + String(mo).padStart(2, "0");
  }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function persist() { window.LedgerStore.save(state); }

  function monthSwitch() {
    return '<div class="month-switch"><button id="prev-month" aria-label="上个月">‹</button>' +
      '<strong>' + monthLabel(currentMonth) + '</strong>' +
      '<button id="next-month" aria-label="下个月">›</button>' +
      '<span class="muted">切换月份查看各月账本</span></div>';
  }

  function summary(m) {
    var tx = monthTxns(m), income = 0, expense = 0;
    tx.forEach(function (t) { if (t.kind === "income") income += t.amount; else expense += t.amount; });
    return { income: income, expense: expense, balance: income - expense, rate: income > 0 ? Math.round((income - expense) / income * 100) : 0 };
  }

  function catTotals(m) {
    var map = {};
    monthTxns(m).forEach(function (t) { if (t.kind === "expense") map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.keys(map).map(function (k) { return { cat: k, amount: map[k] }; }).sort(function (a, b) { return b.amount - a.amount; });
  }

  function renderOverview() {
    var s = summary(currentMonth);
    var cats = catTotals(currentMonth);
    var maxCat = cats.length ? cats[0].amount : 1;
    var recent = monthTxns(currentMonth).slice().sort(function (a, b) { return b.date.localeCompare(a.date); }).slice(0, 5);
    var budgets = window.EXPENSE_CATEGORIES.map(function (c) {
      var spent = (catTotals(currentMonth).find(function (x) { return x.cat === c; }) || { amount: 0 }).amount;
      var limit = state.budgets[c] || 0;
      var pct = limit > 0 ? Math.round(spent / limit * 100) : 0;
      return { cat: c, spent: spent, limit: limit, pct: pct };
    });
    var html = '<h2>' + monthLabel(currentMonth) + ' · 家庭收支总览</h2>' + monthSwitch();
    html += '<div class="cards">' +
      '<div class="card income"><div class="label">本月收入</div><div class="big">' + money(s.income) + '</div><div class="muted">工资 + 奖金 + 其他</div></div>' +
      '<div class="card expense"><div class="label">本月支出</div><div class="big">' + money(s.expense) + '</div><div class="muted">共 ' + monthTxns(currentMonth).length + ' 笔</div></div>' +
      '<div class="card"><div class="label">本月结余</div><div class="big">' + money(s.balance) + '</div><div class="muted">收入减去支出</div></div>' +
      '<div class="card"><div class="label">储蓄率</div><div class="big">' + s.rate + '<small>%</small></div><div class="muted">结余占收入的比例</div></div></div>';
    html += '<div class="grid2"><div class="card"><h3>分类支出</h3>' +
      cats.map(function (c) {
        return '<div class="bar-row"><span>' + esc(c.cat) + '</span><div class="bar-track"><div class="bar-fill" style="width:' + Math.round(c.amount / maxCat * 100) + '%"></div></div><span class="amt">' + money(c.amount) + '</span></div>';
      }).join("") + '</div>' +
      '<div class="card"><h3>预算进度</h3>' +
      budgets.map(function (b) {
        return '<div style="margin:10px 0"><div style="display:flex;justify-content:space-between;font-size:14px"><span>' + esc(b.cat) + '</span><span>' + money(b.spent) + ' / ' + money(b.limit) + '</span></div>' +
          '<div class="progress' + (b.pct > 100 ? " over" : "") + '"><i style="width:' + Math.min(100, b.pct) + '%"></i></div>' +
          '<div class="muted">' + b.pct + '% ' + (b.pct > 100 ? '<span class="over-tag">已超支</span>' : '') + '</div></div>';
      }).join("") + '</div></div>';
    html += '<div class="card"><h3>本月最近 5 笔</h3><table><tr><th>日期</th><th>分类</th><th>备注</th><th class="num">金额</th></tr>' +
      recent.map(function (t) {
        return '<tr><td>' + t.date + '</td><td><span class="tag">' + esc(t.category) + '</span></td><td>' + esc(t.note) + '</td><td class="num ' + (t.kind === "income" ? "pos" : "neg") + '">' + (t.kind === "income" ? "+" : "−") + money(t.amount) + '</td></tr>';
      }).join("") + '</table><p style="margin:12px 0 0"><a href="#/transactions">查看全部流水 →</a></p></div>';
    view.innerHTML = html;
    document.getElementById("prev-month").onclick = function () { currentMonth = shiftMonth(currentMonth, -1); render(); };
    document.getElementById("next-month").onclick = function () { currentMonth = shiftMonth(currentMonth, 1); render(); };
  }

  function renderTransactions() {
    var cats = ["全部"].concat(window.CATEGORIES);
    var html = '<h2>收支流水</h2>' + monthSwitch();
    html += '<div class="filters"><select id="f-cat">' + cats.map(function (c) { return '<option>' + c + '</option>'; }).join("") + '</select>' +
      '<input id="f-q" type="search" placeholder="搜索备注，如：买菜、外卖…">' +
      '<button class="ghost" id="f-reset">重置</button></div>';
    html += '<div class="card" style="margin-bottom:18px"><h3>记一笔</h3><form class="add" id="add-form">' +
      '<label>日期<input type="date" id="a-date" value="2026-11-26" required></label>' +
      '<label>类型<select id="a-kind"><option value="expense">支出</option><option value="income">收入</option></select></label>' +
      '<label>分类<select id="a-cat">' + window.CATEGORIES.map(function (c) { return '<option>' + c + '</option>'; }).join("") + '</select></label>' +
      '<label>金额（元）<input type="number" id="a-amount" min="0.01" step="0.01" placeholder="例如 128" required></label>' +
      '<label class="full">备注<input type="text" id="a-note" maxlength="40" placeholder="例如：菜市场买菜" required></label>' +
      '<div class="full"><button class="btn" type="submit">保存这笔账</button> <span class="err" id="a-err"></span></div></form></div>';
    html += '<div class="card"><h3>流水明细 <span class="muted" id="tx-count"></span></h3><table id="tx-table"><tr><th>日期</th><th>类型</th><th>分类</th><th>备注</th><th class="num">金额</th><th></th></tr><tbody id="tx-body"></tbody></table></div>';
    view.innerHTML = html;
    document.getElementById("prev-month").onclick = function () { currentMonth = shiftMonth(currentMonth, -1); render(); };
    document.getElementById("next-month").onclick = function () { currentMonth = shiftMonth(currentMonth, 1); render(); };

    function drawList() {
      var cat = document.getElementById("f-cat").value;
      var q = document.getElementById("f-q").value.trim();
      var list = monthTxns(currentMonth).slice().sort(function (a, b) { return b.date.localeCompare(a.date) || b.id.localeCompare(a.id); });
      if (cat !== "全部") list = list.filter(function (t) { return t.category === cat; });
      if (q) list = list.filter(function (t) { return t.note.indexOf(q) !== -1 || t.category.indexOf(q) !== -1; });
      document.getElementById("tx-count").textContent = "共 " + list.length + " 笔";
      document.getElementById("tx-body").innerHTML = list.map(function (t) {
        return '<tr><td>' + t.date + '</td><td>' + (t.kind === "income" ? "收入" : "支出") + '</td><td><span class="tag">' + esc(t.category) + '</span></td><td>' + esc(t.note) + '</td>' +
          '<td class="num ' + (t.kind === "income" ? "pos" : "neg") + '">' + (t.kind === "income" ? "+" : "−") + money(t.amount) + '</td>' +
          '<td><button class="danger" data-del="' + t.id + '">删除</button></td></tr>';
      }).join("") || '<tr><td colspan="6" class="muted">本月暂无符合条件的流水，换个筛选或记一笔吧。</td></tr>';
      Array.prototype.forEach.call(document.querySelectorAll("[data-del]"), function (btn) {
        btn.onclick = function () {
          state.txns = state.txns.filter(function (t) { return t.id !== btn.getAttribute("data-del"); });
          persist(); drawList();
        };
      });
    }
    document.getElementById("f-cat").onchange = drawList;
    document.getElementById("f-q").oninput = drawList;
    document.getElementById("f-reset").onclick = function () { document.getElementById("f-cat").value = "全部"; document.getElementById("f-q").value = ""; drawList(); };
    document.getElementById("add-form").onsubmit = function (e) {
      e.preventDefault();
      var err = document.getElementById("a-err");
      var amount = Number(document.getElementById("a-amount").value);
      var note = document.getElementById("a-note").value.trim();
      var date = document.getElementById("a-date").value;
      if (!date) { err.textContent = "请选择日期。"; return; }
      if (!(amount > 0)) { err.textContent = "金额必须大于 0。"; return; }
      if (!note) { err.textContent = "请填写备注。"; return; }
      state.txns.push({ id: "u" + Date.now(), date: date, kind: document.getElementById("a-kind").value, category: document.getElementById("a-cat").value, amount: Math.round(amount * 100) / 100, note: note });
      persist();
      currentMonth = date.slice(0, 7);
      render();
    };
    drawList();
  }

  function renderBudgets() {
    var html = '<h2>' + monthLabel(currentMonth) + ' · 分类预算</h2>' + monthSwitch();
    html += '<p class="muted">预算按月生效，改动会保存到本机；超支的分类会标红提醒。</p><div class="grid2e">';
    window.EXPENSE_CATEGORIES.forEach(function (c) {
      var spent = (catTotals(currentMonth).find(function (x) { return x.cat === c; }) || { amount: 0 }).amount;
      var limit = state.budgets[c] || 0;
      var pct = limit > 0 ? Math.round(spent / limit * 100) : 0;
      var left = limit - spent;
      html += '<div class="card"><div class="goal-head"><b>' + esc(c) + '</b><span class="goal-amt">已花 <b>' + money(spent) + '</b> / 预算 ' + money(limit) + '</span></div>' +
        '<div class="progress' + (pct > 100 ? " over" : "") + '" style="margin:10px 0 6px"><i style="width:' + Math.min(100, pct) + '%"></i></div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center"><span class="muted">' + pct + '% · ' + (left >= 0 ? "还剩 " + money(left) : '<span class="over-tag">超支 ' + money(-left) + '</span>') + '</span>' +
        '<span><input type="number" min="0" step="100" value="' + limit + '" data-budget="' + esc(c) + '" style="width:110px;padding:7px 9px;border:1px solid var(--line);border-radius:8px;font-size:14px"> <button class="btn small" data-save-budget="' + esc(c) + '">保存</button></span></div></div>';
    });
    html += '</div><div class="tip">小提示：本月餐饮已花 ' + money((catTotals(currentMonth).find(function (x) { return x.cat === "餐饮"; }) || { amount: 0 }).amount) + '，周末少点两顿外卖就能回到预算内。</div>';
    view.innerHTML = html;
    document.getElementById("prev-month").onclick = function () { currentMonth = shiftMonth(currentMonth, -1); render(); };
    document.getElementById("next-month").onclick = function () { currentMonth = shiftMonth(currentMonth, 1); render(); };
    Array.prototype.forEach.call(document.querySelectorAll("[data-save-budget]"), function (btn) {
      btn.onclick = function () {
        var cat = btn.getAttribute("data-save-budget");
        var input = document.querySelector('[data-budget="' + cat + '"]');
        var v = Number(input.value);
        if (!(v >= 0)) return;
        state.budgets[cat] = v;
        persist(); render();
      };
    });
  }

  function renderGoals() {
    var html = '<h2>储蓄目标</h2><p class="muted">每个目标都有明确的金额和进度，点「存入」随时加钱，进度实时更新。</p><div class="grid2e">';
    state.goals.forEach(function (g) {
      var pct = Math.min(100, Math.round(g.saved / g.target * 100));
      html += '<div class="card"><div class="goal-head"><b>' + esc(g.name) + '</b><span class="goal-amt">已存 <b>' + money(g.saved) + '</b> / 目标 ' + money(g.target) + '</span></div>' +
        '<p class="muted" style="margin:6px 0">' + esc(g.note) + '</p>' +
        '<div class="progress" style="margin:8px 0 6px"><i style="width:' + pct + '%"></i></div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><span>' + pct + '% · 还差 ' + money(Math.max(0, g.target - g.saved)) + '</span>' +
        '<span><input type="number" min="1" step="100" value="500" data-deposit="' + g.id + '" style="width:100px;padding:7px 9px;border:1px solid var(--line);border-radius:8px;font-size:14px"> <button class="btn small" data-add-goal="' + g.id + '">存入</button></span></div></div>';
    });
    html += '</div><div class="tip">三项目标一共已存 ' + money(state.goals.reduce(function (a, g) { return a + g.saved; }, 0)) + '，按每月结余约 ' + money(summary("2026-11").balance) + ' 计算，家庭旅行目标预计 2 个月后达成。</div>';
    view.innerHTML = html;
    Array.prototype.forEach.call(document.querySelectorAll("[data-add-goal]"), function (btn) {
      btn.onclick = function () {
        var id = btn.getAttribute("data-add-goal");
        var input = document.querySelector('[data-deposit="' + id + '"]');
        var v = Number(input.value);
        if (!(v > 0)) return;
        var g = state.goals.find(function (x) { return x.id === id; });
        g.saved = Math.round((g.saved + v) * 100) / 100;
        persist(); render();
      };
    });
  }

  function renderReports() {
    var months = [];
    ["2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"].forEach(function (m) {
      var s = summary(m);
      months.push({ label: Number(m.slice(5, 7)) + "月", income: s.income, expense: s.expense, balance: s.balance });
    });
    var cats = catTotals(currentMonth);
    var html = '<h2>收支报表 · ' + monthLabel(currentMonth) + '</h2>' + monthSwitch();
    html += '<div class="card" style="margin-bottom:18px"><h3>近 6 个月收支趋势</h3>' + window.Charts.trend(months) +
      '<p class="muted"><span style="color:#1f7a5c">■</span> 收入　<span style="color:#c96a4a">■</span> 支出　<span style="color:#f4b942">—</span> 结余</p></div>';
    html += '<div class="grid2"><div class="card"><h3>本月分类占比</h3><div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center">' + window.Charts.donut(cats) +
      '<div>' + cats.map(function (c, i) {
        return '<div style="font-size:14px;margin:5px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:' + window.Charts.palette[i % window.Charts.palette.length] + ';margin-right:6px"></span>' + esc(c.cat) + ' · ' + money(c.amount) + '</div>';
      }).join("") + '</div></div></div>' +
      '<div class="card"><h3>月度结余表</h3><table><tr><th>月份</th><th class="num">收入</th><th class="num">支出</th><th class="num">结余</th></tr>' +
      ["2026-09", "2026-10", "2026-11"].map(function (m) {
        var s = summary(m);
        return '<tr><td>' + monthLabel(m) + '</td><td class="num pos">' + money(s.income) + '</td><td class="num neg">' + money(s.expense) + '</td><td class="num">' + money(s.balance) + '</td></tr>';
      }).join("") + '</table><p class="muted">三个月平均每月结余 ' + money(Math.round((summary("2026-09").balance + summary("2026-10").balance + summary("2026-11").balance) / 3)) + '。</p></div></div>';
    view.innerHTML = html;
    document.getElementById("prev-month").onclick = function () { currentMonth = shiftMonth(currentMonth, -1); render(); };
    document.getElementById("next-month").onclick = function () { currentMonth = shiftMonth(currentMonth, 1); render(); };
  }

  function render() {
    var route = (location.hash || "#/").replace(/^#\/?/, "");
    document.querySelectorAll("#nav a").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-route") === route);
    });
    if (route === "transactions") renderTransactions();
    else if (route === "budgets") renderBudgets();
    else if (route === "goals") renderGoals();
    else if (route === "reports") renderReports();
    else renderOverview();
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", render);
  render();
})();
