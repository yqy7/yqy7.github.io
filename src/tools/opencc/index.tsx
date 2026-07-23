import { useState, useCallback } from "react"
import OpenCC from "opencc-js"
import { Button } from "@/components/ui/button"

const CONVERSIONS = [
  { label: "简体 → 繁体（台湾）", from: "cn", to: "twp" },
  { label: "繁体（台湾） → 简体", from: "twp", to: "cn" },
  { label: "简体 → 繁体（香港）", from: "cn", to: "hk" },
  { label: "繁体（香港） → 简体", from: "hk", to: "cn" },
]

export default function OpenCCPage() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [selected, setSelected] = useState(0)
  const [copied, setCopied] = useState(false)

  const handleConvert = useCallback(() => {
    if (!input.trim()) {
      setOutput("")
      return
    }
    const { from, to } = CONVERSIONS[selected]
    const converter = OpenCC.Converter({ from, to })
    setOutput(converter(input))
  }, [input, selected])

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

  const handleSwap = useCallback(() => {
    setInput(output)
    setOutput("")
  }, [output])

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">简繁转换</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          简体中文与繁体中文相互转换
        </p>
      </div>

      {/* 转换方向 */}
      <div className="flex flex-wrap gap-2">
        {CONVERSIONS.map((conv, i) => (
          <Button
            key={i}
            variant={selected === i ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelected(i)
              setOutput("")
            }}
          >
            {conv.label}
          </Button>
        ))}
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
          placeholder="在此粘贴或输入文本…"
          className="min-h-32 w-full border border-border bg-transparent px-3 py-3 text-base outline-none transition-[color,border-color] placeholder:text-muted-foreground focus-visible:border-ring md:text-sm"
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
        />
      </div>

      {/* 执行按钮 */}
      <Button onClick={handleConvert} className="w-full">
        转换
      </Button>

      {/* 输出区 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">转换结果</label>
          <div className="flex gap-2">
            {output && (
              <>
                <Button variant="outline" size="xs" onClick={handleCopy}>
                  {copied ? "已复制" : "复制"}
                </Button>
                <Button variant="ghost" size="xs" onClick={handleSwap}>
                  回填到输入
                </Button>
              </>
            )}
          </div>
        </div>
        <textarea
          readOnly
          className="min-h-32 w-full border border-border bg-muted/50 px-3 py-3 font-sans text-base outline-none"
          value={output}
          placeholder="转换结果将显示在这里…"
        />
      </div>
    </div>
  )
}
