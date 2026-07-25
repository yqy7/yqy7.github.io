import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Unicode 分类正则
const PATTERNS: Record<string, RegExp> = {
  // 汉字：CJK 统一表意文字基本区 + 扩展 A
  hanzi: /[一-鿿㐀-䶿]/g,
  // 中文标点：CJK 符号和标点 + 全角标点 + 其他中文符号
  cnPunct:
    /[　-〿！-／：-＠［-｀｛-～｡-･‘’“”…‧·～【】《》「」『』—]/g,
  // 英文（含数字、符号、标点）：ASCII 可打印字符
  english: /[ -~]/g,
  // 数字：阿拉伯数字
  digit: /[0-9]/g,
}

interface StatItem {
  label: string
  value: number
  highlight?: boolean
}

export default function WordCountPage() {
  const [input, setInput] = useState("")
  const [copied, setCopied] = useState(false)

  const stats = useMemo((): StatItem[] => {
    const text = input
    const total = Array.from(text).length // 按 Unicode 码点计数

    const hanziCount = text.match(PATTERNS.hanzi)?.length ?? 0
    const cnPunctCount = text.match(PATTERNS.cnPunct)?.length ?? 0
    const cnTotal = hanziCount + cnPunctCount
    const englishCount = text.match(PATTERNS.english)?.length ?? 0
    const digitCount = text.match(PATTERNS.digit)?.length ?? 0

    // 空格：ASCII 空白字符
    const spaceCount = (text.match(/[  　\t\n\r]/g) ?? []).length

    // 其他：不在以上任何分类中的字符
    let otherCount = total
    const counted = new Set<number>()
    const collect = (pattern: RegExp) => {
      for (const m of text.matchAll(pattern)) {
        counted.add(m.index!)
      }
    }
    collect(PATTERNS.hanzi)
    collect(PATTERNS.cnPunct)
    collect(PATTERNS.english)
    // 空格
    collect(/[  　\t\n\r]/g)
    otherCount = Array.from(text).filter((_, i) => !counted.has(i)).length

    return [
      { label: "总字符数", value: total, highlight: true },
      { label: "汉字", value: hanziCount },
      { label: "中文标点符号", value: cnPunctCount },
      { label: "汉字 + 中文标点", value: cnTotal, highlight: true },
      { label: "英文（含数字、符号、标点）", value: englishCount },
      { label: "数字", value: digitCount },
      { label: "空格 / 换行", value: spaceCount },
      { label: "其他字符", value: otherCount },
    ]
  }, [input])

  const handleCopy = useCallback(async () => {
    if (!stats.length) return
    const text = stats.map((s) => `${s.label}: ${s.value}`).join("\n")
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [stats])

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">字数统计</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            统计文本中的汉字、英文、数字、标点符号等各类字符数量
          </p>
        </div>
        {input && (
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? "已复制" : "复制统计"}
          </Button>
        )}
      </div>

      {/* 输入 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">输入文本</label>
        <textarea
          placeholder="在此输入或粘贴要统计的文本…"
          className="min-h-40 w-full border border-border bg-transparent px-3 py-3 text-base outline-none transition-[color,border-color] placeholder:text-muted-foreground focus-visible:border-ring md:text-sm"
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
        />
      </div>

      {/* 统计结果 */}
      <Card>
        <CardHeader>
          <CardTitle>统计结果</CardTitle>
          <CardDescription>实时统计，输入即更新</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {stats.map((item) => (
              <div
                key={item.label}
                className={`flex items-center justify-between rounded-sm border px-3 py-2.5 ${
                  item.highlight ? "border-ring bg-muted/30" : "border-border"
                }`}
              >
                <span className="text-sm">{item.label}</span>
                <span
                  className={`text-lg tabular-nums ${
                    item.highlight ? "font-semibold" : "text-muted-foreground"
                  }`}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
