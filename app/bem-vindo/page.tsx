"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, CheckCircle, Calendar, User, Scissors } from "lucide-react";
import { useAutenticacao } from "@/contexts/AutenticacaoContext";
import { useRouter } from "next/navigation";

/**
 * Página de Boas-vindas
 * Mostrada após cadastro bem-sucedido
 */
export default function PaginaBemVindo() {
  const { usuario } = useAutenticacao();
  const router = useRouter();
  const [progresso, setProgresso] = useState(0);

  useEffect(() => {
    // Redirecionar se não estiver autenticado
    if (!usuario) {
      router.push("/entrar");
      return;
    }

    // Simular progresso de carregamento
    const interval = setInterval(() => {
      setProgresso((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          // Redirecionar após 3 segundos
          setTimeout(() => {
            router.push("/meus-agendamentos");
          }, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [usuario, router]);

  const nome = usuario?.user_metadata?.nome || usuario?.email?.split("@")[0] || "Cliente";

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-200 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-800 flex items-center justify-center p-4 overflow-hidden">
      {/* Animações de fundo */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0, x: "50%", y: "50%" }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 2],
              x: `${Math.random() * 100}%`,
              y: `${Math.random() * 100}%`,
            }}
            transition={{
              duration: 3,
              delay: i * 0.1,
              repeat: Infinity,
              repeatDelay: 5,
            }}
            className="absolute w-2 h-2 bg-zinc-400 dark:bg-zinc-600 rounded-full"
          />
        ))}
      </div>

      {/* Conteúdo principal */}
      <div className="relative z-10 max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-8 md:p-12 border border-zinc-200 dark:border-zinc-800"
        >
          {/* Ícone de sucesso */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex justify-center mb-6"
          >
            <div className="relative">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 bg-green-400 dark:bg-green-600 rounded-full blur-xl opacity-50"
              />
              <div className="relative w-20 h-20 md:w-24 md:h-24 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 md:w-14 md:h-14 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Título com animação */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-3 flex items-center justify-center gap-2">
              <span>Olá,</span>
              <motion.span
                animate={{
                  color: ["#18181b", "#3b82f6", "#18181b"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              >
                {nome}!
              </motion.span>
              <Sparkles className="w-8 h-8 text-yellow-500" />
            </h1>
            <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400">
              Conta criada com sucesso!
            </p>
          </motion.div>

          {/* Cards de benefícios */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              {
                icon: Calendar,
                title: "Agende Online",
                desc: "Reserve seu horário",
                delay: 0.4,
              },
              {
                icon: User,
                title: "Perfil Pessoal",
                desc: "Gerencie seus dados",
                delay: 0.5,
              },
              {
                icon: Scissors,
                title: "Histórico",
                desc: "Veja seus cortes",
                delay: 0.6,
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: item.delay }}
                className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 text-center border border-zinc-200 dark:border-zinc-700"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white dark:bg-zinc-900 mb-3">
                  <item.icon className="w-6 h-6 text-zinc-900 dark:text-white" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Barra de progresso */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
              <span>Preparando sua área...</span>
              <span className="font-semibold">{progresso}%</span>
            </div>
            <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progresso}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
              />
            </div>
            <p className="text-xs text-center text-zinc-500 dark:text-zinc-500">
              Redirecionando para seus agendamentos...
            </p>
          </motion.div>
        </motion.div>

        {/* Mensagem adicional */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-6 text-sm text-zinc-600 dark:text-zinc-400"
        >
          ✨ Bem-vindo à Barbearia BR99 ✨
        </motion.p>
      </div>
    </div>
  );
}
