/**
 * 「兽言兽语」编码/解码核心逻辑
 *
 * 原理：文字 → UTF-8 字节 → 每字节拆为 4 组 2bit → 映射到 4 个自定义字符。
 * 每个字节对应 4 个输出字符，编码后体积变为原始 UTF-8 字节数的 4 倍。
 */

export interface AnimalSpeakOptions {
  chars: [string, string, string, string] // 分别对应 0b00, 0b01, 0b10, 0b11
}

const DEFAULT_CHARS: [string, string, string, string] = ["嗷", "呜", "啊", "~"]

/**
 * 编码：文字 → 兽语
 */
export function animalEncode(
  text: string,
  options: AnimalSpeakOptions = { chars: DEFAULT_CHARS },
): string {
  if (!text) return ""
  const { chars } = options
  const bytes = new TextEncoder().encode(text)
  const result: string[] = []
  for (const byte of bytes) {
    for (let shift = 6; shift >= 0; shift -= 2) {
      const idx = (byte >> shift) & 0b11
      result.push(chars[idx])
    }
  }
  return result.join("")
}

/**
 * 解码：兽语 → 文字
 */
export function animalDecode(
  encoded: string,
  options: AnimalSpeakOptions = { chars: DEFAULT_CHARS },
): string {
  if (!encoded) return ""
  const { chars } = options
  const charToIdx = new Map<string, number>()
  chars.forEach((ch, i) => charToIdx.set(ch, i))

  // 过滤并提取有效字符
  const filtered: number[] = []
  for (const ch of encoded) {
    const idx = charToIdx.get(ch)
    if (idx !== undefined) filtered.push(idx)
  }
  if (filtered.length === 0) return ""

  // 补足到 4 的倍数（忽略末尾不完整的字节）
  const complete = filtered.slice(0, Math.floor(filtered.length / 4) * 4)
  const bytes = new Uint8Array(complete.length / 4)
  for (let i = 0; i < complete.length; i += 4) {
    bytes[i / 4] =
      ((complete[i] & 0b11) << 6) |
      ((complete[i + 1] & 0b11) << 4) |
      ((complete[i + 2] & 0b11) << 2) |
      (complete[i + 3] & 0b11)
  }
  return new TextDecoder().decode(bytes)
}

export { DEFAULT_CHARS }
