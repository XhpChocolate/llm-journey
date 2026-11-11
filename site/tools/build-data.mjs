// 把 learning-workbench/dist/plan.json 编译成站点可直接读的 data/plan.js
// 用法: node tools/build-data.mjs
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(here, "..");
const src = join(siteRoot, "..", "dist", "plan.json");
const out = join(siteRoot, "data", "plan.js");

const plan = JSON.parse(await readFile(src, "utf8"));

// 题库与计划分开维护：quizzes.json 由 build.py 从 quizzes/*.yaml 生成
let briefs = {};
try {
  briefs = JSON.parse(await readFile(join(siteRoot, "..", "dist", "briefs.json"), "utf8"));
} catch (e) {
  console.warn("dist/briefs.json 缺失，先运行 build.py");
}

let quizzes = {};
try {
  quizzes = JSON.parse(await readFile(join(siteRoot, "..", "dist", "quizzes.json"), "utf8"));
} catch (e) {
  console.warn("dist/quizzes.json 缺失，先运行 build.py");
}

const slim = {
  schema: plan.schema,
  totalWeeks: plan.total_weeks,
  totalDays: plan.total_days,
  totalMinutes: plan.total_minutes,
  resources: plan.resources,
  briefs,
  quizzes,
  weeks: plan.weeks.map((w) => ({
    week: w.week,
    phase: w.phase,
    phaseName: w.phase_name,
    theme: w.theme,
    goal: w.goal,
    acceptance: w.acceptance,
    days: w.days.map((d) => ({
      id: d.id,
      day: d.day,
      title: d.title,
      minutes: d.minutes,
      goal: d.goal,
      tasks: d.tasks,
      deliverable: d.deliverable,
      notesPrompt: d.notes_prompt,
      refs: d.refs.map((r) => r.id),
    })),
  })),
};

const body =
  "/* 由 tools/build-data.mjs 从 ../dist/plan.json 生成，请勿手改。 */\n" +
  "window.__PLAN__ = " +
  JSON.stringify(slim) +
  ";\n";

await writeFile(out, body, "utf8");
const kb = (Buffer.byteLength(body) / 1024).toFixed(0);
const qCount = Object.values(quizzes).reduce((n, arr) => n + arr.length, 0);
const bCount = Object.values(briefs).reduce((n, a) => n + a.length, 0);
console.log(`任务卡: ${bCount} 个 / ${Object.keys(briefs).length} 天`);
console.log(`data/plan.js: ${slim.totalDays} 天 / ${Object.keys(slim.resources).length} 资源 / ${qCount} 题 / ${kb} KB`);
