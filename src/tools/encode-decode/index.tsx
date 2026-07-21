import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { computeHash, computeEncode, type HashAlgo, type EncodeType } from "./utils"

const HASH_ALGOS: HashAlgo[] = ["MD5", "SHA-1", "SHA-256", "SHA-512"]
const ENCODE_TYPES: EncodeType[] = ["Base64", "URL", "Hex"]

export default function EncodeDecodePage() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [activeTab, setActiveTab] = useState<"hash" | "encode" | "decode">("hash")
  const [selectedAlgo, setSelectedAlgo] = useState<HashAlgo>("MD5")
  const [selectedEncode, setSelectedEncode] = useState<EncodeType>("Base64")
  const [copied, setCopied] = useState(false)

  const handleExecute = useCallback(async () => {
    if (!input.trim()) {
      setOutput("")
      return
    }

    if (activeTab === "hash") {
      const result = await computeHash(input, selectedAlgo)
      setOutput(result)
    } else if (activeTab === "encode") {
      try {
        const result = computeEncode(input, selectedEncode, "encode")
        setOutput(result)
      } catch {
        setOutput("编码失败，请检查输入内容")
      }
    } else {
      try {
        const result = computeEncode(input, selectedEncode, "decode")
        setOutput(result)
      } catch {
        setOutput("解码失败，请检查输入格式是否正确")
      }
    }
  }, [input, activeTab, selectedAlgo, selectedEncode])

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
        <h1 className="text-2xl font-semibold tracking-tight">编解码工具</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          MD5 / SHA 哈希计算 · Base64 / URL / Hex 编解码
        </p>
      </div>

      {/* 输入区 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">输入内容</label>
        <textarea
          placeholder="在此粘贴或输入文本…"
          className="min-h-32 w-full border border-border bg-transparent px-3 py-3 text-base outline-none transition-[color,border-color] placeholder:text-muted-foreground focus-visible:border-ring md:text-sm"
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
        />
      </div>

      {/* 操作区 */}
      <Card>
        <CardHeader>
          <CardTitle>算法</CardTitle>
          <CardDescription>选择算法后点击「执行」进行计算</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tab 切换 */}
          <div className="flex gap-1 rounded-md bg-muted p-1">
            {(["hash", "encode", "decode"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab)
                  setOutput("")
                }}
                className={cn(
                  "flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
                  activeTab === tab
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab === "hash" ? "哈希" : tab === "encode" ? "编码" : "解码"}
              </button>
            ))}
          </div>

          {/* 哈希按钮 */}
          {activeTab === "hash" && (
            <div className="flex flex-wrap gap-2">
              {HASH_ALGOS.map((algo) => (
                <Button
                  key={algo}
                  variant={selectedAlgo === algo ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedAlgo(algo)}
                >
                  {algo}
                </Button>
              ))}
            </div>
          )}

          {/* 编码按钮 */}
          {activeTab === "encode" && (
            <div className="flex flex-wrap gap-2">
              {ENCODE_TYPES.map((type) => (
                <Button
                  key={type}
                  variant={selectedEncode === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedEncode(type)}
                >
                  {type} 编码
                </Button>
              ))}
            </div>
          )}

          {/* 解码按钮 */}
          {activeTab === "decode" && (
            <div className="flex flex-wrap gap-2">
              {ENCODE_TYPES.map((type) => (
                <Button
                  key={type}
                  variant={selectedEncode === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedEncode(type)}
                >
                  {type} 解码
                </Button>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleExecute} className="w-full">
            执行
          </Button>
        </CardFooter>
      </Card>

      {/* 输出区 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">输出结果</label>
          <div className="flex gap-2">
            {output && (
              <Button variant="outline" size="xs" onClick={handleCopy}>
                {copied ? "已复制" : "复制"}
              </Button>
            )}
            <Button variant="ghost" size="xs" onClick={handleClear}>
              清空
            </Button>
          </div>
        </div>
        <textarea
          readOnly
          className="min-h-24 w-full border border-border bg-muted/50 px-3 py-3 font-mono text-sm outline-none"
          value={output}
          placeholder="计算结果将显示在这里…"
        />
      </div>
    </div>
  )
}
