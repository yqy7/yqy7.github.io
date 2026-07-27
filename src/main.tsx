import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

import './index.css'
import { Layout } from '@/components/Layout'
import App from './App.tsx'
import EncodeDecodePage from '@/tools/encode-decode/index.tsx'
import QRCodePage from '@/tools/qrcode/index.tsx'
import OpenCCPage from '@/tools/opencc/index.tsx'
import PinyinPage from '@/tools/pinyin/index.tsx'
import PasswordPage from '@/tools/password/index.tsx'
import RandomNumberPage from '@/tools/random-number/index.tsx'
import BaseConvertPage from '@/tools/base-convert/index.tsx'
import UUIDPage from '@/tools/uuid/index.tsx'
import MorsePage from '@/tools/morse/index.tsx'
import NameCasePage from '@/tools/name-case/index.tsx'
import ColorConvertPage from '@/tools/color-convert/index.tsx'
import CrontabPage from '@/tools/crontab/index.tsx'
import JsonYamlPage from '@/tools/json-yaml/index.tsx'
import ChineseNumberPage from '@/tools/chinese-number/index.tsx'
import FancyTextPage from '@/tools/fancy-text/index.tsx'
import TTSPage from '@/tools/tts/index.tsx'
import DeviceInfoPage from '@/tools/device-info/index.tsx'
import UnicodePage from '@/tools/unicode/index.tsx'
import ZeroWidthPage from '@/tools/zero-width/index.tsx'
import AnimalSpeakPage from '@/tools/animal-speak/index.tsx'
import TextDiffPage from '@/tools/text-diff/index.tsx'
import WordCountPage from '@/tools/word-count/index.tsx'
import JsonFormatterPage from '@/tools/json-formatter/index.tsx'
import MartianTextPage from '@/tools/martian-text/index.tsx'
import LuckyWheelPage from '@/tools/lucky-wheel/index.tsx'
import RandomNamePage from '@/tools/random-name/index.tsx'
import IdentityPage from '@/tools/identity/index.tsx'
import BarcodePage from '@/tools/barcode/index.tsx'

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
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />,
  </StrictMode>,
)
