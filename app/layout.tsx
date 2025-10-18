"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { Theme } from "@radix-ui/themes";
import { TemaProvider } from "@/contexts/TemaContext";
import { AutenticacaoProvider } from "@/contexts/AutenticacaoContext";
import { Cabecalho } from "@/components/Cabecalho";
import { Rodape } from "@/components/Rodape";
import { PWAUpdateNotification } from "@/components/PWAUpdateNotification";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { registerPWA, unregisterPWA } from "@/lib/pwa-register";
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

  // Registra PWA apropriada e limpa SWs antigos
  useEffect(() => {
    const initPWA = async () => {
      // Primeiro, desregistra qualquer SW antigo
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          // Remove SWs que não são os nossos
          const swUrl = registration.active?.scriptURL || '';
          if (!swUrl.includes('sw-client.js') && !swUrl.includes('sw-dashboard.js')) {
            console.log('[PWA] Removendo SW antigo:', swUrl);
            await registration.unregister();
          }
        }
      }

      // Aguarda um pouco para garantir limpeza
      await new Promise(resolve => setTimeout(resolve, 100));

      // Registra o SW correto
      if (isDashboard) {
        registerPWA('dashboard', {
          onSuccess: () => console.log('[PWA] Dashboard registrado'),
          onUpdate: () => console.log('[PWA] Dashboard atualizado'),
        });
      } else {
        registerPWA('client', {
          onSuccess: () => console.log('[PWA] Cliente registrado'),
          onUpdate: () => console.log('[PWA] Cliente atualizado'),
        });
      }
    };

    initPWA();
  }, [isDashboard]);

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <title>Barbearia BR99 - A Melhor Barbearia de Barras, PI</title>
        <meta name="description" content="Barbearia BR99 - Cortes modernos, barba bem feita e atendimento de qualidade em Barras, PI. Agende seu horário online!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#18181b" />
        
        {/* Favicons */}
        <link rel="icon" href="/favicon/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
        <link rel="manifest" href={isDashboard ? "/manifest-dashboard.json" : "/manifest-client.json"} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Barbearia BR99 - A Melhor Barbearia de Barras, PI" />
        <meta property="og:description" content="Cortes modernos, barba bem feita e atendimento de qualidade. Agende online!" />
        <meta property="og:image" content="/assets/logo.PNG" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Barbearia BR99" />
        <meta name="twitter:description" content="A melhor barbearia de Barras, PI" />
      </head>
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
              
              {/* Notificação de atualização PWA */}
              <PWAUpdateNotification />
            </Theme>
          </AutenticacaoProvider>
        </TemaProvider>
      </body>
    </html>
  );
}
