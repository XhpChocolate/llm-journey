(() => {
  "use strict";

  const PLAN = window.__PLAN__;
  if (!PLAN) return;

  const KEY = "xuetai.v1";
  const DAYS = [];
  PLAN.weeks.forEach((w) =>
    w.days.forEach((d) =>
      DAYS.push({ ...d, week: w.week, phase: w.phase, theme: w.theme })
    )
  );
  const RES = PLAN.resources;
  const IDX = new Map(DAYS.map((d, i) => [d.id, i]));
  const TYPE_LABEL = { doc: "文档", video: "视频", code: "代码", tool: "工具" };
  const WEEK_CN = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

  /* ---------------- 日期 ---------------- */
  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseYmd = (s) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const addDays = (d, n) => {
    const x = new Date(d.getTime());
    x.setDate(x.getDate() + n);
    return x;
  };
  const dayDiff = (a, b) => Math.round((parseYmd(b) - parseYmd(a)) / 86400000);
  const fmtDate = (d) => `${d.getMonth() + 1} 月 ${d.getDate()} 日 ${WEEK_CN[d.getDay()]}`;
  const fmtMin = (m) => (m >= 60 ? `${(m / 60).toFixed(m % 60 ? 1 : 0)} 小时` : `${m} 分钟`);

  /* ---------------- 状态 ---------------- */
  function blank() {
    return { v: 1, start: ymd(new Date()), days: {}, questions: [], reviews: {} };
  }
  let state = blank();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = Object.assign(blank(), parsed);
      state.days = parsed.days || {};
      state.questions = parsed.questions || [];
      state.reviews = parsed.reviews || {};
    }
  } catch (e) {
    console.warn("读取本地记录失败，使用空状态", e);
  }

  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
        const el = document.getElementById("saveState");
        if (el) el.textContent = "已保存 · " + new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
      } catch (e) {
        toast("浏览器拒绝保存，可能是隐私模式");
      }
    }, 160);
  }

  const dayState = (id) => state.days[id] || (state.days[id] = {});
  const statusOf = (id) => state.days[id]?.status || "";

  /* 解锁模型：第一个没完成的天 = 今天；后面全部锁定。
     不按日历推进 —— 哪天没做完，整条计划自动顺延，不会跳天。 */
  function currentIdx() {
    const i = DAYS.findIndex((d) => statusOf(d.id) !== "done");
    return i === -1 ? DAYS.length : i;
  }
  function dateOf(i) {
    return addDays(new Date(), i - currentIdx());
  }
  // 已完成的旧记录即使排在当前进度之后，也仍然可查看（老数据可能乱序）
  const isLocked = (i) => i > currentIdx() && statusOf(DAYS[i].id) !== "done";

  function stats() {
    let done = 0, minutes = 0;
    DAYS.forEach((d) => {
      if (statusOf(d.id) === "done") {
        done++;
        minutes += dayState(d.id).minutes ?? d.minutes;
      }
    });
    let streak = 0;
    for (let i = currentIdx() - 1; i >= 0; i--) {
      if (statusOf(DAYS[i].id) === "done") streak++;
      else break;
    }
    return {
      done,
      minutes,
      streak,
      left: DAYS.length - done,
      rate: Math.round((done / DAYS.length) * 100),
      allDone: currentIdx() >= DAYS.length,
    };
  }

  /* ---------------- 小工具 ---------------- */
  const $ = (id) => document.getElementById(id);
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let toastTimer = null;
  function toast(msg) {
    const el = $("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-on"), 2200);
  }
  function resItem(r, extra) {
    const label = r.type === "video" ? "看视频" : r.type === "code" ? "读仓库" : "读文档";
    const meta = [metaOf(r), extra].filter(Boolean).join(" · ");
    return `<li class="res">
      <a class="res__link" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" data-ext title="${esc(r.url)}">
        <span class="res__body">
          <span class="res__type">${TYPE_LABEL[r.type] || "资源"} · ${r.lang === "en" ? "英文" : "中文"} · ${fmtMin(r.minutes)}</span>
          <span class="res__t">${esc(r.title)}</span>
          ${meta ? `<span class="res__meta">${meta}</span>` : ""}
        </span>
        <span class="res__go">${label} ↗</span>
      </a>
    </li>`;
  }
  const metaOf = (r) => [r.author, r.published].filter(Boolean).join(" · ");

  /* ---------------- 今日 ---------------- */
  function renderToday() {
    const s = stats();
    const i = Math.min(currentIdx(), DAYS.length - 1);
    const d = DAYS[i];
    const ds = dayState(d.id);
    const date = dateOf(i);

    $("navDate").textContent = ymd(new Date());
    $("tKicker").textContent = s.allDone
      ? "98 天全部完成"
      : `第 ${d.week} 周 · 第 ${d.day} 天 / 98 · 阶段 ${d.phase} · ${fmtDate(date)}`;
    $("tTitle").textContent = d.title;
    $("tGoal").textContent = d.goal;
    $("tMin").textContent = fmtMin(d.minutes);
    $("tDone").textContent = s.done;
    $("tLeft").textContent = s.left;
    $("doneBtn").textContent = s.allDone ? "全部已完成" : "完成第 " + d.day + " 天，解锁下一天";
    $("doneBtn").disabled = s.allDone;

    const tasks = d.tasks || [];
    const checked = ds.tasks || {};
    $("tTasks").innerHTML = tasks
      .map((t, k) => {
        const on = checked[k] || statusOf(d.id) === "done";
        return `<li><label class="task"><input type="checkbox" data-task="${k}"${on ? " checked" : ""}><span class="task__t">${esc(t)}</span></label></li>`;
      })
      .join("");
    $("tAsk").textContent = d.notesPrompt ? "今日自问：" + d.notesPrompt : "";
    $("undoBtn").hidden = !statusOf(d.id);

    const noteEl = $("tNote");
    if (document.activeElement !== noteEl) noteEl.value = ds.notes || "";

    const refs = (d.refs || []).map((id) => RES[id]).filter(Boolean);
    refs.sort((a, b) => (b.must ? 1 : 0) - (a.must ? 1 : 0));
    $("tRes").innerHTML = refs.length
      ? refs.map((r) => resItem(r)).join("")
      : `<li class="empty">今天没有指定资源，专注写代码。</li>`;

    const next = [];
    for (let k = 1; k <= 3 && i + k < DAYS.length; k++) {
      const nd = DAYS[i + k];
      const dd = dateOf(i + k);
      next.push(`<li><button class="next-row" type="button" data-day="${nd.id}">
        <span class="next__d">${pad(dd.getMonth() + 1)}-${pad(dd.getDate())} ${WEEK_CN[dd.getDay()]}</span>
        <span class="next__t">${esc(nd.title)}</span>
        <span class="next__m">${fmtMin(nd.minutes)}</span>
      </button></li>`);
    }
    $("tNext").innerHTML = next.join("") || `<li class="empty">这是最后一天。</li>`;
  }

  /* ---------------- 计划 ---------------- */
  const planFilter = { status: "all", phase: "all" };

  function renderPlan() {
    $("planWeeks").innerHTML = PLAN.weeks
      .map((w) => {
        const rows = w.days
          .map((d, k) => {
            const idx = (w.week - 1) * 7 + k;
            const st = statusOf(d.id);
            const locked = isLocked(idx);
            const now = idx === currentIdx();
            const cls = st === "done"
              ? "status--done"
              : locked ? "status--lock"
              : now ? "status--now"
              : st === "defer" ? "status--defer" : "";
            const label = st === "done" ? "已完成" : locked ? "锁定" : now ? "今天" : "待开始";
            return `<li><button class="day-row${locked ? " is-locked" : ""}" type="button" data-day="${d.id}" data-status="${st || "todo"}"${locked ? " aria-disabled=\"true\"" : ""}>
              <span class="day-row__d">${d.id}</span>
              <span class="day-row__t">${esc(d.title)}</span>
              <span class="day-row__m">${locked ? "—" : fmtMin(d.minutes)}</span>
              <span class="status ${cls}">${label}</span>
            </button></li>`;
          })
          .join("");
        return `<section class="wk" data-phase="${w.phase}">
          <div class="wk__head">
            <span class="wk__n">W${pad(w.week)}</span>
            <span class="wk__t">${esc(w.theme)}</span>
            <span class="wk__p">${w.days.filter((d) => statusOf(d.id) === "done").length} / 7</span>
          </div>
          <ul class="day-list">${rows}</ul>
        </section>`;
      })
      .join("");
    applyPlanFilter();
  }

  function applyPlanFilter() {
    document.querySelectorAll("#planWeeks .wk").forEach((wk) => {
      const phaseOk = planFilter.phase === "all" || wk.dataset.phase === planFilter.phase;
      let shown = 0;
      wk.querySelectorAll(".day-row").forEach((row) => {
        const st = row.dataset.status;
        const ok =
          planFilter.status === "all" ||
          (planFilter.status === "done" && st === "done") ||
          (planFilter.status === "defer" && st === "defer") ||
          (planFilter.status === "todo" && st === "todo");
        row.parentElement.hidden = !ok;
        if (ok) shown++;
      });
      wk.hidden = !phaseOk || shown === 0;
    });
  }

  /* ---------------- 资源 ---------------- */
  const resFilter = { q: "", type: "all", lang: "all" };
  const USED = {};
  DAYS.forEach((d) => (d.refs || []).forEach((id) => (USED[id] = (USED[id] || []).concat(d.id))));

  function renderRes() {
    const q = resFilter.q.trim().toLowerCase();
    const list = Object.values(RES)
      .filter((r) => resFilter.type === "all" || r.type === resFilter.type)
      .filter((r) => resFilter.lang === "all" || (r.lang || "zh") === resFilter.lang)
      .filter((r) => {
        if (!q) return true;
        const hay = [r.title, r.author, r.id, r.note, r.after].filter(Boolean).join(" ").toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => (USED[b.id]?.length || 0) - (USED[a.id]?.length || 0));

    $("resCount").textContent = `${list.length} / ${Object.keys(RES).length}`;
    $("resAll").innerHTML = list.length
      ? list.map((r) => resItem(r, `用在 ${USED[r.id]?.length || 0} 天`)).join("")
      : `<li class="empty">没有匹配的资源，换个关键词。</li>`;
  }

  /* ---------------- 疑点 ---------------- */
  const NEXT_GAP = [1, 3, 7, 15];

  function renderQuestions() {
    const sel = $("qDay");
    if (!sel.options.length) {
      sel.innerHTML = DAYS.map((d) => `<option value="${d.id}">${d.id} · ${esc(d.title)}</option>`).join("");
      sel.value = DAYS[Math.min(currentIdx(), DAYS.length - 1)].id;
    }
    const list = state.questions
      .slice()
      .sort((a, b) => (a.status === "open" ? -1 : 0) - (b.status === "open" ? -1 : 0) || b.created - a.created);
    $("qList").innerHTML = list.length
      ? list
          .map((q) => {
            const due = q.status === "done" && q.nextReview && q.nextReview <= ymd(new Date());
            return `<article class="q ${q.status === "open" ? "q--open" : ""}">
          <div class="q__top">
            <span class="q__text">${esc(q.text)}</span>
            <span class="q__meta">${esc(q.day)} · ${due ? "该复习了" : q.status === "done" ? "复习 " + (q.nextReview || "—") : "未解决"}</span>
          </div>
          <div class="q__row">
            <label class="sr-only" for="qs-${q.id}">状态</label>
            <select id="qs-${q.id}" data-qstatus="${q.id}">
              <option value="open"${q.status === "open" ? " selected" : ""}>未解决</option>
              <option value="done"${q.status === "done" ? " selected" : ""}>已搞懂</option>
              <option value="drop"${q.status === "drop" ? " selected" : ""}>放弃</option>
            </select>
            <button class="btn btn--secondary btn--sm" type="button" data-qreview="${q.id}">记一次复习</button>
            <button class="btn btn--quiet btn--sm" type="button" data-qdel="${q.id}">删除</button>
          </div>
          <div class="q__answer">
            <label for="qa-${q.id}">答案</label>
            <textarea id="qa-${q.id}" rows="2" data-qanswer="${q.id}" placeholder="一句话写清结论">${esc(q.answer || "")}</textarea>
          </div>
        </article>`;
          })
          .join("")
      : `<p class="empty">还没有疑点。今天卡住的地方，先记一条。</p>`;
  }

  /* ---------------- 复盘 ---------------- */
  function renderReviews() {
    $("reviewList").innerHTML = PLAN.weeks
      .map((w) => {
        const r = state.reviews[w.week] || {};
        const done = w.days.filter((d) => statusOf(d.id) === "done").length;
        return `<article class="rev" data-week="${w.week}">
          <div class="rev__head">
            <span class="rev__n">W${pad(w.week)}</span>
            <span class="rev__t">${esc(w.theme)}</span>
            <span class="wk__p" style="margin-left:auto">${done} / 7 完成</span>
          </div>
          <div class="rev__grid">
            <div class="field">
              <label for="r-done-${w.week}">完成了什么</label>
              <textarea id="r-done-${w.week}" rows="3" data-rev="${w.week}" data-key="done" placeholder="具体到产出物">${esc(r.done || "")}</textarea>
            </div>
            <div class="field">
              <label for="r-stuck-${w.week}">卡在哪一步</label>
              <textarea id="r-stuck-${w.week}" rows="3" data-rev="${w.week}" data-key="stuck" placeholder="具体到哪一步、哪一行">${esc(r.stuck || "")}</textarea>
            </div>
            <div class="field">
              <label for="r-adjust-${w.week}">下周砍掉什么</label>
              <textarea id="r-adjust-${w.week}" rows="3" data-rev="${w.week}" data-key="adjust" placeholder="砍掉一项，比加三项有用">${esc(r.adjust || "")}</textarea>
            </div>
          </div>
        </article>`;
      })
      .join("");
  }

  /* ---------------- 进度 ---------------- */
  function renderProgress() {
    const s = stats();
    $("pDone").textContent = s.done;
    $("pHours").textContent = (s.minutes / 60).toFixed(1);
    $("pStreak").textContent = s.streak;
    $("pRate").textContent = s.rate + "%";

    const phases = {};
    DAYS.forEach((d) => {
      phases[d.phase] = phases[d.phase] || { total: 0, done: 0 };
      phases[d.phase].total++;
      if (statusOf(d.id) === "done") phases[d.phase].done++;
    });
    const names = { A: "打底", B: "RAG", C: "Agent", D: "可观测与安全", E: "MCP 与作品", F: "缓冲与求职" };
    $("phaseBars").innerHTML = Object.keys(phases)
      .sort()
      .map((k) => {
        const p = phases[k];
        const pct = Math.round((p.done / p.total) * 100);
        return `<li>
          <div class="bar__top"><span>阶段 ${k} · ${names[k]}</span><span class="bar__n">${p.done} / ${p.total}</span></div>
          <div class="bar__track"><span class="bar__fill" style="width:${pct}%"></span></div>
        </li>`;
      })
      .join("");

    $("weekChart").innerHTML = PLAN.weeks
      .map((w) => {
        const done = w.days.filter((d) => statusOf(d.id) === "done").length;
        return `<div class="wc" title="第 ${w.week} 周：${done} / 7 天">
          <div class="wc__bar"><span style="height:${(done / 7) * 100}%"></span></div>
          <div class="wc__l">${w.week}</div>
        </div>`;
      })
      .join("");

    const doneDays = DAYS.filter((d) => statusOf(d.id) === "done").reverse();
    $("doneList").innerHTML = doneDays.length
      ? doneDays
          .map((d) => `<li class="done-row">
            <span class="done-row__d">第 ${d.day} 天</span>
            <span class="done-row__t">${esc(d.title)}</span>
            <span class="done-row__m">${fmtMin(dayState(d.id).minutes ?? d.minutes)}</span>
            <button class="btn btn--secondary btn--sm" type="button" data-day="${d.id}">回看并记笔记</button>
          </li>`)
          .join("")
      : `<li class="empty">还没有完成的课。</li>`;
  }

  /* ---------------- 详情弹层 ---------------- */
  function openDay(id) {
    const i = IDX.get(id);
    const d = DAYS[i];
    if (!d) return;
    if (isLocked(i)) {
      const cur = currentIdx();
      toast(`先完成第 ${DAYS[cur].day} 天，第 ${d.day} 天才会解锁`);
      return;
    }
    const st = statusOf(id);
    const ds = dayState(id);
    const isCurrent = i === currentIdx();
    const refs = (d.refs || []).map((r) => RES[r]).filter(Boolean);
    $("dlgKicker").textContent = `第 ${d.week} 周 · 第 ${d.day} 天 · ${fmtMin(d.minutes)} · ${st === "done" ? "已完成" : isCurrent ? "今天" : "已解锁"}`;
    $("dlgTitle").textContent = d.title;
    $("dlgBody").innerHTML = `
      <h3>目标</h3><p>${esc(d.goal)}</p>
      <h3>任务</h3><ul>${d.tasks.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
      <h3>产出物</h3><p>${esc(d.deliverable)}</p>
      ${refs.length ? `<h3>资源</h3><ul>${refs.map((r) => `<li><a class="dlg__res" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" data-ext title="${esc(r.url)}">${esc(r.title)} ↗</a> · ${metaOf(r)}${r.after ? `<br><span style="color:#9aa39a;font-size:13px">看完要能回答：${esc(r.after)}</span>` : ""}</li>`).join("")}</ul>` : ""}
      ${d.notesPrompt ? `<h3>今日自问</h3><p>${esc(d.notesPrompt)}</p>` : ""}
      ${st === "done" ? `<h3>复习笔记</h3>
        <label class="sr-only" for="dlgNote">复习笔记</label>
        <textarea id="dlgNote" data-day="${id}" rows="4" placeholder="回看时补一句：这条现在怎么理解、当时哪里想错了">${esc(ds.review || "")}</textarea>
        <p class="hint">随时补，输入即保存；不会覆盖当天的笔记。</p>` : ""}
      <div class="btn-row" style="margin-top:28px">
        ${isCurrent ? `<button class="btn btn--primary" type="button" data-set="${id}:done">完成第 ${d.day} 天，解锁下一天</button>` : ""}
        ${st === "done" && i === currentIdx() - 1 ? `<button class="btn btn--secondary" type="button" data-set="${id}:undo">撤销这一天的完成</button>` : ""}
        ${st === "done" && i !== currentIdx() - 1 ? `<p class="hint">要重做这一天，先从最近完成的一天往回撤销。</p>` : ""}
      </div>`;
    const dlg = $("dayDlg");
    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.setAttribute("open", "");
  }

  /* ---------------- 外部链接：预览环境下仍要能打开 ---------------- */
  let pendingUrl = "";

  function copyText(text) {
    return new Promise((resolve) => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => resolve(true), () => resolve(false));
        return;
      }
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      resolve(ok);
    });
  }

  function isEmbedded() {
    try { return window.top !== window.self; } catch (e) { return true; }
  }

  function showLinkDialog(url, title) {
    pendingUrl = url;
    $("linkUrl").value = url;
    $("linkTitle").textContent = title || "打开资源";
    $("linkNote").textContent = "预览窗口拦住了新标签。复制链接后粘到浏览器，或试试在新窗口打开。";
    const dlg = $("linkDlg");
    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.setAttribute("open", "");
  }

  /* ---------------- 路由 ---------------- */
  const TABS = ["today", "plan", "res", "q", "review", "progress"];
  let current = "today";

  function show(view, focus) {
    if (!TABS.includes(view)) view = "today";
    current = view;
    TABS.forEach((v) => {
      const tab = $("tab-" + v);
      const panel = $("panel-" + v);
      const on = v === view;
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.tabIndex = on ? 0 : -1;
      panel.hidden = !on;
    });
    if (view === "today") renderToday();
    if (view === "plan") renderPlan();
    if (view === "res") renderRes();
    if (view === "q") renderQuestions();
    if (view === "review") renderReviews();
    if (view === "progress") renderProgress();
    if (history.replaceState) history.replaceState(null, "", "#" + view);
    if (focus) $("panel-" + view).focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  /* ---------------- 事件 ---------------- */
  function bind() {
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => show(tab.id.replace("tab-", "")));
      tab.addEventListener("keydown", (e) => {
        const i = TABS.indexOf(current);
        let n = -1;
        if (e.key === "ArrowRight") n = (i + 1) % TABS.length;
        else if (e.key === "ArrowLeft") n = (i - 1 + TABS.length) % TABS.length;
        else if (e.key === "Home") n = 0;
        else if (e.key === "End") n = TABS.length - 1;
        if (n >= 0) {
          e.preventDefault();
          show(TABS[n]);
          $("tab-" + TABS[n]).focus();
        }
      });
    });

    document.querySelectorAll("[data-view]").forEach((el) =>
      el.addEventListener("click", (e) => {
        e.preventDefault();
        show(el.dataset.view);
      })
    );

    $("tTasks").addEventListener("change", (e) => {
      const input = e.target.closest("input[data-task]");
      if (!input) return;
      const d = DAYS[Math.min(currentIdx(), DAYS.length - 1)];
      const ds = dayState(d.id);
      ds.tasks = ds.tasks || {};
      ds.tasks[input.dataset.task] = input.checked;
      save();
    });

    $("tNote").addEventListener("input", (e) => {
      dayState(DAYS[Math.min(currentIdx(), DAYS.length - 1)].id).notes = e.target.value;
      $("noteHint").textContent = "保存中…";
      save();
      setTimeout(() => ($("noteHint").textContent = "已保存 · 存在本机浏览器"), 400);
    });

    $("doneBtn").addEventListener("click", () => {
      const i = currentIdx();
      if (i >= DAYS.length) {
        toast("98 天已经全部完成");
        return;
      }
      const d = DAYS[i];
      const ds = dayState(d.id);
      ds.status = "done";
      ds.doneAt = ymd(new Date());
      ds.minutes = ds.minutes ?? d.minutes;
      save();
      renderToday();
      const left = DAYS.length - stats().done;
      toast(left ? `第 ${d.day} 天完成，解锁第 ${d.day + 1} 天` : "98 天全部完成，可以开始做作品集了");
    });

    // 顺延：不标记完成，日期自然推到明天（解锁规则保证不会跳天）
    $("deferBtn").addEventListener("click", () => {
      const i = currentIdx();
      if (i >= DAYS.length) return;
      const ds = dayState(DAYS[i].id);
      ds.defer = (ds.defer || 0) + 1;
      save();
      renderToday();
      toast(`已顺延 ${ds.defer} 次，明天继续第 ${DAYS[i].day} 天`);
    });

    // 撤销：把上一个完成的天退回，它重新成为「今天」
    $("undoBtn").addEventListener("click", () => {
      const prev = currentIdx() - 1;
      if (prev < 0) {
        toast("还没有可撤销的记录");
        return;
      }
      const ds = dayState(DAYS[prev].id);
      delete ds.status;
      delete ds.doneAt;
      save();
      renderToday();
      toast(`已撤销第 ${DAYS[prev].day} 天，重新回到这一关`);
    });

    $("tqForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const input = $("tqInput");
      addQuestion(input.value, DAYS[Math.min(currentIdx(), DAYS.length - 1)].id);
      input.value = "";
    });

    $("qForm").addEventListener("submit", (e) => {
      e.preventDefault();
      addQuestion($("qText").value, $("qDay").value);
      $("qText").value = "";
    });

    $("qList").addEventListener("change", (e) => {
      const sel = e.target.closest("[data-qstatus]");
      if (!sel) return;
      const q = state.questions.find((x) => x.id === sel.dataset.qstatus);
      if (!q) return;
      q.status = sel.value;
      if (sel.value === "done" && !q.nextReview) {
        q.nextReview = ymd(addDays(new Date(), NEXT_GAP[0]));
        q.reviews = q.reviews || 0;
      }
      save();
      renderQuestions();
    });
    $("qList").addEventListener("input", (e) => {
      const ta = e.target.closest("[data-qanswer]");
      if (!ta) return;
      const q = state.questions.find((x) => x.id === ta.dataset.qanswer);
      if (q) {
        q.answer = ta.value;
        save();
      }
    });
    $("qList").addEventListener("click", (e) => {
      const rev = e.target.closest("[data-qreview]");
      if (rev) {
        const q = state.questions.find((x) => x.id === rev.dataset.qreview);
        if (!q) return;
        q.reviews = (q.reviews || 0) + 1;
        q.nextReview = ymd(addDays(new Date(), NEXT_GAP[Math.min(q.reviews, NEXT_GAP.length - 1)]));
        save();
        renderQuestions();
        toast(`复习 ${q.reviews} 次，下次 ${q.nextReview}`);
        return;
      }
      const del = e.target.closest("[data-qdel]");
      if (del) {
        state.questions = state.questions.filter((x) => x.id !== del.dataset.qdel);
        save();
        renderQuestions();
      }
    });

    document.addEventListener("click", (e) => {
      const day = e.target.closest("[data-day]");
      if (day) {
        openDay(day.dataset.day);
        return;
      }
      const set = e.target.closest("[data-set]");
      if (set) {
        const [id, value] = set.dataset.set.split(":");
        const ds = dayState(id);
        if (value === "done") {
          ds.status = "done";
          ds.doneAt = ymd(new Date());
          ds.minutes = ds.minutes ?? DAYS[IDX.get(id)].minutes;
        } else if (value === "undo") {
          delete ds.status;
          delete ds.doneAt;
        }
        save();
        $("dayDlg").close();
        show(current);
        toast(value === "done" ? "已完成，下一天解锁" : "已撤销这一天");
        return;
      }
      if (e.target.closest("#dlgClose")) $("dayDlg").close();
    });
    $("dayDlg").addEventListener("click", (e) => {
      if (e.target === $("dayDlg")) $("dayDlg").close();
    });
    $("dayDlg").addEventListener("input", (e) => {
      const ta = e.target.closest("#dlgNote");
      if (!ta) return;
      const id = ta.dataset.day;
      if (!id) return;
      dayState(id).review = ta.value;
      save();
    });

    // 预览 iframe 会拦截 target=_blank：先试新窗口，再退到「复制链接」弹层
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[data-ext]");
      if (!a) return;
      if (!isEmbedded()) return;
      e.preventDefault();
      let win = null;
      try { win = window.open(a.href, "_blank", "noopener,noreferrer"); } catch (err) { win = null; }
      if (win) return;
      const title = a.querySelector(".res__t")?.textContent || a.textContent.trim();
      showLinkDialog(a.href, title);
    });

    $("linkCopy").addEventListener("click", async () => {
      const ok = await copyText(pendingUrl);
      toast(ok ? "链接已复制，粘到浏览器就能打开" : "复制失败，请手动选中地址复制");
      if (ok) $("linkDlg").close();
    });
    $("linkOpen").addEventListener("click", () => {
      let win = null;
      try { win = window.open(pendingUrl, "_blank", "noopener,noreferrer"); } catch (err) { win = null; }
      if (win) $("linkDlg").close();
      else toast("仍被拦截，请用复制链接");
    });
    $("linkClose").addEventListener("click", () => $("linkDlg").close());
    $("linkDlg").addEventListener("click", (e) => {
      if (e.target === $("linkDlg")) $("linkDlg").close();
    });
  }

  function addQuestion(text, day) {
    const t = (text || "").trim();
    if (!t) {
      toast("先写一句疑点");
      return;
    }
    state.questions.push({
      id: "q" + Date.now().toString(36),
      text: t,
      day,
      status: "open",
      answer: "",
      created: Date.now(),
      nextReview: "",
      reviews: 0,
    });
    save();
    if (current === "q") renderQuestions();
    toast("记下了，周日统一清理");
  }

  /* ---------------- 启动 ---------------- */
  bind();

  if (isEmbedded()) {
    $("envBar").hidden = false;
    document.body.classList.add("has-envbar");
    $("envClose").addEventListener("click", () => {
      $("envBar").hidden = true;
      document.body.classList.remove("has-envbar");
    });
  }

  const initial = (location.hash || "#today").slice(1);
  show(TABS.includes(initial) ? initial : "today");
  $("navDate").textContent = ymd(new Date());
})();
