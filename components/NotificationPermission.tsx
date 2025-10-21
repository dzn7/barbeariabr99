"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, X, Check } from "lucide-react";
import { Button } from "@radix-ui/themes";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  testNotification,
} from "@/lib/push-notifications";

/**
 * Componente para solicitar permissão de notificações
 * Aparece apenas no dashboard
 */
export function NotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [showBanner, setShowBanner] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Verificar suporte
    const supported = isNotificationSupported();
    setIsSupported(supported);

    if (!supported) {
      console.log("[Notificações] Não suportadas neste navegador");
      return;
    }

    // Verificar permissão atual
    const currentPermission = getNotificationPermission();
    setPermission(currentPermission);

    // Mostrar banner se ainda não pediu permissão
    const hasAsked = localStorage.getItem("notification-permission-asked");
    if (currentPermission === "default" && !hasAsked) {
      // Aguardar 3 segundos antes de mostrar
      setTimeout(() => {
        setShowBanner(true);
      }, 3000);
    }
  }, []);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    
    if (granted) {
      setPermission("granted");
      setShowBanner(false);
      
      // Enviar notificação de teste
      await testNotification();
    } else {
      setPermission("denied");
    }

    // Marcar que já pediu permissão
    localStorage.setItem("notification-permission-asked", "true");
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("notification-permission-asked", "true");
  };

  // Não mostrar se não for suportado
  if (!isSupported) {
    return null;
  }

  // Não mostrar se já negou
  if (permission === "denied") {
    return null;
  }

  // Indicador de status (sempre visível no canto)
  const StatusIndicator = () => (
    <div className="fixed bottom-4 right-4 z-40">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`p-3 rounded-full shadow-lg ${
          permission === "granted"
            ? "bg-green-500 text-white"
            : "bg-yellow-500 text-white"
        }`}
        title={
          permission === "granted"
            ? "Notificações ativadas"
            : "Notificações desativadas"
        }
      >
        {permission === "granted" ? (
          <Bell className="w-5 h-5" />
        ) : (
          <BellOff className="w-5 h-5" />
        )}
      </motion.div>
    </div>
  );

  return (
    <>
      {/* Banner de solicitação */}
      <AnimatePresence>
        {showBanner && permission === "default" && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
          >
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                    Ativar Notificações?
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                    Receba alertas instantâneos quando houver novos agendamentos,
                    mesmo com o navegador minimizado.
                  </p>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleRequestPermission}
                      className="flex-1 bg-blue-600 text-white cursor-pointer hover:bg-blue-700"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Ativar
                    </Button>
                    <Button
                      onClick={handleDismiss}
                      variant="outline"
                      className="cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicador de status */}
      <StatusIndicator />
    </>
  );
}
