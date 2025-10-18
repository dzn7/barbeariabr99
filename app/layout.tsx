"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { Theme } from "@radix-ui/themes";
import { TemaProvider } from "@/contexts/TemaContext";
import { AutenticacaoProvider } from "@/contexts/AutenticacaoContext";
import { Cabecalho } from "@/components/Cabecalho";
import { Rodape } from "@/components/Rodape";
import { usePathname } from "next/navigation";
import Head from "next/head";
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
      <Head>
        <title>Barbearia BR99 - A Melhor Barbearia de Barras, PI</title>
        <meta name="description" content="Barbearia BR99 - Cortes modernos, barba bem feita e atendimento de qualidade em Barras, PI. Agende seu horário online!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#18181b" />
        
        {/* Favicons */}
        <link rel="icon" href="/favicon/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Barbearia BR99 - A Melhor Barbearia de Barras, PI" />
        <meta property="og:description" content="Cortes modernos, barba bem feita e atendimento de qualidade. Agende online!" />
        <meta property="og:image" content="/assets/logo.PNG" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Barbearia BR99" />
        <meta name="twitter:description" content="A melhor barbearia de Barras, PI" />
      </Head>
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
