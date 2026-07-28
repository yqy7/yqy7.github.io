import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "sql-formatter"

// ── SQL 方言 ──────────────────────────────────────────────────

const DIALECTS = [
  { value: "mysql", label: "MySQL" },
  { value: "mariadb", label: "MariaDB" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "sqlite", label: "SQLite" },
  { value: "bigquery", label: "BigQuery" },
  { value: "clickhouse", label: "Clickhouse" },
  { value: "db2", label: "DB2" },
  { value: "duckdb", label: "DuckDB" },
  { value: "hive", label: "Apache Hive" },
  { value: "n1ql", label: "N1QL" },
  { value: "plsql", label: "Oracle PL/SQL" },
  { value: "redshift", label: "Redshift" },
  { value: "singlestoredb", label: "SingleStoreDB" },
  { value: "snowflake", label: "Snowflake" },
  { value: "spark", label: "Spark" },
  { value: "sql", label: "Standard SQL" },
  { value: "tidb", label: "TiDB" },
  { value: "trino", label: "Trino" },
  { value: "tsql", label: "Transact-SQL" },
]

const KEYWORD_CASE_OPTIONS = [
  { value: "upper", label: "大写" },
  { value: "lower", label: "小写" },
  { value: "preserve", label: "保持原样" },
] as const

type KeywordCase = (typeof KEYWORD_CASE_OPTIONS)[number]["value"]

// ── 页面组件 ──────────────────────────────────────────────────

export default function SQLFormatterPage() {
  const [input, setInput] = useState(
    'SELECT id, name, email, created_at FROM users WHERE status = "active" ORDER BY created_at DESC LIMIT 10',
  )
  const [output, setOutput] = useState("")
  const [dialect, setDialect] = useState<string>("mysql")
  const [keywordCase, setKeywordCase] = useState<KeywordCase>("upper")
  const [tabWidth, setTabWidth] = useState(2)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const formatSQL = useCallback(() => {
    setError("")
    if (!input.trim()) {
      setOutput("")
      return
    }
    try {
      const result = format(input, {
        language: dialect as any,
        keywordCase,
        tabWidth,
      })
      setOutput(result)
    } catch (e: any) {
      setError(e?.message ?? "格式化失败")
      setOutput("")
    }
  }, [input, dialect, keywordCase, tabWidth])

  // 实时格式化（防抖 300ms）
  useEffect(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(formatSQL, 300)
    return () => clearTimeout(timerRef.current)
  }, [formatSQL])

  const copyOutput = async () => {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">SQL 格式化</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          SQL 语句美化与格式化，支持多种数据库方言
        </p>
      </div>

      {/* 设置 */}
      <Card>
        <CardHeader>
          <CardTitle>格式设置</CardTitle>
          <CardDescription>选择数据库方言和格式化选项</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">方言</label>
              <select
                value={dialect}
                onChange={(e) => setDialect(e.currentTarget.value)}
                className="border border-border bg-transparent px-2 py-1.5 text-sm outline-none focus-visible:border-ring"
              >
                {DIALECTS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">关键字</label>
              <div className="flex gap-1">
                {KEYWORD_CASE_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={keywordCase === opt.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setKeywordCase(opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">缩进</label>
              <input
                type="number"
                min={1}
                max={8}
                value={tabWidth}
                onChange={(e) => {
                  const v = Number(e.currentTarget.value)
                  if (v >= 1 && v <= 8) setTabWidth(v)
                }}
                className="w-14 border border-border bg-transparent px-2 py-1 text-center text-sm outline-none focus-visible:border-ring"
              />
              <span className="text-xs text-muted-foreground">空格</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 输入 */}
      <Card>
        <CardHeader>
          <CardTitle>输入 SQL</CardTitle>
          <CardDescription>粘贴或输入待格式化的 SQL 语句</CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            placeholder="SELECT * FROM ..."
            rows={8}
            spellCheck={false}
            className="w-full resize-y border border-border bg-transparent px-3 py-2 font-mono text-sm outline-none focus-visible:border-ring"
          />
        </CardContent>
      </Card>

      {/* 输出 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>格式化结果</CardTitle>
            <CardDescription>实时自动格式化</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={copyOutput} disabled={!output}>
            {copied ? "已复制" : "复制结果"}
          </Button>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex items-center justify-center rounded-lg border border-red-500/30 bg-red-50/50 py-12 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
              {error}
            </div>
          ) : (
            <pre className="w-full resize-y overflow-auto border border-border bg-muted/50 px-3 py-2 font-mono text-sm outline-none whitespace-pre">
              {output || <span className="text-muted-foreground">格式化结果将显示在这里…</span>}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
