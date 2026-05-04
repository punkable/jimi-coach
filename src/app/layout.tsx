import type { Metadata } from "next";
import { Outfit, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SpeedInsights } from '@vercel/speed-insights/next';

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LDRFIT",
  description: "Plataforma de entrenamiento para atletas y coaches de CrossFit.",
  icons: {
    icon: '/images/isotipo.png',
    apple: '/images/isotipo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LDRFIT',
  },
};

export const viewport = {
  themeColor: '#0f110a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${outfit.variable} ${robotoMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <TooltipProvider delay={300}>
          {children}
        </TooltipProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
