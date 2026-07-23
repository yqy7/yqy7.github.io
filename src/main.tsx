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
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />,
  </StrictMode>,
)
