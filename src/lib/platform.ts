/**
 * 平台差异封装：统一 Web 端与 Tauri 桌面端的实现。
 * 页面代码只调用这里的函数，无需关心运行环境。
 */

/** 是否运行在 Tauri 桌面端 */
export const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window

/** dataURL → Uint8Array */
async function dataUrlToBytes(dataUrl: string): Promise<Uint8Array> {
  const res = await fetch(dataUrl)
  const buf = await res.arrayBuffer()
  return new Uint8Array(buf)
}

/** dataURL → RGBA 原始像素数据（用于 Tauri 剪贴板图片） */
async function dataUrlToRgba(dataUrl: string) {
  const img = new Image()
  img.src = dataUrl
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error("图片加载失败"))
  })
  const canvas = document.createElement("canvas")
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(img, 0, 0)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  return {
    width: canvas.width,
    height: canvas.height,
    rgba: new Uint8Array(imageData.data.buffer),
  }
}

/** 保存图片：桌面端用原生保存对话框，Web 端触发浏览器下载 */
export async function saveImage(dataUrl: string, filename: string) {
  if (isTauri) {
    const { save } = await import("@tauri-apps/plugin-dialog")
    const { writeFile } = await import("@tauri-apps/plugin-fs")
    const path = await save({ defaultPath: filename })
    if (!path) return
    await writeFile(path, await dataUrlToBytes(dataUrl))
  } else {
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = filename
    a.click()
  }
}

/** 复制文字到剪贴板 */
export async function copyText(text: string) {
  if (isTauri) {
    const { writeText } = await import("@tauri-apps/plugin-clipboard-manager")
    await writeText(text)
  } else {
    await navigator.clipboard.writeText(text)
  }
}

/** 复制图片到剪贴板 */
export async function copyImage(dataUrl: string) {
  if (isTauri) {
    const { writeImage } = await import("@tauri-apps/plugin-clipboard-manager")
    const { Image } = await import("@tauri-apps/api/image")
    const { width, height, rgba } = await dataUrlToRgba(dataUrl)
    const img = await Image.new(rgba, width, height)
    await writeImage(img)
  } else {
    const blob = await (await fetch(dataUrl)).blob()
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
  }
}
