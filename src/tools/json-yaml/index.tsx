import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { load, dump } from "js-yaml"

type Direction = "json2yaml" | "yaml2json"

export default function JsonYamlPage() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")
  const [lastDir, setLastDir] = useState<Direction | null>(null)
  const [copied, setCopied] = useState(false)

  const convert = useCallback((dir: Direction) => {
    setError("")
    setLastDir(dir)
    if (!input.trim()) {
      setOutput("")
      return
    }
    try {
      if (dir === "json2yaml") {
        const obj = JSON.parse(input)
        setOutput(dump(obj, { indent: 2 }))
      } else {
        const obj = load(input) as unknown
        setOutput(JSON.stringify(obj, null, 2))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "转换失败")
      setOutput("")
    }
  }, [input])

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
    setLastDir(null)
  }, [output])

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">JSON ⇄ YAML</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          JSON 与 YAML 格式相互转换，支持复杂嵌套结构
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
          placeholder="在此输入 JSON 或 YAML…"
          className="min-h-40 w-full border border-border bg-transparent px-3 py-3 font-mono text-base outline-none transition-[color,border-color] placeholder:text-muted-foreground focus-visible:border-ring md:text-sm"
          value={input}
          onChange={(e) => {
            setInput(e.currentTarget.value)
            setError("")
          }}
          spellCheck={false}
        />
      </div>

      {/* 选项 */}
      <Card>
        <CardHeader>
          <CardTitle>格式说明</CardTitle>
          <CardDescription>
            JSON 使用标准格式，YAML 使用 2 空格缩进
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={() => convert("json2yaml")} className="flex-1">
              JSON → YAML
            </Button>
            <Button
              onClick={() => convert("yaml2json")}
              variant="outline"
              className="flex-1"
            >
              YAML → JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 输出区 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">
            转换结果
            {lastDir && (
              <span className="ml-1 text-muted-foreground">
                ({lastDir === "json2yaml" ? "JSON → YAML" : "YAML → JSON"})
              </span>
            )}
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
          <textarea
            readOnly
            className="min-h-40 w-full border border-border bg-muted/50 px-3 py-3 font-mono text-base outline-none md:text-sm"
            value={output}
            placeholder="转换结果将显示在这里…"
            spellCheck={false}
          />
        )}
      </div>
    </div>
  )
}
