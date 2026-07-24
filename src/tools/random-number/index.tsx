import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function generateNumbers(
  min: number,
  max: number,
  count: number,
  unique: boolean,
  sort: boolean,
  pad: boolean,
  groups: number,
  separator: string,
): string {
  if (min > max || count < 1 || groups < 1) return ""

  const totalAvailable = max - min + 1
  if (unique && count > totalAvailable) return ""

  const padLen = String(max).length

  const lines: string[] = []
  for (let g = 0; g < groups; g++) {
    let nums: number[]
    if (unique) {
      // Fisher-Yates 部分洗牌，只取前 count 个
      const pool = Array.from({ length: totalAvailable }, (_, i) => min + i)
      const buf = new Uint32Array(count)
      crypto.getRandomValues(buf)
      for (let i = 0; i < count; i++) {
        const j = i + (buf[i] % (totalAvailable - i))
        ;[pool[i], pool[j]] = [pool[j], pool[i]]
      }
      nums = pool.slice(0, count)
    } else {
      const buf = new Uint32Array(count)
      crypto.getRandomValues(buf)
      nums = Array.from({ length: count }, (_, i) => min + (buf[i] % totalAvailable))
    }

    if (sort) {
      nums.sort((a, b) => a - b)
    }

    const formatted = nums.map((n) => (pad ? String(n).padStart(padLen, "0") : String(n)))
    lines.push(formatted.join(separator))
  }

  return lines.join("\n")
}

export default function RandomNumberPage() {
  const [min, setMin] = useState(1)
  const [max, setMax] = useState(100)
  const [count, setCount] = useState(5)
  const [unique, setUnique] = useState(true)
  const [sort, setSort] = useState(false)
  const [pad, setPad] = useState(false)
  const [groups, setGroups] = useState(1)
  const [separator, setSeparator] = useState(", ")
  const [output, setOutput] = useState("")
  const [copied, setCopied] = useState(false)

  const handleGenerate = useCallback(() => {
    const result = generateNumbers(min, max, count, unique, sort, pad, groups, separator)
    setOutput(result)
  }, [min, max, count, unique, sort, pad, groups, separator])

  const handleCopy = useCallback(async () => {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [output])

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">随机数生成器</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          使用加密安全随机数，支持去重、排序、补零、自定义分隔符等
        </p>
      </div>

      {/* 选项区 */}
      <Card>
        <CardHeader>
          <CardTitle>生成选项</CardTitle>
          <CardDescription>设置数字范围、每组个数、去重排序等规则</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 数字范围 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">数字范围</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={min}
                onChange={(e) => setMin(Number(e.currentTarget.value))}
                className="w-full border border-border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring"
                placeholder="最小值"
              />
              <span className="text-sm text-muted-foreground">—</span>
              <input
                type="number"
                value={max}
                onChange={(e) => setMax(Number(e.currentTarget.value))}
                className="w-full border border-border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring"
                placeholder="最大值"
              />
            </div>
          </div>

          {/* 每组个数 + 组数 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">每组个数</label>
              <input
                type="number"
                min={1}
                value={count}
                onChange={(e) => {
                  const v = Number(e.currentTarget.value)
                  if (v >= 1) setCount(v)
                }}
                className="w-full border border-border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">生成组数</label>
              <input
                type="number"
                min={1}
                value={groups}
                onChange={(e) => {
                  const v = Number(e.currentTarget.value)
                  if (v >= 1) setGroups(v)
                }}
                className="w-full border border-border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring"
              />
            </div>
          </div>

          {/* 分隔符 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">每组数字分隔符</label>
            <div className="flex flex-wrap gap-1.5">
              {[", ", " ", "-", "|", "/"].map((s) => (
                <Button
                  key={s}
                  variant={separator === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSeparator(s)}
                >
                  {s === " " ? "空格" : s}
                </Button>
              ))}
              <input
                type="text"
                value={separator}
                onChange={(e) => setSeparator(e.currentTarget.value)}
                placeholder="自定义"
                className="w-20 border border-border bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring"
              />
            </div>
          </div>

          {/* 复选框选项 */}
          <div className="flex flex-wrap gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={unique}
                onChange={() => setUnique((v) => !v)}
                className="accent-foreground size-4"
              />
              每组内数字不重复
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={sort}
                onChange={() => setSort((v) => !v)}
                className="accent-foreground size-4"
              />
              自动排序
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={pad}
                onChange={() => setPad((v) => !v)}
                className="accent-foreground size-4"
              />
              补前置零
            </label>
          </div>
        </CardContent>
      </Card>

      {/* 生成按钮 */}
      <Button onClick={handleGenerate} className="w-full">
        生成随机数
      </Button>

      {/* 输出区 */}
      {output !== "" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">生成结果</label>
            <Button variant="outline" size="xs" onClick={handleCopy}>
              {copied ? "已复制" : "复制"}
            </Button>
          </div>
          {output ? (
            <div className="border border-border bg-muted/50 px-3 py-3">
              {output.split("\n").map((line, i) => (
                <div key={i} className="font-mono text-base leading-relaxed">
                  {line}
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-border bg-muted/50 px-3 py-3 text-sm text-muted-foreground">
              范围不足以生成不重复的数字（需要 {max - min + 1} ≥ {count}）
            </div>
          )}
        </div>
      )}
    </div>
  )
}
