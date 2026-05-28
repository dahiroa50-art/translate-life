import "./globals.css";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";
import type { ReactNode } from "react";

export const metadata = {
  title: "Translate Life",
  description: "Break tasks into steps. Decode confusing messages.",
};

export const viewport = {
  themeColor: "#86BC9D",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#86BC9D" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Translate Life" />
      </head>
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}

