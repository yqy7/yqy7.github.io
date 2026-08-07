import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// ── 时区列表 ──────────────────────────────────────────────────

const TIMEZONES = [
  { value: "local", label: "本地时区" },
  { value: "UTC", label: "UTC" },
  { value: "Asia/Shanghai", label: "Asia/Shanghai · 北京" },
  { value: "Asia/Hong_Kong", label: "Asia/Hong_Kong · 香港" },
  { value: "Asia/Taipei", label: "Asia/Taipei · 台北" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo · 东京" },
  { value: "Asia/Seoul", label: "Asia/Seoul · 首尔" },
  { value: "Asia/Singapore", label: "Asia/Singapore · 新加坡" },
  { value: "Europe/London", label: "Europe/London · 伦敦" },
  { value: "Europe/Paris", label: "Europe/Paris · 巴黎" },
  { value: "America/New_York", label: "America/New_York · 纽约" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles · 洛杉矶" },
  { value: "Australia/Sydney", label: "Australia/Sydney · 悉尼" },
]

// ── 工具函数 ──────────────────────────────────────────────────

/** 获取某个时区在指定时刻相对于 UTC 的偏移（毫秒） */
function tzOffsetMs(tz: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23",
  })
  const p = Object.fromEntries(dtf.formatToParts(date).map((x) => [x.type, x.value]))
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second)
  return asUTC - date.getTime()
}

