import { StrictMode, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

import './index.css'
import { Layout } from '@/components/Layout'
import App from './App.tsx'

// 工具页全部懒加载：进入对应路由时才加载，减小首页首屏体积
const EncodeDecodePage = lazy(() => import('@/tools/encode-decode/index.tsx'))
const QRCodePage = lazy(() => import('@/tools/qrcode/index.tsx'))
const OpenCCPage = lazy(() => import('@/tools/opencc/index.tsx'))
const PinyinPage = lazy(() => import('@/tools/pinyin/index.tsx'))
const PasswordPage = lazy(() => import('@/tools/password/index.tsx'))
const RandomNumberPage = lazy(() => import('@/tools/random-number/index.tsx'))
const BaseConvertPage = lazy(() => import('@/tools/base-convert/index.tsx'))
const UUIDPage = lazy(() => import('@/tools/uuid/index.tsx'))
const MorsePage = lazy(() => import('@/tools/morse/index.tsx'))
const NameCasePage = lazy(() => import('@/tools/name-case/index.tsx'))
const ColorConvertPage = lazy(() => import('@/tools/color-convert/index.tsx'))
const CrontabPage = lazy(() => import('@/tools/crontab/index.tsx'))
const JsonYamlPage = lazy(() => import('@/tools/json-yaml/index.tsx'))
const ChineseNumberPage = lazy(() => import('@/tools/chinese-number/index.tsx'))
const FancyTextPage = lazy(() => import('@/tools/fancy-text/index.tsx'))
const TTSPage = lazy(() => import('@/tools/tts/index.tsx'))
const DeviceInfoPage = lazy(() => import('@/tools/device-info/index.tsx'))
const UnicodePage = lazy(() => import('@/tools/unicode/index.tsx'))
const ZeroWidthPage = lazy(() => import('@/tools/zero-width/index.tsx'))
const AnimalSpeakPage = lazy(() => import('@/tools/animal-speak/index.tsx'))
const TextDiffPage = lazy(() => import('@/tools/text-diff/index.tsx'))
const WordCountPage = lazy(() => import('@/tools/word-count/index.tsx'))
const JsonFormatterPage = lazy(() => import('@/tools/json-formatter/index.tsx'))
const MartianTextPage = lazy(() => import('@/tools/martian-text/index.tsx'))
const LuckyWheelPage = lazy(() => import('@/tools/lucky-wheel/index.tsx'))
const RandomNamePage = lazy(() => import('@/tools/random-name/index.tsx'))
const IdentityPage = lazy(() => import('@/tools/identity/index.tsx'))
const BarcodePage = lazy(() => import('@/tools/barcode/index.tsx'))
const OCRPage = lazy(() => import('@/tools/ocr/index.tsx'))
const SQLFormatterPage = lazy(() => import('@/tools/sql-formatter/index.tsx'))
const ColorExtractorPage = lazy(() => import('@/tools/color-extractor/index.tsx'))
const BgRemovePage = lazy(() => import('@/tools/bg-remove/index.tsx'))
const QRCodeScannerPage = lazy(() => import('@/tools/qrcode-scanner/index.tsx'))
const PixelArtPage = lazy(() => import('@/tools/pixel-art/index.tsx'))
const ChineseColorPage = lazy(() => import('@/tools/chinese-color/index.tsx'))
const WatermarkPage = lazy(() => import('@/tools/watermark/index.tsx'))
const ImageCompressPage = lazy(() => import('@/tools/image-compress/index.tsx'))
const TimestampPage = lazy(() => import('@/tools/timestamp/index.tsx'))
const CropPage = lazy(() => import('@/tools/crop/index.tsx'))
const ResizePage = lazy(() => import('@/tools/resize/index.tsx'))
const BlurPage = lazy(() => import('@/tools/blur/index.tsx'))
const SlicePage = lazy(() => import('@/tools/slice/index.tsx'))
const AsciiArtPage = lazy(() => import('@/tools/ascii-art/index.tsx'))
const LoveHeartPage = lazy(() => import('@/tools/love-heart/index.tsx'))
const PaperTexturePage = lazy(() => import('@/tools/paper-texture/index.tsx'))

const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <App />,
      },
      {
        path: "/tools/encode-decode",
        element: <EncodeDecodePage />,
      },
      {
        path: "/tools/qrcode",
        element: <QRCodePage />,
      },
      {
        path: "/tools/opencc",
        element: <OpenCCPage />,
      },
      {
        path: "/tools/pinyin",
        element: <PinyinPage />,
      },
      {
        path: "/tools/password",
        element: <PasswordPage />,
      },
      {
        path: "/tools/random-number",
        element: <RandomNumberPage />,
      },
      {
        path: "/tools/base-convert",
        element: <BaseConvertPage />,
      },
      {
        path: "/tools/uuid",
        element: <UUIDPage />,
      },
      {
        path: "/tools/morse",
        element: <MorsePage />,
      },
      {
        path: "/tools/name-case",
        element: <NameCasePage />,
      },
      {
        path: "/tools/color-convert",
        element: <ColorConvertPage />,
      },
      {
        path: "/tools/crontab",
        element: <CrontabPage />,
      },
      {
        path: "/tools/json-yaml",
        element: <JsonYamlPage />,
      },
      {
        path: "/tools/chinese-number",
        element: <ChineseNumberPage />,
      },
      {
        path: "/tools/fancy-text",
        element: <FancyTextPage />,
      },
      {
        path: "/tools/tts",
        element: <TTSPage />,
      },
      {
        path: "/tools/device-info",
        element: <DeviceInfoPage />,
      },
      {
        path: "/tools/unicode",
        element: <UnicodePage />,
      },
      {
        path: "/tools/zero-width",
        element: <ZeroWidthPage />,
      },
      {
        path: "/tools/animal-speak",
        element: <AnimalSpeakPage />,
      },
      {
        path: "/tools/text-diff",
        element: <TextDiffPage />,
      },
      {
        path: "/tools/word-count",
        element: <WordCountPage />,
      },
      {
        path: "/tools/json-formatter",
        element: <JsonFormatterPage />,
      },
      {
        path: "/tools/martian-text",
        element: <MartianTextPage />,
      },
      {
        path: "/tools/lucky-wheel",
        element: <LuckyWheelPage />,
      },
      {
        path: "/tools/random-name",
        element: <RandomNamePage />,
      },
      {
        path: "/tools/identity",
        element: <IdentityPage />,
      },
      {
        path: "/tools/barcode",
        element: <BarcodePage />,
      },
      {
        path: "/tools/ocr",
        element: <OCRPage />,
      },
      {
        path: "/tools/sql-formatter",
        element: <SQLFormatterPage />,
      },
      {
        path: "/tools/color-extractor",
        element: <ColorExtractorPage />,
      },
      {
        path: "/tools/bg-remove",
        element: <BgRemovePage />,
      },
      {
        path: "/tools/qrcode-scanner",
        element: <QRCodeScannerPage />,
      },
      {
        path: "/tools/pixel-art",
        element: <PixelArtPage />,
      },
      {
        path: "/tools/chinese-color",
        element: <ChineseColorPage />,
      },
      {
        path: "/tools/watermark",
        element: <WatermarkPage />,
      },
      {
        path: "/tools/image-compress",
        element: <ImageCompressPage />,
      },
      {
        path: "/tools/timestamp",
        element: <TimestampPage />,
      },
      {
        path: "/tools/crop",
        element: <CropPage />,
      },
      {
        path: "/tools/resize",
        element: <ResizePage />,
      },
      {
        path: "/tools/blur",
        element: <BlurPage />,
      },
      {
        path: "/tools/slice",
        element: <SlicePage />,
      },
      {
        path: "/tools/ascii-art",
        element: <AsciiArtPage />,
      },
      {
        path: "/tools/love-heart",
        element: <LoveHeartPage />,
      },
      {
        path: "/tools/paper-texture",
        element: <PaperTexturePage />,
      },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />,
  </StrictMode>,
)
