import { describe, it, expect } from "vitest"
import { animalEncode, animalDecode, DEFAULT_CHARS } from "./encoding"

describe("animalEncode", () => {
  it("空字符串返回空", () => {
    expect(animalEncode("")).toBe("")
  })

  it("编码后只包含 4 个自定义字符", () => {
    const result = animalEncode("Hello")
    for (const ch of result) {
      expect(DEFAULT_CHARS).toContain(ch)
    }
  })

  it("每个 ASCII 字符编码为 4 个兽语字符（UTF-8 单字节）", () => {
    expect(animalEncode("a")).toHaveLength(4)
    expect(animalEncode("ab")).toHaveLength(8)
    expect(animalEncode("abc")).toHaveLength(12)
  })

  it("中文字符编码长度大于 4（UTF-8 多字节）", () => {
    // "你" = 3 字节 UTF-8，编码后 12 个字符
    const result = animalEncode("你")
    expect(result.length).toBe(12)
  })

  it("emoji 编码正常", () => {
    const result = animalEncode("🤔")
    expect(result.length).toBeGreaterThan(0)
    for (const ch of result) {
      expect(DEFAULT_CHARS).toContain(ch)
    }
  })

  it("自定义字符", () => {
    const chars: [string, string, string, string] = ["喵", "汪", "叽", "喳"]
    const result = animalEncode("hi", { chars })
    for (const ch of result) {
      expect(["喵", "汪", "叽", "喳"]).toContain(ch)
    }
  })
})

describe("animalDecode", () => {
  it("空字符串返回空", () => {
    expect(animalDecode("")).toBe("")
  })

  it("纯非有效字符返回空", () => {
    expect(animalDecode("hello world")).toBe("")
  })

  it("编码后解码还原（ASCII）", () => {
    const cases = ["Hello World", "abc", "Test123", "!@#$%"]
    for (const text of cases) {
      const encoded = animalEncode(text)
      const decoded = animalDecode(encoded)
      expect(decoded).toBe(text)
    }
  })

  it("编码后解码还原（中文）", () => {
    const cases = ["你好世界", "兽言兽语", "编码测试！"]
    for (const text of cases) {
      const encoded = animalEncode(text)
      const decoded = animalDecode(encoded)
      expect(decoded).toBe(text)
    }
  })

  it("编码后解码还原（emoji）", () => {
    const text = "Hello 🎉 World 🌍"
    const encoded = animalEncode(text)
    const decoded = animalDecode(encoded)
    expect(decoded).toBe(text)
  })

  it("编码后解码还原（混合字符）", () => {
    const text = "中文Hello123🎉"
    const encoded = animalEncode(text)
    const decoded = animalDecode(encoded)
    expect(decoded).toBe(text)
  })

  it("过滤兽语字符之间的无关字符", () => {
    const text = "你好"
    const encoded = animalEncode(text)
    // 在字符之间插入空格和换行
    const withNoise = encoded.slice(0, 4) + " \n" + encoded.slice(4, 8) + "xyz" + encoded.slice(8)
    expect(animalDecode(withNoise)).toBe(text)
  })

  it("末尾不完整字节被忽略", () => {
    const text = "你好"
    const encoded = animalEncode(text)
    // "你好" = 24 字符，去掉最后 2 个 → 22 字符 = 5 个完整字节 + 2 残留
    const truncated = encoded.slice(0, -2)
    const decoded = animalDecode(truncated)
    // 解码后不等于原文（丢失了最后一个字节的一部分）
    expect(decoded).not.toBe(text)
    // 残留的 2 个字符被忽略，再编码长度应是 4 的倍数
    const reEncoded = animalEncode(decoded)
    expect(reEncoded.length % 4).toBe(0)
    // 再解码回去仍然一致
    expect(animalDecode(reEncoded)).toBe(decoded)
  })

  it("自定义字符对应关系正确", () => {
    const chars: [string, string, string, string] = ["喵", "汪", "叽", "喳"]
    const text = "测试Test"
    const encoded = animalEncode(text, { chars })
    const decoded = animalDecode(encoded, { chars })
    expect(decoded).toBe(text)
    // 确保只包含自定义字符
    for (const ch of encoded) {
      expect(["喵", "汪", "叽", "喳"]).toContain(ch)
    }
  })
})

describe("往返一致性", () => {
  it("各种文本编码后再解码完全还原", () => {
    const texts = [
      "",
      "a",
      "Hello World!",
      "你好",
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      "中英混合 Mixed こんにちは 🎉 emoji 测试",
      "非常长的中文段落。" + "这是一段测试文本。".repeat(50),
    ]
    for (const text of texts) {
      expect(animalDecode(animalEncode(text))).toBe(text)
    }
  })
})
