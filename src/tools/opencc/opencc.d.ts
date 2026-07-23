declare module "opencc-js" {
  interface ConverterOptions {
    from: string
    to: string
  }

  function Converter(options: ConverterOptions): (text: string) => string
  function CustomConverter(
    dict: string[][] | string,
  ): (text: string) => string
  function ConverterFactory(
    from: unknown,
    to: unknown,
  ): (text: string) => string

  const Locale: {
    from: Record<string, unknown>
    to: Record<string, unknown>
  }

  function HTMLConverter(
    converter: (text: string) => string,
    root: HTMLElement,
    fromLang: string,
    toLang: string,
  ): { convert(): void; restore(): void }

  export default OpenCC
  const OpenCC: {
    Converter: typeof Converter
    CustomConverter: typeof CustomConverter
    ConverterFactory: typeof ConverterFactory
    HTMLConverter: typeof HTMLConverter
    Locale: typeof Locale
  }
}
