import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import nzhcn from "nzh/cn"
import nzhhk from "nzh/hk"

type Lang = "cn" | "hk"
type Style = "s" | "b"

interface Option {
  lang: Lang
  style: Style
}

export default function ChineseNumberPage() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [option, setOption] = useState<Option>({ lang: "cn", style: "s" })
  const [mode, setMode] = useState<"num2cn" | "cn2num">("num2cn")
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  const nzh = option.lang === "cn" ? nzhcn : nzhhk

  const handleNum2Cn = useCallback(() => {
    setError("")
    setMode("num2cn")
    if (!input.trim()) {
      setOutput("")
      return
    }
    try {
      const num = Number(input)
      if (isNaN(num)) {
        setError("请输入有效的数字")
        return
      }
      const result =
        option.style === "b" ? nzh.encodeB(num) : nzh.encodeS(num)
      setOutput(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : "转换失败")
    }
  }, [input, option])

  const handleCn2Num = useCallback(() => {
    setError("")
    setMode("cn2num")
    if (!input.trim()) {
      setOutput("")
      return
    }
    try {
      const result = String(
        option.style === "b"
          ? nzh.decodeB(input.trim())
          : nzh.decodeS(input.trim()),
      )
      setOutput(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : "转换失败，请检查中文数字格式")
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

  const handleSwap = useCallback(() => {
    setInput(output)
    setOutput("")
    setError("")
    setMode((m) => (m === "num2cn" ? "cn2num" : "num2cn"))
  }, [output])

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">中文数字转换</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          阿拉伯数字与中文数字相互转换，支持简体、繁体和大小写
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
        <input
          type="text"
          placeholder="输入阿拉伯数字或中文数字，如一亿二千三百四十五万…"
          className="w-full border border-border bg-transparent px-3 py-2 text-base outline-none focus-visible:border-ring"
          value={input}
          onChange={(e) => {
            setInput(e.currentTarget.value)
            setError("")
          }}
        />
      </div>

      {/* 选项 */}
      <Card>
        <CardHeader>
          <CardTitle>转换选项</CardTitle>
          <CardDescription>选择语言和大小写风格</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 语言 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">语言</label>
            <div className="flex gap-2">
              {[
                { key: "cn" as Lang, label: "简体中文" },
                { key: "hk" as Lang, label: "繁体中文" },
              ].map(({ key, label }) => (
                <Button
                  key={key}
                  variant={option.lang === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOption((p) => ({ ...p, lang: key }))}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* 大小写 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">数字格式</label>
            <div className="flex gap-2">
              {[
                { key: "s" as Style, label: "小写", example: "一千二百三十四" },
                { key: "b" as Style, label: "大写", example: "壹仟贰佰叁拾肆" },
              ].map(({ key, label, example }) => (
                <Button
                  key={key}
                  variant={option.style === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOption((p) => ({ ...p, style: key }))}
                >
                  {label}
                  <span className="ml-1 text-xs opacity-70">({example})</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 执行按钮 */}
      <div className="flex gap-2">
        <Button onClick={handleNum2Cn} className="flex-1">
          数字 → 中文
        </Button>
        <Button onClick={handleCn2Num} className="flex-1">
          中文 → 数字
        </Button>
      </div>

      {/* 输出 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">
            转换结果
            <span className="ml-1 text-muted-foreground">
              ({mode === "num2cn" ? "数字 → 中文" : "中文 → 数字"})
            </span>
          </label>
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
        {error ? (
          <div className="border border-destructive/50 bg-destructive/10 px-3 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : (
          <div className="min-h-12 border border-border bg-muted/50 px-3 py-3 text-base">
            {output || (
              <span className="text-muted-foreground">结果将显示在这里…</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
