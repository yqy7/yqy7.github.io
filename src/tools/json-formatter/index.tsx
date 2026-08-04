import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

/** 去除 JSON 注释（JSONC），跳过字符串内的注释符号 */
function stripComments(json: string): string {
  let inString = false
  let escaped = false
  let result = ""
  let i = 0
  while (i < json.length) {
    const ch = json[i]
    const next = json[i + 1]

    if (inString) {
      result += ch
      if (escaped) {
        escaped = false
      } else if (ch === "\\") {
        escaped = true
      } else if (ch === '"') {
        inString = false
      }
      i++
      continue
    }

    if (ch === '"') {
      inString = true
      result += ch
      i++
      continue
    }
    if (ch === "/" && next === "/") {
      // 行注释：跳到换行
      while (i < json.length && json[i] !== "\n") i++
      i++
      continue
    }
    if (ch === "/" && next === "*") {
      // 块注释：跳到 */
      i += 2
      while (i < json.length && !(json[i] === "*" && json[i + 1] === "/")) i++
      i += 2
      continue
    }
    result += ch
    i++
  }
  return result
}

function parseInput(input: string, allowComments: boolean): unknown {
  return JSON.parse(allowComments ? stripComments(input) : input)
}

function formatJSON(input: string, indent: number, allowComments: boolean): string {
  return JSON.stringify(parseInput(input, allowComments), null, indent)
}

function compressJSON(input: string, allowComments: boolean): string {
  return JSON.stringify(parseInput(input, allowComments))
}

function escapeJSON(input: string): string {
  return JSON.stringify(input)
}

function unescapeJSON(input: string, allowComments: boolean): string {
  const result = parseInput(input, allowComments)
  // 如果是字符串直接返回，否则格式化回 JSON
  return typeof result === "string" ? result : JSON.stringify(result, null, 2)
}

export default function JsonFormatterPage() {
  const [input, setInput] = useState("")
  const [indent, setIndent] = useState(2)
  const [allowComments, setAllowComments] = useState(false)
  const [error, setError] = useState("")

  const handleFormat = useCallback(() => {
    setError("")
    if (!input.trim()) return
    try {
      setInput(formatJSON(input, indent, allowComments))
    } catch (e) {
      setError(e instanceof Error ? e.message : "格式错误")
    }
  }, [input, indent, allowComments])

  const handleCompress = useCallback(() => {
    setError("")
    if (!input.trim()) return
    try {
      setInput(compressJSON(input, allowComments))
    } catch (e) {
      setError(e instanceof Error ? e.message : "格式错误")
    }
  }, [input, allowComments])

  const handleEscape = useCallback(() => {
    setError("")
    if (!input) return
    try {
      setInput(escapeJSON(input))
    } catch (e) {
      setError(e instanceof Error ? e.message : "转义失败")
    }
  }, [input])

  const handleUnescape = useCallback(() => {
    setError("")
    if (!input.trim()) return
    try {
      setInput(unescapeJSON(input, allowComments))
    } catch (e) {
      setError(e instanceof Error ? e.message : "去除转义失败")
    }
  }, [input, allowComments])

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">JSON 格式化</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          格式化、压缩、转义和去除转义 JSON 文本
        </p>
      </div>

      {/* 输入 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">输入</label>
        <textarea
          placeholder="在此输入 JSON 文本…"
          className="min-h-40 w-full border border-border bg-transparent px-3 py-3 font-mono text-base outline-none transition-[color,border-color] placeholder:text-muted-foreground focus-visible:border-ring md:text-sm"
          value={input}
          onChange={(e) => {
            setInput(e.currentTarget.value)
            setError("")
          }}
          spellCheck={false}
        />
      </div>

      {/* 操作区 */}
      <Card>
        <CardHeader>
          <CardTitle>操作</CardTitle>
          <CardDescription>选择要执行的操作</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 缩进 */}
          <div className="flex items-center gap-3">
            <label className="shrink-0 text-sm font-medium">缩进空格</label>
            <div className="flex gap-1">
              {[2, 4].map((n) => (
                <Button
                  key={n}
                  variant={indent === n ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIndent(n)}
                >
                  {n}
                </Button>
              ))}
            </div>
          </div>

          {/* 兼容注释 */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allowComments}
              onChange={() => setAllowComments((v) => !v)}
              className="accent-foreground size-4"
            />
            兼容注释（JSONC）
          </label>

          {/* 按钮 */}
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleFormat}>格式化</Button>
            <Button onClick={handleCompress} variant="outline">
              压缩
            </Button>
            <Button onClick={handleEscape} variant="outline">
              转义
            </Button>
            <Button onClick={handleUnescape} variant="outline">
              去除转义
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 错误 */}
      {error && (
        <div className="border border-destructive/50 bg-destructive/10 px-3 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

    </div>
  )
}
