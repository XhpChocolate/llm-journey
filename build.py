#!/usr/bin/env python3
"""把 weeks/*.yaml + resources.yaml 编译成可读计划与可打卡的工作台。

用法:
    python3 build.py

产物:
    dist/plan.md        可阅读的完整计划（带可点击资源链接）
    dist/plan.csv       可导入飞书/Notion/表格的平面数据
    dist/学习工作台.xlsx 带打卡、疑点、复盘、统计的工作簿

说明: 运行环境没有 PyYAML，这里自带一个只支持本项目所用子集的
极小 YAML 解析器（映射、列表、行内列表、整数/布尔标量）。
"""

from __future__ import annotations

import csv
import json
import re
import sys
from datetime import date
from pathlib import Path

from openpyxl import Workbook
from openpyxl.formatting.rule import CellIsRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

ROOT = Path(__file__).resolve().parent
WEEKS_DIR = ROOT / "weeks"
DIST = ROOT / "dist"

STATUS_OPTIONS = ["未开始", "进行中", "已完成", "顺延", "跳过"]


# --------------------------------------------------------------------------
# 极简 YAML 子集解析
# --------------------------------------------------------------------------
def _scalar(text: str):
    text = text.strip()
    if text.startswith("[") and text.endswith("]"):
        inner = text[1:-1].strip()
        if not inner:
            return []
        return [_scalar(x) for x in inner.split(",")]
    if text in ("true", "True"):
        return True
    if text in ("false", "False"):
        return False
    if re.fullmatch(r"-?\d+", text):
        return int(text)
    if len(text) >= 2 and text[0] == text[-1] and text[0] in "\"'":
        return text[1:-1]
    return text


def _lines(text: str):
    out = []
    for raw in text.splitlines():
        if not raw.strip() or raw.lstrip().startswith("#"):
            continue
        if "\t" in raw:
            raise ValueError(f"制表符不允许，请用空格缩进: {raw!r}")
        stripped = raw.lstrip(" ")
        out.append((len(raw) - len(stripped), stripped.rstrip()))
    return out


def _parse_block(lines, i, indent):
    if i >= len(lines):
        return {}, i
    if lines[i][1].startswith("- "):
        return _parse_list(lines, i, indent)
    return _parse_dict(lines, i, indent)


def _parse_dict(lines, i, indent):
    data = {}
    while i < len(lines):
        ind, content = lines[i]
        if ind < indent:
            break
        if ind > indent:
            raise ValueError(f"缩进异常: {content!r}")
        if content.startswith("- "):
            break
        key, sep, val = content.partition(":")
        if not sep:
            raise ValueError(f"缺少冒号: {content!r}")
        key, val = key.strip(), val.strip()
        if val == "":
            i += 1
            if i < len(lines) and lines[i][0] > indent:
                child, i = _parse_block(lines, i, lines[i][0])
                data[key] = child
            else:
                data[key] = {}
        else:
            if ": " in val:
                raise ValueError(f"标量里出现 ': '，需要加引号: {val!r}")
            data[key] = _scalar(val)
            i += 1
    return data, i


def _parse_list(lines, i, indent):
    items = []
    while i < len(lines):
        ind, content = lines[i]
        if ind < indent:
            break
        if ind > indent:
            raise ValueError(f"列表缩进异常: {content!r}")
        if not content.startswith("- "):
            break
        # 单个条目：把 "- key: val" 变成缩进 +2 的 "key: val"，
        # 再收拢该条目后续更深缩进的行，整体按映射解析。
        sub = [(indent + 2, content[2:])]
        j = i + 1
        while j < len(lines) and lines[j][0] > indent:
            sub.append(lines[j])
            j += 1
        if len(sub) == 1 and ":" not in sub[0][1]:
            items.append(_scalar(sub[0][1]))
        else:
            obj, _ = _parse_dict(sub, 0, sub[0][0])
            items.append(obj)
        i = j
        if i >= len(lines) or lines[i][0] != indent or not lines[i][1].startswith("- "):
            break
    return items, i


def load_yaml(path: Path):
    return _parse_block(_lines(path.read_text(encoding="utf-8")), 0, 0)[0]


