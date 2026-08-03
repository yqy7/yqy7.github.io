import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import colorData from "@/assets/chinese_color.json"

// ── 类型与常量 ────────────────────────────────────────────────

interface ChineseColor {
  name: string
  category: string
  r: number
  g: number
  b: number
  hex: string
  sentence: string
  author: string
  sentenceFrom: string
  fontColor?: string
}

const ALL_COLORS: ChineseColor[] = colorData.flat()
const CATEGORIES = [...new Set(ALL_COLORS.map((c) => c.category))]

// ── 页面组件 ──────────────────────────────────────────────────

export default function ChineseColorPage() {
  const [category, setCategory] = useState("全部")
  const [keyword, setKeyword] = useState("")
  const [selected, setSelected] = useState<ChineseColor | null>(null)
  const [copied, setCopied] = useState<"hex" | "rgb" | "">("")

  const colors = useMemo(() => {
    const kw = keyword.trim()
    return ALL_COLORS.filter(
      (c) =>
        (category === "全部" || c.category === category) &&
        (!kw || c.name.includes(kw) || c.hex.includes(kw)),
    )
  }, [category, keyword])

  const handleCopy = async (type: "hex" | "rgb") => {
    if (!selected) return
    const text = type === "hex" ? selected.hex : `rgb(${selected.r}, ${selected.g}, ${selected.b})`
    await navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(""), 1500)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">中国传统颜色</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          二十四节气 · 384 种中国传统颜色，点击色块查看详情并复制
        </p>
      </div>

      {/* 节气筛选 + 搜索 */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setCategory("全部")}
            className={`rounded-sm border px-2.5 py-1 text-xs transition-colors ${
              category === "全部"
                ? "border-ring bg-muted text-foreground"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            全部
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-sm border px-2.5 py-1 text-xs transition-colors ${
                category === c
                  ? "border-ring bg-muted text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.currentTarget.value)}
          placeholder="搜索颜色名称或色值…"
          className="w-full max-w-xs border border-border bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:border-ring"
        />
      </div>

      {/* 选中颜色详情 */}
      {selected && (
        <Card className="sticky top-14 z-20 backdrop-blur-sm">
          <CardContent className="grid gap-4 p-4 sm:grid-cols-[160px_1fr]">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{ backgroundColor: selected.hex, minHeight: 120 }}
            >
              <span
                className="text-sm font-medium"
                style={{ color: selected.fontColor ?? "#ffffff" }}
              >
                {selected.name}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold">{selected.name}</h3>
                <span className="text-xs text-muted-foreground">{selected.category}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleCopy("hex")}
                  className="rounded-sm border border-border px-2 py-1 font-mono text-xs transition-colors hover:bg-muted"
                >
                  {copied === "hex" ? "✓ 已复制" : selected.hex}
                </button>
                <button
                  onClick={() => handleCopy("rgb")}
                  className="rounded-sm border border-border px-2 py-1 font-mono text-xs transition-colors hover:bg-muted"
                >
                  {copied === "rgb" ? "✓ 已复制" : `rgb(${selected.r}, ${selected.g}, ${selected.b})`}
                </button>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                <p className="leading-relaxed">{selected.sentence}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  —— {selected.author}
                  {selected.sentenceFrom ? `《${selected.sentenceFrom}》` : ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 颜色网格 */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {colors.map((c) => (
          <button
            key={c.hex + c.name}
            onClick={() => setSelected(c)}
            className="group cursor-pointer overflow-hidden rounded-md border border-border transition-all hover:shadow-md"
          >
            <div
              className="aspect-square w-full"
              style={{ backgroundColor: c.hex }}
            />
            <div className="px-1 py-0.5 text-center">
              <span className="block truncate text-[11px] text-foreground">{c.name}</span>
            </div>
          </button>
        ))}
      </div>

      {colors.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">未找到匹配的颜色</p>
      )}

      <p className="text-xs text-muted-foreground">共 {colors.length} 种颜色</p>
    </div>
  )
}