/** 按指定时区格式化日期为 YYYY-MM-DD HH:mm:ss */
function formatInTz(date: Date, tz?: string): string {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23",
  })
  const p = Object.fromEntries(dtf.formatToParts(date).map((x) => [x.type, x.value]))
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`
}

/** 格式化 UTC 偏移为 +08:00 形式 */
function formatOffset(offsetMs: number): string {
  const sign = offsetMs < 0 ? "-" : "+"
  const abs = Math.abs(offsetMs)
  const h = Math.floor(abs / 3600000).toString().padStart(2, "0")
  const m = Math.floor((abs % 3600000) / 60000).toString().padStart(2, "0")
  return `${sign}${h}:${m}`
}

/** "YYYY-MM-DD HH:mm:ss" 转时间戳（按指定时区解释） */
function parseDateStr(s: string, tz: string): { seconds: number; ms: number } | null {
  const m = s.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/)
  if (!m) return null
  const [, y, mo, d, h, mi, se = "0"] = m
  const utc = Date.UTC(+y, +mo - 1, +d, +h, +mi, +se)
  let ms: number
  if (tz === "local") {
    const dt = new Date(+y, +mo - 1, +d, +h, +mi, +se)
    if (isNaN(dt.getTime())) return null
    ms = dt.getTime()
  } else {
    // 用探测时刻计算时区偏移，再反推真实时间戳
    const offset = tzOffsetMs(tz, new Date(utc))
    ms = utc - offset
  }
  return { seconds: Math.floor(ms / 1000), ms }
}

// ── 页面组件 ──────────────────────────────────────────────────

type Unit = "auto" | "s" | "ms"

export default function TimestampPage() {
  const [timezone, setTimezone] = useState("Asia/Shanghai")
  const [tsInput, setTsInput] = useState("")
  const [unit, setUnit] = useState<Unit>("auto")
  const [dateInput, setDateInput] = useState("")

  // ── 时间戳 → 日期 ─────────────────────────────────────────
  const tsResult = useMemo(() => {
    const raw = tsInput.trim()
    if (!raw) return null
    const num = Number(raw)
    if (!Number.isFinite(num)) return null

    let ms: number
    let detected: Unit
    if (unit === "s") {
      ms = num * 1000
      detected = "s"
    } else if (unit === "ms") {
      ms = num
      detected = "ms"
    } else {
      // 自动：小于 1e11 视为秒
      detected = Math.abs(num) < 100000000000 ? "s" : "ms"
      ms = detected === "s" ? num * 1000 : num
    }

    const date = new Date(ms)
    if (isNaN(date.getTime())) return null

    const tz = timezone === "local" ? undefined : timezone
    const offset = timezone === "local" ? -date.getTimezoneOffset() * 60000 : tzOffsetMs(timezone, date)

    return {
      detected,
      local: formatInTz(date, tz),
      utc: formatInTz(date, "UTC"),
      iso: date.toISOString(),
      offset: formatOffset(offset),
    }
  }, [tsInput, unit, timezone])

  // ── 日期 → 时间戳 ─────────────────────────────────────────
  const dateResult = useMemo(() => {
    if (!dateInput.trim()) return null
    return parseDateStr(dateInput, timezone)
  }, [dateInput, timezone])

  const fillNow = () => {
    const now = new Date()
    const tz = timezone === "local" ? undefined : timezone
    setDateInput(formatInTz(now, tz))
    setTsInput(String(Math.floor(now.getTime() / 1000)))
    setUnit("s")
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">时间戳转换</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          时间戳与日期时间互转，支持多时区
        </p>
      </div>

      {/* 时区选择 */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-muted-foreground">时区</label>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.currentTarget.value)}
          className="border border-border bg-transparent px-2 py-1.5 text-sm outline-none focus-visible:border-ring"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
        <Button variant="outline" size="sm" onClick={fillNow}>
          填入当前时间
        </Button>
      </div>

      {/* 时间戳 → 日期 */}
      <Card>
        <CardHeader>
          <CardTitle>时间戳 → 日期时间</CardTitle>
          <CardDescription>输入秒或毫秒时间戳</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              inputMode="numeric"
              value={tsInput}
              onChange={(e) => setTsInput(e.currentTarget.value)}
              placeholder="例如 1754500000 或 1754500000000"
              className="min-w-0 flex-1 border border-border bg-transparent px-3 py-2 font-mono text-sm outline-none focus-visible:border-ring"
            />
            <div className="flex gap-1">
              {(
                [
                  ["auto", "自动"],
                  ["s", "秒"],
                  ["ms", "毫秒"],
                ] as const
              ).map(([k, label]) => (
                <Button
                  key={k}
                  variant={unit === k ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUnit(k)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {tsResult ? (
            <div className="space-y-1.5">
              <div className="flex justify-between border-b border-border py-1.5">
                <span className="text-sm text-muted-foreground">解释单位</span>
                <span className="text-sm">{tsResult.detected === "s" ? "秒" : "毫秒"}</span>
              </div>
              <div className="flex justify-between border-b border-border py-1.5">
                <span className="text-sm text-muted-foreground">指定时区</span>
                <span className="font-mono text-sm">{tsResult.local}（{tsResult.offset}）</span>
              </div>
              <div className="flex justify-between border-b border-border py-1.5">
                <span className="text-sm text-muted-foreground">UTC</span>
                <span className="font-mono text-sm">{tsResult.utc}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-sm text-muted-foreground">ISO</span>
                <span className="font-mono text-sm">{tsResult.iso}</span>
              </div>
            </div>
          ) : (
            tsInput.trim() && (
              <p className="text-sm text-amber-600 dark:text-amber-400">请输入有效的时间戳</p>
            )
          )}
        </CardContent>
      </Card>

      {/* 日期 → 时间戳 */}
      <Card>
        <CardHeader>
          <CardTitle>日期时间 → 时间戳</CardTitle>
          <CardDescription>按所选时区解释输入，格式 YYYY-MM-DD HH:mm:ss</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            type="text"
            value={dateInput}
            onChange={(e) => setDateInput(e.currentTarget.value)}
            placeholder="例如 2026-08-07 12:00:00"
            className="w-full border border-border bg-transparent px-3 py-2 font-mono text-sm outline-none focus-visible:border-ring"
          />
          {dateResult ? (
            <div className="space-y-1.5">
              <div className="flex justify-between border-b border-border py-1.5">
                <span className="text-sm text-muted-foreground">秒时间戳</span>
                <span className="font-mono text-sm">{dateResult.seconds}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-sm text-muted-foreground">毫秒时间戳</span>
                <span className="font-mono text-sm">{dateResult.ms}</span>
              </div>
            </div>
          ) : (
            dateInput.trim() && (
              <p className="text-sm text-amber-600 dark:text-amber-400">格式不正确，应为 YYYY-MM-DD HH:mm:ss</p>
            )
          )}
        </CardContent>
      </Card>
    </div>
  )
}