# --------------------------------------------------------------------------
# 载入与校验
# --------------------------------------------------------------------------
def load_data():
    errors: list[str] = []
    errors_dup: list[str] = []
    resources = {r["id"]: r for r in load_yaml(ROOT / "resources.yaml")["resources"]}
    video_file = ROOT / "videos.yaml"
    if video_file.exists():
        for v in load_yaml(video_file)["videos"]:
            if v["id"] in resources:
                errors_dup.append(v["id"])
            resources[v["id"]] = v

    weeks = []
    files = sorted(WEEKS_DIR.glob("w*.yaml"))
    if len(files) != 14:
        errors.append(f"weeks 目录应有 14 个文件，实际 {len(files)} 个")
    for f in files:
        try:
            weeks.append(load_yaml(f))
        except Exception as exc:  # noqa: BLE001
            errors.append(f"{f.name}: 解析失败 {exc}")

    weeks.sort(key=lambda w: w["week"])
    if [w["week"] for w in weeks] != list(range(1, len(weeks) + 1)):
        errors.append("周次不连续")

    total_days = 0
    for w in weeks:
        days = w.get("days") or []
        if len(days) != 7:
            errors.append(f"第 {w['week']} 周有 {len(days)} 天，应为 7")
        for idx, d in enumerate(days, 1):
            total_days += 1
            expect = f"W{w['week']:02d}D{idx:02d}"
            if d.get("id") != expect:
                errors.append(f"{expect}: id 是 {d.get('id')}")
            if d.get("day") != idx:
                errors.append(f"{expect}: day 字段是 {d.get('day')}")
            for key in ("title", "goal", "tasks", "deliverable", "minutes"):
                if not d.get(key):
                    errors.append(f"{expect}: 缺少 {key}")
            for ref in d.get("refs") or []:
                if ref not in resources:
                    errors.append(f"{expect}: 引用了不存在的资源 {ref}")
        if sum(d.get("minutes", 0) for d in days) > 20 * 60:
            errors.append(f"第 {w['week']} 周预估总时长超过 20 小时")

    if total_days != 98:
        errors.append(f"总天数应为 98，实际 {total_days}")

    if errors_dup:
        errors.append(f"资源 id 重复: {', '.join(errors_dup)}")

    # 资源是否都被用到
    used = {ref for w in weeks for d in w["days"] for ref in (d.get("refs") or [])}
    unused = sorted(set(resources) - used)
    return weeks, resources, used, unused, errors


# --------------------------------------------------------------------------
# 题库：quizzes/*.yaml -> dist/quizzes.json
# --------------------------------------------------------------------------
VALID_TYPES = {"choice", "judge", "short"}


def load_quizzes(weeks):
    day_ids = {d["id"] for w in weeks for d in w["days"]}
    quizzes, errors = {}, []
    files = sorted((ROOT / "quizzes").glob("q*.yaml"))
    if not files:
        return {}, [], []
    for f in files:
        try:
            data = load_yaml(f)
        except Exception as exc:  # noqa: BLE001
            errors.append(f"{f.name}: 解析失败 {exc}")
            continue
        for block in data.get("quizzes") or []:
            day = block.get("day")
            if day not in day_ids:
                errors.append(f"{f.name}: 未知的 day {day}")
                continue
            # 同一天可以出现在多个文件里（后续按周扩题），题目累加
            quizzes.setdefault(day, []).extend(block.get("items") or [])

    for day, items in quizzes.items():
        if len(items) < 2:
            errors.append(f"{day}: 只有 {len(items)} 题，至少 2 题")
        for i, it in enumerate(items, 1):
            t = it.get("type")
            tag = f"{day}#{i}"
            if t not in VALID_TYPES:
                errors.append(f"{tag}: 未知题型 {t}")
                continue
            if not it.get("q"):
                errors.append(f"{tag}: 缺少题干")
            if not it.get("explain"):
                errors.append(f"{tag}: 缺少解析")
            if t == "choice":
                opts = it.get("options") or []
                if len(opts) < 2:
                    errors.append(f"{tag}: 选项不足")
                a = it.get("answer")
                if not isinstance(a, int) or not (0 <= a < len(opts)):
                    errors.append(f"{tag}: answer 应为 0..{len(opts)-1} 的整数")
            elif t == "judge":
                if not isinstance(it.get("answer"), bool):
                    errors.append(f"{tag}: 判断题 answer 应为 true/false")
            elif not it.get("answer"):
                errors.append(f"{tag}: 简答题缺少参考答案")

    missing = sorted(day_ids - set(quizzes))
    return quizzes, errors, missing


