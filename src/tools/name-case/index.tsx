import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Format {
  name: string
  desc: string
  example: string
  convert: (words: string[]) => string
}

const FORMATS: Format[] = [
  {
    name: "camelCase",
    desc: "驼峰命名（小驼峰）",
    example: "helloWorld",
    convert: (w) =>
      w
        .map((s, i) => (i === 0 ? s.toLowerCase() : s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()))
        .join(""),
  },
  {
    name: "PascalCase",
    desc: "帕斯卡命名（大驼峰）",
    example: "HelloWorld",
    convert: (w) =>
      w.map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join(""),
  },
  {
    name: "snake_case",
    desc: "下划线 + 小写",
    example: "hello_world",
    convert: (w) => w.map((s) => s.toLowerCase()).join("_"),
  },
  {
    name: "UPPER_SNAKE_CASE",
    desc: "下划线 + 大写",
    example: "HELLO_WORLD",
    convert: (w) => w.map((s) => s.toUpperCase()).join("_"),
  },
  {
    name: "kebab-case",
    desc: "短横线 + 小写",
    example: "hello-world",
    convert: (w) => w.map((s) => s.toLowerCase()).join("-"),
  },
  {
    name: "Train-Case",
    desc: "短横线 + 首字母大写",
    example: "Hello-World",
    convert: (w) =>
      w.map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join("-"),
  },
  {
    name: "dot.case",
    desc: "点号分隔 + 小写（包名风格）",
    example: "hello.world",
    convert: (w) => w.map((s) => s.toLowerCase()).join("."),
  },
]

function splitWords(input: string): string[] {
  // 先按常见分隔符拆分
  const separated = input.replace(/[-_.\s]+/g, " ")
  // 再拆分 camelCase / PascalCase 边界：小写后接大写、大写后接小写+大写
  const words = separated
    .split(" ")
    .flatMap((part) => {
      // 拆分 camelCase: helloWorld → hello World
      const split = part.replace(/([a-z])([A-Z])/g, "$1 $2")
      // 拆分连续大写: XMLParser → XML Parser
      return split.replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2").split(" ")
    })
    .filter(Boolean)
  return words.length > 0 ? words : [input]
}

export default function NameCasePage() {
  const [input, setInput] = useState("")
  const [copied, setCopied] = useState<string | null>(null)

  const words = useMemo(() => splitWords(input), [input])

  const copy = useCallback(async (name: string, text: string) => {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(name)
    setTimeout(() => setCopied(null), 2000)
  }, [])

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">命名转换</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          输入空格分隔的单词或任意命名格式，自动转换为其他命名风格
        </p>
      </div>

      {/* 输入区 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">输入名称</label>
        <textarea
          placeholder="输入单词或命名，如 &#34;hello world&#34; 或 &#34;hello_world&#34; 或 &#34;HelloWorld&#34;…"
          className="min-h-20 w-full border border-border bg-transparent px-3 py-3 text-base outline-none transition-[color,border-color] placeholder:text-muted-foreground focus-visible:border-ring md:text-sm"
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
        />
      </div>

      {/* 结果区 */}
      <Card>
        <CardHeader>
          <CardTitle>转换结果</CardTitle>
          <CardDescription>
            {words.length > 0
              ? `已识别 ${words.length} 个单词：${words.join("、")}`
              : "输入内容后将自动显示所有命名格式"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {FORMATS.map((fmt) => {
            const result = words.length > 0 ? fmt.convert(words) : ""
            return (
              <div
                key={fmt.name}
                className="flex items-center gap-3 rounded-sm border border-border px-3 py-2.5"
              >
                <div className="w-40 shrink-0">
                  <div className="text-sm font-medium">{fmt.desc}</div>
                  <div className="text-xs text-muted-foreground">{fmt.example}</div>
                </div>
                <code className="min-w-0 flex-1 break-all text-base">{result || "—"}</code>
                {result && (
                  <Button
                    variant="outline"
                    size="xs"
                    className="shrink-0"
                    onClick={() => copy(fmt.name, result)}
                  >
                    {copied === fmt.name ? "已复制" : "复制"}
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
