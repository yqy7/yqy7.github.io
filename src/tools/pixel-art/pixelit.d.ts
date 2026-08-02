declare class Pixelit {
  constructor(config: {
    from?: HTMLImageElement
    to?: HTMLCanvasElement
    scale?: number
    palette?: [number, number, number][]
    maxWidth?: number
    maxHeight?: number
  })

  draw(): this
  pixelate(): this
  convertGrayscale(): this
  convertPalette(): this
  setScale(scale: number): this
  setPalette(palette: [number, number, number][]): this
  setMaxWidth(width: number): this
  setMaxHeight(height: number): this
  getPalette(): [number, number, number][]
  setFromImgSource(src: string): void
  setDrawFrom(elem: HTMLImageElement): this
  setDrawTo(elem: HTMLCanvasElement): this
  saveImage(): void
}

export default Pixelit
