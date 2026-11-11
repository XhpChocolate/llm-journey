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
  const QUIZ = PLAN.quizzes || {};
  const BRIEFS = PLAN.briefs || {};
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
    return { v: 1, start: ymd(new Date()), days: {}, questions: [], reviews: {}, quizSeed: {} };
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

  /* ---------------- 今日小测 ---------------- */
  const redoing = new Set();   // 「错题本」里正在重做的题，key = dayId:k

  function redoBody(w) {
    const it = w.it;
    const id = w.day.id, k = w.k;
    if (it.type === "choice") {
      return `<div class="qi__opts">${it.options
        .map((o, j) => `<button class="opt" type="button" data-redo-opt="${id}" data-k="${k}" data-opt="${j}"><span class="opt__k">${String.fromCharCode(65 + j)}</span>${esc(o)}</button>`)
        .join("")}</div>`;
    }
    if (it.type === "judge") {
      return `<div class="qi__opts qi__opts--row">
        <button class="opt" type="button" data-redo-opt="${id}" data-k="${k}" data-judge="true">对</button>
        <button class="opt" type="button" data-redo-opt="${id}" data-k="${k}" data-judge="false">错</button>
      </div>`;
    }
    return `<p class="qi__ans">参考答案：${esc(it.answer)}</p>
      <div class="qi__row">
        <button class="btn btn--quiet btn--sm" type="button" data-redo-self="right" data-k="${k}" data-dayid="${id}">答对了</button>
        <button class="btn btn--quiet btn--sm" type="button" data-redo-self="partial" data-k="${k}" data-dayid="${id}">部分对</button>
        <button class="btn btn--quiet btn--sm" type="button" data-redo-self="wrong" data-k="${k}" data-dayid="${id}">没答上</button>
      </div>`;
  }
  const revealed = {};   // 简答题「已看答案」的临时标记，不入库

  function quizOf(id) { return QUIZ[id] || []; }
  function quizState(id) {
    const ds = dayState(id);
    ds.quiz = ds.quiz || {};
    return ds.quiz;
  }

  const QUIZ_DRAW = 2;   // 每次抽几题

  // 按 天 id 和 seed 做确定性洗牌：同一个 seed 刷新后抽到同一组
  function drawQuiz(dayId, items) {
    if (items.length <= QUIZ_DRAW) return items.map((it, k) => ({ it, k }));
    let h = ((state.quizSeed?.[dayId] || 0) * 7919 + 17) % 2147483647;
    for (const ch of dayId) h = (h * 131 + ch.charCodeAt(0)) % 2147483647;
    const idx = items.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      h = (h * 1103515245 + 12345) % 2147483648;
      const j = h % (i + 1);
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx.slice(0, QUIZ_DRAW).sort((a, b) => a - b).map((k) => ({ it: items[k], k }));
  }

  function quizItem(it, k, id, res, pick) {
    const tag = it.type === "choice" ? "单选" : it.type === "judge" ? "判断" : "简答";
    let body = "";
    if (it.type === "choice") {
      body = `<div class="qi__opts">${it.options
        .map((o, j) => {
          const cls = res ? (j === it.answer ? "is-right" : pick === String(j) ? "is-pick-wrong" : "is-dim") : "";
          return `<button class="opt ${cls}" type="button" data-k="${k}" data-opt="${j}"${res ? " disabled" : ""}>
            <span class="opt__k">${String.fromCharCode(65 + j)}</span>${esc(o)}</button>`;
        })
        .join("")}</div>`;
    } else if (it.type === "judge") {
      const picked = (v) => (res && pick === String(v) ? " is-pick-wrong" : "");
      body = `<div class="qi__opts qi__opts--row">
        <button class="opt${res && it.answer === true ? " is-right" : picked(true)}" type="button" data-k="${k}" data-judge="true"${res ? " disabled" : ""}>对</button>
        <button class="opt${res && it.answer === false ? " is-right" : picked(false)}" type="button" data-k="${k}" data-judge="false"${res ? " disabled" : ""}>错</button>
      </div>`;
    } else {
      const show = res || revealed[id + k];
      body = `<textarea rows="3" data-draft="${id + ":" + k}" placeholder="先自己写一句，再看参考答案">${esc(dayState(id).quizDraft?.[k] || "")}</textarea>
        <div class="qi__row">
          <button class="btn btn--secondary btn--sm" type="button" data-reveal="${k}">${show ? "收起答案" : "看参考答案"}</button>
          ${show ? `<button class="btn btn--quiet btn--sm" type="button" data-self="right" data-k="${k}">答对了</button>
          <button class="btn btn--quiet btn--sm" type="button" data-self="partial" data-k="${k}">部分对</button>
          <button class="btn btn--quiet btn--sm" type="button" data-self="wrong" data-k="${k}">没答上</button>` : ""}
        </div>`;
    }
    const fb = res
      ? `<div class="qi__fb ${res === "right" ? "is-ok" : res === "partial" ? "is-mid" : "is-bad"}">
          <p class="qi__ans">${it.type === "short" ? "参考答案：" + esc(it.answer) : it.type === "judge" ? "正确答案：" + (it.answer ? "对" : "错") : "正确答案：" + String.fromCharCode(65 + it.answer) + ". " + esc(it.options[it.answer])}${res !== "right" && pick !== undefined && it.type !== "short" ? `<span class="qi__pick">你选了：${it.type === "judge" ? (pick === "true" ? "对" : "错") : String.fromCharCode(65 + Number(pick))}</span>` : ""}</p>
          <p class="qi__ex">${esc(it.explain)}</p>
        </div>`
      : "";
    return `<li class="qi${res ? " is-answered" : ""}">
      <p class="qi__type">${tag}</p>
      <p class="qi__q">${esc(it.q)}</p>
      ${body}${fb}
    </li>`;
  }

  function renderQuiz() {
    const i = Math.min(currentIdx(), DAYS.length - 1);
    const d = DAYS[i];
    const items = quizOf(d.id);
    const st = quizState(d.id);
    const drawn = drawQuiz(d.id, items);
    const done = drawn.filter((x) => st[x.k]).length;
    const right = drawn.filter((x) => st[x.k] === "right").length;
    $("quizCard").hidden = items.length === 0;
    $("quizScore").textContent = items.length
      ? `${done} / ${drawn.length} 已答 · 对 ${right}` + (items.length > drawn.length ? ` · 题库 ${items.length} 题` : "")
      : "";
    $("quizShuffle").hidden = items.length <= drawn.length;
    $("quizGate").textContent =
      items.length && done < drawn.length ? `还有 ${drawn.length - done} 道小测没做，答错不影响打卡` : "";
    $("quizList").innerHTML = items.length
      ? drawn.map(({ it, k }) => quizItem(it, k, d.id, st[k], st["p" + k])).join("")
      : `<li class="empty">这一关没有配题。</li>`;
  }

  /* ---------------- 随机刷题 ---------------- */
  let drillPhase = "all";
  let drillItems = [];

  const phaseOf = (dayId) => {
    const d = DAYS[IDX.get(dayId)];
    return d ? d.phase : "";
  };

  function drawDrill(n = 5) {
    const pool = [];
    DAYS.forEach((d) => {
      if (drillPhase !== "all" && d.phase !== drillPhase) return;
      (QUIZ[d.id] || []).forEach((it, k) => pool.push({ dayId: d.id, k, it }));
    });
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    drillItems = pool.slice(0, Math.min(n, pool.length));
  }

  function renderDrill() {
    const prac = state.practice || (state.practice = {});
    const answered = drillItems.filter((x) => prac[x.dayId + ":" + x.k]);
    const right = answered.filter((x) => prac[x.dayId + ":" + x.k] === "right").length;
    $("drillScore").textContent = drillItems.length
      ? `${answered.length} / ${drillItems.length} 已答 · 对 ${right}`
      : "";
    $("drillList").innerHTML = drillItems.length
      ? drillItems
          .map(({ dayId, k, it }) => {
            const res = prac[dayId + ":" + k];
            const opts =
              it.type === "choice"
                ? `<div class="qi__opts">${it.options
                    .map((o, j) => {
                      const cls = res ? (j === it.answer ? "is-right" : "is-dim") : "";
                      return `<button class="opt ${cls}" type="button" data-drill-opt="${dayId}" data-k="${k}" data-opt="${j}"${res ? " disabled" : ""}><span class="opt__k">${String.fromCharCode(65 + j)}</span>${esc(o)}</button>`;
                    })
                    .join("")}</div>`
                : it.type === "judge"
                  ? `<div class="qi__opts qi__opts--row">
                      <button class="opt${res && it.answer === true ? " is-right" : ""}" type="button" data-drill-opt="${dayId}" data-k="${k}" data-judge="true"${res ? " disabled" : ""}>对</button>
                      <button class="opt${res && it.answer === false ? " is-right" : ""}" type="button" data-drill-opt="${dayId}" data-k="${k}" data-judge="false"${res ? " disabled" : ""}>错</button>
                    </div>`
                  : `<p class="qi__ans">参考答案：${esc(it.answer)}</p>`;
            const fb = res
              ? `<div class="qi__fb ${res === "right" ? "is-ok" : "is-bad"}"><p class="qi__ex">${esc(it.explain)}</p></div>`
              : "";
            return `<li class="qi${res ? " is-answered" : ""}">
              <p class="qi__type">第 ${DAYS[IDX.get(dayId)].day} 天 · ${it.type === "choice" ? "单选" : it.type === "judge" ? "判断" : "简答"}</p>
              <p class="qi__q">${esc(it.q)}</p>${opts}${fb}
            </li>`;
          })
          .join("")
      : `<li class="empty">这个阶段暂时没有题。</li>`;
  }

  /* ---------------- 任务卡 ---------------- */
  function briefOf(dayId, k) {
    return (BRIEFS[dayId] || []).find((b) => b.i === k);
  }

  function openBrief(dayId, k) {
    const d = DAYS[IDX.get(dayId)];
    const task = (d.tasks || [])[k] || "";
    const b = briefOf(dayId, k);
    $("briefKicker").textContent = `第 ${d.week} 周 · 第 ${d.day} 天 · 第 ${k + 1} 个任务`;
    $("briefTitle").textContent = task;
    if (!b) {
      const refs = (d.refs || []).map((id) => RES[id]).filter(Boolean);
      $("briefBody").innerHTML = `
        <p class="hint">这一天还没有写详细任务卡（目前覆盖第 1 周）。下面是当天目标和资源，可以自己拆步骤。</p>
        <h3>当天目标</h3><p>${esc(d.goal)}</p>
        <h3>产出物</h3><p>${esc(d.deliverable)}</p>
        ${refs.length ? `<h3>当天资源</h3><ul>${refs.map((r) => `<li><a class="dlg__res" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" data-ext>${esc(r.title)} ↗</a> · ${r.minutes} 分钟</li>`).join("")}</ul>` : ""}`;
    } else {
      const refs = (b.refs || []).length
        ? b.refs.map((id) => RES[id]).filter(Boolean)
        : (d.refs || []).map((id) => RES[id]).filter(Boolean);
      const mats = refs.length
        ? `<h3>学习材料${b.focus ? `<span class="brief-focus">${esc(b.focus)}</span>` : ""}</h3>
           <ul class="mats">${refs.map((r) => `<li class="mat">
             <a class="mat__link" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" data-ext title="${esc(r.url)}">
               <span class="mat__type">${TYPE_LABEL[r.type] || "资源"}</span>
               <span class="mat__t">${esc(r.title)}</span>
               <span class="mat__m">${fmtMin(r.minutes)}${r.author ? " · " + esc(r.author) : ""} ↗</span>
             </a></li>`).join("")}</ul>`
        : `<p class="hint">这个任务没有指定材料，按步骤直接做。</p>`;
      $("briefBody").innerHTML = `
        <h3>为什么做</h3><p>${esc(b.why)}</p>
        ${mats}
        <h3>动手步骤</h3><ol class="brief-steps">${(b.steps || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ol>
        <h3>练什么</h3><p>${esc(b.practice)}</p>
        <h3>怎么算过</h3><ul class="brief-check">${(b.check || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        ${b.pitfall ? `<h3>常见坑</h3><p class="brief-pit">${esc(b.pitfall)}</p>` : ""}`;
    }
    const dlg = $("briefDlg");
    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.setAttribute("open", "");
  }

  /* ---------------- 学习计时 ----------------
     只记录「有效学习时间」：
     - 必须手动点开始
     - 页面不可见 / 窗口失焦 / 5 分钟无操作 → 自动暂停，回来要手动继续
     - 用 performance.now() 计时，避免系统改时间影响
     - 每 5 秒把累计值落盘，刷新后不会丢，但不会补算关闭期间的时间 */
  const IDLE_LIMIT = 5 * 60 * 1000;   // 5 分钟无操作自动暂停
  let timer = { running: false, startedAt: 0, baseMs: 0, tickId: null, lastSave: 0, lastInput: 0 };
  let autoPausedReason = "";

  const timerOf = (id) => {
    const ds = dayState(id);
    ds.time = ds.time || { ms: 0, sessions: 0, running: false, totalAtFinish: null };
    return ds.time;
  };
  const nowMs = () => (performance && performance.now ? performance.now() : Date.now());

  function timerElapsed() {
    if (!timer.running) return timer.baseMs;
    return timer.baseMs + (nowMs() - timer.startedAt);
  }
  const fmtClock = (ms) => {
    const t = Math.max(0, Math.floor(ms / 1000));
    const hh = String(Math.floor(t / 3600)).padStart(2, "0");
    const mm = String(Math.floor((t % 3600) / 60)).padStart(2, "0");
    const ss = String(t % 60).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  };
  const fmtDur = (ms) => {
    if (!ms) return "0m";
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    const m = Math.round(ms / 60000);
    if (m < 60) return `${m}m`;
    return `${(m / 60).toFixed(m % 60 ? 1 : 0)}h`;
  };

  function startTimer() {
    const d = DAYS[Math.min(currentIdx(), DAYS.length - 1)];
    const t = timerOf(d.id);
    if (timer.running) return;
    timer.running = true;
    timer.baseMs = t.ms;
    timer.startedAt = nowMs();
    timer.lastInput = Date.now();
    t.running = true;
    t.sessions = (t.sessions || 0) + 1;
    autoPausedReason = "";
    timer.tickId = setInterval(() => {
      const el = timerElapsed();
      $("timerClock").textContent = fmtClock(el);
      const now = Date.now();
      if (now - timer.lastInput > IDLE_LIMIT) {
        pauseTimer("idle");
        return;
      }
      if (now - timer.lastSave > 5000) {
        t.ms = el;
        timer.lastSave = now;
        save();
      }
    }, 1000);
    renderTimer();
  }

  function pauseTimer(reason) {
    if (!timer.running) return;
    const d = DAYS[Math.min(currentIdx(), DAYS.length - 1)];
    const t = timerOf(d.id);
    t.ms = Math.max(t.ms, timerElapsed());
    t.running = false;
    timer.running = false;
    timer.baseMs = t.ms;
    clearInterval(timer.tickId);
    timer.tickId = null;
    if (reason === "hidden") autoPausedReason = "切走页面，已自动暂停";
    else if (reason === "blur") autoPausedReason = "窗口失去焦点，已自动暂停";
    else if (reason === "idle") autoPausedReason = "5 分钟没操作，已自动暂停";
    else autoPausedReason = "";
    save();
    renderTimer();
    if (reason) toast(autoPausedReason);
  }

  function renderTimer() {
    const d = DAYS[Math.min(currentIdx(), DAYS.length - 1)];
    const t = timerOf(d.id);
    const el = timer.running ? timerElapsed() : t.ms;
    $("timerClock").textContent = fmtClock(el);
    $("timerState").textContent = timer.running ? "计时中" : t.ms > 0 ? "已暂停" : "未开始";
    $("timerState").className = "timer-state" + (timer.running ? " is-running" : "");
    $("timerToggle").textContent = timer.running ? "暂停" : t.ms > 0 ? "继续" : "开始学习";
    $("timerReset").hidden = t.ms === 0 && !timer.running;
    $("timerHint").textContent = timer.running
      ? "正在记录。切走页面会自动暂停。"
      : autoPausedReason || (t.ms > 0 ? "已暂停，休息好再继续。" : "切走这个页面会自动暂停，回来点“继续”才计时。");
  }

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
        return `<li class="task-row">
          <label class="task"><input type="checkbox" data-task="${k}"${on ? " checked" : ""}><span class="task__t">${esc(t)}</span></label>
          <button class="task__more" type="button" data-brief="${k}">怎么学</button>
        </li>`;
      })
      .join("");
    $("tAsk").textContent = d.notesPrompt ? "今日自问：" + d.notesPrompt : "";
    $("undoBtn").hidden = !statusOf(d.id);


    const noteEl = $("tNote");
    if (document.activeElement !== noteEl) noteEl.value = ds.notes || "";

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

    renderQuiz();
    renderTimer();
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

    let answered = 0, rightN = 0, partialN = 0;
    DAYS.forEach((d) => {
      const q = state.days[d.id]?.quiz || {};
      Object.keys(q).forEach((k) => {
        if (!/^\d+$/.test(k)) return;
        answered++;
        if (q[k] === "right") rightN++;
        else if (q[k] === "partial") partialN++;
      });
    });
    // 学习时长统计
    const curD = DAYS[Math.min(currentIdx(), DAYS.length - 1)];
    const sumOf = (list) => list.reduce((n, d) => n + (state.days[d.id]?.time?.ms || 0), 0);
    // 今天：当前这一关 + 今天完成过的那些天（完成后当前关会前进）
    const todayStr = ymd(new Date());
    const todayMs = DAYS.reduce((n, d) => {
      const ds = state.days[d.id];
      if (!ds) return n;
      if (d.id === curD.id || ds.doneAt === todayStr) return n + (ds.time?.ms || 0);
      return n;
    }, 0);
    const weekMs = sumOf(DAYS.filter((d) => d.week === curD.week));
    const totalMs = sumOf(DAYS);
    const doneN = DAYS.filter((d) => statusOf(d.id) === "done").length;
    $("timeToday").textContent = fmtDur(todayMs);
    $("timeWeek").textContent = fmtDur(weekMs);
    $("timeTotal").textContent = fmtDur(totalMs);
    $("timeAvg").textContent = doneN ? fmtDur(totalMs / doneN) : "—";
    const planMin = curD.minutes;
    $("timeCompare").textContent = todayMs
      ? `今天计划 ${Math.round(planMin / 60 * 10) / 10} 小时，实际学了 ${(todayMs / 3600000).toFixed(1)} 小时。`
      : `今天还没有开始计时。这一关计划 ${Math.round(planMin / 60 * 10) / 10} 小时。`;

    $("quizSummary").textContent = answered
      ? `已答 ${answered} 题 · 答对 ${rightN} · 部分对 ${partialN} · 正确率 ${Math.round(((rightN + partialN * 0.5) / answered) * 100)}%`
      : "还没有答题记录。";

    // 错题本：答错或自评部分对的题
    const wrongs = [];
    DAYS.forEach((d) => {
      const q = state.days[d.id]?.quiz || {};
      Object.keys(q).forEach((k) => {
        if (!/^\d+$/.test(k)) return;
        if (q[k] !== "wrong" && q[k] !== "partial") return;
        const it = (QUIZ[d.id] || [])[Number(k)];
        if (it) wrongs.push({ day: d, it, k: Number(k), v: q[k], pick: q["p" + k] });
      });
    });
    $("wrongSummary").textContent = wrongs.length
      ? `共 ${wrongs.length} 题待复习，点「回看」跳回那一天。`
      : "还没有错题。答错或自评「部分对」的题会收到这里。";
    $("wrongList").innerHTML = wrongs.length
      ? wrongs
          .map((w) => {
            const ans = w.it.type === "judge" ? (w.it.answer ? "对" : "错")
              : w.it.type === "choice" ? String.fromCharCode(65 + w.it.answer) + ". " + esc(w.it.options[w.it.answer])
              : esc(w.it.answer);
            const mine = w.it.type === "judge" ? (w.pick === "true" ? "对" : w.pick === "false" ? "错" : "—")
              : w.it.type === "choice" ? (w.pick !== undefined ? String.fromCharCode(65 + Number(w.pick)) : "—")
              : "自评";
            const key = w.day.id + ":" + w.k;
            const isRedo = redoing.has(key);
            return `<li class="wrong-row${isRedo ? " is-redo" : ""}">
              <p class="wrong-row__q"><span class="wrong-row__day">第 ${w.day.day} 天</span>${esc(w.it.q)}</p>
              ${isRedo ? redoBody(w) : `<p class="wrong-row__m">你选了 ${mine} · 正确答案 ${ans}</p>
              <p class="wrong-row__e">${esc(w.it.explain)}</p>`}
              <div class="qi__row">
                ${isRedo
                  ? `<button class="btn btn--quiet btn--sm" type="button" data-redo-cancel="${key}">取消</button>`
                  : `<button class="btn btn--secondary btn--sm" type="button" data-redo="${key}">重做这题</button>
                     <button class="btn btn--quiet btn--sm" type="button" data-open-day="${w.day.id}">回看这一天</button>`}
              </div>
            </li>`;
          })
          .join("")
      : "";

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
      ${quizOf(id).length ? `<h3>当天小测</h3><ul class="dlg-quiz">${quizOf(id).map((it, k) => {
        const q = ds.quiz?.[k];
        const label = q === "right" ? "答对" : q === "partial" ? "部分对" : q === "wrong" ? "答错" : "未答";
        const cls = q === "right" ? "is-ok" : q === "partial" ? "is-mid" : q === "wrong" ? "is-bad" : "";
        const ans = it.type === "judge" ? (it.answer ? "对" : "错") : it.type === "choice" ? String.fromCharCode(65 + it.answer) + ". " + esc(it.options[it.answer]) : esc(it.answer);
        return `<li class="${cls}"><p class="dlg-quiz__q">${esc(it.q)}</p><p class="dlg-quiz__a">${label} · 正确答案 ${ans}</p></li>`;
      }).join("")}</ul>` : ""}
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
      pauseTimer();
      const spent = timerOf(d.id).ms;
      ds.status = "done";
      ds.doneAt = ymd(new Date());
      ds.time = timerOf(d.id);
      ds.time.totalAtFinish = spent;
      save();
      renderToday();
      const left = DAYS.length - stats().done;
      const spentTxt = spent > 0 ? `，今天学了 ${fmtDur(spent)}` : "";
      toast(left ? `第 ${d.day} 天完成${spentTxt}，解锁第 ${d.day + 1} 天` : `98 天全部完成${spentTxt}`);
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

    $("dayResBtn").addEventListener("click", () => {
      openDay(DAYS[Math.min(currentIdx(), DAYS.length - 1)].id);
    });

    $("tTasks").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-brief]");
      if (!btn) return;
      e.preventDefault();
      const d = DAYS[Math.min(currentIdx(), DAYS.length - 1)];
      openBrief(d.id, Number(btn.dataset.brief));
    });
    $("briefClose").addEventListener("click", () => $("briefDlg").close());
    $("briefDlg").addEventListener("click", (e) => {
      if (e.target === $("briefDlg")) $("briefDlg").close();
    });

    $("timerToggle").addEventListener("click", () => {
      if (timer.running) pauseTimer();
      else startTimer();
    });
    $("timerReset").addEventListener("click", () => {
      const d = DAYS[Math.min(currentIdx(), DAYS.length - 1)];
      if (!confirm("清零今天的计时？已经记录的时间会删掉。")) return;
      pauseTimer();
      const t = timerOf(d.id);
      t.ms = 0; t.sessions = 0; t.totalAtFinish = null;
      timer.baseMs = 0;
      save();
      renderTimer();
      toast("今天的计时已清零");
    });

    // 自动暂停：切走页面、窗口失焦、长时间无操作
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && timer.running) pauseTimer("hidden");
    });
    window.addEventListener("blur", () => {
      if (timer.running) pauseTimer("blur");
    });
    ["mousemove", "keydown", "scroll", "touchstart", "click"].forEach((ev) =>
      window.addEventListener(ev, () => { timer.lastInput = Date.now(); }, { passive: true })
    );
    window.addEventListener("beforeunload", () => {
      if (!timer.running) return;
      const d = DAYS[Math.min(currentIdx(), DAYS.length - 1)];
      const t = timerOf(d.id);
      t.ms = Math.max(t.ms, timerElapsed());
      t.running = false;
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    });

    $("drillOpen").addEventListener("click", () => {
      drawDrill(5);
      renderDrill();
      const dlg = $("drillDlg");
      if (typeof dlg.showModal === "function") dlg.showModal();
      else dlg.setAttribute("open", "");
    });
    $("drillClose").addEventListener("click", () => $("drillDlg").close());
    $("drillStart").addEventListener("click", () => {
      drawDrill(5);
      renderDrill();
    });
    $("drillPhase").addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      drillPhase = chip.dataset.phase;
      [...$("drillPhase").children].forEach((c) => c.classList.toggle("is-on", c === chip));
      drawDrill(5);
      renderDrill();
    });
    $("drillList").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-drill-opt]");
      if (!btn) return;
      const dayId = btn.dataset.drillOpt;
      const k = Number(btn.dataset.k);
      const item = (QUIZ[dayId] || [])[k];
      if (!item) return;
      const correct = btn.dataset.opt !== undefined
        ? Number(btn.dataset.opt) === item.answer
        : (btn.dataset.judge === "true") === item.answer;
      state.practice = state.practice || {};
      state.practice[dayId + ":" + k] = correct ? "right" : "wrong";
      save();
      renderDrill();
    });

    // 错题本：进入/退出重做、重做判分
    $("wrongList").addEventListener("click", (e) => {
      const go = e.target.closest("[data-redo]");
      if (go) {
        redoing.add(go.dataset.redo);
        renderProgress();
        return;
      }
      const cancel = e.target.closest("[data-redo-cancel]");
      if (cancel) {
        redoing.delete(cancel.dataset.redoCancel);
        renderProgress();
        return;
      }
      const opt = e.target.closest("[data-redo-opt]");
      if (opt) {
        const id = opt.dataset.redoOpt, k = Number(opt.dataset.k);
        const item = (QUIZ[id] || [])[k];
        if (!item) return;
        const st = quizState(id);
        const correct = opt.dataset.opt !== undefined
          ? Number(opt.dataset.opt) === item.answer
          : (opt.dataset.judge === "true") === item.answer;
        st[k] = correct ? "right" : "wrong";
        st["p" + k] = opt.dataset.opt !== undefined ? String(opt.dataset.opt) : opt.dataset.judge;
        redoing.delete(id + ":" + k);
        save();
        renderProgress();
        toast(correct ? "答对了，已移出错题本" : "还是不对，看一遍解析再试");
        return;
      }
      const self = e.target.closest("[data-redo-self]");
      if (self) {
        const id = self.dataset.dayid, k = Number(self.dataset.k);
        const st = quizState(id);
        st[k] = self.dataset.redoSelf;
        redoing.delete(id + ":" + k);
        save();
        renderProgress();
        toast(self.dataset.redoSelf === "right" ? "标记为已掌握" : "继续留在错题本");
      }
    });

    $("quizShuffle").addEventListener("click", () => {
      const d = DAYS[Math.min(currentIdx(), DAYS.length - 1)];
      state.quizSeed = state.quizSeed || {};
      state.quizSeed[d.id] = (state.quizSeed[d.id] || 0) + 1;
      save();
      renderQuiz();
    });

    $("quizList").addEventListener("click", (e) => {
      const d = DAYS[Math.min(currentIdx(), DAYS.length - 1)];
      const items = quizOf(d.id);
      const st = quizState(d.id);

      const opt = e.target.closest("[data-opt]");
      if (opt) {
        const k = Number(opt.dataset.k);
        st[k] = Number(opt.dataset.opt) === items[k].answer ? "right" : "wrong";
        st["p" + k] = String(opt.dataset.opt);
        save(); renderQuiz(); return;
      }
      const jb = e.target.closest("[data-judge]");
      if (jb) {
        const k = Number(jb.dataset.k);
        st[k] = (jb.dataset.judge === "true") === items[k].answer ? "right" : "wrong";
        st["p" + k] = jb.dataset.judge;
        save(); renderQuiz(); return;
      }
      const rv = e.target.closest("[data-reveal]");
      if (rv) {
        const key = d.id + rv.dataset.reveal;
        revealed[key] = !revealed[key];
        renderQuiz(); return;
      }
      const self = e.target.closest("[data-self]");
      if (self) {
        st[Number(self.dataset.k)] = self.dataset.self;
        save(); renderQuiz(); return;
      }
    });

    $("quizList").addEventListener("input", (e) => {
      const ta = e.target.closest("[data-draft]");
      if (!ta) return;
      const [id, k] = ta.dataset.draft.split(":");
      const ds = dayState(id);
      ds.quizDraft = ds.quizDraft || {};
      ds.quizDraft[k] = ta.value;
      save();
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
      const openDayBtn = e.target.closest("[data-open-day]");
      if (openDayBtn) {
        openDay(openDayBtn.dataset.openDay);
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