def write_quizzes(quizzes):
    (DIST / "quizzes.json").write_text(
        json.dumps(quizzes, ensure_ascii=False, indent=1), encoding="utf-8"
    )


# --------------------------------------------------------------------------
# 任务卡：briefs/*.yaml -> dist/briefs.json
# --------------------------------------------------------------------------
def load_briefs(weeks):
    day_tasks = {d["id"]: d["tasks"] for w in weeks for d in w["days"]}
    briefs, errors = {}, []
    files = sorted((ROOT / "briefs").glob("b*.yaml")) if (ROOT / "briefs").exists() else []
    for f in files:
        try:
            data = load_yaml(f)
        except Exception as exc:  # noqa: BLE001
            errors.append(f"{f.name}: 解析失败 {exc}")
            continue
        for block in data.get("briefs") or []:
            day = block.get("day")
            if day not in day_tasks:
                errors.append(f"{f.name}: 未知的 day {day}")
                continue
            items = block.get("tasks") or []
            briefs.setdefault(day, [])
            for it in items:
                i = it.get("i")
                tag = f"{day}#{i}"
                if not isinstance(i, int) or not (0 <= i < len(day_tasks[day])):
                    errors.append(f"{tag}: 任务下标越界（当天有 {len(day_tasks[day])} 个任务）")
                    continue
                for key in ("why", "practice", "pitfall"):
                    if not it.get(key):
                        errors.append(f"{tag}: 缺少 {key}")
                if len(it.get("steps") or []) < 2:
                    errors.append(f"{tag}: steps 至少 2 步")
                if not (it.get("check") or []):
                    errors.append(f"{tag}: 缺少验收标准 check")
                briefs[day].append(dict(it))
            briefs[day].sort(key=lambda x: x.get("i", 0))

    covered = sum(len(v) for v in briefs.values())
    return briefs, errors, covered


def write_briefs(briefs):
    (DIST / "briefs.json").write_text(
        json.dumps(briefs, ensure_ascii=False, indent=1), encoding="utf-8"
    )


# --------------------------------------------------------------------------
# plan.md
# --------------------------------------------------------------------------
def write_markdown(weeks, resources):
    lines = [
        "# 14 周大模型应用开发学习计划",
        "",
        "> 由 `build.py` 从 `weeks/*.yaml` 自动生成，请改 YAML 而不是改这里。",
        "> 每天完成标准：① 有产出物 ② 有一条能讲给别人听的笔记 ③ 有一个明确疑点。",
        "",
    ]
    phase = None
    for w in weeks:
        if w["phase"] != phase:
            phase = w["phase"]
            lines += [f"## 阶段 {phase} · {w['phase_name']}", ""]
        week_min = sum(d["minutes"] for d in w["days"])
        lines += [
            f"### 第 {w['week']} 周 · {w['theme']}（预估 {week_min // 60} 小时）",
            "",
            f"**本周目标**：{w['goal']}",
            "",
            f"**验收**：{w['acceptance']}",
            "",
        ]
        for d in w["days"]:
            refs = d.get("refs") or []
            lines.append(f"#### {d['id']} · {d['title']}（{d['minutes']} 分钟）")
            lines.append("")
            lines.append(f"- 目标：{d['goal']}")
            for t in d["tasks"]:
                lines.append(f"- [ ] {t}")
            lines.append(f"- 产出物：{d['deliverable']}")
            if refs:
                for ref in refs:
                    r = resources[ref]
                    tag = "主" if r.get("must") else "辅"
                    lines.append(
                        f"- 资源[{tag}]：{r['title']} · {r['minutes']} 分钟 · <{r['url']}>"
                    )
            if d.get("notes_prompt"):
                lines.append(f"- 今日自问：{d['notes_prompt']}")
            lines.append("")
    (DIST / "plan.md").write_text("\n".join(lines), encoding="utf-8")


