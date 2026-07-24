import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { encode, decode } from "xmorse"

interface Option {
  space: string
  short: string
  long: string
}

export default function MorsePage() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [option, setOption] = useState<Option>({
    space: "/",
    short: ".",
    long: "−",
  })
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")

  const opt = { space: option.space, short: option.short, long: option.long }

  const handleEncode = useCallback(() => {
    setError("")
    if (!input.trim()) {
      setOutput("")
      return
    }
    setOutput(encode(input, opt))
  }, [input, option])

  const handleDecode = useCallback(() => {
    setError("")
    if (!input.trim()) {
      setOutput("")
      return
    }
    try {
      setOutput(decode(input, opt))
    } catch {
      setError("解码失败，请检查摩斯电码格式是否正确")
      setOutput("")
    }
  }, [input, option])

  const handleCopy = useCallback(async () => {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [output])

  const handleClear = useCallback(() => {
    setInput("")
    setOutput("")
    setError("")
  }, [])

  const updateOption = (key: keyof Option, value: string) => {
    setOption((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">摩斯电码</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          支持中文等 Unicode 字符，可自定义长短符号和分隔符
        </p>
      </div>

      {/* 输入区 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">输入内容</label>
          <Button variant="ghost" size="xs" onClick={handleClear}>
            清空
          </Button>
        </div>
        <textarea
          placeholder="输入文字或摩斯电码…"
          className="min-h-32 w-full border border-border bg-transparent px-3 py-3 text-base outline-none transition-[color,border-color] placeholder:text-muted-foreground focus-visible:border-ring md:text-sm"
          value={input}
          onChange={(e) => {
            setInput(e.currentTarget.value)
            setError("")
          }}
        />
      </div>

      {/* 选项区 */}
      <Card>
        <CardHeader>
          <CardTitle>符号设置</CardTitle>
          <CardDescription>自定义摩斯电码的长短符号和字符分隔符</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">短符号</label>
              <input
                type="text"
                maxLength={1}
                value={option.short}
                onChange={(e) => updateOption("short", e.currentTarget.value)}
                className="w-full border border-border bg-transparent px-3 py-2 text-center font-mono text-sm outline-none focus-visible:border-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">长符号</label>
              <input
                type="text"
                maxLength={1}
                value={option.long}
                onChange={(e) => updateOption("long", e.currentTarget.value)}
                className="w-full border border-border bg-transparent px-3 py-2 text-center font-mono text-sm outline-none focus-visible:border-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">字符分隔符</label>
              <input
                type="text"
                maxLength={3}
                value={option.space}
                onChange={(e) => updateOption("space", e.currentTarget.value)}
                className="w-full border border-border bg-transparent px-3 py-2 text-center font-mono text-sm outline-none focus-visible:border-ring"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 执行按钮 */}
      <div className="flex gap-2">
        <Button onClick={handleEncode} className="flex-1">
          编码 → 摩斯码
        </Button>
        <Button onClick={handleDecode} className="flex-1">
          解码 → 文字
        </Button>
      </div>

      {/* 输出区 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">结果</label>
          <div className="flex gap-2">
            {output && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  setInput(output)
                  setOutput("")
                  setError("")
                }}
              >
                回填
              </Button>
            )}
            {output && (
              <Button variant="outline" size="xs" onClick={handleCopy}>
                {copied ? "已复制" : "复制"}
              </Button>
            )}
          </div>
        </div>
        {error ? (
          <div className="border border-destructive/50 bg-destructive/10 px-3 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : (
          <div className="min-h-24 border border-border bg-muted/50 px-3 py-3 text-base">
            {output || (
              <span className="text-muted-foreground">结果将显示在这里…</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
