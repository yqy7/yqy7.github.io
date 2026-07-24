import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function generateUUID(strip: boolean, upper: boolean): string {
  let uuid: string = crypto.randomUUID()
  if (strip) uuid = uuid.replace(/-/g, "")
  if (upper) uuid = uuid.toUpperCase()
  return uuid
}

export default function UUIDPage() {
  const [count, setCount] = useState(1)
  const [strip, setStrip] = useState(false)
  const [upper, setUpper] = useState(false)
  const [output, setOutput] = useState("")
  const [copied, setCopied] = useState(false)

  const handleGenerate = useCallback(() => {
    const uuids = Array.from({ length: count }, () => generateUUID(strip, upper))
    setOutput(uuids.join("\n"))
  }, [count, strip, upper])

  const handleCopy = useCallback(async () => {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [output])

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">UUID 生成器</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          基于加密安全随机数生成 UUID v4，支持自定义数量和格式
        </p>
      </div>

      {/* 选项区 */}
      <Card>
        <CardHeader>
          <CardTitle>生成选项</CardTitle>
          <CardDescription>设置生成数量和输出格式</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 数量 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">生成数量</label>
            <input
              type="number"
              min={1}
              max={500}
              value={count}
              onChange={(e) => {
                const v = Number(e.currentTarget.value)
                if (v >= 1 && v <= 500) setCount(v)
              }}
              className="w-full border border-border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring sm:w-32"
            />
          </div>

          {/* 格式选项 */}
          <div className="flex flex-wrap gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!strip}
                onChange={() => setStrip((v) => !v)}
                className="accent-foreground size-4"
              />
              保留连字符（-）
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={upper}
                onChange={() => setUpper((v) => !v)}
                className="accent-foreground size-4"
              />
              大写字母
            </label>
          </div>
        </CardContent>
      </Card>

      {/* 生成按钮 */}
      <Button onClick={handleGenerate} className="w-full">
        生成 UUID
      </Button>

      {/* 输出区 */}
      {output && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              生成结果（{count} 个）
            </label>
            <Button variant="outline" size="xs" onClick={handleCopy}>
              {copied ? "已复制" : "复制"}
            </Button>
          </div>
          <div className="border border-border bg-muted/50 px-3 py-3">
            {output.split("\n").map((line, i) => (
              <div key={i} className="font-mono text-base leading-relaxed">
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
