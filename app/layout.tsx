"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { Theme } from "@radix-ui/themes";
import { TemaProvider } from "@/contexts/TemaContext";
import { AutenticacaoProvider } from "@/contexts/AutenticacaoContext";
import { Cabecalho } from "@/components/Cabecalho";
import { Rodape } from "@/components/Rodape";
import { usePathname } from "next/navigation";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TemaProvider>
          <AutenticacaoProvider>
            <Theme>
              {isDashboard ? (
                // Dashboard sem cabeçalho/rodapé
                <>{children}</>
              ) : (
                // Páginas normais com cabeçalho/rodapé
                <div className="flex flex-col min-h-screen">
                  <Cabecalho />
                  <main className="flex-1">
                    {children}
                  </main>
                  <Rodape />
                </div>
              )}
            </Theme>
          </AutenticacaoProvider>
        </TemaProvider>
      </body>
    </html>
  );
}
