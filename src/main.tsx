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
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />,
  </StrictMode>,
)
