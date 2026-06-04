import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = localFont({
  src: [
    {
      path: "../fonts/CormorantGaramond-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/CormorantGaramond-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/CormorantGaramond-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/CormorantGaramond-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/CormorantGaramond-Light.woff2",
      weight: "300",
      style: "normal",
    },
  ],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PRAGA Living | Arquitectura para quienes valoran lo excepcional",
  description: "PRAGA Living - Una pieza arquitectónica diseñada para permanecer. Descubre residencias premium con arquitectura excepcional, diseño biophilic y estilo de vida exclusivo.",
  keywords: ["PRAGA Living", "residencias premium", "arquitectura", "bienestar", "exclusividad", "inmobiliaria"],
  authors: [{ name: "PRAGA Living" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "PRAGA Living | Arquitectura para quienes valoran lo excepcional",
    description: "Una pieza arquitectónica diseñada para permanecer",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${cormorant.variable} antialiased bg-[#F5F1EA] text-[#111111]`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
