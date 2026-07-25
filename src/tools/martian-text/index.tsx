import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import cnchar from "cnchar"
import "cnchar-trad"

export default function MartianTextPage() {
  const [input, setInput] = useState("你好，这是我的小工具页面")
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  const handleToMartian = useCallback(() => {
    setError("")
    if (!input.trim()) return
    try {
      const result = (cnchar as any).convert.simpleToSpark(input)
      setOutput(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : "转换失败")
    }
  }, [input])

  const handleFromMartian = useCallback(() => {
    setError("")
    if (!input.trim()) return
    try {
      const result = (cnchar as any).convert.sparkToSimple(input)
      setOutput(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : "转换失败")
    }
  }, [input])

  const handleCopy = useCallback(async () => {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [output])

  const handleSwap = useCallback(() => {
    setInput(output)
    setOutput("")
    setError("")
  }, [output])

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">火星文转换</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          简体中文与火星文（吙煋呅）相互转换
        </p>
      </div>

      {/* 输入 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">输入文字</label>
        <textarea
          placeholder="在此输入要转换的文字…"
          className="min-h-28 w-full border border-border bg-transparent px-3 py-3 text-base outline-none transition-[color,border-color] placeholder:text-muted-foreground focus-visible:border-ring md:text-sm"
          value={input}
          onChange={(e) => {
            setInput(e.currentTarget.value)
            setError("")
          }}
        />
      </div>

      {/* 按钮 */}
      <Card>
        <CardHeader>
          <CardTitle>转换方向</CardTitle>
          <CardDescription>火星文是一种混合繁体、异体字和符号的网络用语风格</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={handleToMartian} className="flex-1">
              简体 → 火星文
            </Button>
            <Button onClick={handleFromMartian} className="flex-1">
              火星文 → 简体
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

      {/* 输出 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">转换结果</label>
          <div className="flex gap-2">
            {output && (
              <Button variant="outline" size="xs" onClick={handleSwap}>
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
        <div className="min-h-24 border border-border bg-muted/50 px-3 py-3 text-base">
          {output || (
            <span className="text-muted-foreground">结果将显示在这里…</span>
          )}
        </div>
      </div>
    </div>
  )
}
