import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { diffLines, diffWords, diffChars, type Change } from "diff"

type DiffMode = "lines" | "words" | "chars"

const MODES: { key: DiffMode; label: string; diff: (a: string, b: string) => Change[] }[] = [
  { key: "lines", label: "按行", diff: diffLines },
  { key: "words", label: "按词", diff: diffWords },
  { key: "chars", label: "按字符", diff: diffChars },
]

export default function TextDiffPage() {
  const [left, setLeft] = useState("")
  const [right, setRight] = useState("")
  const [mode, setMode] = useState<DiffMode>("lines")
  const [result, setResult] = useState<Change[]>([])
  const [stats, setStats] = useState("")

  const handleDiff = useCallback(() => {
    const diffFn = MODES.find((m) => m.key === mode)!.diff
    const changes = diffFn(left, right)
    setResult(changes)

    let added = 0, removed = 0
    for (const c of changes) {
      if (c.added) added += c.count ?? c.value.length
      else if (c.removed) removed += c.count ?? c.value.length
    }
    setStats(`删除 ${removed} / 新增 ${added}`)
  }, [left, right, mode])

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">文本对比</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          对比两段文本的差异，支持按行、按词、按字符模式
        </p>
      </div>

      {/* 模式切换 */}
      <div className="flex gap-2">
        {MODES.map((m) => (
          <Button
            key={m.key}
            variant={mode === m.key ? "default" : "outline"}
            size="sm"
            onClick={() => setMode(m.key)}
          >
            {m.label}
          </Button>
        ))}
      </div>

      {/* 两个输入框 */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">原始文本</label>
          <textarea
            placeholder="在此粘贴原始文本…"
            className="min-h-60 w-full border border-border bg-transparent px-3 py-3 font-mono text-sm outline-none transition-[color,border-color] placeholder:text-muted-foreground focus-visible:border-ring"
            value={left}
            onChange={(e) => setLeft(e.currentTarget.value)}
            spellCheck={false}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">修改后文本</label>
          <textarea
            placeholder="在此粘贴修改后文本…"
            className="min-h-60 w-full border border-border bg-transparent px-3 py-3 font-mono text-sm outline-none transition-[color,border-color] placeholder:text-muted-foreground focus-visible:border-ring"
            value={right}
            onChange={(e) => setRight(e.currentTarget.value)}
            spellCheck={false}
          />
        </div>
      </div>

      <Button onClick={handleDiff} className="w-full">
        对比差异
      </Button>

      {/* 结果 */}
      {result.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>对比结果</CardTitle>
              <span className="text-sm text-muted-foreground">{stats}</span>
            </div>
            <CardDescription>
              红色背景 = 删除 &nbsp; 绿色背景 = 新增
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto rounded-sm border border-border bg-muted/30 px-4 py-3 font-mono text-sm leading-relaxed whitespace-pre-wrap">
              {result.map((change, i) => {
                if (!change.added && !change.removed) {
                  return <span key={i}>{change.value}</span>
                }
                const bg = change.added
                  ? "bg-green-200 dark:bg-green-900/40"
                  : "bg-red-200 dark:bg-red-900/40"
                return (
                  <span key={i} className={bg}>
                    {change.value}
                  </span>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
