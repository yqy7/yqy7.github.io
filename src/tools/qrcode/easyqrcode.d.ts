declare module "easyqrcodejs" {
  interface QRCodeOptions {
    text: string
    width?: number
    height?: number
    colorDark?: string
    colorLight?: string
    correctLevel?: QRCode.CorrectLevel
    drawer?: "canvas" | "svg"
    logo?: string
    logoWidth?: number
    logoHeight?: number
    quietZone?: number
    title?: string
    titleFont?: string
    titleColor?: string
    subTitle?: string
    subTitleFont?: string
    subTitleColor?: string
    onRenderingEnd?: (options: QRCodeOptions, dataURL: string) => void
  }

  namespace QRCode {
    enum CorrectLevel {
      H = 0,
      Q = 1,
      M = 2,
      L = 3,
    }
  }

  class QRCode {
    constructor(element: HTMLElement, options: QRCodeOptions)
    clear(): void
    makeCode(text: string): void
    resize(width: number, height: number): void
    download(fileName?: string): void
  }

  export = QRCode
}
