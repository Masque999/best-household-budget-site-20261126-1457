/* 安家账本 · 本地持久化：localStorage 读写，种子数据只在首次加载时写入。 */
(function () {
  var KEY = "anjia-ledger-v1";

  function seedState() {
    return {
      txns: window.SEED_TXNS.map(function (row, i) {
        return { id: "seed-" + (i + 1), date: row[0], kind: row[1], category: row[2], amount: row[3], note: row[4] };
      }),
      budgets: Object.assign({}, window.SEED_BUDGETS),
      goals: window.SEED_GOALS.map(function (g) { return Object.assign({}, g); })
    };
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.txns)) return parsed;
      }
    } catch (e) { /* 损坏则回落到种子数据 */ }
    var fresh = seedState();
    saveState(fresh);
    return fresh;
  }

  function saveState(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 存储满或被禁用时忽略 */ }
  }

  function resetState() {
    var fresh = seedState();
    saveState(fresh);
    return fresh;
  }

  window.LedgerStore = { load: loadState, save: saveState, reset: resetState, key: KEY };
})();
