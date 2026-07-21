/**
 * MD5 纯 TypeScript 实现（RFC 1321）
 */
function md5Hash(input: string): string {
  const bytes = new TextEncoder().encode(input)
  return md5Raw(bytes)
}

function md5Raw(bytes: Uint8Array): string {
  // MD5 常量
  const K = new Uint32Array([
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a,
    0xa8304613, 0xfd469501, 0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
    0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821, 0xf61e2562, 0xc040b340,
    0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8,
    0x676f02d9, 0x8d2a4c8a, 0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
    0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70, 0x289b7ec6, 0xeaa127fa,
    0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92,
    0xffeff47d, 0x85845dd1, 0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
    0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
  ])

  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ]

  const len = bytes.length
  const paddedLen = (((len + 8) >>> 6) + 1) << 6
  const padded = new Uint8Array(paddedLen)
  padded.set(bytes)
  padded[len] = 0x80

  const view = new DataView(padded.buffer)
  view.setUint32(paddedLen - 8, len * 8, true)

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476

  for (let i = 0; i < paddedLen; i += 64) {
    const M = new Uint32Array(16)
    for (let j = 0; j < 16; j++) {
      M[j] = view.getUint32(i + j * 4, true)
    }

    let A = a0, B = b0, C = c0, D = d0

    for (let j = 0; j < 64; j++) {
      let F: number, g: number
      if (j < 16) {
        F = (B & C) | (~B & D)
        g = j
      } else if (j < 32) {
        F = (D & B) | (~D & C)
        g = (5 * j + 1) % 16
      } else if (j < 48) {
        F = B ^ C ^ D
        g = (3 * j + 5) % 16
      } else {
        F = C ^ (B | ~D)
        g = (7 * j) % 16
      }
      F = (F + A + K[j] + M[g]) | 0
      A = D
      D = C
      C = B
      B = (B + ((F << S[j]) | (F >>> (32 - S[j])))) | 0
    }

    a0 = (a0 + A) | 0
    b0 = (b0 + B) | 0
    c0 = (c0 + C) | 0
    d0 = (d0 + D) | 0
  }

  return toHex(new Uint8Array(new Uint32Array([a0, b0, c0, d0]).buffer))
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}

/**
 * SHA 系列（使用 Web Crypto API）
 */
async function shaHash(input: string, algo: "SHA-1" | "SHA-256" | "SHA-512"): Promise<string> {
  const data = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest(algo, data)
  return toHex(new Uint8Array(hash))
}

/**
 * Base64
 */
function base64Encode(input: string): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(input)))
}

function base64Decode(input: string): string {
  return new TextDecoder().decode(
    Uint8Array.from(atob(input), (c) => c.charCodeAt(0)),
  )
}

/**
 * URL 编码
 */
function urlEncode(input: string): string {
  return encodeURIComponent(input)
}

function urlDecode(input: string): string {
  return decodeURIComponent(input)
}

/**
 * Hex 编码
 */
function hexEncode(input: string): string {
  return toHex(new TextEncoder().encode(input))
}

function hexDecode(input: string): string {
  const hex = input.replace(/\s/g, "")
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return new TextDecoder().decode(bytes)
}

// ─── 类型 ──────────────────────────────────────────────

export type HashAlgo = "MD5" | "SHA-1" | "SHA-256" | "SHA-512"
export type EncodeType = "Base64" | "URL" | "Hex"

export interface HashResult {
  algo: HashAlgo
  hash: string
}

export interface EncodeResult {
  type: EncodeType
  direction: "encode" | "decode"
  output: string
  error?: string
}

// ─── 导出 ──────────────────────────────────────────────

export async function computeHash(input: string, algo: HashAlgo): Promise<string> {
  if (algo === "MD5") return md5Hash(input)
  return shaHash(input, algo)
}

export function computeEncode(input: string, type: EncodeType, direction: "encode" | "decode"): string {
  switch (type) {
    case "Base64":
      return direction === "encode" ? base64Encode(input) : base64Decode(input)
    case "URL":
      return direction === "encode" ? urlEncode(input) : urlDecode(input)
    case "Hex":
      return direction === "encode" ? hexEncode(input) : hexDecode(input)
  }
}