# --------------------------------------------------------------------------
# plan.csv
# --------------------------------------------------------------------------
def write_csv(weeks, resources):
    with (DIST / "plan.csv").open("w", newline="", encoding="utf-8-sig") as fh:
        writer = csv.writer(fh)
        writer.writerow(
            ["周", "天", "ID", "阶段", "标题", "目标", "任务", "产出物",
             "预估分钟", "主资源", "补充资源", "资源链接", "状态", "实际分钟", "笔记"]
        )
        for w in weeks:
            for d in w["days"]:
                refs = [resources[r] for r in (d.get("refs") or [])]
                must = [r for r in refs if r.get("must")]
                extra = [r for r in refs if not r.get("must")]
                writer.writerow([
                    w["week"], d["day"], d["id"], w["phase"], d["title"], d["goal"],
                    " | ".join(d["tasks"]), d["deliverable"], d["minutes"],
                    "；".join(r["title"] for r in must),
                    "；".join(r["title"] for r in extra),
                    " ".join(r["url"] for r in refs),
                    "未开始", "", "",
                ])


# --------------------------------------------------------------------------
# plan.json（给将来的网站/小程序用）
# --------------------------------------------------------------------------
def write_json(weeks, resources):
    payload = {
        "schema": "learning-plan/v1",
        "total_weeks": len(weeks),
        "total_days": sum(len(w["days"]) for w in weeks),
        "total_minutes": sum(d["minutes"] for w in weeks for d in w["days"]),
        "resources": resources,
        "weeks": [
            {
                "week": w["week"],
                "phase": w["phase"],
                "phase_name": w["phase_name"],
                "theme": w["theme"],
                "goal": w["goal"],
                "acceptance": w["acceptance"],
                "days": [
                    {**{k: d[k] for k in ("id", "day", "title", "minutes", "goal",
                                          "tasks", "deliverable", "notes_prompt")},
                     "refs": [{**resources[r]} for r in (d.get("refs") or [])]}
                    for d in w["days"]
                ],
            }
            for w in weeks
        ],
    }
    (DIST / "plan.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )


# --------------------------------------------------------------------------
# xlsx
# --------------------------------------------------------------------------
HEADER_FILL = PatternFill("solid", start_color="1F3864")
HEADER_FONT = Font(color="FFFFFF", bold=True, size=10)
THIN = Side(style="thin", color="D9D9D9")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
WRAP = Alignment(wrap_text=True, vertical="top")
CENTER = Alignment(horizontal="center", vertical="center", wrap_text=True)


def _header(ws, headers, widths, row=1):
    ws.append(headers)
    for idx, (col, width) in enumerate(zip(headers, widths), 1):
        cell = ws.cell(row=row, column=idx)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = CENTER
        cell.border = BORDER
        ws.column_dimensions[get_column_letter(idx)].width = width
    ws.row_dimensions[row].height = 28
    ws.freeze_panes = f"A{row + 1}"


def build_xlsx(weeks, resources):
    wb = Workbook()

    # ---------------- 说明 ----------------
    ws = wb.active
    ws.title = "说明"
    ws.column_dimensions["A"].width = 100
    guide = [
        ("14 周大模型应用开发 · 个人学习工作台", 16, True),
        ("", 10, False),
        ("怎么用（5 分钟上手）", 12, True),
        ("1. 在「总览」B2 填开学日期，每日计划里的日期会自动排好。", 10, False),
        ("2. 每天只做三件事：看当天「每日计划」→ 做任务 → 在 M 列把状态改成「已完成」。", 10, False),
        ("3. 当天没做完就把状态设成「顺延」，周末的「周复盘」里统一处理。", 10, False),
        ("4. 任何卡住的地方，立刻记到「疑点清单」，不要留在脑子里。", 10, False),
        ("5. 每周日填「周复盘」三栏：完成了什么 / 卡在哪 / 下周砍掉什么。", 10, False),
        ("6. 想改计划只改 weeks/*.yaml，然后重新运行 build.py，不要手改工作表。", 10, False),
        ("", 10, False),
        ("完成标准（比「看完视频」重要）", 12, True),
        ("① 有产出物：一段能跑的代码、一次提交、一份文档。", 10, False),
        ("② 有一条能讲给别人听的笔记，不是复制原文。", 10, False),
        ("③ 有一个明确疑点；如果确实没有，写「无疑点」也算完成。", 10, False),
        ("", 10, False),
        ("数据在哪", 12, True),
        ("本文件由 learning-workbench/build.py 生成：weeks/*.yaml 是计划，resources.yaml 是链接库。", 10, False),
        ("链接失效时只改 resources.yaml / videos.yaml 一处，再重新生成即可。", 10, False),
        (f"视频库共 {sum(1 for r in resources.values() if r.get('type') == 'video')} 条，"
         "每条都用 B 站接口核验过 bvid、标题、UP 主、时长、播放量（核验日 2026-11-09）。", 10, False),
        ("长课程（如 8 小时的 Spring AI 主线课）不要顺序刷，按「资源库」里的使用提示挑章节。", 10, False),
        ("", 10, False),
        ("时间预算", 12, True),
        ("14 周 × 7 天 = 98 天；每周约 15 小时（工作日 1.5-2h + 周末 4h），总计约 218 小时（日均约 2.2 小时）。", 10, False),
        ("其中每周第 7 天固定为「复盘 + 缓冲」，进度落后时优先用这天补课。", 10, False),
    ]
    for text, size, bold in guide:
        ws.append([text])
        cell = ws.cell(row=ws.max_row, column=1)
        cell.font = Font(size=size, bold=bold, color="1F3864" if bold and size >= 12 else "000000")
        cell.alignment = Alignment(wrap_text=True, vertical="center")
    ws.sheet_view.showGridLines = False

    # ---------------- 总览 ----------------
    ov = wb.create_sheet("总览")
    _header(ov, ["项目", "值", "说明"], [26, 18, 56])
    rows = [
        ("开学日期", None, "填这个日期，每日计划自动排期"),
        ("总天数", 98, "14 周 × 7 天"),
        ("已完成天数", '=COUNTIF(每日计划!M:M,"已完成")', "状态为「已完成」的天数"),
        ("进行中天数", '=COUNTIF(每日计划!M:M,"进行中")', ""),
        ("顺延天数", '=COUNTIF(每日计划!M:M,"顺延")', "需要补的欠账"),
        ("完成率", '=IF(B3=0,0,B4/B3)', "已完成 / 总天数"),
        ("累计投入(分钟)", "=SUM(每日计划!N:N)", "实际分钟数合计"),
        ("累计投入(小时)", "=ROUND(B8/60,1)", ""),
        ("预估总时长(小时)", "=ROUND(SUM(每日计划!J:J)/60,1)", "计划本身的时间预算"),
        ("距开学已过(天)", '=IF(B2="","",TODAY()-B2+1)', ""),
        ("进度是否落后",
         '=IF(B2="","",IF(TODAY()-B2+1>B3,"已结束",IF(AND(TODAY()-B2+1>=3,B4/(TODAY()-B2+1)<0.8),"落后","正常")))',
         "开学 3 天后，完成率低于已过天数的 80% 才提示落后"),
    ]
    for name, val, note in rows:
        ov.append([name, val, note])
        r = ov.max_row
        ov.cell(row=r, column=1).font = Font(bold=True)
        ov.cell(row=r, column=2).alignment = Center if False else CENTER
        for c in range(1, 4):
            ov.cell(row=r, column=c).border = BORDER
    ov["B2"] = date.today()
    ov["B2"].number_format = "yyyy-mm-dd"
    ov["B8"].number_format = "#,##0"
    for ref in ("B9",):
        ov[ref].number_format = "0.0"
    ov["B11"].number_format = "0"
    ov["B12"].alignment = CENTER
    ov["B9"].number_format = "0.0"
    ov["B6"].number_format = "0"
    ov["B7"].number_format = "0.0%"
    ov["B10"].number_format = "0.0"
    ov["B3"].number_format = "0"

    # 阶段进度
    start = ov.max_row + 2
    ov.cell(row=start, column=1, value="阶段进度").font = Font(bold=True, size=12, color="1F3864")
    heads = ["阶段", "主题", "天数", "已完成", "完成率"]
    for i, h in enumerate(heads, 1):
        c = ov.cell(row=start + 1, column=i, value=h)
        c.fill = HEADER_FILL
        c.font = HEADER_FONT
        c.alignment = CENTER
        c.border = BORDER
    phases = {}
    for w in weeks:
        phases.setdefault(w["phase"], {"name": w["phase_name"], "days": []})
        phases[w["phase"]]["days"].extend(d["id"] for d in w["days"])
    for i, (ph, info) in enumerate(sorted(phases.items()), 1):
        r = start + 1 + i
        ov.cell(row=r, column=1, value=f"阶段 {ph}").font = Font(bold=True)
        ov.cell(row=r, column=2, value=info["name"].split("：")[-1])
        ov.cell(row=r, column=3, value=len(info["days"]))
        ov.cell(row=r, column=4, value=f'=COUNTIFS(每日计划!E:E,"{ph}")')
        ov.cell(row=r, column=5, value=f"=IF(C{r}=0,0,D{r}/C{r})")
        ov.cell(row=r, column=5).number_format = "0.0%"
        for c in range(1, 6):
            ov.cell(row=r, column=c).border = BORDER
            ov.cell(row=r, column=c).alignment = CENTER

    # 每周进度
    wk = ov.max_row + 2
    ov.cell(row=wk, column=1, value="每周进度").font = Font(bold=True, size=12, color="1F3864")
    heads = ["周", "主题", "天数", "已完成", "顺延", "实际分钟", "完成率"]
    for i, h in enumerate(heads, 1):
        c = ov.cell(row=wk + 1, column=i, value=h)
        c.fill = HEADER_FILL
        c.font = HEADER_FONT
        c.alignment = CENTER
        c.border = BORDER
    for i, w in enumerate(weeks, 1):
        r = wk + 1 + i
        ov.cell(row=r, column=1, value=w["week"])
        ov.cell(row=r, column=2, value=w["theme"])
        ov.cell(row=r, column=3, value=len(w["days"]))
        ov.cell(row=r, column=4, value=f'=COUNTIFS(每日计划!A:A,A{r},每日计划!M:M,"已完成")')
        ov.cell(row=r, column=5, value=f'=COUNTIFS(每日计划!A:A,A{r},每日计划!M:M,"顺延")')
        ov.cell(row=r, column=6, value=f'=SUMIF(每日计划!A:A,A{r},每日计划!N:N)')
        ov.cell(row=r, column=7, value=f"=IF(C{r}=0,0,D{r}/C{r})")
        ov.cell(row=r, column=7).number_format = "0.0%"
        for c in range(1, 8):
            ov.cell(row=r, column=c).border = BORDER
            if c != 2:
                ov.cell(row=r, column=c).alignment = CENTER

    # ---------------- 每日计划 ----------------
    dp = wb.create_sheet("每日计划")
    headers = ["周", "天", "日期", "ID", "阶段", "标题", "目标", "任务", "产出物",
               "预估分钟", "主资源", "补充资源", "状态", "实际分钟", "完成日期", "笔记/链接", "疑点"]
    widths = [5, 4, 11, 9, 5, 20, 26, 44, 22, 8, 30, 26, 8, 8, 10, 18, 10]
    _header(dp, headers, widths)

    for w in weeks:
        for d in w["days"]:
            refs = [resources[r] for r in (d.get("refs") or [])]
            must = [r for r in refs if r.get("must")]
            extra = [r for r in refs if not r.get("must")]

            def label(r):
                title = r["title"]
                if r.get("type") == "video":
                    title = re.sub(r"^【[^】]*】", "", title)
                    short = title if len(title) <= 22 else title[:21] + "…"
                    return f"{r.get('author', '')}《{short}》（{r['minutes']}m）"
                return f"{title}（{r['minutes']}m）"

            def fmt(rs):
                return "\n".join(f"{label(r)}\n  {r['id']}" for r in rs)

            dp.append([
                w["week"], d["day"], None, d["id"], w["phase"], d["title"], d["goal"],
                "\n".join(f"□ {t}" for t in d["tasks"]), d["deliverable"], d["minutes"],
                fmt(must), fmt(extra), "未开始", None, None, None, None,
            ])
            r = dp.max_row
            dp.cell(row=r, column=3, value=f"=IF(总览!$B$2=\"\",\"\",总览!$B$2+(A{r}-1)*7+(B{r}-1))")
            dp.cell(row=r, column=3).number_format = "mm-dd"
            dp.cell(row=r, column=15).number_format = "mm-dd"
            for c in range(1, 18):
                cell = dp.cell(row=r, column=c)
                cell.border = BORDER
                cell.alignment = CENTER if c in (1, 2, 3, 4, 5, 10, 13, 14, 15) else WRAP
            dp.cell(row=r, column=4).font = Font(bold=True, size=9, color="7F7F7F")

    last = dp.max_row
    dv_status = DataValidation(
        type="list", formula1='"' + ",".join(STATUS_OPTIONS) + '"', allow_blank=True
    )
    dv_status.error = "请从下拉里选"
    dv_status.prompt = "未开始 / 进行中 / 已完成 / 顺延 / 跳过"
    dp.add_data_validation(dv_status)
    dv_status.add(f"M2:M{last}")

    green = PatternFill("solid", start_color="C6EFCE")
    yellow = PatternFill("solid", start_color="FFEB9C")
    gray = PatternFill("solid", start_color="D9D9D9")
    red = PatternFill("solid", start_color="FFC7CE")
    for text, fill in (("已完成", green), ("进行中", yellow), ("顺延", red), ("跳过", gray)):
        dp.conditional_formatting.add(
            f"A2:Q{last}",
            CellIsRule(operator="equal", formula=[f'$M2="{text}"'], fill=fill),
        )
    dp.auto_filter.ref = f"A1:Q{last}"

    # ---------------- 资源库 ----------------
    rs = wb.create_sheet("资源库")
    headers = ["ID", "标题", "链接", "类型", "主资源", "时长(分)", "UP主/来源",
               "播放量", "发布", "核验日期", "看完应能回答", "使用提示"]
    widths = [22, 46, 50, 7, 8, 9, 18, 11, 9, 11, 46, 34]
    _header(rs, headers, widths)
    for rid in sorted(resources):
        r = resources[rid]
        rs.append([rid, r["title"], r["url"], r.get("type", ""),
                   "是" if r.get("must") else "", r.get("minutes", ""),
                   r.get("author", "官方文档" if r.get("type") == "doc" else ""),
                   r.get("play", ""), r.get("published", ""), r.get("verified", ""),
                   r.get("after", ""), r.get("note", "")])
        row = rs.max_row
        link = rs.cell(row=row, column=3)
        link.hyperlink = r["url"]
        link.font = Font(color="0563C1", underline="single")
        rs.cell(row=row, column=8).number_format = "#,##0"
        for c in range(1, 13):
            cell = rs.cell(row=row, column=c)
            cell.border = BORDER
            cell.alignment = CENTER if c in (1, 4, 5, 6, 8, 9, 10) else WRAP
    rs.auto_filter.ref = f"A1:L{rs.max_row}"

    # ---------------- 疑点清单 ----------------
    qs = wb.create_sheet("疑点清单")
    headers = ["编号", "发现日期", "来自哪天", "疑点描述", "状态", "答案/结论", "下次复习", "复习次数"]
    widths = [6, 11, 10, 46, 10, 46, 11, 9]
    _header(qs, headers, widths)
    for i in range(1, 41):
        qs.append([f"Q{i:03d}", None, None, None, "未解决", None, None, 0])
        row = qs.max_row
        qs.cell(row=row, column=2).number_format = "mm-dd"
        qs.cell(row=row, column=7).number_format = "mm-dd"
        for c in range(1, 9):
            cell = qs.cell(row=row, column=c)
            cell.border = BORDER
            cell.alignment = CENTER if c in (1, 2, 3, 5, 7, 8) else WRAP
    dv_q = DataValidation(type="list", formula1='"未解决,查资料中,已搞懂,放弃"', allow_blank=True)
    qs.add_data_validation(dv_q)
    dv_q.add("E2:E41")
    qs.conditional_formatting.add("A2:H41", CellIsRule(
        operator="equal", formula=['$E2="已搞懂"'], fill=green))
    qs.conditional_formatting.add("A2:H41", CellIsRule(
        operator="equal", formula=['$E2="未解决"'], fill=red))

    # ---------------- 周复盘 ----------------
    rv = wb.create_sheet("周复盘")
    headers = ["周", "主题", "本周完成了什么", "卡在哪（具体到哪一步）",
               "下周砍掉/调整什么", "本周最大收获", "自评分(1-5)"]
    widths = [5, 24, 40, 40, 34, 30, 10]
    _header(rv, headers, widths)
    for w in weeks:
        rv.append([w["week"], w["theme"], None, None, None, None, None])
        row = rv.max_row
        for c in range(1, 8):
            cell = rv.cell(row=row, column=c)
            cell.border = BORDER
            cell.alignment = CENTER if c in (1, 7) else WRAP
        rv.row_dimensions[row].height = 46

    # ---------------- 里程碑 ----------------
    ms = wb.create_sheet("里程碑")
    _header(ms, ["里程碑", "周次", "交付物", "验收标准", "状态"], [10, 8, 46, 52, 10])
    milestones = [
        ("M1", "第2周", "可演示的对话服务：流式输出 + 超时重试 + 统一异常 + traceId + 单测",
         "能演示；断网/超时/非法输出三种情况都不崩", "未开始"),
        ("M2", "第5周", "企业知识库问答：解析 → 切片 → 检索 → 引用 → 20 条 eval 报告",
         "一条命令跑评测；答案带引用；无依据会拒答", "未开始"),
        ("M3", "第8周", "单工具/多工具 Agent：查真实业务数据 + 权限 + 可定位失败",
         "docker compose 一键起；失败能在 10 分钟内定位", "未开始"),
        ("M4", "第10周", "安全自查表 20 项 + 护栏落地",
         "自我攻击 5 例，至少拦住 4 例；有审计日志", "未开始"),
        ("M5", "第12周", "完整作品：架构图 + README + 演示视频 + 简历段落",
         "3 分钟能讲清；20 个追问答上 15 个", "未开始"),
    ]
    for row in milestones:
        ms.append(list(row))
        r = ms.max_row
        for c in range(1, 6):
            cell = ms.cell(row=r, column=c)
            cell.border = BORDER
            cell.alignment = CENTER if c in (1, 2, 5) else WRAP
    dv_m = DataValidation(type="list", formula1='"未开始,进行中,已完成"', allow_blank=True)
    ms.add_data_validation(dv_m)
    dv_m.add("E2:E6")

    out = DIST / "学习工作台.xlsx"
    wb.save(out)
    return out


def main():
    DIST.mkdir(exist_ok=True)
    weeks, resources, used, unused, errors = load_data()
    if errors:
        print("数据校验失败：")
        for e in errors:
            print("  -", e)
        return 1

    quizzes, q_errors, q_missing = load_quizzes(weeks)
    if q_errors:
        print("题库校验失败：")
        for e in q_errors:
            print("  -", e)
        return 1
    write_quizzes(quizzes)

    briefs, b_errors, b_covered = load_briefs(weeks)
    if b_errors:
        print("任务卡校验失败：")
        for e in b_errors:
            print("  -", e)
        return 1
    write_briefs(briefs)

    write_markdown(weeks, resources)
    write_csv(weeks, resources)
    write_json(weeks, resources)
    out = build_xlsx(weeks, resources)

    total = sum(d["minutes"] for w in weeks for d in w["days"])
    print(f"周数 {len(weeks)} / 天数 {sum(len(w['days']) for w in weeks)} / "
          f"资源 {len(resources)}（未引用 {len(unused)}）")
    print(f"总预估 {total} 分钟 ≈ {total / 60:.1f} 小时，日均 {total / 98:.0f} 分钟")
    for ph in sorted({w["phase"] for w in weeks}):
        ws = [w for w in weeks if w["phase"] == ph]
        mins = sum(d["minutes"] for w in ws for d in w["days"])
        print(f"  阶段 {ph}: {len(ws)} 周 / {mins / 60:.0f} 小时")
    if unused:
        print("未引用的资源:", ", ".join(unused))
    total_q = sum(len(v) for v in quizzes.values())
    pools = sorted(len(v) for v in quizzes.values())
    total_tasks = sum(len(d["tasks"]) for w in weeks for d in w["days"])
    print(f"任务卡: {b_covered} / {total_tasks} 个任务（{len(briefs)} 天）")
    print(f"题库: {len(quizzes)} 天 / {total_q} 题（每天 {pools[0]}–{pools[-1]} 题）" + (f"（缺 {len(q_missing)} 天：{', '.join(q_missing[:5])}…）" if q_missing else ""))
    print("生成:", out.relative_to(ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
