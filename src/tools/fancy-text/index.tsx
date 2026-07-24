import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { string_to_unicode_variant } from "string-to-unicode-variant"

interface VariantItem {
  key: string
  label: string
  preview: string
}

const VARIANTS: VariantItem[] = [
  { key: "monospace", label: "Monospace 等宽", preview: "monospace" },
  { key: "bold", label: "Bold 粗体", preview: "bold" },
  { key: "italic", label: "Italic 斜体", preview: "italic" },
  { key: "bold italic", label: "Bold Italic 粗斜体", preview: "bold italic" },
  { key: "script", label: "Script 手写体", preview: "script" },
  { key: "bold script", label: "Bold Script 粗手写", preview: "bold script" },
  { key: "gothic", label: "Gothic 哥特体", preview: "gothic" },
  { key: "gothic bold", label: "Gothic Bold 粗哥特", preview: "gothic bold" },
  { key: "doublestruck", label: "Doublestruck 双线", preview: "doublestruck" },
  { key: "sans", label: "Sans 无衬线", preview: "sans" },
  { key: "bold sans", label: "Bold Sans 粗无衬线", preview: "bold sans" },
  { key: "italic sans", label: "Italic Sans 斜无衬线", preview: "italic sans" },
  { key: "bold italic sans", label: "Bold Italic Sans", preview: "bold italic sans" },
  { key: "circled", label: "Circled 圆圈", preview: "circled" },
  { key: "circled negative", label: "Circled Neg 反色圈", preview: "circled neg" },
  { key: "squared", label: "Squared 方框", preview: "squared" },
  { key: "squared negative", label: "Squared Neg 反色方框", preview: "squared neg" },
  { key: "fullwidth", label: "Fullwidth 全角", preview: "fullwidth" },
  { key: "parenthesis", label: "Parenthesis 括号", preview: "parenthesis" },
]

const COMBININGS: { key: string; label: string }[] = [
  { key: "", label: "无" },
  { key: "underline", label: "下划线" },
  { key: "underline-double", label: "双下划线" },
  { key: "strike", label: "删除线" },
  { key: "overline", label: "上划线" },
  { key: "slash", label: "斜线" },
]

function convert(text: string, variant: string, combining: string): string {
  if (!text) return ""
  try {
    return combining
      ? string_to_unicode_variant(text, variant, combining)
      : string_to_unicode_variant(text, variant)
  } catch {
    return text
  }
}

export default function FancyTextPage() {
  const [input, setInput] = useState("")
  const [combining, setCombining] = useState("")
  const [copied, setCopied] = useState<string | null>(null)

  const copy = useCallback(async (key: string, text: string) => {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }, [])

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">花体英文转换</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          将普通文字转换为多种 Unicode 花体风格，支持装饰线组合
        </p>
      </div>

      {/* 输入区 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">输入文字</label>
        <textarea
          placeholder="在此输入英文文字…"
          className="min-h-24 w-full border border-border bg-transparent px-3 py-3 text-base outline-none transition-[color,border-color] placeholder:text-muted-foreground focus-visible:border-ring md:text-sm"
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
        />
      </div>

      {/* 装饰线选项 */}
      <Card>
        <CardHeader>
          <CardTitle>装饰线</CardTitle>
          <CardDescription>叠加在文字上的装饰效果（可选）</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {COMBININGS.map((c) => (
              <Button
                key={c.key}
                variant={combining === c.key ? "default" : "outline"}
                size="sm"
                onClick={() => setCombining(c.key)}
              >
                {c.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 结果区 */}
      <Card>
        <CardHeader>
          <CardTitle>转换结果</CardTitle>
          <CardDescription>
            共 {VARIANTS.length} 种风格，点击右侧按钮复制
            {!input && "（输入文字后自动显示）"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {VARIANTS.map((v) => {
            const result = convert(input, v.key, combining)
            return (
              <div
                key={v.key}
                className="flex items-center gap-3 rounded-sm border border-border px-3 py-2.5"
              >
                <div className="w-40 shrink-0">
                  <div className="text-sm font-medium">{v.label}</div>
                </div>
                <code className="min-w-0 flex-1 break-all text-base">
                  {result || (
                    <span className="text-muted-foreground">
                      {input ? "—" : v.preview}
                    </span>
                  )}
                </code>
                {result && (
                  <Button
                    variant="outline"
                    size="xs"
                    className="shrink-0"
                    onClick={() => copy(v.key, result)}
                  >
                    {copied === v.key ? "已复制" : "复制"}
                  </Button>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
