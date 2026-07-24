import { useState, useCallback } from "react"
import pinyin from "pinyin"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type PinyinStyle = "tone" | "normal" | "tone2" | "first_letter"

const STYLES: { key: PinyinStyle; label: string; desc: string }[] = [
  { key: "tone", label: "带声调拼音", desc: "zhōng xīn" },
  { key: "normal", label: "无声调拼音", desc: "zhong xin" },
  { key: "tone2", label: "数字声调", desc: "zhong1 xin1" },
  { key: "first_letter", label: "拼音首字母", desc: "z x" },
]

export default function PinyinPage() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [style, setStyle] = useState<PinyinStyle>("tone")
  const [copied, setCopied] = useState(false)

  const handleConvert = useCallback(() => {
    if (!input.trim()) {
      setOutput("")
      return
    }
    const result = pinyin(input, { style }).map((py) => py[0]).join(" ")
    setOutput(result)
  }, [input, style])

  const handleCopy = useCallback(async () => {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [output])

  const handleClear = useCallback(() => {
    setInput("")
    setOutput("")
  }, [])

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">汉字转拼音</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          支持带声调、无声调、数字声调、首字母等模式
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
          placeholder="在此输入中文文本…"
          className="min-h-32 w-full border border-border bg-transparent px-3 py-3 text-base outline-none transition-[color,border-color] placeholder:text-muted-foreground focus-visible:border-ring md:text-sm"
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
        />
      </div>

      {/* 选项区 */}
      <Card>
        <CardHeader>
          <CardTitle>拼音模式</CardTitle>
          <CardDescription>选择一种模式后点击「转换」</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {STYLES.map((s) => (
            <Button
              key={s.key}
              variant={style === s.key ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setStyle(s.key)
                setOutput("")
              }}
            >
              {s.label}
              <span className="ml-1.5 text-xs text-muted-foreground">
                ({s.desc})
              </span>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* 执行按钮 */}
      <Button onClick={handleConvert} className="w-full">
        转换
      </Button>

      {/* 输出区 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">转换结果</label>
          {output && (
            <Button variant="outline" size="xs" onClick={handleCopy}>
              {copied ? "已复制" : "复制"}
            </Button>
          )}
        </div>
        <textarea
          readOnly
          className="min-h-24 w-full border border-border bg-muted/50 px-3 py-3 text-base outline-none"
          value={output}
          placeholder="拼音结果将显示在这里…"
        />
      </div>
    </div>
  )
}
