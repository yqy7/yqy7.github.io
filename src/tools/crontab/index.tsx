import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CronExpressionParser } from "cron-parser"

type FormatType = "linux" | "spring" | "quartz"

interface FormatInfo {
  key: FormatType
  label: string
  fields: number
  desc: string
  example: string
}

const FORMATS: FormatInfo[] = [
  {
    key: "linux",
    label: "Linux",
    fields: 5,
    desc: "分 时 日 月 周",
    example: "*/15 8-18 * * 1-5",
  },
  {
    key: "spring",
    label: "Java (Spring)",
    fields: 6,
    desc: "秒 分 时 日 月 周",
    example: "0 */15 8-18 * * 1-5",
  },
  {
    key: "quartz",
    label: "Java (Quartz)",
    fields: 7,
    desc: "秒 分 时 日 月 周 年",
    example: "0 */15 8-18 * * 1-5 *",
  },
]

// 根据格式将表达式转为 cron-parser 标准的 6 字段 + 可选年份过滤
function normalize(
  expression: string,
  format: FormatType,
): { cron6: string; yearFilter: string | null } {
  const parts = expression.trim().split(/\s+/)
  if (format === "linux") {
    // 5 字段 → 前面加秒 "0"
    return { cron6: ["0", ...parts].join(" "), yearFilter: null }
  }
  if (format === "spring") {
    // 6 字段 → 直接使用
    return { cron6: parts.slice(0, 6).join(" "), yearFilter: null }
  }
  // quartz: 7 字段 → 取前 6 个为 cron，第 7 个为年份过滤
  const year = parts.length >= 7 ? parts[6] : "*"
  return {
    cron6: parts.slice(0, 6).join(" "),
    yearFilter: year === "*" || year === "" ? null : year,
  }
}

function matchesYear(date: Date, yearFilter: string | null): boolean {
  if (!yearFilter) return true
  const year = date.getFullYear()
  // 简单支持单个年份或逗号分隔年份
  const years = yearFilter.split(",").map(Number)
  return years.includes(year)
}

export default function CrontabPage() {
  const [format, setFormat] = useState<FormatType>("linux")
  const [expression, setExpression] = useState("")
  const [count, setCount] = useState(10)
  const [results, setResults] = useState<string[]>([])
  const [error, setError] = useState("")

  const handleCalc = useCallback(() => {
    setError("")
    setResults([])
    if (!expression.trim()) return

    const { cron6, yearFilter } = normalize(expression, format)

    try {
      const cron = CronExpressionParser.parse(cron6, {
        currentDate: new Date(),
      })
      const dates = cron.take(count * 2) // 多取一些，过滤年份后可能不够
      const filtered: string[] = []
      for (const d of dates) {
        const date = d.toDate()
        if (matchesYear(date, yearFilter)) {
          filtered.push(
            date.toLocaleString("zh-CN", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              weekday: "short",
            }),
          )
          if (filtered.length >= count) break
        }
      }
      setResults(filtered)
      if (filtered.length === 0) {
        setError("未找到符合条件的执行时间")
      }
    } catch (e) {
      setError(`表达式解析失败：${e instanceof Error ? e.message : "格式错误"}`)
    }
  }, [expression, format, count])

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Crontab 执行时间</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          计算 crontab 表达式未来的 N 次执行时间，支持 Linux / Spring / Quartz 格式
        </p>
      </div>

      {/* 格式选择 */}
      <div className="flex gap-2">
        {FORMATS.map((f) => (
          <Button
            key={f.key}
            variant={format === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setFormat(f.key)
              setExpression(f.example)
              setResults([])
              setError("")
            }}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>表达式</CardTitle>
          <CardDescription>
            {FORMATS.find((f) => f.key === format)?.desc} — 共{" "}
            {FORMATS.find((f) => f.key === format)?.fields} 个字段
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 表达式输入 */}
          <div className="space-y-1.5">
            <input
              type="text"
              placeholder={FORMATS.find((f) => f.key === format)?.example}
              value={expression}
              onChange={(e) => {
                setExpression(e.currentTarget.value)
                setError("")
              }}
              className="w-full border border-border bg-transparent px-3 py-2 font-mono text-base outline-none focus-visible:border-ring"
            />
          </div>

          {/* 数量 */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium shrink-0">未来执行次数</label>
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => {
                const v = Number(e.currentTarget.value)
                if (v >= 1 && v <= 100) setCount(v)
              }}
              className="w-20 border border-border bg-transparent px-2 py-1 text-center text-sm outline-none focus-visible:border-ring"
            />
          </div>
        </CardContent>
      </Card>

      {/* 计算按钮 */}
      <Button onClick={handleCalc} className="w-full">
        计算执行时间
      </Button>

      {/* 结果 */}
      {error && (
        <div className="border border-destructive/50 bg-destructive/10 px-3 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>执行时间</CardTitle>
            <CardDescription>
              共 {results.length} 次，基于当前时间往后推算
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {results.map((time, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-sm border border-border px-3 py-2 font-mono text-sm"
                >
                  <span className="w-6 shrink-0 text-muted-foreground tabular-nums">
                    {i + 1}
                  </span>
                  <span>{time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
